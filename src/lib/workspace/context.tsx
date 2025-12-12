// lib/workspace/context.tsx
// Workspace context and provider for multi-tenancy

'use client';

import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';

// Types
export interface Workspace {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isMaster: boolean;
    isAgencyClient: boolean;
    industry?: string;
    plan: string;
    timezone: string;
    currency: string;
    logoUrl?: string;
    primaryColor?: string;
    createdAt: string;
}

export interface WorkspaceMember {
    id: string;
    workspaceId: string;
    userId: string;
    role: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'client' | 'visitor';
    workspace: Workspace;
}

interface WorkspaceContextValue {
    // Current workspace
    workspace: Workspace | null;
    workspaceId: string | null;
    isLoading: boolean;
    error: Error | null;

    // All accessible workspaces
    workspaces: Workspace[];
    workspacesLoading: boolean;

    // User's role in current workspace
    role: WorkspaceMember['role'] | null;
    isOwner: boolean;
    isAdmin: boolean;
    canEdit: boolean;
    canManage: boolean;

    // Actions
    switchWorkspace: (workspaceId: string) => Promise<void>;
    refreshWorkspaces: () => void;

    // Helpers
    hasPermission: (permission: Permission) => boolean;
}

type Permission =
    | 'campaigns:view' | 'campaigns:edit' | 'campaigns:delete'
    | 'leads:view' | 'leads:edit' | 'leads:export'
    | 'analytics:view'
    | 'pages:view' | 'pages:edit' | 'pages:publish'
    | 'brand:view' | 'brand:edit'
    | 'settings:view' | 'settings:edit'
    | 'billing:view' | 'billing:edit'
    | 'team:view' | 'team:edit';

// Role hierarchy for permission checks
const roleHierarchy: Record<WorkspaceMember['role'], number> = {
    owner: 100,
    admin: 80,
    manager: 60,
    editor: 40,
    viewer: 20,
    client: 10,
    visitor: 0,
};

// Permission requirements by role level
const permissionLevels: Record<Permission, number> = {
    'campaigns:view': 10,
    'campaigns:edit': 40,
    'campaigns:delete': 60,
    'leads:view': 10,
    'leads:edit': 40,
    'leads:export': 60,
    'analytics:view': 10,
    'pages:view': 10,
    'pages:edit': 40,
    'pages:publish': 60,
    'brand:view': 10,
    'brand:edit': 60,
    'settings:view': 40,
    'settings:edit': 80,
    'billing:view': 80,
    'billing:edit': 100,
    'team:view': 60,
    'team:edit': 80,
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// Cookie configuration
const WORKSPACE_COOKIE = 'workspace_id';
const COOKIE_OPTIONS = {
    expires: 365, // 1 year
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
};

// API functions
async function fetchWorkspaces(): Promise<Workspace[]> {
    const res = await fetch('/api/workspaces');
    if (!res.ok) throw new Error('Failed to fetch workspaces');
    return res.json();
}

async function fetchWorkspace(id: string): Promise<Workspace> {
    const res = await fetch(`/api/workspaces/${id}`);
    if (!res.ok) throw new Error('Failed to fetch workspace');
    return res.json();
}

async function fetchMembership(workspaceId: string): Promise<WorkspaceMember> {
    const res = await fetch(`/api/workspaces/${workspaceId}/membership`);
    if (!res.ok) throw new Error('Failed to fetch membership');
    return res.json();
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { isLoaded, isSignedIn, user } = useUser();
    const queryClient = useQueryClient();

    // Current workspace ID from cookie
    const [workspaceId, setWorkspaceId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return Cookies.get(WORKSPACE_COOKIE) || null;
    });

    // Fetch all accessible workspaces
    const {
        data: workspaces = [],
        isLoading: workspacesLoading,
        refetch: refreshWorkspaces,
    } = useQuery({
        queryKey: ['workspaces'],
        queryFn: fetchWorkspaces,
        enabled: isLoaded && isSignedIn,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch current workspace details
    const {
        data: workspace = null,
        isLoading: workspaceLoading,
        error: workspaceError,
    } = useQuery({
        queryKey: ['workspace', workspaceId],
        queryFn: () => fetchWorkspace(workspaceId!),
        enabled: !!workspaceId && isSignedIn,
    });

    // Fetch user's membership/role in current workspace
    const { data: membership = null } = useQuery({
        queryKey: ['membership', workspaceId],
        queryFn: () => fetchMembership(workspaceId!),
        enabled: !!workspaceId && isSignedIn,
    });

    // Auto-select workspace if only one available
    useEffect(() => {
        if (!workspaceId && workspaces.length === 1) {
            switchWorkspace(workspaces[0].id);
        }
    }, [workspaces, workspaceId]);

    // Switch workspace
    const switchWorkspace = useCallback(async (newWorkspaceId: string) => {
        // Update cookie
        Cookies.set(WORKSPACE_COOKIE, newWorkspaceId, COOKIE_OPTIONS);

        // Update state
        setWorkspaceId(newWorkspaceId);

        // Invalidate workspace-scoped queries
        queryClient.invalidateQueries({ queryKey: ['workspace'] });
        queryClient.invalidateQueries({ queryKey: ['membership'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['pages'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['brand'] });
    }, [queryClient]);

    // Permission check
    const hasPermission = useCallback((permission: Permission): boolean => {
        if (!membership) return false;

        // Owner role in user table means global owner (Pedro)
        const isGlobalOwner = user?.publicMetadata?.globalRole === 'owner';
        if (isGlobalOwner) return true;

        const userLevel = roleHierarchy[membership.role] || 0;
        const requiredLevel = permissionLevels[permission] || 100;

        return userLevel >= requiredLevel;
    }, [membership, user]);

    // Derived state
    const role = membership?.role || null;
    const isOwner = role === 'owner' || user?.publicMetadata?.globalRole === 'owner';
    const isAdmin = isOwner || role === 'admin';
    const canManage = isAdmin || role === 'manager';
    const canEdit = canManage || role === 'editor';

    const value: WorkspaceContextValue = {
        workspace,
        workspaceId,
        isLoading: !isLoaded || workspaceLoading,
        error: workspaceError as Error | null,

        workspaces,
        workspacesLoading,

        role,
        isOwner,
        isAdmin,
        canEdit,
        canManage,

        switchWorkspace,
        refreshWorkspaces,

        hasPermission,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}

// Hook for requiring a workspace (redirects if none selected)
export function useRequireWorkspace() {
    const workspace = useWorkspace();

    useEffect(() => {
        if (!workspace.isLoading && !workspace.workspaceId) {
            window.location.href = '/onboarding';
        }
    }, [workspace.isLoading, workspace.workspaceId]);

    return workspace;
}

// Hook for permission-gated components
export function usePermission(permission: Permission) {
    const { hasPermission, isLoading } = useWorkspace();
    return {
        allowed: hasPermission(permission),
        isLoading,
    };
}