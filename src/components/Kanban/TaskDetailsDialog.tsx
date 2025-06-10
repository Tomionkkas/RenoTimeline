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
import { Trash2 } from 'lucide-react';

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
    defaultValues: {
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
    }
  });

  useEffect(() => {
    form.reset({
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
    });
  }, [task, form]);

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

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Tytuł zadania</Label>
        <Input
          id="task-title"
          {...form.register('title')}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="task-description">Opis</Label>
        <Textarea
          id="task-description"
          {...form.register('description')}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-assigned_to">Przypisany do</Label>
        <Select 
          value={form.watch('assigned_to')} 
          onValueChange={(value) => form.setValue('assigned_to', value)}
        >
          <SelectTrigger><SelectValue placeholder="Nieprzypisane" /></SelectTrigger>
          <SelectContent>
            {teamMembers.map((member: TeamMember) => {
              const memberName = `${member.first_name} ${member.last_name}`;
              return <SelectItem key={member.id} value={member.id}>{memberName}</SelectItem>
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task-priority">Priorytet</Label>
          <Select 
            value={form.watch('priority')} 
            onValueChange={(value) => form.setValue('priority', value as any)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Niski</SelectItem>
              <SelectItem value="medium">Średni</SelectItem>
              <SelectItem value="high">Wysoki</SelectItem>
              <SelectItem value="urgent">Pilny</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-status">Status</Label>
          <Select 
            value={form.watch('status')} 
            onValueChange={(value) => form.setValue('status', value as any)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">Do zrobienia</SelectItem>
              <SelectItem value="in_progress">W toku</SelectItem>
              <SelectItem value="review">Do przeglądu</SelectItem>
              <SelectItem value="done">Ukończone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Custom Field Manager - Choose which fields to enable */}
      <TaskCustomFieldManager
        taskId={task.id}
        projectId={task.project_id}
      />

      {/* Custom Fields Section - Only shows enabled fields */}
      {isLoaded && enabledFields.length > 0 && (
        <CustomFieldsSection
          entityType="task"
          entityId={task.id}
          projectId={task.project_id}
          control={form.control}
          setValue={form.setValue}
          errors={form.formState.errors}
          enabledFieldIds={enabledFields}
        />
      )}



      <DialogFooter className="justify-between pt-4">
        <Button type="button" variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Usuń zadanie
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
};


const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({ task, open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Szczegóły zadania</DialogTitle>
          <DialogDescription>
            Przeglądaj i edytuj szczegóły zadania.
          </DialogDescription>
        </DialogHeader>
        
        {task && <TaskDetails task={task} onOpenChange={onOpenChange} />}

      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog; 