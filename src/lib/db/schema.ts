// schema/complete-v3.ts
// Marketing Analytics Platform - Complete V3 Schema
// Full brand operating system + agency multi-tenancy
// 
// VERSION ROADMAP:
// V1 (Ship): Workspaces, Users, Basic Brand (logo + colors)
// V2 (Month 2): Full token system, Voice config, Asset library
// V3 (Future): Templates, Industry learning, Token versioning
//
// ALL TABLES INCLUDED - Use what you need, ignore the rest
// No breaking migrations needed for future features

import {
    pgTable,
    pgEnum,
    uuid,
    text,
    timestamp,
    boolean,
    integer,
    decimal,
    real,
    jsonb,
    date,
    index,
    uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';

// ============================================
// CUSTOM TYPES
// ============================================

// pgvector type - 768 dimensions for Gemini embedding-001
const vector = customType<{ data: number[]; driverData: string }>({
    dataType() {
        return 'vector(768)';
    },
    toDriver(value: number[]): string {
        return `[${value.join(',')}]`;
    },
    fromDriver(value: string): number[] {
        return JSON.parse(value);
    },
});

// ============================================
// ENUMS
// ============================================

// Auth & Tenancy
export const userRoleEnum = pgEnum('user_role', [
    'owner',      // Platform owner (Pedro) - sees all workspaces
    'admin',      // Workspace admin - full access to workspace
    'manager',    // Can manage campaigns, not billing
    'editor',     // Can edit content, not settings
    'viewer',     // Read-only access
    'client',     // Client portal access (limited)
]);

export const workspacePlanEnum = pgEnum('workspace_plan', [
    'trial',
    'starter',
    'professional',
    'agency',
    'enterprise',
]);

export const inviteStatusEnum = pgEnum('invite_status', [
    'pending',
    'accepted',
    'expired',
    'revoked',
]);

// Brand System
export const assetTypeEnum = pgEnum('asset_type', [
    'logo_primary',
    'logo_secondary',
    'logo_icon',
    'logo_dark',
    'logo_light',
    'logo_favicon',
    'photo',
    'icon',
    'pattern',
    'background',
    'product',
    'team',
    'social',
    'other',
]);

export const assetStatusEnum = pgEnum('asset_status', [
    'processing',
    'ready',
    'error',
]);

// Existing enums (from previous schema)
export const leadStageEnum = pgEnum('lead_stage', [
    'captured',
    'engaged',
    'qualified',
    'opportunity',
    'customer',
    'churned',
]);

export const eventTypeEnum = pgEnum('event_type', [
    'page_view',
    'scroll',
    'click',
    'form_start',
    'form_submit',
    'video_play',
    'video_progress',
    'video_complete',
    'download',
    'share',
    'purchase',
    'refund',
    'email_open',
    'email_click',
    'custom',
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
    'draft',
    'scheduled',
    'active',
    'paused',
    'completed',
    'archived',
]);

export const pageStatusEnum = pgEnum('page_status', [
    'draft',
    'published',
    'testing',
    'paused',
    'archived',
]);

export const insightTypeEnum = pgEnum('insight_type', [
    'observation',
    'recommendation',
    'warning',
    'success',
    'anomaly',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
    'sale',
    'refund',
    'chargeback',
]);

export const monitorStatusEnum = pgEnum('monitor_status', [
    'active',
    'paused',
    'triggered',
]);

export const alertSeverityEnum = pgEnum('alert_severity', [
    'info',
    'warning',
    'critical',
]);

export const alertStatusEnum = pgEnum('alert_status', [
    'open',
    'acknowledged',
    'resolved',
    'dismissed',
]);

// ============================================
// SECTION 1: AUTH & TENANCY
// ============================================

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Identity (synced from Clerk)
    clerkId: text('clerk_id').notNull(),
    email: text('email').notNull(),
    name: text('name'),
    avatarUrl: text('avatar_url'),

    // Global role (owner can see everything)
    globalRole: userRoleEnum('global_role').default('client'),

    // Preferences
    preferences: jsonb('preferences').default({}),
    // {
    //   theme: 'dark' | 'light' | 'system',
    //   timezone: 'America/Sao_Paulo',
    //   language: 'pt-BR',
    //   notifications: { email: true, push: true }
    // }

    // Status
    isActive: boolean('is_active').default(true),
    lastLoginAt: timestamp('last_login_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    clerkIdx: uniqueIndex('users_clerk_idx').on(table.clerkId),
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

export const workspaces = pgTable('workspaces', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Basic info
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),

    // Type
    isMaster: boolean('is_master').default(false), // Owner's own business
    isAgencyClient: boolean('is_agency_client').default(false), // Client of the agency

    // Industry (for AI learning)
    industry: text('industry'),
    subIndustry: text('sub_industry'),
    // {
    //   'education', 'restaurant', 'ecommerce', 'saas', 'healthcare',
    //   'real_estate', 'finance', 'fitness', 'beauty', 'legal', 'other'
    // }

    // Plan & Billing (V3)
    plan: workspacePlanEnum('plan').default('starter'),
    planExpiresAt: timestamp('plan_expires_at'),

    // Limits (based on plan)
    limits: jsonb('limits').default({
        campaigns: 10,
        landingPages: 20,
        leads: 1000,
        users: 3,
        storage: 1073741824, // 1GB in bytes
    }),

    // Settings
    timezone: text('timezone').default('America/Sao_Paulo'),
    currency: text('currency').default('BRL'),
    locale: text('locale').default('pt-BR'),

    // Feature flags
    features: jsonb('features').default({
        aiCopywriting: true,
        abTesting: true,
        customDomains: false,
        whiteLabel: false,
        apiAccess: false,
    }),

    // Owner reference (for quick access)
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'restrict' }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    slugIdx: uniqueIndex('workspaces_slug_idx').on(table.slug),
    ownerIdx: index('workspaces_owner_idx').on(table.ownerId),
    industryIdx: index('workspaces_industry_idx').on(table.industry),
}));

export const workspaceMembers = pgTable('workspace_members', {
    id: uuid('id').defaultRandom().primaryKey(),

    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

    // Role within this workspace
    role: userRoleEnum('role').default('viewer'),

    // Permissions override (fine-grained)
    permissions: jsonb('permissions').default({}),
    // {
    //   campaigns: { view: true, edit: true, delete: false },
    //   leads: { view: true, edit: true, export: false },
    //   analytics: { view: true },
    //   settings: { view: false, edit: false },
    //   billing: { view: false, edit: false },
    // }

    // Invitation tracking
    invitedBy: uuid('invited_by').references(() => users.id),
    invitedAt: timestamp('invited_at'),
    joinedAt: timestamp('joined_at').defaultNow(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueMember: uniqueIndex('workspace_members_unique').on(table.workspaceId, table.userId),
    workspaceIdx: index('workspace_members_workspace_idx').on(table.workspaceId),
    userIdx: index('workspace_members_user_idx').on(table.userId),
}));

export const invitations = pgTable('invitations', {
    id: uuid('id').defaultRandom().primaryKey(),

    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),

    // Invitee
    email: text('email').notNull(),
    role: userRoleEnum('role').default('viewer'),

    // Token for accepting
    token: text('token').notNull(),

    // Status
    status: inviteStatusEnum('status').default('pending'),

    // Tracking
    invitedBy: uuid('invited_by').references(() => users.id).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    acceptedAt: timestamp('accepted_at'),
    acceptedBy: uuid('accepted_by').references(() => users.id),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    tokenIdx: uniqueIndex('invitations_token_idx').on(table.token),
    emailIdx: index('invitations_email_idx').on(table.email),
    workspaceIdx: index('invitations_workspace_idx').on(table.workspaceId),
}));


// ============================================
// SECTION 2: BRAND SYSTEM
// ============================================

// Core brand settings and design tokens
export const brandSettings = pgTable('brand_settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),

    // ========== V1: Basic Brand ==========

    // Primary logo URL (Vercel Blob)
    logoUrl: text('logo_url'),
    faviconUrl: text('favicon_url'),

    // Core colors
    primaryColor: text('primary_color').default('#3B82F6'),
    secondaryColor: text('secondary_color').default('#1E40AF'),
    accentColor: text('accent_color').default('#F59E0B'),
    backgroundColor: text('background_color').default('#FFFFFF'),
    surfaceColor: text('surface_color').default('#F9FAFB'),
    textColor: text('text_color').default('#111827'),
    textMutedColor: text('text_muted_color').default('#6B7280'),

    // Typography basics
    headingFont: text('heading_font').default('Inter'),
    bodyFont: text('body_font').default('Inter'),

    // Default style preset
    defaultStylePreset: text('default_style_preset').default('minimal'),
    // 'brutalist', 'minimal', 'bold', 'elegant'

    // ========== V2: Full Token System ==========

    // Complete design token tree (Figma/Tailwind compatible)
    tokens: jsonb('tokens').default({}),
    // {
    //   primitives: {
    //     colors: { red500: '#EF4444', blue500: '#3B82F6', ... },
    //     fonts: { sans: 'Inter', serif: 'Merriweather' },
    //     spacing: { 1: '4px', 2: '8px', ... },
    //   },
    //   semantic: {
    //     color: {
    //       primary: { value: '{primitives.colors.blue500}' },
    //       'primary.hover': { value: '{primitives.colors.blue600}' },
    //       background: { value: '{primitives.colors.white}' },
    //       text: { value: '{primitives.colors.gray900}' },
    //       ...
    //     },
    //     font: {
    //       heading: { value: '{primitives.fonts.sans}' },
    //       body: { value: '{primitives.fonts.sans}' },
    //     },
    //     ...
    //   },
    //   component: {
    //     button: {
    //       primary: {
    //         bg: { value: '{semantic.color.primary}' },
    //         text: { value: '#FFFFFF' },
    //         radius: { value: '{semantic.radius.md}' },
    //       },
    //       ...
    //     },
    //     card: { ... },
    //     input: { ... },
    //   }
    // }

    // Color palette (additional brand colors)
    colorPalette: jsonb('color_palette').default([]),
    // [
    //   { name: 'Brand Red', value: '#E63946', usage: 'CTAs, urgency' },
    //   { name: 'Trust Blue', value: '#1D3557', usage: 'Headers, trust elements' },
    // ]

    // Typography scale
    typographyScale: jsonb('typography_scale').default({}),
    // {
    //   baseSize: 16,
    //   scaleRatio: 1.25,
    //   sizes: {
    //     xs: '12px', sm: '14px', base: '16px', lg: '20px',
    //     xl: '24px', '2xl': '32px', '3xl': '40px', display: '48px'
    //   },
    //   lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
    //   letterSpacing: { tight: '-0.02em', normal: '0', wide: '0.02em' }
    // }

    // Spacing system
    spacingScale: jsonb('spacing_scale').default({}),
    // { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px' }

    // Border radius
    radiusScale: jsonb('radius_scale').default({}),
    // { none: '0', sm: '4px', md: '8px', lg: '16px', xl: '24px', full: '9999px' }

    // Shadows
    shadowScale: jsonb('shadow_scale').default({}),
    // {
    //   sm: '0 1px 2px rgba(0,0,0,0.05)',
    //   md: '0 4px 6px rgba(0,0,0,0.1)',
    //   lg: '0 10px 15px rgba(0,0,0,0.1)',
    //   xl: '0 20px 25px rgba(0,0,0,0.15)'
    // }

    // ========== V3: Advanced ==========

    // Token version history
    tokenVersion: integer('token_version').default(1),

    // Export configurations
    exportConfigs: jsonb('export_configs').default({}),
    // {
    //   tailwind: { enabled: true, path: 'tailwind.config.js' },
    //   css: { enabled: true, format: 'variables' },
    //   figma: { enabled: false },
    //   scss: { enabled: false }
    // }

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: uniqueIndex('brand_settings_workspace_idx').on(table.workspaceId),
}));

// Logo variations
export const brandLogos = pgTable('brand_logos', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),

    // Type of logo
    type: assetTypeEnum('type').notNull(),
    // 'logo_primary', 'logo_secondary', 'logo_icon', 'logo_dark', 'logo_light', 'logo_favicon'

    // File info
    name: text('name').notNull(),
    url: text('url').notNull(), // Vercel Blob URL

    // Dimensions
    width: integer('width'),
    height: integer('height'),

    // File metadata
    mimeType: text('mime_type'),
    fileSize: integer('file_size'), // bytes

    // Status
    status: assetStatusEnum('status').default('ready'),

    // Preferred usage
    usageNotes: text('usage_notes'),
    // 'Use on light backgrounds only', 'Minimum size 200px', etc.

    // Ordering
    sortOrder: integer('sort_order').default(0),
    isPrimary: boolean('is_primary').default(false),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('brand_logos_workspace_idx').on(table.workspaceId),
    typeIdx: index('brand_logos_type_idx').on(table.type),
}));

// Brand voice and tone configuration
export const brandVoice = pgTable('brand_voice', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),

    // ========== V2: Voice Configuration ==========

    // Brand personality traits (select 3-5)
    personality: text('personality').array().default([]),
    // ['friendly', 'professional', 'innovative', 'warm', 'bold', 'playful', 
    //  'serious', 'minimal', 'luxury', 'technical', 'approachable', 'authoritative']

    // Tone adjectives
    toneAdjectives: text('tone_adjectives').array().default([]),
    // ['confident', 'warm', 'clear', 'enthusiastic', 'empathetic', 'direct']

    // Voice description (free text)
    voiceDescription: text('voice_description'),
    // "Confident but not arrogant. Warm and welcoming. Uses clear, simple language..."

    // Target audience
    audienceDescription: text('audience_description'),
    // "Professionals aged 25-45 looking to advance their careers..."

    // Vocabulary guidance
    preferredWords: text('preferred_words').array().default([]),
    // ['transform', 'fluency', 'confidence', 'journey', 'invest', 'professional']

    avoidWords: text('avoid_words').array().default([]),
    // ['cheap', 'discount', 'fast', 'easy', 'guaranteed', 'buy now']

    // Example copy (for AI to learn from)
    exampleCopy: text('example_copy').array().default([]),
    // ["Fluency isn't just about words. It's about confidence.", ...]

    // ========== V3: Advanced Voice ==========

    // Context-specific variations
    voiceVariations: jsonb('voice_variations').default({}),
    // {
    //   landing_page: { tone: 'persuasive', emphasis: 'benefits' },
    //   email: { tone: 'personal', emphasis: 'relationship' },
    //   social: { tone: 'casual', emphasis: 'engagement' },
    //   support: { tone: 'helpful', emphasis: 'clarity' }
    // }

    // Competitor differentiation
    competitorNotes: text('competitor_notes'),
    // "Unlike [Competitor], we focus on..."

    // Key messages / Value propositions
    keyMessages: text('key_messages').array().default([]),
    // ["Professional English fluency for career advancement", ...]

    // Embedding for semantic search
    embedding: vector('embedding'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: uniqueIndex('brand_voice_workspace_idx').on(table.workspaceId),
}));

// Asset library
export const brandAssets = pgTable('brand_assets', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),

    // Organization
    folderId: uuid('folder_id').references(() => brandAssetFolders.id, { onDelete: 'set null' }),

    // Asset info
    name: text('name').notNull(),
    type: assetTypeEnum('type').notNull(),

    // File info (Vercel Blob)
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),

    // Dimensions (for images)
    width: integer('width'),
    height: integer('height'),

    // File metadata
    mimeType: text('mime_type'),
    fileSize: integer('file_size'), // bytes

    // Status
    status: assetStatusEnum('status').default('ready'),

    // Metadata
    alt: text('alt'), // Alt text for accessibility
    description: text('description'),
    tags: text('tags').array().default([]),

    // Usage tracking
    usageCount: integer('usage_count').default(0),
    lastUsedAt: timestamp('last_used_at'),

    // AI-extracted metadata (V3)
    aiMetadata: jsonb('ai_metadata').default({}),
    // {
    //   dominantColors: ['#E63946', '#1D3557'],
    //   detectedObjects: ['person', 'laptop', 'office'],
    //   suggestedTags: ['professional', 'modern', 'technology'],
    //   textContent: 'Extracted text if any...'
    // }

    // Embedding for similarity search
    embedding: vector('embedding'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('brand_assets_workspace_idx').on(table.workspaceId),
    folderIdx: index('brand_assets_folder_idx').on(table.folderId),
    typeIdx: index('brand_assets_type_idx').on(table.type),
    tagsIdx: index('brand_assets_tags_idx').on(table.tags),
}));

// Asset folders (V2)
export const brandAssetFolders = pgTable('brand_asset_folders', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),

    parentId: uuid('parent_id'), // Self-reference for nesting

    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),

    // Auto-organize rules (V3)
    autoRules: jsonb('auto_rules').default({}),
    // { types: ['photo'], tags: ['product'], aiTags: ['food'] }

    sortOrder: integer('sort_order').default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('brand_asset_folders_workspace_idx').on(table.workspaceId),
    parentIdx: index('brand_asset_folders_parent_idx').on(table.parentId),
    slugIdx: index('brand_asset_folders_slug_idx').on(table.workspaceId, table.slug),
}));

// Brand templates (V3)
export const brandTemplates = pgTable('brand_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),

    name: text('name').notNull(),
    description: text('description'),

    // Template type
    type: text('type').notNull(),
    // 'landing_page', 'email', 'social_post', 'ad', 'document'

    // The actual template (structure depends on type)
    template: jsonb('template').notNull(),
    // For landing_page:
    // {
    //   sections: [
    //     { type: 'hero', config: { layout: 'centered', hasImage: true } },
    //     { type: 'benefits', config: { columns: 3 } },
    //     { type: 'testimonials', config: { style: 'carousel' } },
    //     { type: 'cta', config: { style: 'full-width' } }
    //   ],
    //   defaultCopy: { headline: '...', subheadline: '...' }
    // }

    // Preview image
    thumbnailUrl: text('thumbnail_url'),
    previewUrl: text('preview_url'),

    // Categorization
    category: text('category'),
    tags: text('tags').array().default([]),

    // Usage stats
    usageCount: integer('usage_count').default(0),
    lastUsedAt: timestamp('last_used_at'),

    // Is this a system default or user-created?
    isSystem: boolean('is_system').default(false),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('brand_templates_workspace_idx').on(table.workspaceId),
    typeIdx: index('brand_templates_type_idx').on(table.type),
}));

// Token version history (V3)
export const brandTokenHistory = pgTable('brand_token_history', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),

    version: integer('version').notNull(),

    // Snapshot of tokens at this version
    tokens: jsonb('tokens').notNull(),

    // What changed
    changeDescription: text('change_description'),
    changedBy: uuid('changed_by').references(() => users.id),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    workspaceVersionIdx: uniqueIndex('brand_token_history_version_idx').on(table.workspaceId, table.version),
}));


// ============================================
// SECTION 3: CORE MARKETING ENTITIES
// (All with workspaceId)
// ============================================

export const visitors = pgTable('visitors', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    // Identity
    fingerprintHash: text('fingerprint_hash'),
    cookieId: text('cookie_id'),

    // First touch attribution
    firstSource: text('first_source'),
    firstMedium: text('first_medium'),
    firstCampaign: text('first_campaign'),
    firstContent: text('first_content'),
    firstTerm: text('first_term'),

    // Metadata
    firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('visitors_workspace_idx').on(table.workspaceId),
    fingerprintIdx: index('visitors_fingerprint_idx').on(table.workspaceId, table.fingerprintHash),
    cookieIdx: index('visitors_cookie_idx').on(table.workspaceId, table.cookieId),
    firstSeenIdx: index('visitors_first_seen_idx').on(table.firstSeenAt),
}));

export const leads = pgTable('leads', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),
    visitorId: uuid('visitor_id').references(() => visitors.id, { onDelete: 'restrict' }),

    // Contact
    email: text('email').notNull(),
    name: text('name'),
    phone: text('phone'),

    // Lifecycle
    stage: leadStageEnum('stage').default('captured').notNull(),
    stageChangedAt: timestamp('stage_changed_at').defaultNow(),

    // Scoring
    behaviorScore: integer('behavior_score').default(0),
    demographicScore: integer('demographic_score').default(0),
    totalScore: integer('total_score').default(0),

    // Attribution (denormalized for speed)
    firstSource: text('first_source'),
    firstMedium: text('first_medium'),
    firstCampaignId: uuid('first_campaign_id'),
    lastSource: text('last_source'),
    lastMedium: text('last_medium'),
    lastCampaignId: uuid('last_campaign_id'),

    // Revenue (calculated)
    lifetimeValue: decimal('lifetime_value', { precision: 12, scale: 2 }).default('0'),
    purchaseCount: integer('purchase_count').default(0),

    // Flexible fields
    customFields: jsonb('custom_fields').default({}),
    tags: text('tags').array().default([]),

    // Timestamps
    convertedAt: timestamp('converted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('leads_workspace_idx').on(table.workspaceId),
    emailIdx: uniqueIndex('leads_email_workspace_idx').on(table.workspaceId, table.email),
    stageIdx: index('leads_stage_idx').on(table.stage),
    scoreIdx: index('leads_score_idx').on(table.totalScore),
    visitorIdx: index('leads_visitor_idx').on(table.visitorId),
    createdIdx: index('leads_created_idx').on(table.createdAt),
    firstSourceIdx: index('leads_first_source_idx').on(table.firstSource),
}));

export const leadStageHistory = pgTable('lead_stage_history', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'restrict' }).notNull(),

    fromStage: leadStageEnum('from_stage'),
    toStage: leadStageEnum('to_stage').notNull(),

    enteredAt: timestamp('entered_at').defaultNow().notNull(),
    exitedAt: timestamp('exited_at'),
    durationSeconds: integer('duration_seconds'),

    // Context
    changedBy: text('changed_by'),
    reason: text('reason'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('lead_stage_history_workspace_idx').on(table.workspaceId),
    leadIdx: index('lead_stage_history_lead_idx').on(table.leadId),
    stageIdx: index('lead_stage_history_stage_idx').on(table.toStage),
    enteredIdx: index('lead_stage_history_entered_idx').on(table.enteredAt),
}));

export const campaigns = pgTable('campaigns', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    // Basic info
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    status: campaignStatusEnum('status').default('draft').notNull(),

    // UTM defaults
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    utmTerm: text('utm_term'),

    // Budget
    budget: decimal('budget', { precision: 12, scale: 2 }),
    spent: decimal('spent', { precision: 12, scale: 2 }).default('0'),

    // Schedule
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),

    // Goals
    targetLeads: integer('target_leads'),
    targetRevenue: decimal('target_revenue', { precision: 12, scale: 2 }),
    targetRoas: real('target_roas'),

    // Strategy context (for vector search)
    strategyNotes: text('strategy_notes'),
    targetAudience: text('target_audience'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('campaigns_workspace_idx').on(table.workspaceId),
    slugIdx: uniqueIndex('campaigns_slug_workspace_idx').on(table.workspaceId, table.slug),
    statusIdx: index('campaigns_status_idx').on(table.status),
}));

export const campaignDailyMetrics = pgTable('campaign_daily_metrics', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'restrict' }).notNull(),
    date: date('date').notNull(),

    // External (from Meta/Google APIs)
    spend: decimal('spend', { precision: 12, scale: 2 }).default('0'),
    impressions: integer('impressions').default(0),
    clicks: integer('clicks').default(0),
    reach: integer('reach').default(0),

    // Internal (aggregated from events/leads)
    visitors: integer('visitors').default(0),
    leads: integer('leads').default(0),
    customers: integer('customers').default(0),
    revenue: decimal('revenue', { precision: 12, scale: 2 }).default('0'),

    // Calculated (for fast queries)
    ctr: real('ctr'),
    cvr: real('cvr'),
    cpa: decimal('cpa', { precision: 12, scale: 2 }),
    roas: real('roas'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('campaign_daily_workspace_idx').on(table.workspaceId),
    uniqueDay: uniqueIndex('campaign_daily_unique').on(table.campaignId, table.date),
    dateIdx: index('campaign_daily_date_idx').on(table.date),
}));

export const landingPages = pgTable('landing_pages', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'restrict' }),
    parentPageId: uuid('parent_page_id'),

    // Basic info
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    status: pageStatusEnum('status').default('draft').notNull(),

    // Content
    headline: text('headline'),
    subheadline: text('subheadline'),
    bodyContent: jsonb('body_content'),
    ctaText: text('cta_text'),

    // SEO
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),

    // A/B Testing
    isVariant: boolean('is_variant').default(false),
    variantName: text('variant_name'),
    trafficAllocation: integer('traffic_allocation').default(100),

    // Style (links to brand)
    stylePreset: text('style_preset'), // 'brutalist', 'minimal', 'bold', 'elegant'
    customStyles: jsonb('custom_styles').default({}), // Overrides

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    publishedAt: timestamp('published_at'),
}, (table) => ({
    workspaceIdx: index('landing_pages_workspace_idx').on(table.workspaceId),
    slugIdx: uniqueIndex('landing_pages_slug_workspace_idx').on(table.workspaceId, table.slug),
    campaignIdx: index('landing_pages_campaign_idx').on(table.campaignId),
    parentIdx: index('landing_pages_parent_idx').on(table.parentPageId),
    statusIdx: index('landing_pages_status_idx').on(table.status),
}));

export const landingPageDailyMetrics = pgTable('landing_page_daily_metrics', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),
    landingPageId: uuid('landing_page_id').references(() => landingPages.id, { onDelete: 'restrict' }).notNull(),
    date: date('date').notNull(),

    // Traffic
    visitors: integer('visitors').default(0),
    uniqueVisitors: integer('unique_visitors').default(0),
    pageViews: integer('page_views').default(0),

    // Engagement
    avgTimeOnPage: integer('avg_time_on_page'),
    avgScrollDepth: real('avg_scroll_depth'),
    bounceRate: real('bounce_rate'),

    // Conversions
    formStarts: integer('form_starts').default(0),
    formSubmits: integer('form_submits').default(0),
    leads: integer('leads').default(0),

    // Calculated
    cvr: real('cvr'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('landing_page_daily_workspace_idx').on(table.workspaceId),
    uniqueDay: uniqueIndex('landing_page_daily_unique').on(table.landingPageId, table.date),
    dateIdx: index('landing_page_daily_date_idx').on(table.date),
}));

export const sessions = pgTable('sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),
    visitorId: uuid('visitor_id').references(() => visitors.id, { onDelete: 'restrict' }).notNull(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),

    // Attribution
    source: text('source'),
    medium: text('medium'),
    campaign: text('campaign'),
    content: text('content'),
    term: text('term'),
    referrer: text('referrer'),

    // Landing
    landingPageId: uuid('landing_page_id').references(() => landingPages.id, { onDelete: 'set null' }),
    entryUrl: text('entry_url'),
    exitUrl: text('exit_url'),

    // Device & Geo
    device: text('device'),
    browser: text('browser'),
    os: text('os'),
    country: text('country'),
    region: text('region'),
    city: text('city'),

    // Session metrics
    pageViews: integer('page_views').default(0),
    eventCount: integer('event_count').default(0),
    duration: integer('duration'),
    maxScrollDepth: real('max_scroll_depth'),

    // Timestamps
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('sessions_workspace_idx').on(table.workspaceId),
    visitorIdx: index('sessions_visitor_idx').on(table.visitorId),
    leadIdx: index('sessions_lead_idx').on(table.leadId),
    landingPageIdx: index('sessions_landing_page_idx').on(table.landingPageId),
    startedIdx: index('sessions_started_idx').on(table.startedAt),
    sourceIdx: index('sessions_source_idx').on(table.source),
}));

export const events = pgTable('events', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    // Links
    visitorId: uuid('visitor_id').references(() => visitors.id, { onDelete: 'restrict' }).notNull(),
    sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'restrict' }),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    landingPageId: uuid('landing_page_id').references(() => landingPages.id, { onDelete: 'set null' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),

    // Event data
    type: eventTypeEnum('type').notNull(),
    name: text('name'),
    value: real('value'),

    // Context
    url: text('url'),
    metadata: jsonb('metadata').default({}),

    // Timestamp
    timestamp: timestamp('timestamp').defaultNow().notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('events_workspace_idx').on(table.workspaceId),
    visitorIdx: index('events_visitor_idx').on(table.visitorId),
    sessionIdx: index('events_session_idx').on(table.sessionId),
    leadIdx: index('events_lead_idx').on(table.leadId),
    typeIdx: index('events_type_idx').on(table.type),
    timestampIdx: index('events_timestamp_idx').on(table.timestamp),
    funnelIdx: index('events_funnel_idx').on(table.landingPageId, table.type, table.timestamp),
}));

export const products = pgTable('products', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    name: text('name').notNull(),
    description: text('description'),
    sku: text('sku'),

    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').default('BRL'),

    category: text('category'),
    tags: text('tags').array().default([]),

    isActive: boolean('is_active').default(true),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('products_workspace_idx').on(table.workspaceId),
    skuIdx: uniqueIndex('products_sku_workspace_idx').on(table.workspaceId, table.sku),
    categoryIdx: index('products_category_idx').on(table.category),
}));

export const transactions = pgTable('transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    // Links
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'restrict' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }),

    // Attribution - Last touch
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    landingPageId: uuid('landing_page_id').references(() => landingPages.id, { onDelete: 'set null' }),
    sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),

    // Attribution - First touch (denormalized)
    firstTouchCampaignId: uuid('first_touch_campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    firstTouchLandingPageId: uuid('first_touch_landing_page_id').references(() => landingPages.id, { onDelete: 'set null' }),

    // Transaction data
    type: transactionTypeEnum('type').default('sale').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').default('BRL'),

    // External reference
    externalId: text('external_id'),
    paymentMethod: text('payment_method'),

    // Status
    status: text('status').default('completed'),

    // Timestamps
    transactionAt: timestamp('transaction_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('transactions_workspace_idx').on(table.workspaceId),
    leadIdx: index('transactions_lead_idx').on(table.leadId),
    campaignIdx: index('transactions_campaign_idx').on(table.campaignId),
    firstTouchCampaignIdx: index('transactions_first_touch_campaign_idx').on(table.firstTouchCampaignId),
    transactionAtIdx: index('transactions_at_idx').on(table.transactionAt),
}));

export const abTestAssignments = pgTable('ab_test_assignments', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    visitorId: uuid('visitor_id').references(() => visitors.id, { onDelete: 'restrict' }).notNull(),
    landingPageId: uuid('landing_page_id').references(() => landingPages.id, { onDelete: 'restrict' }).notNull(),
    variantId: uuid('variant_id').references(() => landingPages.id, { onDelete: 'restrict' }).notNull(),

    // Outcome tracking
    converted: boolean('converted').default(false),
    conversionValue: decimal('conversion_value', { precision: 12, scale: 2 }),
    convertedAt: timestamp('converted_at'),

    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('ab_assignments_workspace_idx').on(table.workspaceId),
    visitorIdx: index('ab_assignments_visitor_idx').on(table.visitorId),
    pageIdx: index('ab_assignments_page_idx').on(table.landingPageId),
    conversionIdx: index('ab_assignments_conversion_idx').on(table.landingPageId, table.converted),
}));

export const emailSequences = pgTable('email_sequences', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    name: text('name').notNull(),
    description: text('description'),

    triggerType: text('trigger_type'),
    triggerConditions: jsonb('trigger_conditions').default({}),

    isActive: boolean('is_active').default(false),

    totalEnrolled: integer('total_enrolled').default(0),
    totalCompleted: integer('total_completed').default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('email_sequences_workspace_idx').on(table.workspaceId),
}));

export const emailTemplates = pgTable('email_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),
    sequenceId: uuid('sequence_id').references(() => emailSequences.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    subject: text('subject').notNull(),
    bodyHtml: text('body_html'),
    bodyText: text('body_text'),

    position: integer('position').default(0),
    delayHours: integer('delay_hours').default(0),

    totalSent: integer('total_sent').default(0),
    totalOpened: integer('total_opened').default(0),
    totalClicked: integer('total_clicked').default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('email_templates_workspace_idx').on(table.workspaceId),
    sequenceIdx: index('email_templates_sequence_idx').on(table.sequenceId),
}));


// ============================================
// SECTION 4: AI & ANALYTICS
// ============================================

export const aiInsights = pgTable('ai_insights', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),

    type: insightTypeEnum('type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),

    confidence: real('confidence'),
    model: text('model'),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),

    recommendations: jsonb('recommendations').default([]),
    dataSnapshot: jsonb('data_snapshot').default({}),

    isActionable: boolean('is_actionable').default(true),
    isActedUpon: boolean('is_acted_upon').default(false),
    actedUponAt: timestamp('acted_upon_at'),

    userValidated: boolean('user_validated'),
    userNotes: text('user_notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('ai_insights_workspace_idx').on(table.workspaceId),
    entityIdx: index('ai_insights_entity_idx').on(table.entityType, table.entityId),
    typeIdx: index('ai_insights_type_idx').on(table.type),
    createdIdx: index('ai_insights_created_idx').on(table.createdAt),
}));

export const contentEmbeddings = pgTable('content_embeddings', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),

    chunkType: text('chunk_type'),
    chunkOrder: integer('chunk_order').default(0),
    originalDocumentId: uuid('original_document_id'),

    content: text('content').notNull(),
    embedding: vector('embedding').notNull(),

    metadata: jsonb('metadata').default({}),
    tags: text('tags').array().default([]),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('embeddings_workspace_idx').on(table.workspaceId),
    entityIdx: index('embeddings_entity_idx').on(table.entityType, table.entityId),
    chunkTypeIdx: index('embeddings_chunk_type_idx').on(table.chunkType),
}));

export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),

    action: text('action').notNull(),
    field: text('field'),
    oldValue: text('old_value'),
    newValue: text('new_value'),

    snapshot: jsonb('snapshot'),

    changedBy: text('changed_by').notNull(),
    reason: text('reason'),
    metadata: jsonb('metadata').default({}),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('audit_logs_workspace_idx').on(table.workspaceId),
    entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    changedByIdx: index('audit_logs_changed_by_idx').on(table.changedBy),
    createdIdx: index('audit_logs_created_idx').on(table.createdAt),
}));

export const reports = pgTable('reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    name: text('name').notNull(),
    description: text('description'),
    type: text('type').notNull(),

    config: jsonb('config').notNull(),

    analysisPrompt: text('analysis_prompt'),
    analysisDepth: text('analysis_depth').default('detailed'),

    folder: text('folder'),
    tags: text('tags').array().default([]),

    lastRunAt: timestamp('last_run_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('reports_workspace_idx').on(table.workspaceId),
    typeIdx: index('reports_type_idx').on(table.type),
    folderIdx: index('reports_folder_idx').on(table.folder),
}));

export const monitors = pgTable('monitors', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    name: text('name').notNull(),
    description: text('description'),
    status: monitorStatusEnum('status').default('active'),

    scope: text('scope').notNull(),
    metric: text('metric').notNull(),
    baseline: text('baseline').default('rolling_7d_avg'),

    conditions: jsonb('conditions').notNull(),

    severity: alertSeverityEnum('severity').default('warning'),
    notifyChannels: jsonb('notify_channels').default(['dashboard']),
    autoAnalyze: boolean('auto_analyze').default(true),
    analysisPrompt: text('analysis_prompt'),

    lastCheckedAt: timestamp('last_checked_at'),
    lastTriggeredAt: timestamp('last_triggered_at'),
    triggerCount30d: integer('trigger_count_30d').default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('monitors_workspace_idx').on(table.workspaceId),
    statusIdx: index('monitors_status_idx').on(table.status),
    metricIdx: index('monitors_metric_idx').on(table.metric),
}));

export const monitorAlerts = pgTable('monitor_alerts', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),
    monitorId: uuid('monitor_id').references(() => monitors.id, { onDelete: 'cascade' }).notNull(),

    triggeredCondition: jsonb('triggered_condition'),
    metricValue: real('metric_value'),
    baselineValue: real('baseline_value'),
    deviationPercent: real('deviation_percent'),

    contextSnapshot: jsonb('context_snapshot'),
    similarIncidents: jsonb('similar_incidents').default([]),

    analysis: text('analysis'),
    diagnosis: text('diagnosis'),
    recommendedActions: jsonb('recommended_actions').default([]),

    status: alertStatusEnum('status').default('open'),
    resolvedAt: timestamp('resolved_at'),
    resolution: text('resolution'),

    embedding: vector('embedding'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('monitor_alerts_workspace_idx').on(table.workspaceId),
    monitorIdx: index('monitor_alerts_monitor_idx').on(table.monitorId),
    statusIdx: index('monitor_alerts_status_idx').on(table.status),
    createdIdx: index('monitor_alerts_created_idx').on(table.createdAt),
}));

export const heartbeats = pgTable('heartbeats', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    name: text('name').notNull(),
    description: text('description'),

    schedule: text('schedule').notNull(),
    timezone: text('timezone').default('America/Sao_Paulo'),

    sections: jsonb('sections').notNull(),

    synthesisPrompt: text('synthesis_prompt'),
    synthesisFormat: text('synthesis_format').default('briefing'),

    deliveryChannels: jsonb('delivery_channels').default(['dashboard']),

    status: text('status').default('active'),
    lastRunAt: timestamp('last_run_at'),
    nextRunAt: timestamp('next_run_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('heartbeats_workspace_idx').on(table.workspaceId),
    statusIdx: index('heartbeats_status_idx').on(table.status),
    nextRunIdx: index('heartbeats_next_run_idx').on(table.nextRunAt),
}));

export const reportRuns = pgTable('report_runs', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    sourceType: text('source_type').notNull(),
    sourceId: uuid('source_id'),

    query: jsonb('query').notNull(),
    dataSnapshot: jsonb('data_snapshot').notNull(),

    analysis: text('analysis'),
    structuredInsights: jsonb('structured_insights'),

    userValidated: boolean('user_validated'),
    userNotes: text('user_notes'),

    embedding: vector('embedding'),

    tokensUsed: integer('tokens_used'),
    latencyMs: integer('latency_ms'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('report_runs_workspace_idx').on(table.workspaceId),
    sourceIdx: index('report_runs_source_idx').on(table.sourceType, table.sourceId),
    createdIdx: index('report_runs_created_idx').on(table.createdAt),
}));

export const knowledgeEntries = pgTable('knowledge_entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'restrict' }).notNull(),

    type: text('type').notNull(),

    title: text('title'),
    content: text('content').notNull(),

    relatedCampaigns: uuid('related_campaigns').array().default([]),
    relatedPages: uuid('related_pages').array().default([]),

    tags: text('tags').array().default([]),

    embedding: vector('embedding'),

    sourceType: text('source_type'),
    sourceRunId: uuid('source_run_id'),

    isValidated: boolean('is_validated').default(false),
    validatedAt: timestamp('validated_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('knowledge_entries_workspace_idx').on(table.workspaceId),
    typeIdx: index('knowledge_entries_type_idx').on(table.type),
    tagsIdx: index('knowledge_entries_tags_idx').on(table.tags),
}));

// Industry knowledge (V3 - cross-workspace learning)
export const industryKnowledge = pgTable('industry_knowledge', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Not workspace-specific - aggregated learnings
    industry: text('industry').notNull(),
    subIndustry: text('sub_industry'),

    type: text('type').notNull(),
    // 'conversion_benchmark', 'best_practice', 'common_issue', 'winning_copy'

    title: text('title').notNull(),
    content: text('content').notNull(),

    // Aggregated stats
    confidence: real('confidence'),
    sampleSize: integer('sample_size'),

    // Source tracking (anonymized)
    sourceWorkspaceCount: integer('source_workspace_count').default(1),

    embedding: vector('embedding'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    industryIdx: index('industry_knowledge_industry_idx').on(table.industry),
    typeIdx: index('industry_knowledge_type_idx').on(table.type),
}));


// ============================================
// SECTION 5: INTEGRATIONS (V2/V3)
// ============================================

export const integrations = pgTable('integrations', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),

    // Provider
    provider: text('provider').notNull(),
    // 'meta_ads', 'google_ads', 'google_analytics', 'mailchimp', 'activecampaign',
    // 'whatsapp', 'stripe', 'hotmart', 'webhook'

    // Status
    status: text('status').default('disconnected'),
    // 'disconnected', 'connecting', 'connected', 'error', 'expired'

    // Credentials (encrypted in practice)
    credentials: jsonb('credentials').default({}),
    // Varies by provider - access tokens, API keys, etc.

    // Configuration
    config: jsonb('config').default({}),
    // {
    //   accountId: '...',
    //   syncFrequency: '1h',
    //   syncEnabled: true,
    //   ...
    // }

    // Sync state
    lastSyncAt: timestamp('last_sync_at'),
    lastSyncStatus: text('last_sync_status'),
    lastSyncError: text('last_sync_error'),

    // Metadata
    connectedBy: uuid('connected_by').references(() => users.id),
    connectedAt: timestamp('connected_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('integrations_workspace_idx').on(table.workspaceId),
    providerIdx: index('integrations_provider_idx').on(table.provider),
    statusIdx: index('integrations_status_idx').on(table.status),
}));

// Webhook endpoints (for receiving external events)
export const webhookEndpoints = pgTable('webhook_endpoints', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),

    name: text('name').notNull(),

    // Unique URL path
    path: text('path').notNull(), // /webhooks/{workspaceId}/{path}

    // Secret for validation
    secret: text('secret').notNull(),

    // What events to accept
    events: text('events').array().default(['*']),

    // Processing
    transformScript: text('transform_script'), // Optional JS transform
    targetTable: text('target_table'), // Where to store

    isActive: boolean('is_active').default(true),

    // Stats
    totalReceived: integer('total_received').default(0),
    lastReceivedAt: timestamp('last_received_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    workspaceIdx: index('webhook_endpoints_workspace_idx').on(table.workspaceId),
    pathIdx: uniqueIndex('webhook_endpoints_path_idx').on(table.workspaceId, table.path),
}));


// ============================================
// EXPORT ALL
// ============================================

export const schema = {
    // Enums
    userRoleEnum,
    workspacePlanEnum,
    inviteStatusEnum,
    assetTypeEnum,
    assetStatusEnum,
    leadStageEnum,
    eventTypeEnum,
    campaignStatusEnum,
    pageStatusEnum,
    insightTypeEnum,
    transactionTypeEnum,
    monitorStatusEnum,
    alertSeverityEnum,
    alertStatusEnum,

    // Auth & Tenancy
    users,
    workspaces,
    workspaceMembers,
    invitations,

    // Brand System
    brandSettings,
    brandLogos,
    brandVoice,
    brandAssets,
    brandAssetFolders,
    brandTemplates,
    brandTokenHistory,

    // Core Marketing
    visitors,
    leads,
    leadStageHistory,
    campaigns,
    campaignDailyMetrics,
    landingPages,
    landingPageDailyMetrics,
    sessions,
    events,
    products,
    transactions,
    abTestAssignments,
    emailSequences,
    emailTemplates,

    // AI & Analytics
    aiInsights,
    contentEmbeddings,
    auditLogs,
    reports,
    monitors,
    monitorAlerts,
    heartbeats,
    reportRuns,
    knowledgeEntries,
    industryKnowledge,

    // Integrations
    integrations,
    webhookEndpoints,
};