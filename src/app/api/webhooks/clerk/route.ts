// app/api/webhooks/clerk/route.ts
// Handles Clerk webhook events to sync users to our database

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { users, workspaces, workspaceMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Clerk webhook event types we care about
type WebhookEvent = {
    type: string;
    data: {
        id: string;
        email_addresses?: Array<{ email_address: string; id: string }>;
        primary_email_address_id?: string;
        first_name?: string;
        last_name?: string;
        image_url?: string;
        public_metadata?: Record<string, unknown>;
        created_at?: number;
        updated_at?: number;
        deleted?: boolean;
    };
};

export async function POST(req: Request) {
    // Get the webhook secret from environment
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('Missing CLERK_WEBHOOK_SECRET');
        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json(
            { error: 'Missing svix headers' },
            { status: 400 }
        );
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with the secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    // Handle the webhook
    const eventType = evt.type;

    try {
        switch (eventType) {
            case 'user.created':
                await handleUserCreated(evt.data);
                break;

            case 'user.updated':
                await handleUserUpdated(evt.data);
                break;

            case 'user.deleted':
                await handleUserDeleted(evt.data);
                break;

            default:
                console.log(`Unhandled webhook event: ${eventType}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

// Handle user.created event
async function handleUserCreated(data: WebhookEvent['data']) {
    const { id: clerkId, email_addresses, primary_email_address_id, first_name, last_name, image_url, public_metadata } = data;

    // Get primary email
    const primaryEmail = email_addresses?.find(
        (e) => e.id === primary_email_address_id
    )?.email_address;

    if (!primaryEmail) {
        throw new Error('No primary email found for user');
    }

    // Determine global role (default to 'client', can be upgraded manually)
    const globalRole = (public_metadata?.globalRole as string) || 'client';

    // Create user in our database
    const [newUser] = await db.insert(users).values({
        clerkId,
        email: primaryEmail,
        name: [first_name, last_name].filter(Boolean).join(' ') || null,
        avatarUrl: image_url || null,
        globalRole: globalRole as 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'client',
        isActive: true,
    }).returning();

    console.log(`Created user: ${newUser.id} (${primaryEmail})`);

    // If this is the platform owner (first user or marked as owner), create master workspace
    if (globalRole === 'owner') {
        await createMasterWorkspace(newUser.id, primaryEmail);
    }

    return newUser;
}

// Handle user.updated event
async function handleUserUpdated(data: WebhookEvent['data']) {
    const { id: clerkId, email_addresses, primary_email_address_id, first_name, last_name, image_url, public_metadata } = data;

    // Get primary email
    const primaryEmail = email_addresses?.find(
        (e) => e.id === primary_email_address_id
    )?.email_address;

    if (!primaryEmail) {
        throw new Error('No primary email found for user');
    }

    // Update user in our database
    const [updatedUser] = await db
        .update(users)
        .set({
            email: primaryEmail,
            name: [first_name, last_name].filter(Boolean).join(' ') || null,
            avatarUrl: image_url || null,
            globalRole: (public_metadata?.globalRole as string) as any || undefined,
            updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId))
        .returning();

    if (updatedUser) {
        console.log(`Updated user: ${updatedUser.id} (${primaryEmail})`);
    }

    return updatedUser;
}

// Handle user.deleted event
async function handleUserDeleted(data: WebhookEvent['data']) {
    const { id: clerkId } = data;

    // Soft delete - mark as inactive
    const [deletedUser] = await db
        .update(users)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId))
        .returning();

    if (deletedUser) {
        console.log(`Deactivated user: ${deletedUser.id}`);
    }

    return deletedUser;
}

// Create master workspace for platform owner
async function createMasterWorkspace(userId: string, email: string) {
    // Create the master workspace
    const [workspace] = await db.insert(workspaces).values({
        name: 'Minha Empresa', // Will be customized during onboarding
        slug: 'master',
        description: 'Workspace principal',
        isMaster: true,
        isAgencyClient: false,
        plan: 'agency',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        locale: 'pt-BR',
        ownerId: userId,
        features: {
            aiCopywriting: true,
            abTesting: true,
            customDomains: true,
            whiteLabel: true,
            apiAccess: true,
        },
        limits: {
            campaigns: -1, // Unlimited
            landingPages: -1,
            leads: -1,
            users: -1,
            storage: -1,
        },
    }).returning();

    // Add owner as member
    await db.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: userId,
        role: 'owner',
        joinedAt: new Date(),
    });

    console.log(`Created master workspace: ${workspace.id}`);

    return workspace;
}