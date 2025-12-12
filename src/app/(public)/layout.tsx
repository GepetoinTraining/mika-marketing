// app/(public)/layout.tsx
// Layout for public pages (no sidebar, no auth required)

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}