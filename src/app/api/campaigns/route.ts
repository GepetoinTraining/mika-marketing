// app/api/campaigns/route.ts
// Workspace-scoped campaigns API

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// TEMPORARY: Import mock data until DB is connected
import { getCampaignsByWorkspace, DEMO_WORKSPACE } from '@/lib/db/mock';

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

        // TODO: Verify user has access to this workspace
        // For now, we trust the middleware + cookie

        // ===========================================
        // TEMPORARY: Use mock data
        // REPLACE with real query when DB is connected:
        //
        // const campaigns = await db
        //   .select()
        //   .from(schema.campaigns)
        //   .where(eq(schema.campaigns.workspaceId, workspaceId))
        //   .orderBy(schema.campaigns.createdAt);
        // ===========================================

        const campaigns = getCampaignsByWorkspace(workspaceId);

        // If no campaigns found for this workspace, check if using demo
        // This helps during development when workspace IDs don't match
        if (campaigns.length === 0) {
            const demoCampaigns = getCampaignsByWorkspace(DEMO_WORKSPACE.id);
            if (demoCampaigns.length > 0) {
                console.log('[DEV] No campaigns for workspace, returning demo data');
                return NextResponse.json(demoCampaigns);
            }
        }

        return NextResponse.json(campaigns);
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
        const { name, description, status, budget, startDate, endDate } = body;

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

        // ===========================================
        // TEMPORARY: Return mock response
        // REPLACE with real insert when DB is connected:
        //
        // const [campaign] = await db.insert(schema.campaigns).values({
        //   workspaceId,
        //   name,
        //   slug,
        //   description,
        //   status: status || 'draft',
        //   budget,
        //   startDate: startDate ? new Date(startDate) : null,
        //   endDate: endDate ? new Date(endDate) : null,
        // }).returning();
        // ===========================================

        const mockCampaign = {
            id: `camp-${Date.now()}`,
            workspaceId,
            name,
            slug,
            description: description || null,
            status: status || 'draft',
            budget: budget || null,
            spent: '0',
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Empty metrics for new campaign
            totalVisitors: 0,
            totalLeads: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            avgCvr: 0,
            avgRoas: 0,
        };

        return NextResponse.json(mockCampaign, { status: 201 });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json(
            { error: 'Failed to create campaign' },
            { status: 500 }
        );
    }
}