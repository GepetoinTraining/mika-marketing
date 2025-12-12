// src/app/(public)/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import LandingPageClient from './LandingPage';

export default async function Home() {
    const { userId } = await auth();

    if (userId) {
        redirect('/pages');
    }

    return <LandingPageClient />;
}