import { useState } from 'react';
import { GripVertical, Edit2, Trash2, Plus } from 'lucide-react';
import { type Milestone } from '../lib/supabase';

interface KanbanProps {
  milestones: Milestone[];
  onUpdateMilestone: (milestone: Milestone) => void;
  onDeleteMilestone: (id: string) => void;
  onAddMilestone: (status: string) => void;
}

const STATUSES = [
  { id: 'To Do', label: 'To Do', color: 'bg-slate-500' },
  { id: 'In Progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'Ready for Review', label: 'Ready for Review', color: 'bg-amber-500' },
  { id: 'Approved', label: 'Approved', color: 'bg-emerald-500' },
];

export default function KanbanBoard({ milestones, onUpdateMilestone, onDeleteMilestone, onAddMilestone }: KanbanProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const getMilestonesByStatus = (status: string) => {
    return milestones.filter((m: any) => m.status === status);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Milestone Workflow</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map((status) => {
          const statusMilestones = getMilestonesByStatus(status.id);
          return (
            <div key={status.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <h4 className="font-semibold text-sm">{status.label}</h4>
                <span className="ml-auto text-xs text-slate-400">{statusMilestones.length}</span>
              </div>

              <div className="space-y-2 min-h-48">
                {statusMilestones.map((milestone: any) => (
                  <div
                    key={milestone.id}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-100 break-words">{milestone.name}</p>
                        {milestone.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{milestone.description}</p>
                        )}
                        {milestone.due_date && (
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(milestone.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-slate-800 rounded transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        onClick={() => onDeleteMilestone(milestone.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}

                {statusMilestones.length === 0 && (
                  <div className="text-center py-6 text-slate-500">
                    <p className="text-xs">No milestones</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => onAddMilestone(status.id)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-slate-700"
              >
                <Plus className="w-4 h-4" />
                Add Milestone
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
