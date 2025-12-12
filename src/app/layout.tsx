// src/app/layout.tsx
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';
import { Providers } from './providers';

const theme = createTheme({
    primaryColor: 'teal',
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontFamilyMonospace: 'JetBrains Mono, Fira Code, monospace',
    headings: {
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontWeight: '600',
    },
    colors: {
        dark: [
            '#e5e5e5',
            '#888888',
            '#555555',
            '#333333',
            '#2a2a2a',
            '#222222',
            '#1a1a1a',
            '#111111',
            '#0a0a0a',
            '#050505',
        ],
    },
});

export const metadata = {
    title: 'Mika Marketing',
    description: 'Full-funnel marketing analytics platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                <ColorSchemeScript forceColorScheme="dark" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body>
                <MantineProvider theme={theme} forceColorScheme="dark">
                    <Providers>
                        {children}
                    </Providers>
                </MantineProvider>
            </body>
        </html>
    );
}