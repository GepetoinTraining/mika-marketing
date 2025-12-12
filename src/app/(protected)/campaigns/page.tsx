// app/campaigns/page.tsx
'use client';

import { useState } from 'react';
import { Shell } from '@/components/Shell';
import { CampaignRow } from '@/components/CampaignRow';
import { CampaignTimeline } from '@/components/CampaignTimeline';
import { CampaignStatsPanel } from '@/components/CampaignStatsPanel';
import { useCampaigns, type CampaignWithPerformance } from '@/lib/queries/campaigns';
import { type LandingPage } from '@/types';
import { useWorkspace } from '@/lib/workspace/context';
import { IconPlus, IconList, IconCalendar, IconLoader2 } from '@tabler/icons-react';

type FilterStatus = 'all' | 'active' | 'paused' | 'completed' | 'draft';
type ViewMode = 'table' | 'timeline';

export default function CampaignsPage() {
  const { workspace, isLoading: workspaceLoading } = useWorkspace();
  const { data: campaigns = [], isLoading: campaignsLoading, error } = useCampaigns();

  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithPerformance | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  const isLoading = workspaceLoading || campaignsLoading;

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'all') return true;
    if (filter === 'draft') return campaign.status === 'draft' || campaign.status === 'scheduled';
    return campaign.status === filter;
  });
  const toNumber = (val: number | string | null | undefined): number => {
    if (val === null || val === undefined) return 0;
    return typeof val === 'string' ? parseFloat(val) || 0 : val;
  };

  const counts = {
    all: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    draft: campaigns.filter(c => c.status === 'draft' || c.status === 'scheduled').length,
  };

  // TODO: Fetch linked pages for selected campaign
  const linkedPages: LandingPage[] = [];

  // Summary stats
  const totalSpent = campaigns.reduce((sum, c) => sum + toNumber(c.spent), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + toNumber(c.totalRevenue), 0);
  const overallRoas = totalSpent > 0 ? (totalRevenue / totalSpent).toFixed(2) : '—';

  // Loading state
  if (isLoading) {
    return (
      <Shell>
        <div className="loading-container">
          <IconLoader2 size={32} className="spinner" />
          <p>Loading campaigns...</p>
        </div>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 400px;
            gap: 16px;
            color: var(--text-muted);
          }
          .loading-container :global(.spinner) {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Shell>
    );
  }

  // Error state
  if (error) {
    return (
      <Shell>
        <div className="error-container">
          <p>Failed to load campaigns</p>
          <p className="error-detail">{error.message}</p>
        </div>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 400px;
            gap: 8px;
            color: var(--negative);
          }
          .error-detail {
            font-size: 13px;
            color: var(--text-muted);
          }
        `}</style>
      </Shell>
    );
  }

  return (
    <Shell
      panel={selectedCampaign && (
        <CampaignStatsPanel
          campaign={selectedCampaign}
          linkedPages={linkedPages}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
      panelOpen={!!selectedCampaign}
    >
      <div className="page-content">
        {/* Header */}
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">Campaigns</h1>
            <div className="header-stats">
              <span className="stat">
                <span className="stat-value mono">{campaigns.length}</span> campaigns
              </span>
              <span className="stat-divider">·</span>
              <span className="stat">
                <span className="stat-value mono">R$ {totalSpent.toLocaleString('pt-BR')}</span> spent
              </span>
              <span className="stat-divider">·</span>
              <span className="stat">
                <span className="stat-value mono positive">{overallRoas}x</span> ROAS
              </span>
            </div>
          </div>
          <div className="header-right">
            {/* View Toggle */}
            <div className="view-toggle">
              <button
                className="toggle-btn"
                data-active={viewMode === 'timeline'}
                onClick={() => setViewMode('timeline')}
                title="Timeline View"
              >
                <IconCalendar size={18} />
              </button>
              <button
                className="toggle-btn"
                data-active={viewMode === 'table'}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <IconList size={18} />
              </button>
            </div>

            <button className="btn-create">
              <IconPlus size={16} />
              New Campaign
            </button>
          </div>
        </header>

        {/* Filters - only show for table view */}
        {viewMode === 'table' && (
          <div className="filters">
            {(['all', 'active', 'paused', 'completed', 'draft'] as FilterStatus[]).map(status => (
              <button
                key={status}
                className="filter-btn"
                data-active={filter === status}
                onClick={() => setFilter(status)}
              >
                {status.toUpperCase()}
                <span className="filter-count mono">{counts[status]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {campaigns.length === 0 ? (
          <div className="empty-state">
            <h3>No campaigns yet</h3>
            <p>Create your first campaign to start tracking performance</p>
            <button className="btn-create">
              <IconPlus size={16} />
              Create Campaign
            </button>
          </div>
        ) : (
          <>
            {/* Views */}
            {viewMode === 'timeline' ? (
              <CampaignTimeline
                campaigns={filteredCampaigns}
                selectedCampaignId={selectedCampaign?.id}
                onSelectCampaign={(c) => setSelectedCampaign(
                  selectedCampaign?.id === c.id ? null : c
                )}
              />
            ) : (
              <div className="table-container">
                <table className="campaigns-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Campaign</th>
                      <th className="th-right">Visitors</th>
                      <th className="th-right">Leads</th>
                      <th className="th-right">CVR</th>
                      <th className="th-right">Customers</th>
                      <th className="th-right">Budget</th>
                      <th className="th-right">ROAS</th>
                      <th className="th-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map(campaign => (
                      <CampaignRow
                        key={campaign.id}
                        campaign={campaign}
                        selected={selectedCampaign?.id === campaign.id}
                        onClick={() => setSelectedCampaign(
                          selectedCampaign?.id === campaign.id ? null : campaign
                        )}
                      />
                    ))}
                  </tbody>
                </table>

                {filteredCampaigns.length === 0 && (
                  <div className="empty-filter">
                    <p>No campaigns found with status "{filter}"</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
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
        
        .header-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .view-toggle {
          display: flex;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
        }
        
        .toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.1s ease;
        }
        
        .toggle-btn:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }
        
        .toggle-btn[data-active="true"] {
          color: var(--accent);
          background: rgba(0, 255, 136, 0.05);
        }
        
        .toggle-btn:first-child {
          border-right: 1px solid var(--border);
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
        }
        
        .btn-create:hover {
          background: var(--accent-dim);
        }
        
        .filters {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }
        
        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.1s ease;
        }
        
        .filter-btn:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }
        
        .filter-btn[data-active="true"] {
          color: var(--accent);
          background: rgba(0, 255, 136, 0.05);
        }
        
        .filter-count {
          font-size: 10px;
          color: var(--text-muted);
        }
        
        .filter-btn[data-active="true"] .filter-count {
          color: var(--accent);
        }
        
        .table-container {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          overflow-x: auto;
        }
        
        .campaigns-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .campaigns-table thead tr {
          border-bottom: 1px solid var(--border);
        }
        
        .campaigns-table th {
          padding: 12px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          text-align: left;
          text-transform: uppercase;
        }
        
        .th-right {
          text-align: right !important;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
          gap: 12px;
        }
        
        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        
        .empty-state p {
          color: var(--text-muted);
          margin: 0 0 16px 0;
        }
        
        .empty-filter {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }
        
        .positive {
          color: var(--positive);
        }
      `}</style>
    </Shell>
  );
}