// src/app/(protected)/layout.tsx
import './globals.css';
import { ConfigProvider } from '@/lib/config-context';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConfigProvider>
            {children}
        </ConfigProvider>
    );
}