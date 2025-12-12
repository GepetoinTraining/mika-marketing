// lib/queries/campaigns.ts
// Client-side data fetching for campaigns

import type { Campaign, LandingPage } from '@/types';
import type { CampaignWithPerformance } from '@/lib/db/mock';

// Re-export types for convenience
export type { Campaign, LandingPage } from '@/types';
export type { CampaignWithPerformance } from '@/lib/db/mock';

// ===========================================
// FETCH FUNCTIONS
// ===========================================

export async function fetchCampaigns(): Promise<CampaignWithPerformance[]> {
    const res = await fetch('/api/campaigns');

    if (!res.ok) {
        throw new Error('Failed to fetch campaigns');
    }

    return res.json();
}

export async function fetchCampaign(id: string): Promise<CampaignWithPerformance> {
    const res = await fetch(`/api/campaigns/${id}`);

    if (!res.ok) {
        throw new Error('Failed to fetch campaign');
    }

    return res.json();
}

export async function createCampaign(data: {
    name: string;
    description?: string;
    status?: string;
    budget?: number;
    startsAt?: string;
    endsAt?: string;
}): Promise<Campaign> {
    const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error('Failed to create campaign');
    }

    return res.json();
}

export async function updateCampaign(
    id: string,
    data: Partial<Campaign>
): Promise<Campaign> {
    const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error('Failed to update campaign');
    }

    return res.json();
}

export async function deleteCampaign(id: string): Promise<void> {
    const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
    });

    if (!res.ok) {
        throw new Error('Failed to delete campaign');
    }
}

// ===========================================
// REACT QUERY HOOKS
// ===========================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/workspace/context';

export function useCampaigns() {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: ['campaigns', workspaceId],
        queryFn: fetchCampaigns,
        enabled: !!workspaceId,
        staleTime: 60 * 1000, // 1 minute
    });
}

export function useCampaign(id: string | null) {
    const { workspaceId } = useWorkspace();

    return useQuery({
        queryKey: ['campaign', id, workspaceId],
        queryFn: () => fetchCampaign(id!),
        enabled: !!id && !!workspaceId,
    });
}

export function useCreateCampaign() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: createCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
        },
    });
}

export function useUpdateCampaign() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) =>
            updateCampaign(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['campaign', id, workspaceId] });
        },
    });
}

export function useDeleteCampaign() {
    const queryClient = useQueryClient();
    const { workspaceId } = useWorkspace();

    return useMutation({
        mutationFn: deleteCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
        },
    });
}