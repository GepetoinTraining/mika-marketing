'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useConfig } from '@/lib/config-context';
import { METRIC_DEFINITIONS, formatMetricValue, getMetricColor } from '@/lib/metrics';
import { TooltipContext, MetricKey } from '@/types/config';
import { IconSettings, IconGripVertical } from '@tabler/icons-react';

type MetricData = {
  [K in MetricKey]?: number;
};

type Props = {
  children: ReactNode;
  context: TooltipContext;
  data: MetricData;
  title?: string;
  subtitle?: string;
  maxValues?: Partial<MetricData>; // For calculating colors
  position?: 'top' | 'bottom' | 'left' | 'right';
  showConfigButton?: boolean;
};

export function MetricTooltip({
  children,
  context,
  data,
  title,
  subtitle,
  maxValues = {},
  position = 'top',
  showConfigButton = true,
}: Props) {
  const { config, updateTooltipConfig } = useConfig();
  const [isVisible, setIsVisible] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [localMetrics, setLocalMetrics] = useState<MetricKey[]>([]);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const metrics = config.tooltips[context] || [];

  useEffect(() => {
    setLocalMetrics(metrics);
  }, [metrics, isConfiguring]);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200); // Small delay to prevent flicker
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isConfiguring) {
      setIsVisible(false);
    }
  };

  const handleSaveConfig = () => {
    updateTooltipConfig(context, localMetrics);
    setIsConfiguring(false);
  };

  const toggleMetric = (key: MetricKey) => {
    setLocalMetrics(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const moveMetric = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localMetrics.length) return;

    const newMetrics = [...localMetrics];
    [newMetrics[index], newMetrics[newIndex]] = [newMetrics[newIndex], newMetrics[index]];
    setLocalMetrics(newMetrics);
  };

  // Group available metrics by category
  const metricsByCategory = Object.values(METRIC_DEFINITIONS).reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof METRIC_DEFINITIONS[MetricKey][]>);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip-${position}`}
          onClick={e => e.stopPropagation()}
        >
          {!isConfiguring ? (
            <>
              {/* Header */}
              {(title || showConfigButton) && (
                <div className="tooltip-header">
                  <div className="tooltip-title-group">
                    {title && <div className="tooltip-title">{title}</div>}
                    {subtitle && <div className="tooltip-subtitle mono">{subtitle}</div>}
                  </div>
                  {showConfigButton && (
                    <button
                      className="config-btn"
                      onClick={() => setIsConfiguring(true)}
                      title="Configure tooltip"
                    >
                      <IconSettings size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Metrics */}
              <div className="tooltip-metrics">
                {metrics.map(key => {
                  const def = METRIC_DEFINITIONS[key];
                  const value = data[key];
                  const maxValue = maxValues[key];

                  if (!def || value === undefined) return null;

                  return (
                    <div key={key} className="tooltip-metric">
                      <span className="metric-label">{def.shortLabel}</span>
                      <span
                        className="metric-value mono"
                        style={{ color: getMetricColor(value, key, { max: maxValue }) }}
                      >
                        {formatMetricValue(value, def.format)}
                      </span>
                    </div>
                  );
                })}

                {metrics.length === 0 && (
                  <div className="tooltip-empty">
                    Click <IconSettings size={12} /> to add metrics
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Config Mode */}
              <div className="tooltip-header">
                <div className="tooltip-title">Configure Metrics</div>
                <button
                  className="config-btn save"
                  onClick={handleSaveConfig}
                >
                  Save
                </button>
              </div>

              {/* Selected metrics - draggable order */}
              <div className="config-section">
                <div className="config-section-title">SHOWING ({localMetrics.length})</div>
                <div className="config-selected">
                  {localMetrics.map((key, index) => {
                    const def = METRIC_DEFINITIONS[key];
                    return (
                      <div key={key} className="config-item selected">
                        <IconGripVertical size={12} className="drag-handle" />
                        <span className="config-item-label">{def.label}</span>
                        <div className="config-item-actions">
                          <button
                            className="move-btn"
                            onClick={() => moveMetric(index, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            className="move-btn"
                            onClick={() => moveMetric(index, 'down')}
                            disabled={index === localMetrics.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            className="remove-btn"
                            onClick={() => toggleMetric(key)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Available metrics by category */}
              <div className="config-section">
                <div className="config-section-title">AVAILABLE</div>
                <div className="config-available">
                  {Object.entries(metricsByCategory).map(([category, categoryMetrics]) => (
                    <div key={category} className="config-category">
                      <div className="category-title">{category}</div>
                      <div className="category-metrics">
                        {categoryMetrics
                          .filter(m => !localMetrics.includes(m.key))
                          .map(metric => (
                            <button
                              key={metric.key}
                              className="config-item available"
                              onClick={() => toggleMetric(metric.key)}
                            >
                              <span className="config-item-label">{metric.shortLabel}</span>
                              <span className="add-icon">+</span>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .tooltip-wrapper {
          position: relative;
          display: inline-flex;
        }
        
        .tooltip {
          position: absolute;
          z-index: 1000;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          min-width: 200px;
          max-width: 320px;
          font-size: 12px;
        }
        
        .tooltip-top {
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
        }
        
        .tooltip-bottom {
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
        }
        
        .tooltip-left {
          right: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
        }
        
        .tooltip-right {
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
        }
        
        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
          gap: 12px;
        }
        
        .tooltip-title-group {
          flex: 1;
          min-width: 0;
        }
        
        .tooltip-title {
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .tooltip-subtitle {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        
        .config-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          flex-shrink: 0;
        }
        
        .config-btn:hover {
          color: var(--accent);
        }
        
        .config-btn.save {
          color: var(--accent);
          font-size: 11px;
          font-weight: 600;
        }
        
        .tooltip-metrics {
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .tooltip-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        
        .metric-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.03em;
          color: var(--text-muted);
        }
        
        .metric-value {
          font-size: 13px;
          font-weight: 600;
        }
        
        .tooltip-empty {
          color: var(--text-muted);
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        /* Config Mode */
        .config-section {
          padding: 8px 12px;
          border-bottom: 1px solid var(--border);
        }
        
        .config-section:last-child {
          border-bottom: none;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .config-section-title {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        
        .config-selected {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .config-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
        }
        
        .config-item.selected {
          background: var(--bg-tertiary);
        }
        
        .config-item.available {
          cursor: pointer;
          border: none;
          font-size: 11px;
          color: var(--text-secondary);
        }
        
        .config-item.available:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        
        .drag-handle {
          color: var(--text-muted);
          cursor: grab;
        }
        
        .config-item-label {
          flex: 1;
          font-size: 11px;
          color: var(--text-primary);
        }
        
        .config-item-actions {
          display: flex;
          gap: 2px;
        }
        
        .move-btn, .remove-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px 6px;
          font-size: 12px;
        }
        
        .move-btn:hover, .remove-btn:hover {
          color: var(--text-primary);
        }
        
        .move-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .remove-btn:hover {
          color: var(--negative);
        }
        
        .add-icon {
          color: var(--accent);
          font-weight: 600;
        }
        
        .config-category {
          margin-bottom: 8px;
        }
        
        .config-category:last-child {
          margin-bottom: 0;
        }
        
        .category-title {
          font-size: 9px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: capitalize;
          margin-bottom: 4px;
        }
        
        .category-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}