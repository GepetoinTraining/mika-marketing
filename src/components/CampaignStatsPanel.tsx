'use client';

import { Campaign, LandingPage } from '@/types';
import { IconX, IconExternalLink, IconCopy, IconCalendar } from '@tabler/icons-react';

type Props = {
    campaign: Campaign;
    linkedPages: LandingPage[];
    onClose: () => void;
    onSelectPage?: (page: LandingPage) => void;
};

export function CampaignStatsPanel({ campaign, linkedPages, onClose, onSelectPage }: Props) {
    const formatCurrency = (n: number) => {
        return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    };

    const formatDate = (date?: string) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Calculations
    const roas = campaign.spent > 0
        ? (campaign.totalRevenue / campaign.spent).toFixed(2)
        : '—';

    const cpl = campaign.spent > 0 && campaign.totalLeads > 0
        ? campaign.spent / campaign.totalLeads
        : 0;

    const cpa = campaign.spent > 0 && campaign.totalCustomers > 0
        ? campaign.spent / campaign.totalCustomers
        : 0;

    const visitorToLead = campaign.totalVisitors > 0
        ? ((campaign.totalLeads / campaign.totalVisitors) * 100).toFixed(1)
        : '0';

    const leadToCustomer = campaign.totalLeads > 0
        ? ((campaign.totalCustomers / campaign.totalLeads) * 100).toFixed(1)
        : '0';

    const budgetUsage = campaign.budget
        ? ((campaign.spent / campaign.budget) * 100).toFixed(0)
        : null;

    const copyUtm = () => {
        const utm = `utm_source=${campaign.utmSource || ''}&utm_medium=${campaign.utmMedium || ''}&utm_campaign=${campaign.utmCampaign}`;
        navigator.clipboard.writeText(utm);
    };

    return (
        <div className="panel-content">
            {/* Header */}
            <div className="panel-header">
                <div className="panel-title-row">
                    <h2 className="panel-title">{campaign.name}</h2>
                    <button className="panel-close" onClick={onClose}>
                        <IconX size={18} />
                    </button>
                </div>
                <div className="panel-utm">
                    <span className="mono">{campaign.utmCampaign}</span>
                    <button className="icon-btn" onClick={copyUtm} title="Copy UTM params">
                        <IconCopy size={14} />
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-section">
                <h3 className="section-title">PERFORMANCE</h3>
                <div className="metric-grid">
                    <div className="metric-box">
                        <span className="metric-label">ROAS</span>
                        <span className={`metric-value large mono ${Number(roas) >= 2 ? 'positive' : ''}`}>
                            {roas}x
                        </span>
                    </div>
                    <div className="metric-box">
                        <span className="metric-label">REVENUE</span>
                        <span className="metric-value large mono positive">
                            {formatCurrency(campaign.totalRevenue)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Funnel */}
            <div className="metrics-section">
                <h3 className="section-title">FUNNEL</h3>
                <div className="funnel-mini">
                    <div className="funnel-step">
                        <span className="funnel-value mono">{campaign.totalVisitors.toLocaleString()}</span>
                        <span className="funnel-label">Visitors</span>
                    </div>
                    <div className="funnel-arrow">
                        <span className="funnel-rate mono">{visitorToLead}%</span>
                        →
                    </div>
                    <div className="funnel-step">
                        <span className="funnel-value mono">{campaign.totalLeads.toLocaleString()}</span>
                        <span className="funnel-label">Leads</span>
                    </div>
                    <div className="funnel-arrow">
                        <span className="funnel-rate mono">{leadToCustomer}%</span>
                        →
                    </div>
                    <div className="funnel-step">
                        <span className="funnel-value mono positive">{campaign.totalCustomers.toLocaleString()}</span>
                        <span className="funnel-label">Customers</span>
                    </div>
                </div>
            </div>

            {/* Costs */}
            <div className="metrics-section">
                <h3 className="section-title">COSTS</h3>
                <div className="stat-rows">
                    {campaign.budget && (
                        <div className="stat-row">
                            <span className="stat-label">Budget</span>
                            <span className="stat-value mono">{formatCurrency(campaign.budget)}</span>
                        </div>
                    )}
                    <div className="stat-row">
                        <span className="stat-label">Spent</span>
                        <span className="stat-value mono">
                            {formatCurrency(campaign.spent)}
                            {budgetUsage && <span className="stat-badge">{budgetUsage}%</span>}
                        </span>
                    </div>
                    {cpl > 0 && (
                        <div className="stat-row">
                            <span className="stat-label">Cost per Lead</span>
                            <span className="stat-value mono">{formatCurrency(cpl)}</span>
                        </div>
                    )}
                    {cpa > 0 && (
                        <div className="stat-row">
                            <span className="stat-label">Cost per Acquisition</span>
                            <span className="stat-value mono">{formatCurrency(cpa)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* UTM Parameters */}
            <div className="metrics-section">
                <h3 className="section-title">ATTRIBUTION</h3>
                <div className="stat-rows">
                    {campaign.utmSource && (
                        <div className="stat-row">
                            <span className="stat-label">Source</span>
                            <span className="stat-value mono">{campaign.utmSource}</span>
                        </div>
                    )}
                    {campaign.utmMedium && (
                        <div className="stat-row">
                            <span className="stat-label">Medium</span>
                            <span className="stat-value mono">{campaign.utmMedium}</span>
                        </div>
                    )}
                    <div className="stat-row">
                        <span className="stat-label">Campaign</span>
                        <span className="stat-value mono">{campaign.utmCampaign}</span>
                    </div>
                </div>
            </div>

            {/* Schedule */}
            {(campaign.startsAt || campaign.endsAt) && (
                <div className="metrics-section">
                    <h3 className="section-title">
                        <IconCalendar size={12} />
                        SCHEDULE
                    </h3>
                    <div className="stat-rows">
                        <div className="stat-row">
                            <span className="stat-label">Start</span>
                            <span className="stat-value mono">{formatDate(campaign.startsAt)}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">End</span>
                            <span className="stat-value mono">{formatDate(campaign.endsAt)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Linked Landing Pages */}
            {linkedPages.length > 0 && (
                <div className="metrics-section">
                    <h3 className="section-title">LANDING PAGES ({linkedPages.length})</h3>
                    <div className="linked-pages">
                        {linkedPages.map(page => (
                            <div
                                key={page.id}
                                className="linked-page"
                                onClick={() => onSelectPage?.(page)}
                            >
                                <div className="page-info">
                                    <span className="page-name">{page.name}</span>
                                    <span className="page-slug mono">/{page.slug}</span>
                                </div>
                                <div className="page-stats">
                                    <span className="page-stat mono">{page.totalConversions} conv</span>
                                    <span className="page-stat mono positive">{page.conversionRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="panel-actions">
                <button className="btn-primary">Edit Campaign</button>
                <button className="btn-secondary">View Full Report</button>
            </div>

            <style jsx>{`
        .panel-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .panel-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }
        
        .panel-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        
        .panel-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          line-height: 1.3;
        }
        
        .panel-close {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          display: flex;
          flex-shrink: 0;
        }
        
        .panel-close:hover {
          color: var(--text-primary);
        }
        
        .panel-utm {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .icon-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
        }
        
        .icon-btn:hover {
          color: var(--accent);
        }
        
        .metrics-section {
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }
        
        .section-title {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .metric-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .metric-box {
          background: var(--bg-tertiary);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .metric-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        
        .metric-value.large {
          font-size: 24px;
          font-weight: 600;
        }
        
        .funnel-mini {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .funnel-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          padding: 12px 8px;
          background: var(--bg-tertiary);
        }
        
        .funnel-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .funnel-label {
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-top: 2px;
        }
        
        .funnel-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: var(--text-muted);
          font-size: 12px;
        }
        
        .funnel-rate {
          font-size: 10px;
          color: var(--text-secondary);
        }
        
        .stat-rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .stat-label {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .stat-value {
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .stat-badge {
          font-size: 9px;
          padding: 2px 6px;
          background: var(--bg-tertiary);
          color: var(--text-muted);
        }
        
        .linked-pages {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .linked-page {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.1s ease;
        }
        
        .linked-page:hover {
          border-color: var(--border-light);
          background: var(--bg-hover);
        }
        
        .page-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .page-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .page-slug {
          font-size: 10px;
          color: var(--text-muted);
        }
        
        .page-stats {
          display: flex;
          gap: 12px;
        }
        
        .page-stat {
          font-size: 11px;
          color: var(--text-secondary);
        }
        
        .panel-actions {
          padding: 16px;
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .btn-primary {
          background: var(--accent);
          color: var(--bg-primary);
          border: none;
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .btn-primary:hover {
          background: var(--accent-dim);
        }
        
        .btn-secondary {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .btn-secondary:hover {
          border-color: var(--border-light);
          color: var(--text-primary);
        }
      `}</style>
        </div>
    );
}