
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Clock, User, Flag, FileText, CheckSquare, Bell, Settings } from 'lucide-react';
import { Task, useTasks } from '@/hooks/useTasks';
import { CustomFieldsSection } from '@/components/ui/CustomFieldsSection';
import { useCustomFieldValues } from '@/hooks/useCustomFieldValues';
import TaskChecklist from './TaskChecklist';
import TaskReminders from './TaskReminders';
import { WorkflowTriggers } from '../../lib/workflow/WorkflowTriggers';
import { toast } from 'sonner';

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({ open, onOpenChange, task }) => {
  const { updateTask } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo' as const,
    priority: task?.priority || 'medium' as const,
    due_date: task?.due_date || '',
    estimated_hours: task?.estimated_hours?.toString() || ''
  });

  // Create a simple form for custom fields only
  const customFieldsForm = useForm();

  React.useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || '',
        estimated_hours: task.estimated_hours?.toString() || ''
      });
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;

    try {
      const updates = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status as any,
        priority: formData.priority as any,
        due_date: formData.due_date || null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null
      };

      await updateTask(task.id, updates);
      
      // Trigger workflows if status changed
      if (task.status !== formData.status) {
        try {
          await WorkflowTriggers.onTaskStatusChanged(
            task.id,
            task.project_id,
            task.status,
            formData.status,
            'current-user-id' // This should come from auth context
          );
        } catch (workflowError) {
          console.error('Workflow trigger failed:', workflowError);
          // Don't fail the update if workflow triggers fail
        }
      }
      
      setIsEditing(false);
      toast.success('Zadanie zostało zaktualizowane');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Nie udało się zaktualizować zadania');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Pilny';
      case 'high': return 'Wysoki';
      case 'medium': return 'Średni';
      case 'low': return 'Niski';
      default: return 'Nieznany';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'Do zrobienia';
      case 'in_progress': return 'W toku';
      case 'review': return 'Do przeglądu';
      case 'done': return 'Ukończone';
      default: return 'Nieznany';
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isEditing ? (
              <Input
                {...form.register('title')}
                className="text-lg font-semibold"
              />
            ) : (
              <span>{task.title}</span>
            )}
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
            >
              {isEditing ? 'Zapisz' : 'Edytuj'}
            </Button>
          </DialogTitle>
          <DialogDescription>
            Szczegóły zadania i zarządzanie
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Szczegóły</span>
            </TabsTrigger>
            <TabsTrigger value="custom-fields" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Pola</span>
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4" />
              <span>Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Przypomnienia</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                {isEditing ? (
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'todo' | 'in_progress' | 'review' | 'done' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Do zrobienia</SelectItem>
                      <SelectItem value="in_progress">W toku</SelectItem>
                      <SelectItem value="review">Do przeglądu</SelectItem>
                      <SelectItem value="done">Ukończone</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge>{getStatusLabel(task.status)}</Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>Priorytet</Label>
                {isEditing ? (
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' | 'urgent' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niski</SelectItem>
                      <SelectItem value="medium">Średni</SelectItem>
                      <SelectItem value="high">Wysoki</SelectItem>
                      <SelectItem value="urgent">Pilny</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                    <Flag className="w-3 h-3 mr-1" />
                    {getPriorityLabel(task.priority)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Opis</Label>
              {isEditing ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Opisz zadanie..."
                />
              ) : (
                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md min-h-[100px]">
                  {task.description || 'Brak opisu'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Termin wykonania</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-sm">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <span>
                      {task.due_date 
                        ? new Date(task.due_date).toLocaleDateString('pl-PL')
                        : 'Nie ustawiono'
                      }
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Szacowane godziny</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    placeholder="0"
                    min="0"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{task.estimated_hours || 0} godzin</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Utworzono:</span>
                  <br />
                  {new Date(task.created_at).toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div>
                  <span className="font-medium">Ostatnia aktualizacja:</span>
                  <br />
                  {new Date(task.updated_at).toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom-fields" className="overflow-y-auto max-h-[60vh]">
            <CustomFieldsSection
              entityType="task"
              entityId={task.id}
              projectId={task.project_id}
              control={form.control}
              setValue={form.setValue}
              errors={form.formState.errors}
              disabled={!isEditing}
            />
          </TabsContent>

          <TabsContent value="checklist" className="overflow-y-auto max-h-[60vh]">
            <TaskChecklist taskId={task.id} />
          </TabsContent>

          <TabsContent value="reminders" className="overflow-y-auto max-h-[60vh]">
            <TaskReminders taskId={task.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
