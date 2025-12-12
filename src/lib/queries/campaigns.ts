// lib/queries/campaigns.ts
// React Query hooks for campaigns

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/workspace/context';
import type { Campaign, CampaignWithPerformance, CampaignStatus } from '@/types';

export type { Campaign, CampaignWithPerformance, CampaignStatus };

// Fetch functions
async function fetchCampaigns(): Promise<CampaignWithPerformance[]> {
    const response = await fetch('/api/campaigns');

    if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
    }

    return response.json();
}

async function fetchCampaign(id: string): Promise<CampaignWithPerformance> {
    const response = await fetch(`/api/campaigns/${id}`);

    if (!response.ok) {
        throw new Error('Failed to fetch campaign');
    }

    return response.json();
}

async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create campaign');
    }

    return response.json();
}

async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to update campaign');
    }

    return response.json();
}

async function deleteCampaign(id: string): Promise<void> {
    const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete campaign');
    }
}

// Hooks
export function useCampaigns() {
    const { workspace } = useWorkspace();

    return useQuery({
        queryKey: ['campaigns', workspace?.id],
        queryFn: fetchCampaigns,
        enabled: !!workspace?.id,
        staleTime: 60 * 1000, // 1 minute
    });
}

export function useCampaign(id: string) {
    return useQuery({
        queryKey: ['campaign', id],
        queryFn: () => fetchCampaign(id),
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

export function useCreateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        },
    });
}

export function useUpdateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) =>
            updateCampaign(id, data),
        onSuccess: (updatedCampaign) => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            queryClient.setQueryData(['campaign', updatedCampaign.id], updatedCampaign);
        },
    });
}

export function useDeleteCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        },
    });
}