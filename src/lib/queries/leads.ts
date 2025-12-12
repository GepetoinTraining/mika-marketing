// lib/queries/leads.ts
// React Query hooks for leads

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/workspace/context';
import type { Lead, LeadStage } from '@/types';

export type { Lead, LeadStage };

// Fetch functions
async function fetchLeads(search?: string, stage?: string): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (stage) params.set('stage', stage);

    const url = `/api/leads${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch leads');
    }

    return response.json();
}

async function createLead(data: Partial<Lead>): Promise<Lead> {
    const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create lead');
    }

    return response.json();
}

async function updateLeadStage(leadId: string, stage: LeadStage, reason?: string): Promise<Lead> {
    const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, stage, reason }),
    });

    if (!response.ok) {
        throw new Error('Failed to update lead');
    }

    return response.json();
}

// Hooks
export function useLeads(search?: string, stage?: string) {
    const { workspace } = useWorkspace();

    return useQuery({
        queryKey: ['leads', workspace?.id, search, stage],
        queryFn: () => fetchLeads(search, stage),
        enabled: !!workspace?.id,
        staleTime: 30 * 1000, // 30 seconds
    });
}

export function useCreateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
    });
}

export function useUpdateLeadStage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ leadId, stage, reason }: { leadId: string; stage: LeadStage; reason?: string }) =>
            updateLeadStage(leadId, stage, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
        // Optimistic update
        onMutate: async ({ leadId, stage }) => {
            await queryClient.cancelQueries({ queryKey: ['leads'] });

            const previousLeads = queryClient.getQueryData<Lead[]>(['leads']);

            queryClient.setQueryData<Lead[]>(['leads'], (old) =>
                old?.map((lead) =>
                    lead.id === leadId ? { ...lead, stage } : lead
                )
            );

            return { previousLeads };
        },
        onError: (err, variables, context) => {
            if (context?.previousLeads) {
                queryClient.setQueryData(['leads'], context.previousLeads);
            }
        },
    });
}