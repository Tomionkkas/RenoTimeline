
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
import { CalendarDays, Clock, User, Flag, FileText, CheckSquare, Bell, Settings, Edit, X } from 'lucide-react';
import { Task, useTasks } from '@/hooks/useTasks';
import { CustomFieldsSection } from '@/components/ui/CustomFieldsSection';
import { useCustomFieldValues } from '@/hooks/useCustomFieldValues';
import TaskChecklist from './TaskChecklist';
import TaskReminders from './TaskReminders';
import { toast } from 'sonner';
import ComingSoon from '@/components/ui/ComingSoon';

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

type FormData = {
  name: string;
  description: string;
  project_id: string;
  due_date: string;
  status: string;
  priority: number;
};

const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({ open, onOpenChange, task }) => {
  const { updateTask } = useTasks();
  const { register, control, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>({
    values: {
      name: task?.name || '',
      description: task?.description || '',
      project_id: task?.project_id || '',
      due_date: task?.end_date ? new Date(task.end_date).toISOString().split('T')[0] : '',
      status: task?.status || 'pending',
      priority: task?.priority || 2,
    }
  });

  const { customFieldValues, loading: customFieldsLoading } = useCustomFieldValues(task?.id);
  const [isEditing, setIsEditing] = useState(false);

  const onSubmit = async (data: FormData) => {
    if (!task) return;

    try {
      await updateTask({
        id: task.id,
        name: data.name,
        description: data.description,
        end_date: data.due_date,
        status: data.status,
        priority: data.priority,
      });
      toast.success('Zadanie zaktualizowane pomyślnie!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Wystąpił błąd podczas aktualizacji zadania.');
      console.error(error);
    }
  };

  if (!task) {
    return null;
  }

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1: return <Badge variant="outline" className="text-green-400 border-green-400/50">Niski</Badge>;
      case 2: return <Badge variant="outline" className="text-blue-400 border-blue-400/50">Średni</Badge>;
      case 3: return <Badge variant="outline" className="text-orange-400 border-orange-400/50">Wysoki</Badge>;
      case 4: return <Badge variant="outline" className="text-red-400 border-red-400/50">Pilny</Badge>;
      default: return <Badge variant="secondary">Brak</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-gray-400/20 text-gray-200">Oczekujące</Badge>;
      case 'in_progress': return <Badge className="bg-blue-400/20 text-blue-300">W toku</Badge>;
      case 'completed': return <Badge className="bg-green-400/20 text-green-300">Ukończone</Badge>;
      case 'blocked': return <Badge className="bg-red-400/20 text-red-300">Zablokowane</Badge>;
      default: return <Badge variant="secondary">Brak</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphic-card backdrop-blur-xl bg-slate-900/80 border border-slate-700 shadow-2xl max-w-4xl text-white">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">{isEditing ? 'Edytuj zadanie' : task.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className="text-slate-400 hover:text-white hover:bg-slate-700">
              {isEditing ? <X className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
              <span className="sr-only">{isEditing ? 'Anuluj edycję' : 'Edytuj'}</span>
            </Button>
          </div>
          <DialogDescription>
            Przeglądaj i zarządzaj szczegółami zadania.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="border-b border-slate-700">
              <TabsTrigger value="details">Szczegóły</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="reminders">Przypomnienia</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-slate-400">Tytuł zadania</Label>
                    {isEditing ? (
                      <Input id="name" {...register('name')} className="mt-1 bg-slate-800 border-slate-600" />
                    ) : (
                      <p className="mt-1 text-lg">{task.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-slate-400">Opis</Label>
                    {isEditing ? (
                      <Textarea id="description" {...register('description')} className="mt-1 min-h-[120px] bg-slate-800 border-slate-600" />
                    ) : (
                      <div className="mt-1 p-3 rounded-md bg-slate-800/50 border border-slate-700 min-h-[120px]">
                        {task.description || <span className="text-slate-500">Brak opisu</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-slate-400">Status</Label>
                    {isEditing ? (
                      <Select onValueChange={(value) => setValue('status', value)} defaultValue={task.status}>
                        <SelectTrigger className="mt-1 bg-slate-800 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 text-white">
                          <SelectItem value="pending">Oczekujące</SelectItem>
                          <SelectItem value="in_progress">W toku</SelectItem>
                          <SelectItem value="completed">Ukończone</SelectItem>
                          <SelectItem value="blocked">Zablokowane</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">{getStatusBadge(task.status)}</div>
                    )}
                  </div>
                   <div>
                    <Label className="text-sm font-medium text-slate-400">Priorytet</Label>
                    {isEditing ? (
                      <Select onValueChange={(value) => setValue('priority', parseInt(value))} defaultValue={String(task.priority)}>
                        <SelectTrigger className="mt-1 bg-slate-800 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 text-white">
                          <SelectItem value="1">Niski</SelectItem>
                          <SelectItem value="2">Średni</SelectItem>
                          <SelectItem value="3">Wysoki</SelectItem>
                          <SelectItem value="4">Pilny</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">{getPriorityBadge(task.priority)}</div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="due_date" className="text-sm font-medium text-slate-400 flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2" /> Termin wykonania
                    </Label>
                    {isEditing ? (
                      <Input id="due_date" type="date" {...register('due_date')} className="mt-1 bg-slate-800 border-slate-600" />
                    ) : (
                      <p className="mt-1">{task.end_date ? new Date(task.end_date).toLocaleDateString('pl-PL') : 'Brak'}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-700 text-xs text-slate-500 flex justify-between">
                <span>Utworzono: {new Date(task.created_at).toLocaleString('pl-PL')}</span>
                <span>Ostatnia aktualizacja: {new Date(task.updated_at).toLocaleString('pl-PL')}</span>
              </div>
            </TabsContent>
            <TabsContent value="checklist">
              <ComingSoon />
            </TabsContent>
            <TabsContent value="reminders">
              <ComingSoon />
            </TabsContent>
          </Tabs>

          {isEditing && (
            <div className="flex justify-end space-x-4 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="hover:bg-slate-700">Anuluj</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Zapisz zmiany</Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
