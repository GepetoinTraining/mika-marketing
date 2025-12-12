// app/api/campaigns/route.ts
// Workspace-scoped campaigns API

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, campaignDailyMetrics } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

// Helper to get workspace ID from request
function getWorkspaceId(req: NextRequest): string | null {
    // Middleware injects this header
    return req.headers.get('x-workspace-id');
}

// GET /api/campaigns - List campaigns for current workspace
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

        // Get campaigns with aggregated metrics
        const result = await db
            .select({
                id: campaigns.id,
                workspaceId: campaigns.workspaceId,
                name: campaigns.name,
                slug: campaigns.slug,
                description: campaigns.description,
                status: campaigns.status,
                utmSource: campaigns.utmSource,
                utmMedium: campaigns.utmMedium,
                utmCampaign: campaigns.utmCampaign,
                utmContent: campaigns.utmContent,
                utmTerm: campaigns.utmTerm,
                budget: campaigns.budget,
                spent: campaigns.spent,
                startDate: campaigns.startDate,
                endDate: campaigns.endDate,
                targetLeads: campaigns.targetLeads,
                targetRevenue: campaigns.targetRevenue,
                targetRoas: campaigns.targetRoas,
                strategyNotes: campaigns.strategyNotes,
                targetAudience: campaigns.targetAudience,
                createdAt: campaigns.createdAt,
                updatedAt: campaigns.updatedAt,
                // Aggregated metrics from daily table
                totalVisitors: sql<number>`COALESCE(SUM(${campaignDailyMetrics.visitors}), 0)::int`,
                totalLeads: sql<number>`COALESCE(SUM(${campaignDailyMetrics.leads}), 0)::int`,
                totalCustomers: sql<number>`COALESCE(SUM(${campaignDailyMetrics.customers}), 0)::int`,
                totalRevenue: sql<number>`COALESCE(SUM(${campaignDailyMetrics.revenue}), 0)::numeric`,
            })
            .from(campaigns)
            .leftJoin(
                campaignDailyMetrics,
                eq(campaigns.id, campaignDailyMetrics.campaignId)
            )
            .where(eq(campaigns.workspaceId, workspaceId))
            .groupBy(campaigns.id)
            .orderBy(desc(campaigns.createdAt));

        // Transform to match frontend expectations
        const transformedCampaigns = result.map(campaign => ({
            ...campaign,
            // Convert decimal strings to numbers for frontend
            budget: campaign.budget ? Number(campaign.budget) : null,
            spent: campaign.spent ? Number(campaign.spent) : 0,
            totalRevenue: Number(campaign.totalRevenue) || 0,
            // Calculate derived metrics
            avgCvr: campaign.totalVisitors > 0
                ? (campaign.totalLeads / campaign.totalVisitors) * 100
                : 0,
            avgRoas: campaign.spent && Number(campaign.spent) > 0
                ? Number(campaign.totalRevenue) / Number(campaign.spent)
                : 0,
            // Rename dates for frontend compatibility
            startsAt: campaign.startDate,
            endsAt: campaign.endDate,
        }));

        return NextResponse.json(transformedCampaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaigns' },
            { status: 500 }
        );
    }
}

// POST /api/campaigns - Create a new campaign
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
            name,
            description,
            status,
            budget,
            startDate,
            endDate,
            utmSource,
            utmMedium,
            utmCampaign,
            utmContent,
            utmTerm,
            targetLeads,
            targetRevenue,
            targetRoas,
            strategyNotes,
            targetAudience,
        } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // Generate slug from name
        const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const [campaign] = await db.insert(campaigns).values({
            workspaceId,
            name,
            slug,
            description: description || null,
            status: status || 'draft',
            budget: budget ? String(budget) : null,
            spent: '0',
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            utmSource: utmSource || null,
            utmMedium: utmMedium || null,
            utmCampaign: utmCampaign || null,
            utmContent: utmContent || null,
            utmTerm: utmTerm || null,
            targetLeads: targetLeads || null,
            targetRevenue: targetRevenue ? String(targetRevenue) : null,
            targetRoas: targetRoas || null,
            strategyNotes: strategyNotes || null,
            targetAudience: targetAudience || null,
        }).returning();

        // Return with computed fields for frontend
        const response = {
            ...campaign,
            budget: campaign.budget ? Number(campaign.budget) : null,
            spent: Number(campaign.spent) || 0,
            totalVisitors: 0,
            totalLeads: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            avgCvr: 0,
            avgRoas: 0,
            startsAt: campaign.startDate,
            endsAt: campaign.endDate,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json(
            { error: 'Failed to create campaign' },
            { status: 500 }
        );
    }
}