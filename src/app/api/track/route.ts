import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

type TrackPayload = {
    // Event info
    type: typeof schema.eventTypeEnum.enumValues[number];
    name?: string;

    // Identity (one required)
    visitorId?: string;
    cookieId?: string;
    leadId?: string;

    // Context
    pageUrl?: string;
    landingPageId?: string;
    campaignId?: string;
    sessionId?: string;

    // Engagement
    scrollDepth?: number;
    timeOnPage?: number;
    elementClicked?: string;

    // Attribution (for new visitors/sessions)
    utm?: {
        source?: string;
        medium?: string;
        campaign?: string;
        term?: string;
        content?: string;
    };
    referrer?: string;

    // Device/Geo (client sends what it knows)
    device?: {
        type?: string;
        browser?: string;
        os?: string;
        screenWidth?: number;
        screenHeight?: number;
    };
    geo?: {
        country?: string;
        region?: string;
        city?: string;
    };

    // Flexible payload
    metadata?: Record<string, unknown>;
    value?: number;
};

export async function POST(request: NextRequest) {
    try {
        const payload: TrackPayload = await request.json();

        // Get or create visitor
        let visitorId = payload.visitorId;

        if (!visitorId && payload.cookieId) {
            // Look up by cookie
            const existing = await db.query.visitors.findFirst({
                where: eq(schema.visitors.cookieId, payload.cookieId),
            });

            if (existing) {
                visitorId = existing.id;
            } else {
                // Create new visitor
                const [newVisitor] = await db.insert(schema.visitors).values({
                    cookieId: payload.cookieId,
                    firstSource: payload.utm?.source,
                    firstMedium: payload.utm?.medium,
                    firstCampaign: payload.utm?.campaign,
                    firstReferrer: payload.referrer,
                    firstLandingUrl: payload.pageUrl,
                    deviceType: payload.device?.type,
                    browser: payload.device?.browser,
                    os: payload.device?.os,
                    country: payload.geo?.country,
                    region: payload.geo?.region,
                    city: payload.geo?.city,
                }).returning({ id: schema.visitors.id });

                visitorId = newVisitor.id;
            }
        }

        // Get or create session (if session_start event)
        let sessionId = payload.sessionId;

        if (payload.type === 'session_start' && visitorId) {
            const [newSession] = await db.insert(schema.sessions).values({
                visitorId,
                leadId: payload.leadId,
                source: payload.utm?.source,
                medium: payload.utm?.medium,
                campaign: payload.utm?.campaign,
                referrer: payload.referrer,
                landingUrl: payload.pageUrl,
                deviceType: payload.device?.type,
                browser: payload.device?.browser,
                os: payload.device?.os,
                screenWidth: payload.device?.screenWidth,
                screenHeight: payload.device?.screenHeight,
                country: payload.geo?.country,
                region: payload.geo?.region,
                city: payload.geo?.city,
            }).returning({ id: schema.sessions.id });

            sessionId = newSession.id;
        }

        // Log the event
        const [event] = await db.insert(schema.events).values({
            type: payload.type,
            name: payload.name,
            visitorId,
            leadId: payload.leadId,
            sessionId,
            pageUrl: payload.pageUrl,
            landingPageId: payload.landingPageId,
            campaignId: payload.campaignId,
            scrollDepth: payload.scrollDepth,
            timeOnPage: payload.timeOnPage,
            elementClicked: payload.elementClicked,
            metadata: payload.metadata ?? {},
            value: payload.value?.toString(),
        }).returning({ id: schema.events.id });

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

// Allow CORS for tracking from any domain
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}