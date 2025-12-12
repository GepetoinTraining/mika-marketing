'use client';

import { useState, useMemo } from 'react';
import { CampaignWithPerformance, DailyPerformance } from '@/types';
import { toNumber } from '@/lib/utils/convert';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { MetricTooltip } from './MetricTooltip';

type Props = {
  campaigns: CampaignWithPerformance[];
  onSelectCampaign?: (campaign: CampaignWithPerformance) => void;
  selectedCampaignId?: string;
};

type ViewMode = 'month' | 'quarter';

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--text-muted)',
  scheduled: 'var(--neutral)',
  active: 'var(--positive)',
  paused: 'var(--warning)',
  completed: 'var(--neutral)',
  archived: 'var(--text-muted)',
};

// Calculate conversion rate from daily performance
function getConversionRate(day: DailyPerformance): number {
  if (day.visitors === 0) return 0;
  return (day.leads / day.visitors) * 100;
}

export function CampaignTimeline({ campaigns, onSelectCampaign, selectedCampaignId }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range based on view mode
  const { startDate, endDate, days } = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else {
      // Quarter view - 3 months
      start.setDate(1);
      end.setMonth(end.getMonth() + 3);
      end.setDate(0);
    }

    const daysList: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      daysList.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return { startDate: start, endDate: end, days: daysList };
  }, [currentDate, viewMode]);

  // Navigate
  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const offset = viewMode === 'month' ? 1 : 3;
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? offset : -offset));
    setCurrentDate(newDate);
  };

  // Get performance color based on conversion rate
  const getPerformanceColor = (cvr: number, maxCvr: number) => {
    if (maxCvr === 0) return 'var(--text-muted)';
    const ratio = cvr / maxCvr;
    if (ratio >= 0.8) return 'var(--positive)';
    if (ratio >= 0.6) return 'var(--accent-dim)';
    if (ratio >= 0.4) return 'var(--warning)';
    if (ratio >= 0.2) return '#ff8844';
    return 'var(--negative)';
  };

  // Get performance opacity based on volume
  const getPerformanceOpacity = (visitors: number, maxVisitors: number) => {
    if (maxVisitors === 0) return 0.3;
    return Math.max(0.3, visitors / maxVisitors);
  };

  // Format header date
  const formatHeaderDate = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (viewMode === 'quarter') {
      const endMonth = new Date(endDate);
      return `${startDate.toLocaleDateString('pt-BR', { month: 'short' })} - ${endMonth.toLocaleDateString('pt-BR', options)}`;
    }
    return currentDate.toLocaleDateString('pt-BR', options);
  };

  // Check if a day is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Get campaign position and width
  const getCampaignStyle = (campaign: CampaignWithPerformance) => {
    if (!campaign.startDate || !campaign.endDate) return null;

    const campStart = new Date(campaign.startDate);
    const campEnd = new Date(campaign.endDate);

    // Check if campaign is visible in current range
    if (campEnd < startDate || campStart > endDate) return null;

    const visibleStart = campStart < startDate ? startDate : campStart;
    const visibleEnd = campEnd > endDate ? endDate : campEnd;

    const totalDays = days.length;
    const startOffset = Math.floor((visibleStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((visibleEnd.getTime() - visibleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  // Get daily performance for a campaign within the visible range
  const getVisiblePerformance = (campaign: CampaignWithPerformance) => {
    if (!campaign.dailyPerformance?.length) return [];

    return campaign.dailyPerformance.filter(day => {
      const date = new Date(day.date);
      return date >= startDate && date <= endDate;
    });
  };

  // Get max CVR across all campaigns for color scaling
  const maxCvr = useMemo(() => {
    let max = 0;
    campaigns.forEach(c => {
      c.dailyPerformance?.forEach(d => {
        const cvr = getConversionRate(d);
        if (cvr > max) max = cvr;
      });
    });
    return max || 10;
  }, [campaigns]);

  // Get max visitors for opacity scaling
  const maxVisitors = useMemo(() => {
    let max = 0;
    campaigns.forEach(c => {
      c.dailyPerformance?.forEach(d => {
        if (d.visitors > max) max = d.visitors;
      });
    });
    return max || 1000;
  }, [campaigns]);

  return (
    <div className="timeline-container">
      {/* Header Controls */}
      <div className="timeline-header">
        <div className="timeline-nav">
          <button className="nav-btn" onClick={() => navigate('prev')}>
            <IconChevronLeft size={18} />
          </button>
          <span className="nav-title">{formatHeaderDate()}</span>
          <button className="nav-btn" onClick={() => navigate('next')}>
            <IconChevronRight size={18} />
          </button>
        </div>

        <div className="view-toggle">
          <button
            className="toggle-btn"
            data-active={viewMode === 'month'}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button
            className="toggle-btn"
            data-active={viewMode === 'quarter'}
            onClick={() => setViewMode('quarter')}
          >
            Quarter
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="timeline-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: 'var(--positive)' }} />
          <span>High CVR</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: 'var(--warning)' }} />
          <span>Medium</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: 'var(--negative)' }} />
          <span>Low/Dropping</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-outline" />
          <span>Planned</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="timeline-grid">
        {/* Day Headers */}
        <div className="grid-header">
          <div className="grid-label" /> {/* Empty for campaign names column */}
          <div className="grid-days">
            {days.map((day, i) => (
              <div
                key={i}
                className={`day-header ${isWeekend(day) ? 'weekend' : ''} ${isToday(day) ? 'today' : ''}`}
              >
                {viewMode === 'month' || i % 3 === 0 ? (
                  <>
                    <span className="day-name">
                      {day.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                    </span>
                    <span className="day-num mono">{day.getDate()}</span>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Rows */}
        <div className="grid-body">
          {campaigns.map(campaign => {
            const style = getCampaignStyle(campaign);
            const performance = getVisiblePerformance(campaign);
            const isSelected = selectedCampaignId === campaign.id;
            const isFuture = campaign.status === 'scheduled' || campaign.status === 'draft';

            if (!style) return null;

            return (
              <div
                key={campaign.id}
                className="campaign-row"
                data-selected={isSelected}
                onClick={() => onSelectCampaign?.(campaign)}
              >
                <div className="campaign-label">
                  <span
                    className="campaign-status-dot"
                    style={{ background: STATUS_COLORS[campaign.status] || 'var(--text-muted)' }}
                  />
                  <span className="campaign-name">{campaign.name}</span>
                </div>

                <div className="campaign-track">
                  {/* Background grid lines */}
                  <div className="track-grid">
                    {days.map((day, i) => (
                      <div
                        key={i}
                        className={`track-cell ${isWeekend(day) ? 'weekend' : ''} ${isToday(day) ? 'today' : ''}`}
                      />
                    ))}
                  </div>

                  {/* Campaign bar */}
                  <div
                    className={`campaign-bar ${isFuture ? 'future' : ''}`}
                    style={style}
                  >
                    {performance.length > 0 ? (
                      <div className="performance-segments">
                        {performance.map((day, i) => {
                          const cvr = getConversionRate(day);
                          const revenue = toNumber(day.revenue);
                          return (
                            <MetricTooltip
                              key={i}
                              context="timeline-segment"
                              title={campaign.name}
                              subtitle={day.date}
                              data={{
                                conversionRate: cvr,
                                visitors: day.visitors,
                                leads: day.leads,
                                revenue: revenue,
                              }}
                              maxValues={{
                                conversionRate: maxCvr,
                                visitors: maxVisitors,
                              }}
                              position="top"
                            >
                              <div
                                className="segment"
                                style={{
                                  background: getPerformanceColor(cvr, maxCvr),
                                  opacity: getPerformanceOpacity(day.visitors, maxVisitors),
                                }}
                              />
                            </MetricTooltip>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bar-empty">
                        <span className="bar-label">{campaign.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .timeline-container {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }
        
        .timeline-nav {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .nav-btn {
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
        
        .nav-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-light);
        }
        
        .nav-title {
          font-size: 16px;
          font-weight: 600;
          min-width: 200px;
          text-align: center;
          text-transform: capitalize;
        }
        
        .view-toggle {
          display: flex;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
        }
        
        .toggle-btn {
          padding: 8px 16px;
          background: none;
          border: none;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
        }
        
        .toggle-btn:hover {
          color: var(--text-primary);
        }
        
        .toggle-btn[data-active="true"] {
          background: rgba(0, 255, 136, 0.1);
          color: var(--accent);
        }
        
        .toggle-btn:first-child {
          border-right: 1px solid var(--border);
        }
        
        .timeline-legend {
          display: flex;
          gap: 20px;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-tertiary);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text-secondary);
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
        }
        
        .legend-outline {
          background: transparent;
          border: 2px dashed var(--border-light);
        }
        
        .timeline-grid {
          overflow-x: auto;
        }
        
        .grid-header {
          display: flex;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--bg-secondary);
          z-index: 10;
        }
        
        .grid-label {
          width: 200px;
          flex-shrink: 0;
          padding: 8px 12px;
          border-right: 1px solid var(--border);
        }
        
        .grid-days {
          display: flex;
          flex: 1;
        }
        
        .day-header {
          flex: 1;
          min-width: ${viewMode === 'month' ? '32px' : '12px'};
          padding: 8px 2px;
          text-align: center;
          font-size: 10px;
          color: var(--text-muted);
          border-right: 1px solid var(--border);
        }
        
        .day-header.weekend {
          background: rgba(0, 0, 0, 0.2);
        }
        
        .day-header.today {
          background: rgba(0, 255, 136, 0.1);
        }
        
        .day-name {
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        
        .day-num {
          display: block;
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        
        .grid-body {
          min-height: 300px;
        }
        
        .campaign-row {
          display: flex;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.1s ease;
        }
        
        .campaign-row:hover {
          background: var(--bg-tertiary);
        }
        
        .campaign-row[data-selected="true"] {
          background: rgba(0, 255, 136, 0.03);
        }
        
        .campaign-label {
          width: 200px;
          flex-shrink: 0;
          padding: 16px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-right: 1px solid var(--border);
        }
        
        .campaign-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .campaign-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .campaign-track {
          flex: 1;
          position: relative;
          height: 56px;
        }
        
        .track-grid {
          display: flex;
          position: absolute;
          inset: 0;
        }
        
        .track-cell {
          flex: 1;
          border-right: 1px solid var(--border);
        }
        
        .track-cell.weekend {
          background: rgba(0, 0, 0, 0.15);
        }
        
        .track-cell.today {
          background: rgba(0, 255, 136, 0.05);
        }
        
        .campaign-bar {
          position: absolute;
          top: 8px;
          bottom: 8px;
          border-radius: 2px;
          overflow: hidden;
          z-index: 5;
        }
        
        .campaign-bar.future {
          border: 2px dashed var(--border-light);
          background: transparent;
        }
        
        .performance-segments {
          display: flex;
          height: 100%;
        }
        
        .segment {
          flex: 1;
          position: relative;
          transition: opacity 0.2s ease;
        }
        
        .segment:hover {
          opacity: 1 !important;
        }
        
        .bar-empty {
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 12px;
        }
        
        .bar-label {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}