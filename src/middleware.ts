// middleware.ts
// Handles authentication and workspace routing

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes - no auth required
const isPublicRoute = createRouteMatcher([
    '/',
    '/pricing',
    '/invite/(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/sso-callback(.*)',
    '/api/webhooks/(.*)',
]);

// Auth routes - Clerk handles these
const isAuthRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/sso-callback(.*)',
]);

// Onboarding - auth required but no workspace required
const isOnboardingRoute = createRouteMatcher([
    '/onboarding(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    // Public routes - allow through
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // Not authenticated - redirect to sign-in
    if (!userId) {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signInUrl);
    }

    // Authenticated but on auth routes - redirect to dashboard
    if (isAuthRoute(req)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Onboarding routes - allow through (they handle their own logic)
    if (isOnboardingRoute(req)) {
        return NextResponse.next();
    }

    // Protected routes - check for workspace cookie
    const workspaceId = req.cookies.get('workspace_id')?.value;

    if (!workspaceId) {
        // No workspace selected - redirect to onboarding/workspace selection
        return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // Add workspace to headers for API routes
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-workspace-id', workspaceId);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
});

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};