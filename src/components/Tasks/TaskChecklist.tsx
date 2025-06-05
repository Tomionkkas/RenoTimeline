
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, User } from 'lucide-react';
import { useSubtasks, Subtask } from '@/hooks/useSubtasks';
import { toast } from 'sonner';

interface TaskChecklistProps {
  taskId: string;
}

const TaskChecklist: React.FC<TaskChecklistProps> = ({ taskId }) => {
  const { subtasks, loading, createSubtask, updateSubtask, deleteSubtask, toggleSubtask } = useSubtasks(taskId);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) {
      toast.error('Tytuł elementu checklist jest wymagany');
      return;
    }

    try {
      await createSubtask({
        title: newSubtaskTitle.trim()
      });
      setNewSubtaskTitle('');
      setIsAdding(false);
      toast.success('Element checklist został dodany');
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast.error('Nie udało się dodać elementu checklist');
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await toggleSubtask(subtaskId, completed);
    } catch (error) {
      console.error('Error toggling subtask:', error);
      toast.error('Nie udało się zaktualizować elementu checklist');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask(subtaskId);
      toast.success('Element checklist został usunięty');
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast.error('Nie udało się usunąć elementu checklist');
    }
  };

  const completedCount = subtasks.filter(subtask => subtask.completed).length;
  const totalCount = subtasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Checklist</h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Checklist</h3>
        <div className="flex items-center space-x-2">
          {totalCount > 0 && (
            <Badge variant="outline">
              {completedCount}/{totalCount} ({progressPercentage}%)
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Dodaj
          </Button>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      )}

      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            onToggle={handleToggleSubtask}
            onDelete={handleDeleteSubtask}
            onUpdate={updateSubtask}
          />
        ))}

        {isAdding && (
          <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md">
            <Checkbox disabled />
            <Input
              placeholder="Nowy element checklist..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddSubtask();
                }
              }}
              className="flex-1"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim()}
            >
              Dodaj
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewSubtaskTitle('');
              }}
            >
              Anuluj
            </Button>
          </div>
        )}

        {subtasks.length === 0 && !isAdding && (
          <div className="text-center py-4 text-gray-500">
            <p>Brak elementów checklist</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj pierwszy element
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Subtask>) => void;
}

const SubtaskItem: React.FC<SubtaskItemProps> = ({ subtask, onToggle, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [editDescription, setEditDescription] = useState(subtask.description || '');

  const handleSaveEdit = async () => {
    try {
      await onUpdate(subtask.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Nie udało się zaktualizować elementu checklist');
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(subtask.title);
    setEditDescription(subtask.description || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2 p-2 border border-gray-300 rounded-md">
        <div className="flex items-center space-x-2">
          <Checkbox checked={subtask.completed} disabled />
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1"
          />
        </div>
        <Textarea
          placeholder="Opis (opcjonalny)..."
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          rows={2}
        />
        <div className="flex justify-end space-x-2">
          <Button size="sm" onClick={handleSaveEdit}>
            Zapisz
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancelEdit}>
            Anuluj
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded-md group">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={(checked) => onToggle(subtask.id, !!checked)}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        <div
          className={`cursor-pointer ${subtask.completed ? 'line-through text-gray-500' : ''}`}
          onClick={() => setIsEditing(true)}
        >
          <p className="font-medium">{subtask.title}</p>
          {subtask.description && (
            <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2 mt-1">
          {subtask.due_date && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(subtask.due_date).toLocaleDateString('pl-PL')}
            </div>
          )}
          {subtask.assigned_to && (
            <div className="flex items-center text-xs text-gray-500">
              <User className="w-3 h-3 mr-1" />
              Przypisane
            </div>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(subtask.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  );
};

export default TaskChecklist;
