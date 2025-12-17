import React, { useState, useEffect } from 'react';
import { useTaskAssignments, TaskAssignmentWithProfile } from '@/hooks/useTaskAssignments';
import { useTeam } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, User, Save } from 'lucide-react';
import { toast } from 'sonner';

interface TaskAssignmentsProps {
  taskId: string;
  projectId: string;
  isEditing: boolean;
}

const TaskAssignments: React.FC<TaskAssignmentsProps> = ({ taskId, projectId, isEditing }) => {
  const { assignments, loading, addAssignment, removeAssignment, batchUpdateAssignments } = useTaskAssignments(taskId);
  const { teamMembers } = useTeam();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize and sync selected members with current assignments
  useEffect(() => {
    if (isEditing) {
      // When entering edit mode, always sync with current assignments
      // Use team_member_id since we're assigning team members (not users)
      setSelectedMembers(assignments.map(a => a.team_member_id).filter(Boolean) as string[]);
      setHasChanges(false);
    }
  }, [isEditing, assignments]);

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) => {
      const newSelection = prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId];
      setHasChanges(true);
      return newSelection;
    });
  };

  const handleSaveAssignments = async () => {
    try {
      // Get current assignment team_member_ids
      const currentTeamMemberIds = new Set(assignments.map(a => a.team_member_id).filter(Boolean));
      const newSelectionIds = new Set(selectedMembers);

      // Find members to remove
      const toRemove = assignments.filter(a => a.team_member_id && !newSelectionIds.has(a.team_member_id));

      // Find members to add
      const toAdd = selectedMembers.filter(memberId => !currentTeamMemberIds.has(memberId));

      // Remove unselected members
      for (const assignment of toRemove) {
        await removeAssignment(assignment.id);
      }

      // Add new members
      for (let i = 0; i < toAdd.length; i++) {
        const memberId = toAdd[i];
        const order = selectedMembers.indexOf(memberId) + 1;

        await addAssignment({
          task_id: taskId,
          team_member_id: memberId,
          assignment_order: order,
        });
      }

      // Update order for existing assignments
      const existingToUpdate = assignments
        .filter(a => a.team_member_id && newSelectionIds.has(a.team_member_id))
        .map(a => {
          const newOrder = selectedMembers.indexOf(a.team_member_id!) + 1;
          return {
            id: a.id,
            assignment_order: newOrder,
          };
        })
        .filter(update => {
          const existing = assignments.find(a => a.id === update.id);
          return existing && existing.assignment_order !== update.assignment_order;
        });

      if (existingToUpdate.length > 0) {
        await batchUpdateAssignments(existingToUpdate);
      }

      setHasChanges(false);
      toast.success('Przypisania zostały zaktualizowane');
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast.error('Błąd podczas zapisywania przypisań');
    }
  };

  const getMemberName = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    if (!member) return 'Nieznany';
    return `${member.first_name} ${member.last_name}`.trim();
  };

  const getMemberExpertise = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    return member?.expertise || null;
  };

  if (loading) {
    return <div className="text-slate-400">Ładowanie przypisań...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          <Label className="text-sm font-medium text-slate-400">
            Przypisani członkowie zespołu
          </Label>
        </div>
        {isEditing && hasChanges && (
          <Button
            type="button"
            size="sm"
            onClick={handleSaveAssignments}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-3 w-3 mr-1" />
            Zapisz
          </Button>
        )}
      </div>

      {!isEditing ? (
        /* View Mode - Show current assignments */
        <div className="space-y-2">
          {assignments.length === 0 ? (
            <p className="text-sm text-slate-500">Brak przypisanych członków zespołu</p>
          ) : (
            assignments.map((assignment, index) => (
              <div
                key={assignment.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-medium">
                  {index + 1}
                </div>
                <User className="h-4 w-4 text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {assignment.first_name} {assignment.last_name}
                  </p>
                  {assignment.expertise && (
                    <p className="text-xs text-slate-400">{assignment.expertise}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Edit Mode - Show checkboxes */
        <div className="space-y-3">
          <div className="text-xs text-slate-400 mb-2">
            Zaznacz członków zespołu ({selectedMembers.length} wybrano)
          </div>

          {teamMembers.length === 0 ? (
            <p className="text-sm text-slate-500">Brak członków zespołu w tym projekcie</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {teamMembers.map((member) => {
                const isSelected = selectedMembers.includes(member.id);
                const selectedIndex = selectedMembers.indexOf(member.id);

                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/70 border-slate-600 hover:bg-slate-800'
                        : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50'
                    }`}
                    onClick={() => handleMemberToggle(member.id)}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-transparent'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30">
                        {selectedIndex + 1}
                      </div>
                    )}
                    <User className={`h-4 w-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {member.first_name} {member.last_name}
                      </p>
                      {member.expertise && (
                        <p className={`text-xs truncate ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                          {member.expertise}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskAssignments;
