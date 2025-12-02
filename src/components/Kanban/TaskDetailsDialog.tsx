import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTasks, Task } from '@/hooks/useTasks';
import { useTeam, TeamMember } from '@/hooks/useTeam';
import { CustomFieldsSection } from '@/components/ui/CustomFieldsSection';
import { TaskCustomFieldManager } from '@/components/ui/TaskCustomFieldManager';
import { useTaskCustomFields } from '@/hooks/useTaskCustomFields';
import { toast } from 'sonner';
import { Trash2, FileText, User, AlertTriangle, CheckCircle, Settings, Eye } from 'lucide-react';

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetails: React.FC<{ task: Task; onOpenChange: (open: boolean) => void }> = ({ task, onOpenChange }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateTask, deleteTask } = useTasks(task.project_id);
  const { teamMembers } = useTeam();
  const { enabledFields, isLoaded } = useTaskCustomFields(task.id);

  const form = useForm({
    values: {
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
    }
  });

  const handleDelete = async () => {
    if (window.confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      try {
        await deleteTask(task.id);
        toast.success('Zadanie zostało usunięte.');
        onOpenChange(false);
      } catch (err) {
        toast.error('Nie udało się usunąć zadania.');
        console.error(err);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      await updateTask({
        id: task.id,
        title: data.title,
        description: data.description || null,
        assigned_to: data.assigned_to || null,
        priority: data.priority,
        status: data.status,
      });
      
      toast.success('Zadanie zostało zaktualizowane!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Nie udało się zaktualizować zadania.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'low': return <AlertTriangle className="w-4 h-4 text-green-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'review': return <Eye className="w-4 h-4 text-blue-400" />;
      case 'in_progress': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'todo': return <FileText className="w-4 h-4 text-gray-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
      {/* Task Title */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <Label htmlFor="task-title" className="text-white font-medium">Tytuł zadania</Label>
        </div>
        <Input
          id="task-title"
          {...form.register('title')}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl"
        />
      </div>
      
      {/* Description */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <Label htmlFor="task-description" className="text-white font-medium">Opis</Label>
        </div>
        <Textarea
          id="task-description"
          {...form.register('description')}
          rows={3}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl resize-none"
        />
      </div>

      {/* Assigned To */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-purple-400" />
          <Label htmlFor="task-assigned_to" className="text-white font-medium">Przypisany do</Label>
        </div>
        <Select 
          value={form.watch('assigned_to')} 
          onValueChange={(value) => form.setValue('assigned_to', value)}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl">
            <SelectValue placeholder="Nieprzypisane" />
          </SelectTrigger>
          <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
            {teamMembers.map((member: TeamMember) => {
              const memberName = `${member.first_name} ${member.last_name}`;
              return (
                <SelectItem 
                  key={member.id} 
                  value={member.id}
                  className="text-white/80 hover:text-white hover:bg-white/20"
                >
                  {memberName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Priority and Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            {getPriorityIcon(form.watch('priority'))}
            <Label htmlFor="task-priority" className="text-white font-medium">Priorytet</Label>
          </div>
          <Select 
            value={form.watch('priority')} 
            onValueChange={(value) => form.setValue('priority', value as any)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
              <SelectItem value="low" className="text-white/80 hover:text-white hover:bg-white/20">Niski</SelectItem>
              <SelectItem value="medium" className="text-white/80 hover:text-white hover:bg-white/20">Średni</SelectItem>
              <SelectItem value="high" className="text-white/80 hover:text-white hover:bg-white/20">Wysoki</SelectItem>
              <SelectItem value="urgent" className="text-white/80 hover:text-white hover:bg-white/20">Pilny</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(form.watch('status'))}
            <Label htmlFor="task-status" className="text-white font-medium">Status</Label>
          </div>
          <Select 
            value={form.watch('status')} 
            onValueChange={(value) => form.setValue('status', value as any)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
              <SelectItem value="todo" className="text-white/80 hover:text-white hover:bg-white/20">Do zrobienia</SelectItem>
              <SelectItem value="in_progress" className="text-white/80 hover:text-white hover:bg-white/20">W toku</SelectItem>
              <SelectItem value="review" className="text-white/80 hover:text-white hover:bg-white/20">Do przeglądu</SelectItem>
              <SelectItem value="done" className="text-white/80 hover:text-white hover:bg-white/20">Ukończone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Custom Field Manager */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          <Label className="text-white font-medium">Pola niestandardowe</Label>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <TaskCustomFieldManager
            taskId={task.id}
            projectId={task.project_id}
          />
        </div>
      </div>

      {/* Custom Fields Section */}
      {isLoaded && enabledFields.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <Label className="text-white font-medium">Wartości pól niestandardowych</Label>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <CustomFieldsSection
              entityType="task"
              entityId={task.id}
              projectId={task.project_id}
              control={form.control}
              setValue={form.setValue}
              errors={form.formState.errors}
              enabledFieldIds={enabledFields}
            />
          </div>
        </div>
      )}

      <DialogFooter className="justify-between pt-6 border-t border-white/10">
        <Button 
          type="button" 
          variant="destructive" 
          onClick={handleDelete} 
          className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/50 rounded-xl"
        >
          <Trash2 className="w-4 h-4" />
          Usuń zadanie
        </Button>
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-xl"
          >
            Anuluj
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Zapisywanie...</span>
              </div>
            ) : (
              'Zapisz zmiany'
            )}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
};

const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({ task, open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Szczegóły zadania</DialogTitle>
              <DialogDescription className="text-white/60 text-base">
                Przeglądaj i edytuj szczegóły zadania.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {task && <TaskDetails task={task} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog; 