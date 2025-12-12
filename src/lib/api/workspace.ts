// lib/api/workspace.ts
// Helpers for workspace-scoped API operations

import { auth } from '@clerk/nextjs/server';
import { headers, cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, workspaces, workspaceMembers } from '@/schema/complete-v3';
import { eq, and } from 'drizzle-orm';

export interface WorkspaceContext {
    user: {
        id: string;
        clerkId: string;
        email: string;
        globalRole: string;
    };
    workspace: {
        id: string;
        name: string;
        slug: string;
    };
    role: string;
    isGlobalOwner: boolean;
}

/**
 * Get the current workspace context for API routes.
 * Returns null if not authenticated or no workspace selected.
 * Throws if access denied.
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        return null;
    }

    // Get our internal user
    const [user] = await db
        .select({
            id: users.id,
            clerkId: users.clerkId,
            email: users.email,
            globalRole: users.globalRole,
        })
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

    if (!user) {
        return null;
    }

    // Get workspace ID from header (set by middleware) or cookie
    const headersList = await headers();
    const cookieStore = await cookies();

    const workspaceId =
        headersList.get('x-workspace-id') ||
        cookieStore.get('workspace_id')?.value;

    if (!workspaceId) {
        return null;
    }

    // Get workspace
    const [workspace] = await db
        .select({
            id: workspaces.id,
            name: workspaces.name,
            slug: workspaces.slug,
        })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

    if (!workspace) {
        return null;
    }

    const isGlobalOwner = user.globalRole === 'owner';

    // Global owner has implicit access
    if (isGlobalOwner) {
        return {
            user,
            workspace,
            role: 'owner',
            isGlobalOwner: true,
        };
    }

    // Check membership
    const [membership] = await db
        .select({ role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(
            and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, user.id)
            )
        )
        .limit(1);

    if (!membership) {
        throw new Error('Access denied to workspace');
    }

    return {
        user,
        workspace,
        role: membership.role,
        isGlobalOwner: false,
    };
}

/**
 * Require workspace context - throws if not available
 */
export async function requireWorkspaceContext(): Promise<WorkspaceContext> {
    const context = await getWorkspaceContext();

    if (!context) {
        throw new Error('Workspace context required');
    }

    return context;
}

/**
 * Check if user has a specific role level or higher
 */
export function hasRoleLevel(
    context: WorkspaceContext,
    requiredRole: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'client'
): boolean {
    const roleHierarchy: Record<string, number> = {
        owner: 100,
        admin: 80,
        manager: 60,
        editor: 40,
        viewer: 20,
        client: 10,
    };

    const userLevel = roleHierarchy[context.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 100;

    return userLevel >= requiredLevel;
}

/**
 * Require a minimum role level - throws if insufficient
 */
export function requireRoleLevel(
    context: WorkspaceContext,
    requiredRole: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'client'
): void {
    if (!hasRoleLevel(context, requiredRole)) {
        throw new Error(`Insufficient permissions. Required: ${requiredRole}`);
    }
}