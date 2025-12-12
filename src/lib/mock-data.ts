import { LandingPage, Lead, Campaign } from '@/types';

// ============================================
// LANDING PAGES
// ============================================

export const MOCK_PAGES: LandingPage[] = [
    {
        id: '1',
        name: 'Black Friday - Principal',
        slug: 'black-friday',
        status: 'active',
        headline: '50% OFF em todos os cursos',
        subheadline: 'Apenas até domingo',
        ctaText: 'GARANTIR DESCONTO',
        isVariant: false,
        totalViews: 12847,
        uniqueVisitors: 9213,
        totalConversions: 847,
        conversionRate: 9.19,
        avgTimeOnPage: 127,
        bounceRate: 34.2,
        campaignId: '1',
        createdAt: '2024-11-20T10:00:00Z',
        updatedAt: '2024-11-28T15:30:00Z',
    },
    {
        id: '2',
        name: 'Black Friday - Variante B',
        slug: 'black-friday-b',
        status: 'testing',
        headline: 'Última chance: 50% OFF',
        subheadline: 'Oferta expira em 24h',
        ctaText: 'QUERO MEU DESCONTO',
        isVariant: true,
        variantName: 'B',
        parentPageId: '1',
        totalViews: 6402,
        uniqueVisitors: 4587,
        totalConversions: 512,
        conversionRate: 11.16,
        avgTimeOnPage: 142,
        bounceRate: 29.8,
        campaignId: '1',
        createdAt: '2024-11-22T14:00:00Z',
        updatedAt: '2024-11-28T15:30:00Z',
    },
    {
        id: '3',
        name: 'Ebook Marketing Digital',
        slug: 'ebook-marketing',
        status: 'active',
        headline: 'Guia Completo de Marketing Digital',
        subheadline: 'Download gratuito',
        ctaText: 'BAIXAR AGORA',
        isVariant: false,
        totalViews: 3241,
        uniqueVisitors: 2890,
        totalConversions: 623,
        conversionRate: 21.56,
        avgTimeOnPage: 89,
        bounceRate: 42.1,
        campaignId: '2',
        createdAt: '2024-10-15T09:00:00Z',
        updatedAt: '2024-11-25T11:20:00Z',
    },
    {
        id: '4',
        name: 'Webinar Vendas',
        slug: 'webinar-vendas',
        status: 'paused',
        headline: 'Como Triplicar suas Vendas',
        subheadline: 'Webinar ao vivo quinta-feira',
        ctaText: 'RESERVAR VAGA',
        isVariant: false,
        totalViews: 1872,
        uniqueVisitors: 1654,
        totalConversions: 234,
        conversionRate: 14.15,
        avgTimeOnPage: 156,
        bounceRate: 28.4,
        createdAt: '2024-11-01T08:00:00Z',
        updatedAt: '2024-11-15T16:45:00Z',
    },
    {
        id: '5',
        name: 'Newsletter Semanal',
        slug: 'newsletter',
        status: 'active',
        headline: 'Receba dicas exclusivas',
        subheadline: 'Toda segunda na sua caixa',
        ctaText: 'INSCREVER',
        isVariant: false,
        totalViews: 8934,
        uniqueVisitors: 7212,
        totalConversions: 1847,
        conversionRate: 25.61,
        avgTimeOnPage: 45,
        bounceRate: 51.3,
        createdAt: '2024-09-01T10:00:00Z',
        updatedAt: '2024-11-28T09:00:00Z',
    },
    {
        id: '6',
        name: 'Curso Avançado - Em breve',
        slug: 'curso-avancado',
        status: 'draft',
        headline: 'Masterclass Avançado',
        subheadline: 'Em breve',
        ctaText: 'LISTA DE ESPERA',
        isVariant: false,
        totalViews: 0,
        uniqueVisitors: 0,
        totalConversions: 0,
        conversionRate: 0,
        avgTimeOnPage: 0,
        bounceRate: 0,
        createdAt: '2024-11-27T14:00:00Z',
        updatedAt: '2024-11-27T14:00:00Z',
    },
];

// ============================================
// LEADS
// ============================================

export const MOCK_LEADS: Lead[] = [
    {
        id: '1',
        email: 'joao.silva@email.com',
        name: 'João Silva',
        phone: '+5547999001122',
        stage: 'customer',
        behaviorScore: 85,
        demographicScore: 70,
        totalScore: 155,
        lifetimeValue: 497,
        purchaseCount: 2,
        firstSource: 'meta',
        firstMedium: 'paid',
        firstCampaign: 'bf2024',
        capturedVia: 'black-friday',
        tags: ['buyer', 'engaged'],
        createdAt: '2024-11-21T14:32:00Z',
        updatedAt: '2024-11-26T10:15:00Z',
    },
    {
        id: '2',
        email: 'maria.santos@email.com',
        name: 'Maria Santos',
        stage: 'qualified',
        behaviorScore: 72,
        demographicScore: 65,
        totalScore: 137,
        lifetimeValue: 0,
        purchaseCount: 0,
        firstSource: 'google',
        firstMedium: 'organic',
        firstCampaign: 'ebook-mkt',
        capturedVia: 'ebook-marketing',
        tags: ['ebook-download'],
        createdAt: '2024-11-18T09:45:00Z',
        updatedAt: '2024-11-27T16:20:00Z',
    },
    {
        id: '3',
        email: 'carlos.lima@email.com',
        name: 'Carlos Lima',
        stage: 'engaged',
        behaviorScore: 45,
        demographicScore: 50,
        totalScore: 95,
        lifetimeValue: 0,
        purchaseCount: 0,
        firstSource: 'meta',
        firstMedium: 'paid',
        firstCampaign: 'bf2024',
        capturedVia: 'black-friday-b',
        tags: [],
        createdAt: '2024-11-25T11:20:00Z',
        updatedAt: '2024-11-28T08:30:00Z',
    },
    {
        id: '4',
        email: 'ana.costa@email.com',
        name: 'Ana Costa',
        stage: 'captured',
        behaviorScore: 20,
        demographicScore: 40,
        totalScore: 60,
        lifetimeValue: 0,
        purchaseCount: 0,
        firstSource: 'instagram',
        firstMedium: 'social',
        capturedVia: 'newsletter',
        tags: ['newsletter'],
        createdAt: '2024-11-27T15:10:00Z',
        updatedAt: '2024-11-27T15:10:00Z',
    },
    {
        id: '5',
        email: 'pedro.oliveira@email.com',
        name: 'Pedro Oliveira',
        phone: '+5511988776655',
        stage: 'repeat',
        behaviorScore: 95,
        demographicScore: 85,
        totalScore: 180,
        lifetimeValue: 1247,
        purchaseCount: 4,
        firstSource: 'google',
        firstMedium: 'cpc',
        capturedVia: 'webinar-vendas',
        tags: ['vip', 'buyer', 'webinar-attendee'],
        createdAt: '2024-10-05T10:00:00Z',
        updatedAt: '2024-11-28T12:00:00Z',
    },
];

// ============================================
// CAMPAIGNS (base)
// ============================================

export const MOCK_CAMPAIGNS: Campaign[] = [
    {
        id: '1',
        name: 'Black Friday 2024',
        status: 'active',
        utmSource: 'meta',
        utmMedium: 'paid',
        utmCampaign: 'bf2024',
        budget: 5000,
        spent: 3247.50,
        startsAt: '2024-11-20T00:00:00Z',
        endsAt: '2024-12-01T23:59:59Z',
        totalVisitors: 19249,
        totalLeads: 1359,
        totalCustomers: 312,
        totalRevenue: 45890,
        createdAt: '2024-11-15T10:00:00Z',
        updatedAt: '2024-11-28T15:30:00Z',
    },
    {
        id: '2',
        name: 'Lead Magnet - Ebook',
        status: 'active',
        utmSource: 'google',
        utmMedium: 'organic',
        utmCampaign: 'ebook-mkt',
        totalVisitors: 3241,
        totalLeads: 623,
        totalCustomers: 47,
        totalRevenue: 8460,
        spent: 0,
        startsAt: '2024-11-01T00:00:00Z',
        endsAt: '2024-12-15T23:59:59Z',
        createdAt: '2024-10-15T09:00:00Z',
        updatedAt: '2024-11-25T11:20:00Z',
    },
];

// ============================================
// DAILY PERFORMANCE (for timeline)
// ============================================

export type DailyPerformance = {
    date: string;
    visitors: number;
    leads: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
};

export type CampaignWithPerformance = Campaign & {
    dailyPerformance: DailyPerformance[];
};

// Seeded random number generator (deterministic)
function seededRandom(seed: number): () => number {
    return function () {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
}

// Generate mock daily data for campaigns
function generateDailyPerformance(
    startDate: string,
    endDate: string,
    baseVisitors: number,
    baseCvr: number,
    trend: 'stable' | 'declining' | 'growing' | 'spike-then-decline',
    seed: number = 12345 // Add seed parameter
): DailyPerformance[] {
    const random = seededRandom(seed);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: DailyPerformance[] = [];

    let currentDate = new Date(start);
    let dayIndex = 0;
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    while (currentDate <= end) {
        const progress = dayIndex / totalDays;

        let cvrMultiplier = 1;
        let visitorMultiplier = 1;

        switch (trend) {
            case 'declining':
                cvrMultiplier = 1 - (progress * 0.6);
                visitorMultiplier = 1 - (progress * 0.3);
                break;
            case 'growing':
                cvrMultiplier = 1 + (progress * 0.3);
                visitorMultiplier = 1 + (progress * 0.5);
                break;
            case 'spike-then-decline':
                if (progress < 0.3) {
                    cvrMultiplier = 1 + (progress * 2);
                    visitorMultiplier = 1 + (progress * 3);
                } else {
                    cvrMultiplier = 1.6 - ((progress - 0.3) * 1.5);
                    visitorMultiplier = 1.9 - ((progress - 0.3) * 1.2);
                }
                break;
            case 'stable':
            default:
                cvrMultiplier = 0.9 + (random() * 0.2);
                visitorMultiplier = 0.9 + (random() * 0.2);
        }

        const noise = 0.85 + (random() * 0.3);
        const visitors = Math.round(baseVisitors * visitorMultiplier * noise);
        const cvr = Math.max(0.5, baseCvr * cvrMultiplier * noise);
        const leads = Math.round(visitors * (cvr / 100));
        const conversions = Math.round(leads * 0.25 * noise);
        const revenue = conversions * (150 + random() * 100);

        days.push({
            date: currentDate.toISOString().split('T')[0],
            visitors,
            leads,
            conversions,
            conversionRate: Math.round(cvr * 100) / 100,
            revenue: Math.round(revenue),
        });

        currentDate.setDate(currentDate.getDate() + 1);
        dayIndex++;
    }

    return days;
}

export const MOCK_CAMPAIGNS_WITH_PERFORMANCE: CampaignWithPerformance[] = [
    {
        ...MOCK_CAMPAIGNS[0],
        dailyPerformance: generateDailyPerformance(
            '2024-11-20',
            '2024-12-01',
            1500,
            9.5,
            'spike-then-decline',
            11111  // unique seed
        ),
    },
    {
        ...MOCK_CAMPAIGNS[1],
        dailyPerformance: generateDailyPerformance(
            '2024-11-01',
            '2024-12-15',
            200,
            21.5,
            'stable',
            22222  // unique seed
        ),
    },
    {
        id: '3',
        name: 'Cyber Monday Flash',
        status: 'completed',
        utmSource: 'meta',
        utmMedium: 'paid',
        utmCampaign: 'cyber-monday',
        budget: 2000,
        spent: 1987.50,
        startsAt: '2024-12-02T00:00:00Z',
        endsAt: '2024-12-03T23:59:59Z',
        totalVisitors: 4521,
        totalLeads: 567,
        totalCustomers: 89,
        totalRevenue: 12340,
        createdAt: '2024-11-28T10:00:00Z',
        updatedAt: '2024-12-03T23:59:59Z',
        dailyPerformance: generateDailyPerformance(
            '2024-12-02',
            '2024-12-03',
            2200,
            12.5,
            'declining',
            33333  // unique seed
        ),
    },
    {
        id: '4',
        name: 'Christmas Early Bird',
        status: 'scheduled',
        utmSource: 'email',
        utmMedium: 'newsletter',
        utmCampaign: 'xmas-early',
        budget: 3000,
        spent: 0,
        startsAt: '2024-12-10T00:00:00Z',
        endsAt: '2024-12-24T23:59:59Z',
        totalVisitors: 0,
        totalLeads: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        createdAt: '2024-12-01T10:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z',
        dailyPerformance: [],
    },
    {
        id: '5',
        name: 'New Year Promo',
        status: 'draft',
        utmSource: 'meta',
        utmMedium: 'paid',
        utmCampaign: 'newyear-2025',
        budget: 5000,
        spent: 0,
        startsAt: '2024-12-26T00:00:00Z',
        endsAt: '2025-01-05T23:59:59Z',
        totalVisitors: 0,
        totalLeads: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        createdAt: '2024-12-05T10:00:00Z',
        updatedAt: '2024-12-05T10:00:00Z',
        dailyPerformance: [],
    },
];