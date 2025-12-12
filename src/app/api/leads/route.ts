// app/api/leads/route.ts
// Workspace-scoped leads API

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads, leadStageHistory, visitors } from '@/lib/db/schema';
import { eq, desc, ilike, or, sql } from 'drizzle-orm';

// Helper to get workspace ID from request
function getWorkspaceId(req: NextRequest): string | null {
    return req.headers.get('x-workspace-id');
}

// GET /api/leads - List leads for current workspace
export async function GET(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workspaceId = getWorkspaceId(req);

        if (!workspaceId) {
            return NextResponse.json(
                { error: 'No workspace selected' },
                { status: 400 }
            );
        }

        // Get query params for filtering
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const stage = searchParams.get('stage');

        // Build query
        let query = db
            .select({
                id: leads.id,
                workspaceId: leads.workspaceId,
                visitorId: leads.visitorId,
                email: leads.email,
                name: leads.name,
                phone: leads.phone,
                stage: leads.stage,
                stageChangedAt: leads.stageChangedAt,
                behaviorScore: leads.behaviorScore,
                demographicScore: leads.demographicScore,
                totalScore: leads.totalScore,
                firstSource: leads.firstSource,
                firstMedium: leads.firstMedium,
                firstCampaignId: leads.firstCampaignId,
                lastSource: leads.lastSource,
                lastMedium: leads.lastMedium,
                lastCampaignId: leads.lastCampaignId,
                lifetimeValue: leads.lifetimeValue,
                purchaseCount: leads.purchaseCount,
                customFields: leads.customFields,
                tags: leads.tags,
                convertedAt: leads.convertedAt,
                createdAt: leads.createdAt,
                updatedAt: leads.updatedAt,
            })
            .from(leads)
            .where(eq(leads.workspaceId, workspaceId))
            .orderBy(desc(leads.createdAt))
            .$dynamic();

        const result = await query;

        // Transform for frontend
        const transformedLeads = result.map(lead => ({
            ...lead,
            lifetimeValue: Number(lead.lifetimeValue) || 0,
            tags: lead.tags || [],
            customFields: lead.customFields || {},
        }));

        // Apply search filter in JS (could optimize with SQL later)
        let filtered = transformedLeads;
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(lead =>
                lead.email.toLowerCase().includes(q) ||
                lead.name?.toLowerCase().includes(q) ||
                lead.tags.some((t: string) => t.toLowerCase().includes(q))
            );
        }

        if (stage && stage !== 'all') {
            filtered = filtered.filter(lead => lead.stage === stage);
        }

        return NextResponse.json(filtered);
    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leads' },
            { status: 500 }
        );
    }
}

// POST /api/leads - Create a new lead
export async function POST(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workspaceId = getWorkspaceId(req);

        if (!workspaceId) {
            return NextResponse.json(
                { error: 'No workspace selected' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const {
            email,
            name,
            phone,
            stage = 'captured',
            source,
            medium,
            campaignId,
            tags = [],
            customFields = {},
            visitorId,
        } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Insert lead
        const [lead] = await db.insert(leads).values({
            workspaceId,
            email,
            name: name || null,
            phone: phone || null,
            stage,
            visitorId: visitorId || null,
            firstSource: source || null,
            firstMedium: medium || null,
            firstCampaignId: campaignId || null,
            lastSource: source || null,
            lastMedium: medium || null,
            lastCampaignId: campaignId || null,
            tags,
            customFields,
        }).returning();

        // Record stage history
        await db.insert(leadStageHistory).values({
            workspaceId,
            leadId: lead.id,
            toStage: stage,
            changedBy: 'system',
            reason: 'Lead created',
        });

        return NextResponse.json({
            ...lead,
            lifetimeValue: 0,
            tags: lead.tags || [],
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating lead:', error);
        return NextResponse.json(
            { error: 'Failed to create lead' },
            { status: 500 }
        );
    }
}

// PATCH /api/leads - Update lead stage (bulk or single)
export async function PATCH(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workspaceId = getWorkspaceId(req);

        if (!workspaceId) {
            return NextResponse.json(
                { error: 'No workspace selected' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { leadId, stage, reason } = body;

        if (!leadId || !stage) {
            return NextResponse.json(
                { error: 'leadId and stage are required' },
                { status: 400 }
            );
        }

        // Get current lead
        const [currentLead] = await db
            .select()
            .from(leads)
            .where(eq(leads.id, leadId));

        if (!currentLead || currentLead.workspaceId !== workspaceId) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            );
        }

        // Update lead
        const [updatedLead] = await db
            .update(leads)
            .set({
                stage,
                stageChangedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(leads.id, leadId))
            .returning();

        // Record stage change
        await db.insert(leadStageHistory).values({
            workspaceId,
            leadId,
            fromStage: currentLead.stage,
            toStage: stage,
            changedBy: clerkId,
            reason: reason || null,
        });

        return NextResponse.json({
            ...updatedLead,
            lifetimeValue: Number(updatedLead.lifetimeValue) || 0,
            tags: updatedLead.tags || [],
        });
    } catch (error) {
        console.error('Error updating lead:', error);
        return NextResponse.json(
            { error: 'Failed to update lead' },
            { status: 500 }
        );
    }
}