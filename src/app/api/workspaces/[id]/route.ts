// app/api/workspaces/[id]/route.ts
// Get, update, delete individual workspace

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers, users, brandSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type RouteParams = {
    params: Promise<{ id: string }>;
};

// GET /api/workspaces/[id] - Get workspace details
export async function GET(req: Request, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth();
        const { id } = await params;

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

        // Get workspace
        const [workspace] = await db
            .select()
            .from(workspaces)
            .where(eq(workspaces.id, id))
            .limit(1);

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        // Check access (global owner can access any workspace)
        if (user.globalRole !== 'owner') {
            const [membership] = await db
                .select()
                .from(workspaceMembers)
                .where(
                    and(
                        eq(workspaceMembers.workspaceId, id),
                        eq(workspaceMembers.userId, user.id)
                    )
                )
                .limit(1);

            if (!membership) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
        }

        // Get brand settings if they exist
        const [brand] = await db
            .select({
                logoUrl: brandSettings.logoUrl,
                primaryColor: brandSettings.primaryColor,
                secondaryColor: brandSettings.secondaryColor,
            })
            .from(brandSettings)
            .where(eq(brandSettings.workspaceId, id))
            .limit(1);

        return NextResponse.json({
            ...workspace,
            logoUrl: brand?.logoUrl,
            primaryColor: brand?.primaryColor,
        });
    } catch (error) {
        console.error('Error fetching workspace:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workspace' },
            { status: 500 }
        );
    }
}

// PATCH /api/workspaces/[id] - Update workspace
export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth();
        const { id } = await params;

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

        // Check access (must be admin or higher)
        if (user.globalRole !== 'owner') {
            const [membership] = await db
                .select()
                .from(workspaceMembers)
                .where(
                    and(
                        eq(workspaceMembers.workspaceId, id),
                        eq(workspaceMembers.userId, user.id)
                    )
                )
                .limit(1);

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
        }

        const body = await req.json();
        const allowedFields = [
            'name',
            'description',
            'industry',
            'subIndustry',
            'timezone',
            'currency',
            'locale',
        ];

        // Filter to only allowed fields
        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        updates.updatedAt = new Date();

        const [workspace] = await db
            .update(workspaces)
            .set(updates)
            .where(eq(workspaces.id, id))
            .returning();

        return NextResponse.json(workspace);
    } catch (error) {
        console.error('Error updating workspace:', error);
        return NextResponse.json(
            { error: 'Failed to update workspace' },
            { status: 500 }
        );
    }
}

// DELETE /api/workspaces/[id] - Delete workspace
export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth();
        const { id } = await params;

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

        // Only global owner can delete workspaces
        if (user.globalRole !== 'owner') {
            return NextResponse.json(
                { error: 'Only platform owner can delete workspaces' },
                { status: 403 }
            );
        }

        // Get workspace
        const [workspace] = await db
            .select()
            .from(workspaces)
            .where(eq(workspaces.id, id))
            .limit(1);

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        // Cannot delete master workspace
        if (workspace.isMaster) {
            return NextResponse.json(
                { error: 'Cannot delete master workspace' },
                { status: 400 }
            );
        }

        // Delete workspace (cascades to members, brand, etc.)
        await db.delete(workspaces).where(eq(workspaces.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting workspace:', error);
        return NextResponse.json(
            { error: 'Failed to delete workspace' },
            { status: 500 }
        );
    }
}