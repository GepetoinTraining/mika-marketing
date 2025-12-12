// Landing Page
export type LandingPage = {
    id: string;
    name: string;
    slug: string;
    status: 'draft' | 'testing' | 'active' | 'paused' | 'archived';

    // Content
    headline?: string;
    subheadline?: string;
    ctaText?: string;

    // A/B
    isVariant: boolean;
    variantName?: string;
    parentPageId?: string;

    // Metrics
    totalViews: number;
    uniqueVisitors: number;
    totalConversions: number;
    conversionRate: number;
    avgTimeOnPage: number;
    bounceRate: number;

    // Meta
    campaignId?: string;
    createdAt: string;
    updatedAt: string;
};

// Lead
export type Lead = {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    stage: 'anonymous' | 'captured' | 'engaged' | 'qualified' | 'opportunity' | 'customer' | 'repeat' | 'churned';

    // Scores
    behaviorScore: number;
    demographicScore: number;
    totalScore: number;

    // Revenue
    lifetimeValue: number;
    purchaseCount: number;

    // Attribution
    firstSource?: string;
    firstMedium?: string;
    firstCampaign?: string;
    capturedVia?: string;

    // Meta
    tags: string[];
    createdAt: string;
    updatedAt: string;
};

// Campaign
export type Campaign = {
    id: string;
    name: string;
    status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';

    // UTM
    utmSource?: string;
    utmMedium?: string;
    utmCampaign: string;

    // Budget
    budget?: number;
    spent: number;

    // Schedule
    startsAt?: string;
    endsAt?: string;

    // Metrics
    totalVisitors: number;
    totalLeads: number;
    totalCustomers: number;
    totalRevenue: number;

    // Meta
    createdAt: string;
    updatedAt: string;
};

// Event (for activity feeds)
export type Event = {
    id: string;
    type: string;
    name?: string;
    leadId?: string;
    visitorId?: string;
    pageUrl?: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
};