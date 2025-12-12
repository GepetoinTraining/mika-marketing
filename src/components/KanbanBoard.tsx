'use client';

import { Lead } from '@/types';
import { LeadCard } from './LeadCard';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

type Stage = {
  id: Lead['stage'];
  label: string;
  color: string;
};

const STAGES: Stage[] = [
  { id: 'captured', label: 'Captured', color: 'var(--neutral)' },
  { id: 'engaged', label: 'Engaged', color: 'var(--warning)' },
  { id: 'qualified', label: 'Qualified', color: 'var(--warning)' },
  { id: 'opportunity', label: 'Opportunity', color: 'var(--accent)' },
  { id: 'customer', label: 'Customer', color: 'var(--positive)' },
];

type Props = {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead | null) => void;
  onLeadStageChange?: (leadId: string, newStage: Lead['stage']) => void;
};

export function KanbanBoard({ leads, selectedLead, onSelectLead, onLeadStageChange }: Props) {
  const getLeadsByStage = (stage: Lead['stage']) => {
    return leads.filter(lead => lead.stage === stage);
  };

  const formatValue = (leads: Lead[]) => {
    const total = leads.reduce((sum, l) => sum + l.lifetimeValue, 0);
    if (total === 0) return null;
    return 'R$ ' + total.toLocaleString('pt-BR');
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const newStage = destination.droppableId as Lead['stage'];
    onLeadStageChange?.(draggableId, newStage);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban">
        {STAGES.map(stage => {
          const stageLeads = getLeadsByStage(stage.id);
          const value = formatValue(stageLeads);

          return (
            <div key={stage.id} className="kanban-column">
              <div className="column-header">
                <div className="column-title">
                  <span className="column-dot" style={{ background: stage.color }} />
                  <span className="column-name">{stage.label}</span>
                  <span className="column-count mono">{stageLeads.length}</span>
                </div>
                {value && (
                  <div className="column-value mono positive">{value}</div>
                )}
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`column-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {stageLeads.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`draggable-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
                          >
                            <LeadCard
                              lead={lead}
                              selected={selectedLead?.id === lead.id}
                              onClick={() => onSelectLead(
                                selectedLead?.id === lead.id ? null : lead
                              )}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {stageLeads.length === 0 && !snapshot.isDraggingOver && (
                      <div className="column-empty">No leads</div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}

        <style jsx>{`
          .kanban {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 16px;
            min-height: calc(100vh - 140px);
          }
          
          .kanban-column {
            flex: 1;
            min-width: 280px;
            max-width: 350px;
            display: flex;
            flex-direction: column;
          }
          
          .column-header {
            padding: 12px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-bottom: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .column-title {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .column-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
          
          .column-name {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary);
          }
          
          .column-count {
            font-size: 11px;
            color: var(--text-muted);
          }
          
          .column-value {
            font-size: 11px;
            font-weight: 500;
          }
          
          .column-empty {
            text-align: center;
            padding: 24px 12px;
            color: var(--text-muted);
            font-size: 12px;
          }
        `}</style>
      </div>
    </DragDropContext>
  );
}