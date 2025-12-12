'use client';

import { useState } from 'react';
import { Shell } from '@/components/Shell';
import { KanbanBoard } from '@/components/KanbanBoard';
import { FunnelView } from '@/components/FunnelView';
import { LeadStatsPanel } from '@/components/LeadStatsPanel';
import { useLeads, useUpdateLeadStage } from '@/lib/queries/leads';
import type { Lead, LeadStage } from '@/types';
import { useWorkspace } from '@/lib/workspace/context';
import { IconPlus, IconSearch, IconLayoutKanban, IconChartBar, IconLoader2 } from '@tabler/icons-react';

type ViewMode = 'kanban' | 'funnel';

export default function CRMPage() {
  const { workspace, isLoading: workspaceLoading } = useWorkspace();
  const [search, setSearch] = useState('');
  const { data: leads = [], isLoading: leadsLoading, error } = useLeads(search);
  const updateStageMutation = useUpdateLeadStage();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const isLoading = workspaceLoading || leadsLoading;

  const handleStageChange = (leadId: string, newStage: LeadStage) => {
    updateStageMutation.mutate({ leadId, stage: newStage });

    // Update selected lead if it's the one being changed
    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, stage: newStage } : null);
    }
  };
  const toNumber = (val: number | string | null | undefined): number => {
    if (val === null || val === undefined) return 0;
    return typeof val === 'string' ? parseFloat(val) || 0 : val;
  };

  const totalValue = leads.reduce((sum, l) => sum + toNumber(l.lifetimeValue), 0);
  const customerCount = leads.filter(l => l.stage === 'customer').length;

  // Loading state
  if (isLoading) {
    return (
      <Shell>
        <div className="loading-container">
          <IconLoader2 size={32} className="spinner" />
          <p>Loading leads...</p>
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
          <p>Failed to load leads</p>
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
      panel={selectedLead && viewMode === 'kanban' && (
        <LeadStatsPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
      panelOpen={!!selectedLead && viewMode === 'kanban'}
    >
      <div className="page-content">
        {/* Header */}
        <header className="page-header">
          <div className="header-left">
            <h1 className="page-title">CRM</h1>
            <div className="header-stats">
              <span className="stat">
                <span className="stat-value mono">{leads.length}</span> leads
              </span>
              <span className="stat-divider">·</span>
              <span className="stat">
                <span className="stat-value mono">{customerCount}</span> customers
              </span>
              <span className="stat-divider">·</span>
              <span className="stat">
                <span className="stat-value mono positive">R$ {totalValue.toLocaleString('pt-BR')}</span> LTV
              </span>
            </div>
          </div>
          <div className="header-right">
            {/* View Toggle */}
            <div className="view-toggle">
              <button
                className="toggle-btn"
                data-active={viewMode === 'kanban'}
                onClick={() => setViewMode('kanban')}
                title="Kanban View"
              >
                <IconLayoutKanban size={18} />
              </button>
              <button
                className="toggle-btn"
                data-active={viewMode === 'funnel'}
                onClick={() => setViewMode('funnel')}
                title="Funnel View"
              >
                <IconChartBar size={18} />
              </button>
            </div>

            {viewMode === 'kanban' && (
              <div className="search-box">
                <IconSearch size={14} />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}

            <button className="btn-create">
              <IconPlus size={16} />
              Add Lead
            </button>
          </div>
        </header>

        {/* Empty state */}
        {leads.length === 0 ? (
          <div className="empty-state">
            <h3>No leads yet</h3>
            <p>Leads will appear here when visitors submit forms on your landing pages</p>
            <button className="btn-create">
              <IconPlus size={16} />
              Add Lead Manually
            </button>
          </div>
        ) : (
          <>
            {/* Views */}
            {viewMode === 'kanban' ? (
              <KanbanBoard
                leads={leads}
                selectedLead={selectedLead}
                onSelectLead={setSelectedLead}
                onLeadStageChange={handleStageChange}
              />
            ) : (
              <FunnelView leads={leads} />
            )}
          </>
        )}
      </div>

      <style jsx>{`
                .page-content {
                    padding: 24px;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-shrink: 0;
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
                
                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    padding: 8px 12px;
                    color: var(--text-muted);
                }
                
                .search-box input {
                    background: none;
                    border: none;
                    outline: none;
                    color: var(--text-primary);
                    font-size: 13px;
                    width: 180px;
                }
                
                .search-box input::placeholder {
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
                }
                
                .btn-create:hover {
                    background: var(--accent-dim);
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

                .positive {
                    color: var(--positive);
                }
            `}</style>
    </Shell>
  );
}