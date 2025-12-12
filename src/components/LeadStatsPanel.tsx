'use client';

import { Lead } from '@/types';
import { IconX, IconMail, IconPhone, IconTag, IconPlus } from '@tabler/icons-react';

type Props = {
  lead: Lead;
  onClose: () => void;
};

// DB stages only - no 'anonymous' or 'repeat'
const STAGE_INFO: Record<Lead['stage'], { label: string; color: string }> = {
  captured: { label: 'Captured', color: 'var(--neutral)' },
  engaged: { label: 'Engaged', color: 'var(--warning)' },
  qualified: { label: 'Qualified', color: 'var(--warning)' },
  opportunity: { label: 'Opportunity', color: 'var(--accent)' },
  customer: { label: 'Customer', color: 'var(--positive)' },
  churned: { label: 'Churned', color: 'var(--negative)' },
};

export function LeadStatsPanel({ lead, onClose }: Props) {
  const stage = STAGE_INFO[lead.stage];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatValue = (n: number | string) => {
    const num = typeof n === 'string' ? parseFloat(n) : n;
    return 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  return (
    <div className="panel-content">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title-row">
          <div className="lead-identity">
            <div className="lead-avatar">
              {getInitials(lead.name, lead.email)}
            </div>
            <div>
              <h2 className="panel-title">{lead.name || 'Unknown'}</h2>
              <div className="lead-stage" style={{ color: stage.color }}>
                <span className="stage-dot" style={{ background: stage.color }} />
                {stage.label}
              </div>
            </div>
          </div>
          <button className="panel-close" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
      </div>

      {/* Contact */}
      <div className="metrics-section">
        <h3 className="section-title">CONTACT</h3>
        <div className="contact-list">
          <a href={`mailto:${lead.email}`} className="contact-item">
            <IconMail size={14} />
            <span className="mono">{lead.email}</span>
          </a>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="contact-item">
              <IconPhone size={14} />
              <span className="mono">{lead.phone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Scores */}
      <div className="metrics-section">
        <h3 className="section-title">LEAD SCORE</h3>
        <div className="score-display">
          <div className="score-total mono">{lead.totalScore}</div>
          <div className="score-breakdown">
            <div className="score-item">
              <span className="score-label">Behavior</span>
              <span className="score-value mono">{lead.behaviorScore}</span>
            </div>
            <div className="score-item">
              <span className="score-label">Demographic</span>
              <span className="score-value mono">{lead.demographicScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="metrics-section">
        <h3 className="section-title">REVENUE</h3>
        <div className="stat-rows">
          <div className="stat-row">
            <span className="stat-label">Lifetime Value</span>
            <span className={`stat-value mono ${Number(lead.lifetimeValue) > 0 ? 'positive' : ''}`}>
              {formatValue(lead.lifetimeValue)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Purchases</span>
            <span className="stat-value mono">{lead.purchaseCount}</span>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div className="metrics-section">
        <h3 className="section-title">ATTRIBUTION</h3>
        <div className="stat-rows">
          {lead.firstSource && (
            <div className="stat-row">
              <span className="stat-label">Source</span>
              <span className="stat-value mono">{lead.firstSource}</span>
            </div>
          )}
          {lead.firstMedium && (
            <div className="stat-row">
              <span className="stat-label">Medium</span>
              <span className="stat-value mono">{lead.firstMedium}</span>
            </div>
          )}
          <div className="stat-row">
            <span className="stat-label">Created</span>
            <span className="stat-value mono">{formatDate(lead.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="metrics-section">
        <h3 className="section-title">
          <IconTag size={12} />
          TAGS
        </h3>
        <div className="tags-container">
          {lead.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          <button className="tag tag-add">
            <IconPlus size={10} />
            Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="panel-actions">
        <button className="btn-primary">Send Email</button>
        <button className="btn-secondary">View Activity</button>
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
        
        .lead-identity {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .lead-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 2px solid var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          flex-shrink: 0;
        }
        
        .panel-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
        
        .lead-stage {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 500;
          margin-top: 4px;
        }
        
        .stage-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
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
        
        .contact-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
          text-decoration: none;
        }
        
        .contact-item:hover {
          color: var(--accent);
        }
        
        .score-display {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .score-total {
          font-size: 36px;
          font-weight: 700;
          color: var(--accent);
        }
        
        .score-breakdown {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .score-item {
          display: flex;
          gap: 8px;
          font-size: 11px;
        }
        
        .score-label {
          color: var(--text-muted);
        }
        
        .score-value {
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
        }
        
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .tag {
          font-size: 10px;
          font-weight: 500;
          padding: 4px 8px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        
        .tag-add {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          color: var(--text-muted);
        }
        
        .tag-add:hover {
          border-color: var(--accent);
          color: var(--accent);
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