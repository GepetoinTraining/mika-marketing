// app/api/pages/route.ts
// Workspace-scoped landing pages API

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { landingPages, landingPageDailyMetrics } from '@/lib/db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';

// Helper to get workspace ID from request
function getWorkspaceId(req: NextRequest): string | null {
    return req.headers.get('x-workspace-id');
}

// GET /api/pages - List landing pages for current workspace
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

        // Get landing pages with aggregated metrics
        const result = await db
            .select({
                id: landingPages.id,
                workspaceId: landingPages.workspaceId,
                campaignId: landingPages.campaignId,
                parentPageId: landingPages.parentPageId,
                name: landingPages.name,
                slug: landingPages.slug,
                status: landingPages.status,
                headline: landingPages.headline,
                subheadline: landingPages.subheadline,
                bodyContent: landingPages.bodyContent,
                ctaText: landingPages.ctaText,
                metaTitle: landingPages.metaTitle,
                metaDescription: landingPages.metaDescription,
                isVariant: landingPages.isVariant,
                variantName: landingPages.variantName,
                trafficAllocation: landingPages.trafficAllocation,
                stylePreset: landingPages.stylePreset,
                customStyles: landingPages.customStyles,
                createdAt: landingPages.createdAt,
                updatedAt: landingPages.updatedAt,
                publishedAt: landingPages.publishedAt,
                // Aggregated metrics
                totalViews: sql<number>`COALESCE(SUM(${landingPageDailyMetrics.pageViews}), 0)::int`,
                uniqueVisitors: sql<number>`COALESCE(SUM(${landingPageDailyMetrics.uniqueVisitors}), 0)::int`,
                totalConversions: sql<number>`COALESCE(SUM(${landingPageDailyMetrics.leads}), 0)::int`,
                avgTimeOnPage: sql<number>`COALESCE(AVG(${landingPageDailyMetrics.avgTimeOnPage}), 0)::int`,
                avgScrollDepth: sql<number>`COALESCE(AVG(${landingPageDailyMetrics.avgScrollDepth}), 0)::real`,
                bounceRate: sql<number>`COALESCE(AVG(${landingPageDailyMetrics.bounceRate}), 0)::real`,
            })
            .from(landingPages)
            .leftJoin(
                landingPageDailyMetrics,
                eq(landingPages.id, landingPageDailyMetrics.landingPageId)
            )
            .where(eq(landingPages.workspaceId, workspaceId))
            .groupBy(landingPages.id)
            .orderBy(desc(landingPages.createdAt));

        // Transform for frontend
        const transformedPages = result.map(page => ({
            ...page,
            // Calculate conversion rate
            conversionRate: page.uniqueVisitors > 0
                ? (page.totalConversions / page.uniqueVisitors) * 100
                : 0,
            // Ensure proper types
            bodyContent: page.bodyContent || null,
            customStyles: page.customStyles || {},
        }));

        return NextResponse.json(transformedPages);
    } catch (error) {
        console.error('Error fetching landing pages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch landing pages' },
            { status: 500 }
        );
    }
}

// POST /api/pages - Create a new landing page
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
            slug,
            campaignId,
            headline,
            subheadline,
            bodyContent,
            ctaText,
            metaTitle,
            metaDescription,
            parentPageId,
            isVariant = false,
            variantName,
            trafficAllocation = 100,
            stylePreset = 'minimal',
            customStyles = {},
            status = 'draft',
        } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // Generate slug if not provided
        const finalSlug = slug || name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const [page] = await db.insert(landingPages).values({
            workspaceId,
            name,
            slug: finalSlug,
            campaignId: campaignId || null,
            headline: headline || null,
            subheadline: subheadline || null,
            bodyContent: bodyContent || null,
            ctaText: ctaText || null,
            metaTitle: metaTitle || null,
            metaDescription: metaDescription || null,
            parentPageId: parentPageId || null,
            isVariant,
            variantName: variantName || null,
            trafficAllocation,
            stylePreset,
            customStyles,
            status,
        }).returning();

        return NextResponse.json({
            ...page,
            totalViews: 0,
            uniqueVisitors: 0,
            totalConversions: 0,
            conversionRate: 0,
            avgTimeOnPage: 0,
            avgScrollDepth: 0,
            bounceRate: 0,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating landing page:', error);
        return NextResponse.json(
            { error: 'Failed to create landing page' },
            { status: 500 }
        );
    }
}