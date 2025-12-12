import { MetricDefinition, MetricKey } from '@/types/config';

export const METRIC_DEFINITIONS: Record<MetricKey, MetricDefinition> = {
    // Traffic
    visitors: {
        key: 'visitors',
        label: 'Visitors',
        shortLabel: 'VIS',
        description: 'Total number of visitors',
        format: 'number',
        category: 'traffic',
    },
    uniqueVisitors: {
        key: 'uniqueVisitors',
        label: 'Unique Visitors',
        shortLabel: 'UV',
        description: 'Deduplicated visitor count',
        format: 'number',
        category: 'traffic',
    },
    pageViews: {
        key: 'pageViews',
        label: 'Page Views',
        shortLabel: 'PV',
        description: 'Total page views',
        format: 'number',
        category: 'traffic',
    },
    sessions: {
        key: 'sessions',
        label: 'Sessions',
        shortLabel: 'SESS',
        description: 'Total sessions',
        format: 'number',
        category: 'traffic',
    },

    // Engagement
    avgTimeOnPage: {
        key: 'avgTimeOnPage',
        label: 'Avg. Time on Page',
        shortLabel: 'TIME',
        description: 'Average time spent on page',
        format: 'time',
        category: 'engagement',
    },
    bounceRate: {
        key: 'bounceRate',
        label: 'Bounce Rate',
        shortLabel: 'BR',
        description: 'Percentage of single-page sessions',
        format: 'percent',
        category: 'engagement',
    },
    scrollDepth: {
        key: 'scrollDepth',
        label: 'Scroll Depth',
        shortLabel: 'SCROLL',
        description: 'Average scroll depth percentage',
        format: 'percent',
        category: 'engagement',
    },
    returningVisitors: {
        key: 'returningVisitors',
        label: 'Returning Visitors',
        shortLabel: 'RET',
        description: 'Visitors who came back',
        format: 'number',
        category: 'engagement',
    },

    // Conversion
    conversions: {
        key: 'conversions',
        label: 'Conversions',
        shortLabel: 'CONV',
        description: 'Total conversions',
        format: 'number',
        category: 'conversion',
    },
    conversionRate: {
        key: 'conversionRate',
        label: 'Conversion Rate',
        shortLabel: 'CVR',
        description: 'Percentage of visitors who converted',
        format: 'percent',
        category: 'conversion',
    },
    leads: {
        key: 'leads',
        label: 'Leads',
        shortLabel: 'LEADS',
        description: 'Total leads captured',
        format: 'number',
        category: 'conversion',
    },
    leadRate: {
        key: 'leadRate',
        label: 'Lead Rate',
        shortLabel: 'LR',
        description: 'Visitor to lead conversion rate',
        format: 'percent',
        category: 'conversion',
    },

    // Revenue
    revenue: {
        key: 'revenue',
        label: 'Revenue',
        shortLabel: 'REV',
        description: 'Total revenue generated',
        format: 'currency',
        category: 'revenue',
    },
    avgOrderValue: {
        key: 'avgOrderValue',
        label: 'Avg. Order Value',
        shortLabel: 'AOV',
        description: 'Average transaction value',
        format: 'currency',
        category: 'revenue',
    },
    roas: {
        key: 'roas',
        label: 'ROAS',
        shortLabel: 'ROAS',
        description: 'Return on ad spend',
        format: 'number',
        category: 'revenue',
    },
    cpl: {
        key: 'cpl',
        label: 'Cost per Lead',
        shortLabel: 'CPL',
        description: 'Average cost to acquire a lead',
        format: 'currency',
        category: 'revenue',
    },
    cpa: {
        key: 'cpa',
        label: 'Cost per Acquisition',
        shortLabel: 'CPA',
        description: 'Average cost to acquire a customer',
        format: 'currency',
        category: 'revenue',
    },
    ltv: {
        key: 'ltv',
        label: 'Lifetime Value',
        shortLabel: 'LTV',
        description: 'Customer lifetime value',
        format: 'currency',
        category: 'revenue',
    },

    // Campaign
    spent: {
        key: 'spent',
        label: 'Spent',
        shortLabel: 'SPENT',
        description: 'Total amount spent',
        format: 'currency',
        category: 'campaign',
    },
    budget: {
        key: 'budget',
        label: 'Budget',
        shortLabel: 'BUD',
        description: 'Total campaign budget',
        format: 'currency',
        category: 'campaign',
    },
    budgetRemaining: {
        key: 'budgetRemaining',
        label: 'Budget Remaining',
        shortLabel: 'REM',
        description: 'Remaining budget',
        format: 'currency',
        category: 'campaign',
    },
    dailySpend: {
        key: 'dailySpend',
        label: 'Daily Spend',
        shortLabel: 'D/SPEND',
        description: 'Spend for this day',
        format: 'currency',
        category: 'campaign',
    },

    // Trend
    trend: {
        key: 'trend',
        label: 'Trend',
        shortLabel: 'TREND',
        description: 'Direction of change',
        format: 'trend',
        category: 'trend',
    },
    changePercent: {
        key: 'changePercent',
        label: 'Change %',
        shortLabel: 'Δ%',
        description: 'Percentage change from previous period',
        format: 'percent',
        category: 'trend',
    },
    changeAbsolute: {
        key: 'changeAbsolute',
        label: 'Change',
        shortLabel: 'Δ',
        description: 'Absolute change from previous period',
        format: 'number',
        category: 'trend',
    },
};

// Default tooltip configurations per context
export const DEFAULT_TOOLTIP_CONFIG: Record<string, MetricKey[]> = {
    'timeline-segment': ['conversionRate', 'visitors', 'conversions', 'revenue'],
    'timeline-campaign': ['conversionRate', 'visitors', 'leads', 'revenue', 'roas', 'spent'],
    'landing-page-card': ['conversionRate', 'uniqueVisitors', 'conversions', 'bounceRate', 'avgTimeOnPage'],
    'lead-card': ['ltv', 'leadRate', 'avgTimeOnPage'],
    'funnel-stage': ['conversionRate', 'changePercent', 'avgTimeOnPage'],
    'campaign-row': ['roas', 'cpl', 'cpa', 'budgetRemaining'],
};

// Format a value based on its type
export function formatMetricValue(value: number | null | undefined, format: MetricDefinition['format']): string {
    if (value === null || value === undefined) return '—';

    switch (format) {
        case 'number':
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
            return value.toLocaleString('pt-BR');

        case 'percent':
            return value.toFixed(1) + '%';

        case 'currency':
            return 'R$ ' + value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        case 'time':
            const minutes = Math.floor(value / 60);
            const seconds = value % 60;
            if (minutes > 0) return `${minutes}m ${seconds}s`;
            return `${seconds}s`;

        case 'trend':
            if (value > 0) return '↑';
            if (value < 0) return '↓';
            return '→';

        default:
            return String(value);
    }
}

// Get color based on value and metric type
export function getMetricColor(
    value: number,
    key: MetricKey,
    context?: { max?: number; min?: number; target?: number }
): string {
    // Metrics where higher is better
    const higherIsBetter = ['conversionRate', 'revenue', 'roas', 'leads', 'conversions', 'visitors', 'ltv'];
    // Metrics where lower is better
    const lowerIsBetter = ['bounceRate', 'cpl', 'cpa', 'spent'];

    if (higherIsBetter.includes(key)) {
        if (context?.target && value >= context.target) return 'var(--positive)';
        if (context?.max) {
            const ratio = value / context.max;
            if (ratio >= 0.8) return 'var(--positive)';
            if (ratio >= 0.5) return 'var(--warning)';
            return 'var(--negative)';
        }
    }

    if (lowerIsBetter.includes(key)) {
        if (context?.target && value <= context.target) return 'var(--positive)';
        if (context?.max) {
            const ratio = value / context.max;
            if (ratio <= 0.3) return 'var(--positive)';
            if (ratio <= 0.6) return 'var(--warning)';
            return 'var(--negative)';
        }
    }

    return 'var(--text-primary)';
}