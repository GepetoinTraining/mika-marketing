import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

type Params = {
    params: Promise<{ leadId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
    const { leadId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const dest = searchParams.get('dest');
    const campaignId = searchParams.get('cid');
    const landingPageId = searchParams.get('lpid');
    const affiliateId = searchParams.get('aid');

    if (!dest) {
        return NextResponse.json(
            { error: 'Missing destination URL (dest param)' },
            { status: 400 }
        );
    }

    try {
        // Verify lead exists
        const lead = await db.query.leads.findFirst({
            where: eq(schema.leads.id, leadId),
        });

        if (!lead) {
            // Still redirect, but log as anonymous click
            console.warn(`Redirect: Lead ${leadId} not found, redirecting anyway`);
        }

        // Log the click event
        await db.insert(schema.events).values({
            type: 'click',
            name: 'affiliate_redirect',
            leadId: lead ? leadId : undefined,
            visitorId: lead?.visitorId,
            campaignId: campaignId || undefined,
            landingPageId: landingPageId || undefined,
            pageUrl: dest,
            metadata: {
                affiliateId,
                destinationUrl: dest,
                timestamp: new Date().toISOString(),
            },
        });

        // Update lead's last touch attribution if we have campaign info
        if (lead && campaignId) {
            await db.update(schema.leads)
                .set({
                    lastSource: searchParams.get('src') || undefined,
                    lastMedium: searchParams.get('med') || 'affiliate',
                    lastCampaign: campaignId,
                    updatedAt: new Date(),
                })
                .where(eq(schema.leads.id, leadId));
        }

        // Redirect to destination
        return NextResponse.redirect(dest, { status: 302 });

    } catch (error) {
        console.error('Redirect error:', error);
        // On error, still redirect (don't break user experience)
        return NextResponse.redirect(dest, { status: 302 });
    }
}