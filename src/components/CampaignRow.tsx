'use client';

import { Campaign } from '@/types';

type Props = {
  campaign: Campaign;
  selected?: boolean;
  onClick?: () => void;
};

const STATUS_MAP: Record<Campaign['status'], { label: string; color: string }> = {
  draft: { label: 'DRAFT', color: 'var(--text-muted)' },
  scheduled: { label: 'SCHEDULED', color: 'var(--neutral)' },
  active: { label: 'ACTIVE', color: 'var(--positive)' },
  paused: { label: 'PAUSED', color: 'var(--warning)' },
  completed: { label: 'COMPLETED', color: 'var(--neutral)' },
  archived: { label: 'ARCHIVED', color: 'var(--text-muted)' },
};

export function CampaignRow({ campaign, selected, onClick }: Props) {
  const status = STATUS_MAP[campaign.status];

  // Handle decimal strings from DB
  const toNumber = (val: number | string | null | undefined): number => {
    if (val === null || val === undefined) return 0;
    return typeof val === 'string' ? parseFloat(val) || 0 : val;
  };

  const formatCurrency = (n: number | string | null | undefined) => {
    const num = toNumber(n);
    return 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatNumber = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  };

  const spent = toNumber(campaign.spent);
  const budget = toNumber(campaign.budget);
  const totalRevenue = toNumber(campaign.totalRevenue);
  const totalVisitors = campaign.totalVisitors ?? 0;
  const totalLeads = campaign.totalLeads ?? 0;
  const totalCustomers = campaign.totalCustomers ?? 0;

  // ROAS = Revenue / Spent
  const roas = spent > 0
    ? (totalRevenue / spent).toFixed(2)
    : '—';

  // Cost per Lead
  const cpl = spent > 0 && totalLeads > 0
    ? (spent / totalLeads).toFixed(2)
    : '—';

  // Conversion rate (visitors to leads)
  const cvr = totalVisitors > 0
    ? ((totalLeads / totalVisitors) * 100).toFixed(1)
    : '0';

  // Budget usage
  const budgetUsage = budget > 0
    ? (spent / budget) * 100
    : 0;

  return (
    <tr className="campaign-row" data-selected={selected} onClick={onClick}>
      <td className="cell-status">
        <span className="status-badge" style={{ color: status.color }}>
          <span className="status-dot" style={{ background: status.color }} />
          {status.label}
        </span>
      </td>

      <td className="cell-name">
        <div className="campaign-name">{campaign.name}</div>
        <div className="campaign-utm mono">{campaign.utmCampaign}</div>
      </td>

      <td className="cell-metric">
        <span className="metric-value mono">{formatNumber(totalVisitors)}</span>
        <span className="metric-label">visitors</span>
      </td>

      <td className="cell-metric">
        <span className="metric-value mono">{formatNumber(totalLeads)}</span>
        <span className="metric-label">leads</span>
      </td>

      <td className="cell-metric">
        <span className="metric-value mono">{cvr}%</span>
        <span className="metric-label">CVR</span>
      </td>

      <td className="cell-metric">
        <span className="metric-value mono">{formatNumber(totalCustomers)}</span>
        <span className="metric-label">customers</span>
      </td>

      <td className="cell-metric">
        {budget > 0 ? (
          <>
            <div className="budget-bar-container">
              <div
                className="budget-bar"
                style={{
                  width: `${Math.min(budgetUsage, 100)}%`,
                  background: budgetUsage > 90 ? 'var(--warning)' : 'var(--accent)'
                }}
              />
            </div>
            <span className="budget-text mono">
              {formatCurrency(spent)} / {formatCurrency(budget)}
            </span>
          </>
        ) : (
          <span className="metric-value mono muted">—</span>
        )}
      </td>

      <td className="cell-metric">
        <span className={`metric-value mono ${Number(roas) >= 2 ? 'positive' : ''}`}>
          {roas}x
        </span>
        <span className="metric-label">ROAS</span>
      </td>

      <td className="cell-metric cell-revenue">
        <span className={`metric-value mono ${totalRevenue > 0 ? 'positive' : ''}`}>
          {formatCurrency(totalRevenue)}
        </span>
      </td>

      <style jsx>{`
        .campaign-row {
          cursor: pointer;
          transition: background 0.1s ease;
        }
        
        .campaign-row:hover {
          background: var(--bg-tertiary);
        }
        
        .campaign-row[data-selected="true"] {
          background: rgba(0, 255, 136, 0.03);
        }
        
        .campaign-row td {
          padding: 16px 12px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        
        .cell-status {
          width: 100px;
        }
        
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        
        .cell-name {
          min-width: 200px;
        }
        
        .campaign-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        
        .campaign-utm {
          font-size: 11px;
          color: var(--text-muted);
        }
        
        .cell-metric {
          text-align: right;
          white-space: nowrap;
        }
        
        .metric-value {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .metric-label {
          display: block;
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        
        .budget-bar-container {
          width: 80px;
          height: 4px;
          background: var(--bg-tertiary);
          margin-bottom: 4px;
          margin-left: auto;
        }
        
        .budget-bar {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .budget-text {
          font-size: 10px;
          color: var(--text-secondary);
        }
        
        .cell-revenue {
          padding-right: 20px;
        }
      `}</style>
    </tr>
  );
}