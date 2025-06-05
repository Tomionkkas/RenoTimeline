
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTasks } from '@/hooks/useTasks';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ open, onOpenChange, projects }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done',
    due_date: '',
    estimated_hours: ''
  });
  
  // Nowe pola dla checklist i przypomnień
  const [checklistItems, setChecklistItems] = useState<string[]>(['']);
  const [createReminder, setCreateReminder] = useState(false);
  const [reminderData, setReminderData] = useState({
    reminder_time: '',
    reminder_type: 'notification' as 'email' | 'notification' | 'both',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createTask } = useTasks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Tytuł zadania jest wymagany');
      return;
    }

    if (!formData.project_id) {
      toast.error('Wybierz projekt');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        project_id: formData.project_id,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || undefined,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : undefined
      };

      const newTask = await createTask(taskData);
      
      if (newTask) {
        // TODO: Dodaj obsługę tworzenia checklisty i przypomnień po utworzeniu zadania
        // To wymagałoby importu odpowiednich hooków tutaj
        
        toast.success('Zadanie zostało utworzone pomyślnie!');
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        project_id: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
        estimated_hours: ''
      });
      setChecklistItems(['']);
      setCreateReminder(false);
      setReminderData({
        reminder_time: '',
        reminder_type: 'notification',
        message: ''
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Nie udało się utworzyć zadania');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addChecklistItem = () => {
    setChecklistItems(prev => [...prev, '']);
  };

  const updateChecklistItem = (index: number, value: string) => {
    setChecklistItems(prev => prev.map((item, i) => i === index ? value : item));
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nowe zadanie</DialogTitle>
          <DialogDescription>
            Utwórz nowe zadanie w projekcie
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tytuł zadania *</Label>
            <Input
              id="title"
              placeholder="np. Zdemontować starą armaturę"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_id">Projekt *</Label>
            <Select value={formData.project_id} onValueChange={(value) => handleInputChange('project_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz projekt" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              placeholder="Opisz zadanie..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorytet</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
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
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Termin wykonania</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Szacowane godziny</Label>
              <Input
                id="estimated_hours"
                type="number"
                placeholder="0"
                value={formData.estimated_hours}
                onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Sekcja checklist - uproszczona */}
          <div className="space-y-2">
            <Label>Checklist początkowy (opcjonalny)</Label>
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder={`Element checklist ${index + 1}...`}
                    value={item}
                    onChange={(e) => updateChecklistItem(index, e.target.value)}
                  />
                  {checklistItems.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeChecklistItem(index)}
                    >
                      Usuń
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChecklistItem}
              >
                Dodaj element
              </Button>
            </div>
          </div>

          {/* Sekcja przypomnienia - uproszczona */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create_reminder"
                checked={createReminder}
                onCheckedChange={(checked) => setCreateReminder(!!checked)}
              />
              <Label htmlFor="create_reminder">Dodaj przypomnienie</Label>
            </div>
            
            {createReminder && (
              <div className="space-y-2 pl-6 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="datetime-local"
                    value={reminderData.reminder_time}
                    onChange={(e) => setReminderData(prev => ({ ...prev, reminder_time: e.target.value }))}
                    placeholder="Kiedy przypomnieć?"
                  />
                  <Select 
                    value={reminderData.reminder_type} 
                    onValueChange={(value) => setReminderData(prev => ({ ...prev, reminder_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notification">Powiadomienie</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="both">Oba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Niestandardowa wiadomość (opcjonalnie)..."
                  value={reminderData.message}
                  onChange={(e) => setReminderData(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Tworzenie...' : 'Utwórz zadanie'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
