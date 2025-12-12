'use client';

import { LandingPage } from '@/types';
import { IconX, IconExternalLink, IconCopy, IconFlask } from '@tabler/icons-react';

type Props = {
    page: LandingPage;
    onClose: () => void;
};

export function PageStatsPanel({ page, onClose }: Props) {
    const formatNumber = (n: number) => n.toLocaleString('pt-BR');
    const formatPercent = (n: number) => n.toFixed(2) + '%';
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(`https://example.com/${page.slug}`);
    };

    return (
        <div className="panel-content">
            {/* Header */}
            <div className="panel-header">
                <div className="panel-title-row">
                    <h2 className="panel-title">{page.name}</h2>
                    <button className="panel-close" onClick={onClose}>
                        <IconX size={18} />
                    </button>
                </div>
                <div className="panel-slug">
                    <span className="mono">/{page.slug}</span>
                    <button className="icon-btn" onClick={copyUrl} title="Copy URL">
                        <IconCopy size={14} />
                    </button>
                    <a href={`/${page.slug}`} target="_blank" className="icon-btn" title="Open page">
                        <IconExternalLink size={14} />
                    </a>
                </div>
            </div>

            {/* Primary Metrics */}
            <div className="metrics-section">
                <h3 className="section-title">PERFORMANCE</h3>
                <div className="metric-grid">
                    <div className="metric-box">
                        <span className="metric-label">CONVERSION RATE</span>
                        <span className="metric-value large mono positive">{formatPercent(page.conversionRate)}</span>
                    </div>
                    <div className="metric-box">
                        <span className="metric-label">BOUNCE RATE</span>
                        <span className={`metric-value large mono ${page.bounceRate <= 35 ? 'positive' : page.bounceRate >= 50 ? 'negative' : ''}`}>
                            {formatPercent(page.bounceRate)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Traffic */}
            <div className="metrics-section">
                <h3 className="section-title">TRAFFIC</h3>
                <div className="stat-rows">
                    <div className="stat-row">
                        <span className="stat-label">Total Views</span>
                        <span className="stat-value mono">{formatNumber(page.totalViews)}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Unique Visitors</span>
                        <span className="stat-value mono">{formatNumber(page.uniqueVisitors)}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Conversions</span>
                        <span className="stat-value mono positive">{formatNumber(page.totalConversions)}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Avg. Time on Page</span>
                        <span className="stat-value mono">{formatTime(page.avgTimeOnPage)}</span>
                    </div>
                </div>
            </div>

            {/* A/B Test Info */}
            {page.isVariant && (
                <div className="metrics-section">
                    <h3 className="section-title">
                        <IconFlask size={14} />
                        A/B TEST
                    </h3>
                    <div className="ab-info">
                        <div className="ab-variant">
                            Variant <span className="mono">{page.variantName}</span>
                        </div>
                        <p className="ab-note">
                            This is a test variant. Compare against the control to determine the winner.
                        </p>
                    </div>
                </div>
            )}

            {/* Content Preview */}
            <div className="metrics-section">
                <h3 className="section-title">CONTENT</h3>
                <div className="content-preview">
                    {page.headline && (
                        <div className="content-item">
                            <span className="content-label">Headline</span>
                            <p className="content-value">{page.headline}</p>
                        </div>
                    )}
                    {page.subheadline && (
                        <div className="content-item">
                            <span className="content-label">Subheadline</span>
                            <p className="content-value">{page.subheadline}</p>
                        </div>
                    )}
                    {page.ctaText && (
                        <div className="content-item">
                            <span className="content-label">CTA</span>
                            <span className="cta-preview">{page.ctaText}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="panel-actions">
                <button className="btn-primary">Edit Page</button>
                <button className="btn-secondary">View Analytics</button>
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
        
        .panel-slug {
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
          text-decoration: none;
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
        
        .metric-value {
          font-size: 14px;
          font-weight: 600;
        }
        
        .metric-value.large {
          font-size: 24px;
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
          font-size: 13px;
          font-weight: 500;
        }
        
        .ab-info {
          background: rgba(255, 170, 0, 0.05);
          border: 1px solid rgba(255, 170, 0, 0.2);
          padding: 12px;
        }
        
        .ab-variant {
          font-size: 14px;
          font-weight: 600;
          color: var(--warning);
        }
        
        .ab-note {
          font-size: 11px;
          color: var(--text-secondary);
          margin: 8px 0 0 0;
          line-height: 1.4;
        }
        
        .content-preview {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .content-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .content-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.03em;
          color: var(--text-muted);
        }
        
        .content-value {
          font-size: 13px;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.4;
        }
        
        .cta-preview {
          display: inline-block;
          background: var(--accent);
          color: var(--bg-primary);
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          letter-spacing: 0.02em;
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
          letter-spacing: 0.02em;
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