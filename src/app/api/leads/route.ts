import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

type LeadPayload = {
    // Required
    email: string;

    // Optional identity
    name?: string;
    phone?: string;

    // Link to visitor
    visitorId?: string;
    cookieId?: string;

    // Attribution
    capturedVia?: string; // e.g., "ebook-download", "newsletter"
    landingPageId?: string;
    campaignId?: string;
    utm?: {
        source?: string;
        medium?: string;
        campaign?: string;
    };

    // Custom data
    customFields?: Record<string, unknown>;
    tags?: string[];
};

export async function POST(request: NextRequest) {
    try {
        const payload: LeadPayload = await request.json();

        if (!payload.email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Normalize email
        const email = payload.email.toLowerCase().trim();

        // Check if lead already exists
        const existingLead = await db.query.leads.findFirst({
            where: eq(schema.leads.email, email),
        });

        if (existingLead) {
            // Update existing lead with new info
            const [updated] = await db.update(schema.leads)
                .set({
                    name: payload.name || existingLead.name,
                    phone: payload.phone || existingLead.phone,
                    lastSource: payload.utm?.source || existingLead.lastSource,
                    lastMedium: payload.utm?.medium || existingLead.lastMedium,
                    lastCampaign: payload.utm?.campaign || existingLead.lastCampaign,
                    customFields: {
                        ...(existingLead.customFields as Record<string, unknown> || {}),
                        ...(payload.customFields || {}),
                    },
                    tags: [...new Set([...(existingLead.tags || []), ...(payload.tags || [])])],
                    updatedAt: new Date(),
                })
                .where(eq(schema.leads.id, existingLead.id))
                .returning();

            // Log re-capture event
            await db.insert(schema.events).values({
                type: 'lead_captured',
                name: 'lead_recaptured',
                leadId: existingLead.id,
                visitorId: payload.visitorId,
                landingPageId: payload.landingPageId,
                campaignId: payload.campaignId,
                metadata: {
                    capturedVia: payload.capturedVia,
                    isReturning: true,
                },
            });

            // Link visitor to lead if provided
            if (payload.visitorId) {
                await db.update(schema.visitors)
                    .set({
                        convertedToLeadId: existingLead.id,
                        convertedAt: new Date(),
                    })
                    .where(eq(schema.visitors.id, payload.visitorId));
            }

            return NextResponse.json({
                success: true,
                leadId: existingLead.id,
                isNew: false,
                message: 'Lead updated',
            });
        }

        // Resolve visitor ID from cookie if needed
        let visitorId = payload.visitorId;
        if (!visitorId && payload.cookieId) {
            const visitor = await db.query.visitors.findFirst({
                where: eq(schema.visitors.cookieId, payload.cookieId),
            });
            if (visitor) visitorId = visitor.id;
        }

        // Get visitor's first-touch attribution
        let firstAttribution = {
            source: payload.utm?.source,
            medium: payload.utm?.medium,
            campaign: payload.utm?.campaign,
        };

        if (visitorId) {
            const visitor = await db.query.visitors.findFirst({
                where: eq(schema.visitors.id, visitorId),
            });
            if (visitor) {
                firstAttribution = {
                    source: visitor.firstSource || firstAttribution.source,
                    medium: visitor.firstMedium || firstAttribution.medium,
                    campaign: visitor.firstCampaign || firstAttribution.campaign,
                };
            }
        }

        // Create new lead
        const [newLead] = await db.insert(schema.leads).values({
            email,
            name: payload.name,
            phone: payload.phone,
            visitorId,

            // First touch (from visitor or current)
            firstSource: firstAttribution.source,
            firstMedium: firstAttribution.medium,
            firstCampaign: firstAttribution.campaign,

            // Last touch (current)
            lastSource: payload.utm?.source,
            lastMedium: payload.utm?.medium,
            lastCampaign: payload.utm?.campaign,

            // Capture context
            capturedVia: payload.capturedVia,
            capturedLandingPageId: payload.landingPageId,

            // Custom
            customFields: payload.customFields || {},
            tags: payload.tags || [],

            // Initial stage
            stage: 'captured',
            stageChangedAt: new Date(),
        }).returning();

        // Link visitor to lead
        if (visitorId) {
            await db.update(schema.visitors)
                .set({
                    convertedToLeadId: newLead.id,
                    convertedAt: new Date(),
                })
                .where(eq(schema.visitors.id, visitorId));
        }

        // Log capture event
        await db.insert(schema.events).values({
            type: 'lead_captured',
            leadId: newLead.id,
            visitorId,
            landingPageId: payload.landingPageId,
            campaignId: payload.campaignId,
            metadata: {
                capturedVia: payload.capturedVia,
                isNew: true,
            },
        });

        // Update landing page conversion count
        if (payload.landingPageId) {
            await db.execute(
                `UPDATE landing_pages 
         SET total_conversions = total_conversions + 1,
             updated_at = NOW()
         WHERE id = '${payload.landingPageId}'`
            );
        }

        // Update campaign lead count
        if (payload.campaignId) {
            await db.execute(
                `UPDATE campaigns 
         SET total_leads = total_leads + 1,
             updated_at = NOW()
         WHERE id = '${payload.campaignId}'`
            );
        }

        return NextResponse.json({
            success: true,
            leadId: newLead.id,
            isNew: true,
            message: 'Lead captured',
        });

    } catch (error) {
        console.error('Lead capture error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to capture lead' },
            { status: 500 }
        );
    }
}

// Get lead by ID or email
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id && !email) {
        return NextResponse.json(
            { error: 'Provide id or email parameter' },
            { status: 400 }
        );
    }

    try {
        const lead = await db.query.leads.findFirst({
            where: id
                ? eq(schema.leads.id, id)
                : eq(schema.leads.email, email!.toLowerCase().trim()),
            with: {
                visitor: true,
                capturedLandingPage: true,
            },
        });

        if (!lead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, lead });

    } catch (error) {
        console.error('Lead fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch lead' },
            { status: 500 }
        );
    }
}