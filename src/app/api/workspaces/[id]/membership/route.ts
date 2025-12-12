// app/api/workspaces/[id]/membership/route.ts
// Get current user's membership in a workspace

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type RouteParams = {
    params: Promise<{ id: string }>;
};

// GET /api/workspaces/[id]/membership
export async function GET(req: Request, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth();
        const { id: workspaceId } = await params;

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

        // Global owner has implicit owner access to all workspaces
        if (user.globalRole === 'owner') {
            const [workspace] = await db
                .select()
                .from(workspaces)
                .where(eq(workspaces.id, workspaceId))
                .limit(1);

            if (!workspace) {
                return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
            }

            return NextResponse.json({
                id: 'global-owner',
                workspaceId,
                userId: user.id,
                role: 'owner',
                workspace,
            });
        }

        // Get membership
        const result = await db
            .select({
                id: workspaceMembers.id,
                workspaceId: workspaceMembers.workspaceId,
                userId: workspaceMembers.userId,
                role: workspaceMembers.role,
                permissions: workspaceMembers.permissions,
                joinedAt: workspaceMembers.joinedAt,
                workspace: workspaces,
            })
            .from(workspaceMembers)
            .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
            .where(
                and(
                    eq(workspaceMembers.workspaceId, workspaceId),
                    eq(workspaceMembers.userId, user.id)
                )
            )
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error('Error fetching membership:', error);
        return NextResponse.json(
            { error: 'Failed to fetch membership' },
            { status: 500 }
        );
    }
}