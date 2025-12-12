// lib/queries/pages.ts
// React Query hooks for landing pages

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/workspace/context';
import type { LandingPage, PageStatus } from '@/types';

export type { LandingPage, PageStatus };

// Fetch functions
async function fetchPages(): Promise<LandingPage[]> {
    const response = await fetch('/api/pages');

    if (!response.ok) {
        throw new Error('Failed to fetch landing pages');
    }

    return response.json();
}

async function fetchPage(slug: string): Promise<LandingPage> {
    const response = await fetch(`/api/pages/${slug}`);

    if (!response.ok) {
        throw new Error('Failed to fetch landing page');
    }

    return response.json();
}

async function createPage(data: Partial<LandingPage>): Promise<LandingPage> {
    const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create landing page');
    }

    return response.json();
}

async function updatePage(id: string, data: Partial<LandingPage>): Promise<LandingPage> {
    const response = await fetch(`/api/pages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to update landing page');
    }

    return response.json();
}

async function deletePage(id: string): Promise<void> {
    const response = await fetch(`/api/pages/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete landing page');
    }
}

// Hooks
export function usePages() {
    const { workspace } = useWorkspace();

    return useQuery({
        queryKey: ['pages', workspace?.id],
        queryFn: fetchPages,
        enabled: !!workspace?.id,
        staleTime: 60 * 1000, // 1 minute
    });
}

export function usePage(slug: string) {
    return useQuery({
        queryKey: ['page', slug],
        queryFn: () => fetchPage(slug),
        enabled: !!slug,
        staleTime: 30 * 1000,
    });
}

export function useCreatePage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages'] });
        },
    });
}

export function useUpdatePage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LandingPage> }) =>
            updatePage(id, data),
        onSuccess: (updatedPage) => {
            queryClient.invalidateQueries({ queryKey: ['pages'] });
            queryClient.setQueryData(['page', updatedPage.slug], updatedPage);
        },
    });
}

export function useDeletePage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages'] });
        },
    });
}