// app/api/pages/[slug]/route.ts
// Public landing page fetch by slug

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { landingPages } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';

type RouteParams = {
    params: Promise<{ slug: string }>;
};

// GET /api/pages/[slug] - Get a landing page by slug (public)
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;

        // Find page by slug or ID
        const [page] = await db
            .select()
            .from(landingPages)
            .where(
                or(
                    eq(landingPages.slug, slug),
                    eq(landingPages.id, slug)
                )
            );

        if (!page) {
            return NextResponse.json(
                { error: 'Page not found' },
                { status: 404 }
            );
        }

        // Only return published/active pages publicly
        if (page.status !== 'published' && page.status !== 'testing') {
            return NextResponse.json(
                { error: 'Page not found' },
                { status: 404 }
            );
        }

        // Check for A/B test variants
        let selectedPage = page;

        if (!page.isVariant) {
            // This is a parent page - check for variants
            const variants = await db
                .select()
                .from(landingPages)
                .where(
                    and(
                        eq(landingPages.parentPageId, page.id),
                        eq(landingPages.isVariant, true)
                    )
                );

            if (variants.length > 0) {
                // Simple traffic allocation
                // In production, use cookies for consistency
                const totalAllocation = (page.trafficAllocation ?? 100) +
                    variants.reduce((sum, v) => sum + (v.trafficAllocation ?? 0), 0);

                const rand = Math.random() * totalAllocation;
                let cumulative = page.trafficAllocation || 100;

                for (const variant of variants) {
                    if (rand > cumulative) {
                        selectedPage = variant;
                        break;
                    }
                    cumulative += variant.trafficAllocation || 0;
                }
            }
        }

        return NextResponse.json({
            ...selectedPage,
            bodyContent: selectedPage.bodyContent || null,
            customStyles: selectedPage.customStyles || {},
        });
    } catch (error) {
        console.error('Error fetching landing page:', error);
        return NextResponse.json(
            { error: 'Failed to fetch page' },
            { status: 500 }
        );
    }
}