import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

type TrackPayload = {
    // Event info
    type: typeof schema.eventTypeEnum.enumValues[number];
    name?: string;
    value?: number;

    // Required for workspace resolution
    landingPageId: string;

    // Identity (one required)
    visitorId?: string;
    cookieId?: string;
    fingerprintHash?: string;

    // Optional links
    leadId?: string;
    sessionId?: string;
    campaignId?: string;

    // Context
    url?: string;

    // Attribution (for new visitors/sessions)
    utm?: {
        source?: string;
        medium?: string;
        campaign?: string;
        term?: string;
        content?: string;
    };
    referrer?: string;
    entryUrl?: string;

    // Device/Geo (stored on session, not visitor)
    device?: {
        type?: string;
        browser?: string;
        os?: string;
    };
    geo?: {
        country?: string;
        region?: string;
        city?: string;
    };

    // Engagement metrics (go in metadata)
    scrollDepth?: number;
    timeOnPage?: number;
    elementClicked?: string;

    // Flexible payload
    metadata?: Record<string, unknown>;
};

// Cache landingPageId → workspaceId (rarely changes)
const workspaceCache = new Map<string, string>();

async function getWorkspaceId(landingPageId: string): Promise<string | null> {
    if (workspaceCache.has(landingPageId)) {
        return workspaceCache.get(landingPageId)!;
    }

    const page = await db.query.landingPages.findFirst({
        where: eq(schema.landingPages.id, landingPageId),
        columns: { workspaceId: true }
    });

    if (page) {
        workspaceCache.set(landingPageId, page.workspaceId);
        return page.workspaceId;
    }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        const payload: TrackPayload = await request.json();

        // Require landingPageId for workspace resolution
        if (!payload.landingPageId) {
            return NextResponse.json(
                { success: false, error: 'landingPageId is required' },
                { status: 400 }
            );
        }

        // Get workspace from landing page
        const workspaceId = await getWorkspaceId(payload.landingPageId);
        if (!workspaceId) {
            return NextResponse.json(
                { success: false, error: 'Invalid landingPageId' },
                { status: 400 }
            );
        }

        // Get or create visitor
        let visitorId = payload.visitorId;

        if (!visitorId && (payload.cookieId || payload.fingerprintHash)) {
            // Look up existing visitor by cookie or fingerprint within this workspace
            const existing = await db.query.visitors.findFirst({
                where: and(
                    eq(schema.visitors.workspaceId, workspaceId),
                    payload.cookieId
                        ? eq(schema.visitors.cookieId, payload.cookieId)
                        : eq(schema.visitors.fingerprintHash, payload.fingerprintHash!)
                ),
            });

            if (existing) {
                visitorId = existing.id;

                // Update lastSeenAt
                await db.update(schema.visitors)
                    .set({ lastSeenAt: new Date(), updatedAt: new Date() })
                    .where(eq(schema.visitors.id, visitorId));
            } else {
                // Create new visitor
                const [newVisitor] = await db.insert(schema.visitors).values({
                    workspaceId,
                    cookieId: payload.cookieId ?? null,
                    fingerprintHash: payload.fingerprintHash ?? null,
                    firstSource: payload.utm?.source ?? null,
                    firstMedium: payload.utm?.medium ?? null,
                    firstCampaign: payload.utm?.campaign ?? null,
                    firstContent: payload.utm?.content ?? null,
                    firstTerm: payload.utm?.term ?? null,
                }).returning({ id: schema.visitors.id });

                visitorId = newVisitor.id;
            }
        }

        if (!visitorId) {
            return NextResponse.json(
                { success: false, error: 'visitorId, cookieId, or fingerprintHash required' },
                { status: 400 }
            );
        }

        // Handle session creation for page_view events (first event of a session)
        let sessionId = payload.sessionId;

        if (!sessionId && payload.type === 'page_view') {
            // Create new session on first page view
            const [newSession] = await db.insert(schema.sessions).values({
                workspaceId,
                visitorId,
                leadId: payload.leadId ?? null,
                source: payload.utm?.source ?? null,
                medium: payload.utm?.medium ?? null,
                campaign: payload.utm?.campaign ?? null,
                content: payload.utm?.content ?? null,
                term: payload.utm?.term ?? null,
                referrer: payload.referrer ?? null,
                landingPageId: payload.landingPageId,
                entryUrl: payload.entryUrl ?? payload.url ?? null,
                device: payload.device?.type ?? null,
                browser: payload.device?.browser ?? null,
                os: payload.device?.os ?? null,
                country: payload.geo?.country ?? null,
                region: payload.geo?.region ?? null,
                city: payload.geo?.city ?? null,
            }).returning({ id: schema.sessions.id });

            sessionId = newSession.id;
        }

        // Build event metadata (include engagement metrics here)
        const eventMetadata: Record<string, unknown> = {
            ...payload.metadata,
        };
        if (payload.scrollDepth !== undefined) eventMetadata.scrollDepth = payload.scrollDepth;
        if (payload.timeOnPage !== undefined) eventMetadata.timeOnPage = payload.timeOnPage;
        if (payload.elementClicked) eventMetadata.elementClicked = payload.elementClicked;

        // Log the event
        const [event] = await db.insert(schema.events).values({
            workspaceId,
            visitorId,
            sessionId: sessionId ?? null,
            leadId: payload.leadId ?? null,
            landingPageId: payload.landingPageId,
            campaignId: payload.campaignId ?? null,
            type: payload.type,
            name: payload.name ?? null,
            value: payload.value ?? null,
            url: payload.url ?? null,
            metadata: eventMetadata,
        }).returning({ id: schema.events.id });

        // Update session metrics if we have a session
        if (sessionId) {
            await db.update(schema.sessions)
                .set({
                    eventCount: sql`event_count + 1`,
                    exitUrl: payload.url ?? null,
                    endedAt: new Date(),
                    ...(payload.type === 'page_view' && {
                        pageViews: sql`page_views + 1`,
                    }),
                    ...(payload.scrollDepth !== undefined && {
                        maxScrollDepth: sql`GREATEST(COALESCE(max_scroll_depth, 0), ${payload.scrollDepth})`,
                    }),
                })
                .where(eq(schema.sessions.id, sessionId));
        }

        return NextResponse.json({
            success: true,
            eventId: event.id,
            visitorId,
            sessionId,
        });

    } catch (error) {
        console.error('Track error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to track event' },
            { status: 500 }
        );
    }
}

// CORS headers for tracking from any domain
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
    });
}