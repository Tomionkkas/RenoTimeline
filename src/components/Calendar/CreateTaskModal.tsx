import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { Calendar, Clock, FileText, Target, User, AlertTriangle, CheckCircle, CalendarDays } from 'lucide-react';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
  projectId?: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  open, 
  onOpenChange, 
  selectedDate,
  projectId 
}) => {
  const { createTask } = useTasks(projectId);
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: projectId || '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done',
    due_date: selectedDate || '',
    start_date: selectedDate || '',
    start_time: '',
    end_time: '',
    is_all_day: true,
    estimated_hours: ''
  });

  const priorityOptions = [
    { value: 'low', label: 'Niski', icon: CheckCircle, color: 'text-green-400' },
    { value: 'medium', label: 'Średni', icon: Target, color: 'text-blue-400' },
    { value: 'high', label: 'Wysoki', icon: AlertTriangle, color: 'text-orange-400' },
    { value: 'urgent', label: 'Pilny', icon: AlertTriangle, color: 'text-red-400' }
  ];

  const statusOptions = [
    { value: 'todo', label: 'Do zrobienia', color: 'text-gray-400' },
    { value: 'in_progress', label: 'W toku', color: 'text-blue-400' },
    { value: 'review', label: 'Do przeglądu', color: 'text-yellow-400' },
    { value: 'done', label: 'Ukończone', color: 'text-green-400' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Tytuł zadania jest wymagany');
      return;
    }
    if (!formData.project_id) {
      toast.error('Wybór projektu jest wymagany');
      return;
    }

    setLoading(true);
    try {
      await createTask({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        project_id: formData.project_id,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        assigned_to: null,
        start_date: formData.start_date || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        is_all_day: formData.is_all_day
      });
      
      toast.success('Zadanie zostało utworzone pomyślnie!');
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        project_id: projectId || '',
        priority: 'medium',
        status: 'todo',
        due_date: selectedDate || '',
        start_date: selectedDate || '',
        start_time: '',
        end_time: '',
        is_all_day: true,
        estimated_hours: ''
      });
    } catch (error) {
      toast.error('Nie udało się utworzyć zadania');
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
              <CalendarDays className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Nowe zadanie w kalendarzu</DialogTitle>
              <DialogDescription className="text-white/60 text-base">
                Utwórz nowe zadanie z harmonogramem czasowym
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-white/80 font-medium flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span>Tytuł zadania *</span>
            </Label>
            <Input
              id="title"
              placeholder="np. Spotkanie z klientem, Montaż armatury..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
              required
            />
          </div>

          {/* Project Selection */}
          <div className="space-y-3">
            <Label htmlFor="project" className="text-white/80 font-medium flex items-center space-x-2">
              <User className="h-4 w-4 text-purple-400" />
              <span>Projekt *</span>
            </Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl h-12">
                <SelectValue placeholder="Wybierz projekt" />
              </SelectTrigger>
              <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="text-white hover:bg-white/20">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-white/80 font-medium">
              Opis zadania
            </Label>
            <Textarea
              id="description"
              placeholder="Szczegółowy opis zadania, lokalizacja, uwagi..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl min-h-[100px] resize-none"
              rows={4}
            />
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-white/80 font-medium flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <span>Priorytet</span>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/20">
                      <div className="flex items-center space-x-2">
                        <option.icon className={`h-4 w-4 ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label className="text-white/80 font-medium flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Status</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'todo' | 'in_progress' | 'review' | 'done') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/20">
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time Settings */}
          <div className="space-y-4">
            <Label className="text-white/80 font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              <span>Harmonogram czasowy</span>
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="start_date" className="text-white/60 text-sm">
                  Data rozpoczęcia
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="due_date" className="text-white/60 text-sm">
                  Data zakończenia
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <Label htmlFor="start_time" className="text-white/60 text-sm">
                  Godzina rozpoczęcia
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="end_time" className="text-white/60 text-sm">
                  Godzina zakończenia
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="estimated_hours" className="text-white/60 text-sm flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span>Szacowane godziny</span>
                </Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  placeholder="0.0"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-xl px-6 py-3 transition-all duration-300"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.project_id}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Tworzenie...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>Utwórz zadanie</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal; 