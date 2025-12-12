// app/providers.tsx
'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Notifications } from '@mantine/notifications';
import { WorkspaceProvider } from '@/lib/workspace/context';
import { MantineProvider } from '@mantine/core';

// Clerk appearance - brutalist dark
const clerkAppearance = {
    variables: {
        colorPrimary: '#00ff88',
        colorTextOnPrimaryBackground: '#0a0a0a',
        colorBackground: '#111111',
        colorInputBackground: '#1a1a1a',
        colorInputText: '#e5e5e5',
        colorText: '#e5e5e5',
        colorTextSecondary: '#888888',
        borderRadius: '0px',
    },
    elements: {
        formButtonPrimary:
            'bg-[#00ff88] hover:bg-[#00cc6a] text-[#0a0a0a] font-semibold rounded-none',
        card: 'bg-[#111111] border border-[#2a2a2a] rounded-none shadow-none',
        headerTitle: 'text-[#e5e5e5] text-xl font-semibold',
        headerSubtitle: 'text-[#888888]',
        socialButtonsBlockButton:
            'border border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#222222] rounded-none',
        formFieldInput:
            'border border-[#2a2a2a] bg-[#1a1a1a] rounded-none text-[#e5e5e5]',
        footerActionLink:
            'text-[#00ff88] hover:text-[#00cc6a]',
        identityPreviewEditButton:
            'text-[#00ff88]',
    },
};

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <ClerkProvider
            localization={ptBR}
            appearance={clerkAppearance}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/onboarding"
        >
            <QueryClientProvider client={queryClient}>
                <MantineProvider>
                    <WorkspaceProvider>
                        <Notifications position="bottom-right" />
                        {children}
                    </WorkspaceProvider>
                </MantineProvider>
            </QueryClientProvider>
        </ClerkProvider>
    );
}