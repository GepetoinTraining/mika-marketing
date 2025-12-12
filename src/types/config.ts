// All possible metrics that can be shown in tooltips
export type MetricKey =
    // Traffic
    | 'visitors'
    | 'uniqueVisitors'
    | 'pageViews'
    | 'sessions'
    // Engagement
    | 'avgTimeOnPage'
    | 'bounceRate'
    | 'scrollDepth'
    | 'returningVisitors'
    // Conversion
    | 'conversions'
    | 'conversionRate'
    | 'leads'
    | 'leadRate'
    // Revenue
    | 'revenue'
    | 'avgOrderValue'
    | 'roas'
    | 'cpl'
    | 'cpa'
    | 'ltv'
    // Campaign specific
    | 'spent'
    | 'budget'
    | 'budgetRemaining'
    | 'dailySpend'
    // Trend
    | 'trend'
    | 'changePercent'
    | 'changeAbsolute';

export type MetricDefinition = {
    key: MetricKey;
    label: string;
    shortLabel: string;
    description: string;
    format: 'number' | 'percent' | 'currency' | 'time' | 'trend';
    category: 'traffic' | 'engagement' | 'conversion' | 'revenue' | 'campaign' | 'trend';
};

export type TooltipContext =
    | 'timeline-segment'      // Daily segment on campaign timeline
    | 'timeline-campaign'     // Campaign bar on timeline
    | 'landing-page-card'     // Landing page card
    | 'lead-card'             // Lead card in kanban
    | 'funnel-stage'          // Funnel stage bar
    | 'campaign-row';         // Campaign table row

export type TooltipConfig = {
    [K in TooltipContext]: MetricKey[];
};

export type UserConfig = {
    tooltips: TooltipConfig;
    // Future: other user preferences
    showTrends: boolean;
    compactMode: boolean;
    animationsEnabled: boolean;
};