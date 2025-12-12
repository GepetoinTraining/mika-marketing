// src/types/index.ts
// Types aligned with database schema

// Landing Page
// Matches pageStatusEnum in schema
export type PageStatus = 'draft' | 'published' | 'testing' | 'paused' | 'archived';

export type LandingPage = {
    id: string;
    workspaceId: string;
    campaignId: string | null;
    parentPageId: string | null;
    name: string;
    slug: string;
    status: PageStatus;

    // Content
    headline: string | null;
    subheadline: string | null;
    bodyContent: unknown | null;
    ctaText: string | null;
    metaTitle: string | null;
    metaDescription: string | null;

    // A/B
    isVariant: boolean;
    variantName: string | null;
    trafficAllocation: number | null;

    // Styling
    stylePreset: string | null;
    customStyles: Record<string, unknown>;

    // Metrics (computed from daily aggregates - these come from queries, not raw table)
    totalViews: number;
    uniqueVisitors: number;
    totalConversions: number;
    conversionRate: number;
    avgTimeOnPage: number;
    avgScrollDepth: number;
    bounceRate: number;

    // Meta
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
};

// Lead
// Matches leadStageEnum in schema (no 'anonymous' or 'repeat')
export type LeadStage = 'captured' | 'engaged' | 'qualified' | 'opportunity' | 'customer' | 'churned';

export type Lead = {
    id: string;
    workspaceId: string;
    visitorId: string | null;
    email: string;
    name: string | null;
    phone: string | null;
    stage: LeadStage;
    stageChangedAt: string | null;

    // Scores
    behaviorScore: number;
    demographicScore: number;
    totalScore: number;

    // Attribution
    firstSource: string | null;
    firstMedium: string | null;
    firstCampaignId: string | null;
    lastSource: string | null;
    lastMedium: string | null;
    lastCampaignId: string | null;

    // Revenue (decimal from DB - may come as string)
    lifetimeValue: number | string;
    purchaseCount: number;

    // Custom data
    customFields: Record<string, unknown>;
    tags: string[];

    // Meta
    convertedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

// Campaign
// Matches campaignStatusEnum in schema
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';

export type Campaign = {
    id: string;
    workspaceId: string;
    name: string;
    slug: string;
    description: string | null;
    status: CampaignStatus;

    // UTM
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    utmTerm: string | null;

    // Budget (decimals from DB - may come as string)
    budget: number | string | null;
    spent: number | string;

    // Schedule
    startDate: string | null;
    endDate: string | null;

    // Targets
    targetLeads: number | null;
    targetRevenue: number | string | null;
    targetRoas: number | null;
    strategyNotes: string | null;
    targetAudience: string | null;

    // Metrics (computed from daily aggregates - populated by queries)
    totalVisitors: number;
    totalLeads: number;
    totalCustomers: number;
    totalRevenue: number | string;
    avgCvr: number;
    avgRoas: number;

    // Meta
    createdAt: string;
    updatedAt: string;
};

// Campaign with daily performance data
export type CampaignWithPerformance = Campaign & {
    dailyPerformance?: DailyPerformance[];
};

export type DailyPerformance = {
    date: string;
    spend: number | string;
    impressions: number;
    clicks: number;
    visitors: number;
    leads: number;
    customers: number;
    revenue: number | string;
};

// Event (for activity feeds and tracking)
// Matches eventTypeEnum in schema
export type EventType =
    | 'page_view'
    | 'scroll'
    | 'click'
    | 'form_start'
    | 'form_submit'
    | 'video_play'
    | 'video_progress'
    | 'video_complete'
    | 'download'
    | 'share'
    | 'purchase'
    | 'refund'
    | 'email_open'
    | 'email_click'
    | 'custom';

export type Event = {
    id: string;
    workspaceId: string;
    visitorId: string;
    sessionId: string | null;
    leadId: string | null;
    landingPageId: string | null;
    campaignId: string | null;
    type: EventType;
    name: string | null;
    value: number | null;
    url: string | null;
    metadata: Record<string, unknown>;
    timestamp: string;
    createdAt: string;
};

// Visitor
export type Visitor = {
    id: string;
    workspaceId: string;
    fingerprintHash: string | null;
    cookieId: string | null;
    firstSource: string | null;
    firstMedium: string | null;
    firstCampaign: string | null;
    firstContent: string | null;
    firstTerm: string | null;
    firstSeenAt: string;
    lastSeenAt: string;
    createdAt: string;
    updatedAt: string;
};

// Session
export type Session = {
    id: string;
    workspaceId: string;
    visitorId: string;
    leadId: string | null;
    source: string | null;
    medium: string | null;
    campaign: string | null;
    content: string | null;
    term: string | null;
    referrer: string | null;
    landingPageId: string | null;
    entryUrl: string | null;
    exitUrl: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    pageViews: number;
    eventCount: number;
    duration: number | null;
    maxScrollDepth: number | null;
    startedAt: string;
    endedAt: string | null;
    createdAt: string;
};

// Workspace
// Matches workspacePlanEnum and userRoleEnum in schema
export type WorkspacePlan = 'trial' | 'starter' | 'professional' | 'agency' | 'enterprise';
export type UserRole = 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'client';

export type Workspace = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isMaster: boolean;
    isAgencyClient: boolean;
    industry: string | null;
    subIndustry: string | null;
    plan: WorkspacePlan;
    planExpiresAt: string | null;
    limits: Record<string, number>;
    timezone: string;
    currency: string;
    locale: string;
    features: Record<string, boolean>;
    ownerId: string | null;
    createdAt: string;
    updatedAt: string;
};

export type WorkspaceMember = {
    id: string;
    workspaceId: string;
    userId: string;
    role: UserRole;
    permissions: Record<string, boolean>;
    invitedBy: string | null;
    invitedAt: string | null;
    joinedAt: string | null;
    createdAt: string;
};

// User
export type User = {
    id: string;
    clerkId: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    globalRole: UserRole;
    preferences: Record<string, unknown>;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
};