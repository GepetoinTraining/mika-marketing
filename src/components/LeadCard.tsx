'use client';

import { Lead } from '@/types';

type Props = {
    lead: Lead;
    selected?: boolean;
    onClick?: () => void;
};

export function LeadCard({ lead, selected, onClick }: Props) {
    const formatValue = (n: number) => {
        if (n === 0) return '—';
        return 'R$ ' + n.toLocaleString('pt-BR');
    };

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        }
        return email?.slice(0, 2).toUpperCase() || '??';
    };

    const getScoreColor = (score: number) => {
        if (score >= 150) return 'var(--positive)';
        if (score >= 100) return 'var(--warning)';
        return 'var(--text-muted)';
    };

    return (
        <div className="lead-card" data-selected={selected} onClick={onClick}>
            <div className="lead-header">
                <div className="lead-avatar" style={{ borderColor: getScoreColor(lead.totalScore) }}>
                    {getInitials(lead.name, lead.email)}
                </div>
                <div className="lead-info">
                    <div className="lead-name">{lead.name || 'Unknown'}</div>
                    <div className="lead-email mono">{lead.email}</div>
                </div>
            </div>

            <div className="lead-meta">
                <div className="meta-item">
                    <span className="meta-label">SCORE</span>
                    <span className="meta-value mono" style={{ color: getScoreColor(lead.totalScore) }}>
                        {lead.totalScore}
                    </span>
                </div>
                <div className="meta-item">
                    <span className="meta-label">LTV</span>
                    <span className={`meta-value mono ${lead.lifetimeValue > 0 ? 'positive' : ''}`}>
                        {formatValue(lead.lifetimeValue)}
                    </span>
                </div>
            </div>

            {lead.tags.length > 0 && (
                <div className="lead-tags">
                    {lead.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                    ))}
                    {lead.tags.length > 3 && (
                        <span className="tag tag-more">+{lead.tags.length - 3}</span>
                    )}
                </div>
            )}

            <style jsx>{`
        .lead-card {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          padding: 12px;
          cursor: pointer;
          transition: all 0.1s ease;
        }
        
        .lead-card:hover {
          border-color: var(--border-light);
        }
        
        .lead-card[data-selected="true"] {
          border-color: var(--accent);
          background: rgba(0, 255, 136, 0.03);
        }
        
        .lead-header {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .lead-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        
        .lead-info {
          min-width: 0;
          flex: 1;
        }
        
        .lead-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .lead-email {
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .lead-meta {
          display: flex;
          gap: 16px;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }
        
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .meta-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        
        .meta-value {
          font-size: 12px;
          font-weight: 600;
        }
        
        .lead-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 10px;
        }
        
        .tag {
          font-size: 9px;
          font-weight: 500;
          padding: 3px 6px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        
        .tag-more {
          color: var(--text-muted);
        }
      `}</style>
        </div>
    );
}