'use client';

import { LandingPage } from '@/types';

type Props = {
  page: LandingPage;
  selected?: boolean;
  onClick?: () => void;
};

// Matches pageStatusEnum in schema
const STATUS_MAP: Record<LandingPage['status'], { label: string; color: string }> = {
  draft: { label: 'DRAFT', color: 'var(--text-muted)' },
  published: { label: 'LIVE', color: 'var(--positive)' },
  testing: { label: 'A/B TEST', color: 'var(--warning)' },
  paused: { label: 'PAUSED', color: 'var(--text-secondary)' },
  archived: { label: 'ARCHIVED', color: 'var(--text-muted)' },
};

export function PageCard({ page, selected, onClick }: Props) {
  const status = STATUS_MAP[page.status];

  const formatNumber = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  };

  const formatPercent = (n: number) => n.toFixed(1) + '%';

  return (
    <div className="card" data-selected={selected} onClick={onClick}>
      {/* Header */}
      <div className="card-header">
        <div className="card-status" style={{ color: status.color }}>
          <span className="status-dot" style={{ background: status.color }} />
          {status.label}
          {page.isVariant && <span className="variant-badge">{page.variantName}</span>}
        </div>
        <div className="card-slug mono">/{page.slug}</div>
      </div>

      {/* Title */}
      <h3 className="card-title">{page.name}</h3>
      {page.headline && <p className="card-headline">{page.headline}</p>}

      {/* Metrics Grid */}
      <div className="card-metrics">
        <div className="metric-item">
          <span className="metric-label">VISITORS</span>
          <span className="metric-value mono">{formatNumber(page.uniqueVisitors)}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">CONVERTS</span>
          <span className="metric-value mono">{formatNumber(page.totalConversions)}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">CVR</span>
          <span className={`metric-value mono ${page.conversionRate >= 10 ? 'positive' : ''}`}>
            {formatPercent(page.conversionRate)}
          </span>
        </div>
        <div className="metric-item">
          <span className="metric-label">BOUNCE</span>
          <span className={`metric-value mono ${page.bounceRate <= 35 ? 'positive' : page.bounceRate >= 50 ? 'negative' : ''}`}>
            {formatPercent(page.bounceRate)}
          </span>
        </div>
      </div>

      <style jsx>{`
        .card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          padding: 16px;
          cursor: pointer;
          transition: all 0.1s ease;
        }
        
        .card:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-light);
        }
        
        .card[data-selected="true"] {
          border-color: var(--accent);
          background: rgba(0, 255, 136, 0.03);
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .card-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        
        .variant-badge {
          background: var(--bg-hover);
          padding: 2px 6px;
          border-radius: 2px;
          margin-left: 4px;
        }
        
        .card-slug {
          font-size: 11px;
          color: var(--text-muted);
        }
        
        .card-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: var(--text-primary);
        }
        
        .card-headline {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0 0 16px 0;
          line-height: 1.4;
        }
        
        .card-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        
        .metric-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .metric-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        
        .metric-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}