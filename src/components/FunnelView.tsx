'use client';

import { Lead } from '@/types';

type Stage = {
  id: Lead['stage'];
  label: string;
  color: string;
};

// Matches leadStageEnum in schema (no 'anonymous' or 'repeat')
const STAGES: Stage[] = [
  { id: 'captured', label: 'Captured', color: 'var(--neutral)' },
  { id: 'engaged', label: 'Engaged', color: 'var(--warning)' },
  { id: 'qualified', label: 'Qualified', color: 'var(--warning)' },
  { id: 'opportunity', label: 'Opportunity', color: 'var(--accent)' },
  { id: 'customer', label: 'Customer', color: 'var(--positive)' },
];

type Props = {
  leads: Lead[];
};

export function FunnelView({ leads }: Props) {
  // Helper to safely convert decimal strings to numbers
  const toNumber = (val: number | string): number => {
    return typeof val === 'string' ? parseFloat(val) || 0 : val;
  };

  // Count leads at each stage AND beyond (cumulative from that point)
  const getStageCounts = () => {
    const counts: Record<string, number> = {};
    const stageOrder = STAGES.map(s => s.id);

    STAGES.forEach((stage, index) => {
      // Count leads at this stage or any later stage
      counts[stage.id] = leads.filter(lead => {
        const leadStageIndex = stageOrder.indexOf(lead.stage);
        return leadStageIndex >= index;
      }).length;
    });

    return counts;
  };

  const counts = getStageCounts();
  const maxCount = counts['captured'] || 1;

  // Calculate conversion rates between stages
  const getConversionRate = (fromStage: string, toStage: string) => {
    const from = counts[fromStage] || 0;
    const to = counts[toStage] || 0;
    if (from === 0) return 0;
    return (to / from) * 100;
  };

  // Calculate drop-off
  const getDropOff = (fromStage: string, toStage: string) => {
    const from = counts[fromStage] || 0;
    const to = counts[toStage] || 0;
    return from - to;
  };

  const getDropOffRate = (fromStage: string, toStage: string) => {
    const from = counts[fromStage] || 0;
    const dropOff = getDropOff(fromStage, toStage);
    if (from === 0) return 0;
    return (dropOff / from) * 100;
  };

  // Overall conversion rate
  const overallConversion = maxCount > 0
    ? ((counts['customer'] || 0) / maxCount * 100).toFixed(1)
    : '0';

  // Total value in pipeline
  const totalValue = leads.reduce((sum, l) => sum + toNumber(l.lifetimeValue), 0);
  const customerValue = leads
    .filter(l => l.stage === 'customer')
    .reduce((sum, l) => sum + toNumber(l.lifetimeValue), 0);

  return (
    <div className="funnel-container">
      {/* Summary Stats */}
      <div className="funnel-summary">
        <div className="summary-stat">
          <span className="summary-label">TOTAL LEADS</span>
          <span className="summary-value mono">{maxCount}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">CUSTOMERS</span>
          <span className="summary-value mono positive">{counts['customer'] || 0}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">OVERALL CVR</span>
          <span className="summary-value mono positive">{overallConversion}%</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">PIPELINE VALUE</span>
          <span className="summary-value mono">R$ {totalValue.toLocaleString('pt-BR')}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">CUSTOMER LTV</span>
          <span className="summary-value mono positive">R$ {customerValue.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="funnel">
        {STAGES.map((stage, index) => {
          const count = counts[stage.id] || 0;
          const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const nextStage = STAGES[index + 1];

          const convRate = nextStage ? getConversionRate(stage.id, nextStage.id) : null;
          const dropOff = nextStage ? getDropOff(stage.id, nextStage.id) : null;
          const dropOffRate = nextStage ? getDropOffRate(stage.id, nextStage.id) : null;

          return (
            <div key={stage.id} className="funnel-row">
              {/* Stage Bar */}
              <div className="funnel-stage">
                <div className="stage-info">
                  <span className="stage-dot" style={{ background: stage.color }} />
                  <span className="stage-name">{stage.label}</span>
                </div>

                <div className="stage-bar-container">
                  <div
                    className="stage-bar"
                    style={{
                      width: `${width}%`,
                      background: stage.color,
                    }}
                  />
                  <div className="stage-bar-bg" />
                </div>

                <div className="stage-metrics">
                  <span className="stage-count mono">{count}</span>
                  <span className="stage-percent mono muted">
                    {((count / maxCount) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Drop-off Indicator */}
              {nextStage && dropOff !== null && dropOff > 0 && (
                <div className="drop-off">
                  <div className="drop-off-line" />
                  <div className="drop-off-stats">
                    <span className="drop-off-count mono negative">−{dropOff}</span>
                    <span className="drop-off-rate mono negative">
                      {dropOffRate?.toFixed(1)}% lost
                    </span>
                    <span className="drop-off-arrow">↓</span>
                    <span className="conv-rate mono">
                      {convRate?.toFixed(1)}% convert
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leaky Bucket Analysis */}
      <div className="leak-analysis">
        <h3 className="analysis-title">BIGGEST LEAKS</h3>
        <div className="leak-items">
          {STAGES.slice(0, -1).map((stage, index) => {
            const nextStage = STAGES[index + 1];
            const dropOff = getDropOff(stage.id, nextStage.id);
            const dropOffRate = getDropOffRate(stage.id, nextStage.id);

            return {
              from: stage,
              to: nextStage,
              dropOff,
              dropOffRate
            };
          })
            .sort((a, b) => b.dropOff - a.dropOff)
            .slice(0, 3)
            .map(({ from, to, dropOff, dropOffRate }) => (
              <div key={from.id} className="leak-item">
                <div className="leak-stages">
                  <span style={{ color: from.color }}>{from.label}</span>
                  <span className="leak-arrow">→</span>
                  <span style={{ color: to.color }}>{to.label}</span>
                </div>
                <div className="leak-stats">
                  <span className="leak-count mono negative">−{dropOff} leads</span>
                  <span className="leak-rate mono negative">{dropOffRate.toFixed(1)}%</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <style jsx>{`
        .funnel-container {
          max-width: 900px;
        }
        
        .funnel-summary {
          display: flex;
          gap: 24px;
          padding: 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          margin-bottom: 24px;
        }
        
        .summary-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .summary-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        
        .summary-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .funnel {
          display: flex;
          flex-direction: column;
        }
        
        .funnel-row {
          display: flex;
          flex-direction: column;
        }
        
        .funnel-stage {
          display: grid;
          grid-template-columns: 140px 1fr 100px;
          gap: 16px;
          align-items: center;
          padding: 16px 0;
        }
        
        .stage-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .stage-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .stage-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .stage-bar-container {
          position: relative;
          height: 32px;
        }
        
        .stage-bar {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          min-width: 4px;
          transition: width 0.3s ease;
        }
        
        .stage-bar-bg {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          height: 100%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
        }
        
        .stage-bar {
          z-index: 1;
        }
        
        .stage-metrics {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .stage-count {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .stage-percent {
          font-size: 14px;
          color: var(--text-muted);
        }
        
        .drop-off {
          display: grid;
          grid-template-columns: 140px 1fr 100px;
          gap: 16px;
          padding: 8px 0;
          margin-left: 4px;
        }
        
        .drop-off-line {
          border-left: 2px dashed var(--border);
          height: 100%;
          margin-left: 4px;
        }
        
        .drop-off-stats {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          padding: 8px 12px;
          background: rgba(255, 68, 68, 0.05);
          border: 1px dashed rgba(255, 68, 68, 0.2);
        }
        
        .drop-off-count {
          font-weight: 600;
        }
        
        .drop-off-rate {
          color: var(--negative);
        }
        
        .drop-off-arrow {
          color: var(--text-muted);
        }
        
        .conv-rate {
          color: var(--text-secondary);
          margin-left: auto;
        }
        
        .leak-analysis {
          margin-top: 32px;
          padding: 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
        }
        
        .analysis-title {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin: 0 0 16px 0;
        }
        
        .leak-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .leak-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
        }
        
        .leak-stages {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .leak-arrow {
          color: var(--text-muted);
        }
        
        .leak-stats {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        
        .leak-count {
          font-size: 13px;
          font-weight: 600;
        }
        
        .leak-rate {
          font-size: 12px;
          padding: 4px 8px;
          background: rgba(255, 68, 68, 0.1);
        }
      `}</style>
    </div>
  );
}