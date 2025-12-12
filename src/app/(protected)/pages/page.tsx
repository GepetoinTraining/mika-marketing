'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { MOCK_PAGES } from '@/lib/mock-data';
import { LandingPage } from '@/types';
import { IconPlus, IconExternalLink, IconCopy, IconFlask } from '@tabler/icons-react';

const STATUS_COLORS = {
  draft: 'var(--text-muted)',
  testing: 'var(--warning)',
  active: 'var(--positive)',
  paused: 'var(--neutral)',
  archived: 'var(--text-muted)',
};

export default function PagesPage() {
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null);

  const formatNumber = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  };

  // Group variants with parent
  const parentPages = MOCK_PAGES.filter(p => !p.isVariant);
  const variants = MOCK_PAGES.filter(p => p.isVariant);

  return (
    <Shell>
      <div className="page-content">
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Landing Pages</h1>
            <div className="header-stats">
              <span className="stat">
                <span className="stat-value mono">{MOCK_PAGES.length}</span> pages
              </span>
              <span className="stat-divider">·</span>
              <span className="stat">
                <span className="stat-value mono">{variants.length}</span> variants
              </span>
            </div>
          </div>
          <Link href="/pages/new" className="btn-create">
            <IconPlus size={16} />
            New Page
          </Link>
        </header>

        <div className="pages-grid">
          {parentPages.map(page => {
            const pageVariants = variants.filter(v => v.parentPageId === page.id);

            return (
              <div key={page.id} className="page-card" data-status={page.status}>
                <div className="card-header">
                  <span className="status-badge" style={{ color: STATUS_COLORS[page.status] }}>
                    <span className="status-dot" style={{ background: STATUS_COLORS[page.status] }} />
                    {page.status.toUpperCase()}
                  </span>
                  {pageVariants.length > 0 && (
                    <span className="variant-badge">
                      <IconFlask size={12} />
                      {pageVariants.length + 1} variants
                    </span>
                  )}
                </div>

                <h3 className="page-name">{page.name}</h3>
                <p className="page-slug mono">/{page.slug}</p>

                {page.headline && (
                  <p className="page-headline">"{page.headline}"</p>
                )}

                <div className="metrics-row">
                  <div className="metric">
                    <span className="metric-value mono">{formatNumber(page.uniqueVisitors)}</span>
                    <span className="metric-label">visitors</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value mono">{formatNumber(page.totalConversions)}</span>
                    <span className="metric-label">conversions</span>
                  </div>
                  <div className="metric">
                    <span className={`metric-value mono ${page.conversionRate > 10 ? 'positive' : ''}`}>
                      {page.conversionRate.toFixed(1)}%
                    </span>
                    <span className="metric-label">CVR</span>
                  </div>
                </div>

                {/* Show best variant if testing */}
                {pageVariants.length > 0 && (
                  <div className="variants-preview">
                    {pageVariants.map(v => (
                      <div key={v.id} className="variant-row">
                        <span className="variant-name">Variant {v.variantName}</span>
                        <span className={`variant-cvr mono ${v.conversionRate > page.conversionRate ? 'positive' : ''}`}>
                          {v.conversionRate.toFixed(1)}%
                          {v.conversionRate > page.conversionRate && ' ↑'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="card-actions">
                  <button className="action-btn" title="View live">
                    <IconExternalLink size={16} />
                  </button>
                  <button className="action-btn" title="Duplicate">
                    <IconCopy size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .page-content {
          padding: 24px;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .header-left {
          display: flex;
          align-items: baseline;
          gap: 16px;
        }
        
        .page-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        
        .header-stats {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .stat-value {
          color: var(--text-primary);
          font-weight: 500;
        }
        
        .stat-divider {
          color: var(--text-muted);
        }
        
        .btn-create {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: var(--bg-primary);
          border: none;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
        }
        
        .btn-create:hover {
          background: var(--accent-dim);
        }
        
        .pages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        
        .page-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          padding: 20px;
          position: relative;
        }
        
        .page-card:hover {
          border-color: var(--border-light);
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
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
        
        .variant-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--warning);
          background: rgba(255, 170, 0, 0.1);
          padding: 3px 8px;
        }
        
        .page-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }
        
        .page-slug {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0 0 12px 0;
        }
        
        .page-headline {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0 0 16px 0;
          font-style: italic;
        }
        
        .metrics-row {
          display: flex;
          gap: 24px;
          padding: 12px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        
        .metric {
          display: flex;
          flex-direction: column;
        }
        
        .metric-value {
          font-size: 16px;
          font-weight: 600;
        }
        
        .metric-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        
        .variants-preview {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed var(--border);
        }
        
        .variant-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          padding: 4px 0;
        }
        
        .variant-name {
          color: var(--text-secondary);
        }
        
        .variant-cvr {
          font-weight: 600;
        }
        
        .card-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
        }
        
        .action-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-light);
        }
        
        .positive {
          color: var(--positive);
        }
      `}</style>
    </Shell>
  );
}