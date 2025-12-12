// app/api/workspaces/route.ts
// List and create workspaces

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers, users } from '@/schema';
import { eq, and, or } from 'drizzle-orm';

// GET /api/workspaces - List all accessible workspaces
export async function GET() {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get our internal user
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If global owner, return all workspaces
        if (user.globalRole === 'owner') {
            const allWorkspaces = await db
                .select()
                .from(workspaces)
                .orderBy(workspaces.isMaster, workspaces.name);

            return NextResponse.json(allWorkspaces);
        }

        // Otherwise, return only workspaces user is a member of
        const memberWorkspaces = await db
            .select({
                id: workspaces.id,
                name: workspaces.name,
                slug: workspaces.slug,
                description: workspaces.description,
                isMaster: workspaces.isMaster,
                isAgencyClient: workspaces.isAgencyClient,
                industry: workspaces.industry,
                plan: workspaces.plan,
                timezone: workspaces.timezone,
                currency: workspaces.currency,
                createdAt: workspaces.createdAt,
            })
            .from(workspaces)
            .innerJoin(
                workspaceMembers,
                eq(workspaces.id, workspaceMembers.workspaceId)
            )
            .where(eq(workspaceMembers.userId, user.id))
            .orderBy(workspaces.name);

        return NextResponse.json(memberWorkspaces);
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workspaces' },
            { status: 500 }
        );
    }
}

// POST /api/workspaces - Create a new workspace (client)
export async function POST(req: Request) {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get our internal user
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Only owners and admins can create workspaces
        if (user.globalRole !== 'owner' && user.globalRole !== 'admin') {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { name, description, industry, subIndustry } = body;

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
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Check slug uniqueness
        const existing = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        const finalSlug = existing.length > 0
            ? `${slug}-${Date.now().toString(36)}`
            : slug;

        // Create workspace
        const [workspace] = await db.insert(workspaces).values({
            name,
            slug: finalSlug,
            description,
            industry,
            subIndustry,
            isMaster: false,
            isAgencyClient: true,
            plan: 'starter',
            timezone: 'America/Sao_Paulo',
            currency: 'BRL',
            locale: 'pt-BR',
            ownerId: user.id,
            features: {
                aiCopywriting: true,
                abTesting: true,
                customDomains: false,
                whiteLabel: false,
                apiAccess: false,
            },
            limits: {
                campaigns: 10,
                landingPages: 20,
                leads: 1000,
                users: 3,
                storage: 1073741824, // 1GB
            },
        }).returning();

        // Add creator as admin (owner of workspace membership)
        await db.insert(workspaceMembers).values({
            workspaceId: workspace.id,
            userId: user.id,
            role: 'admin',
            joinedAt: new Date(),
        });

        return NextResponse.json(workspace, { status: 201 });
    } catch (error) {
        console.error('Error creating workspace:', error);
        return NextResponse.json(
            { error: 'Failed to create workspace' },
            { status: 500 }
        );
    }
}