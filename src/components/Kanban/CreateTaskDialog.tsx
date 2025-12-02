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
import { Calendar, Clock, FileText, Target, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { Task } from '@/hooks/useTasks';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
  defaultStatus?: Task['status'];
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ open, onOpenChange, projects, defaultStatus }) => {
  const { createTask } = useTasks();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    priority: 2, // Default to Medium
    status: defaultStatus || 'pending' as Task['status'],
    end_date: '', // Was due_date
    estimated_duration_days: ''
  });

  React.useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        status: defaultStatus || 'pending'
      }));
    }
  }, [open, defaultStatus]);

  const priorityOptions = [
    { value: 1, label: 'Niski', icon: CheckCircle, color: 'text-green-400' },
    { value: 2, label: 'Średni', icon: Target, color: 'text-blue-400' },
    { value: 3, label: 'Wysoki', icon: AlertTriangle, color: 'text-orange-400' },
    { value: 4, label: 'Pilny', icon: AlertTriangle, color: 'text-red-400' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Oczekujące', color: 'text-gray-400' },
    { value: 'in_progress', label: 'W toku', color: 'text-blue-400' },
    { value: 'completed', label: 'Ukończone', color: 'text-green-400' },
    { value: 'blocked', label: 'Zablokowane', color: 'text-red-400' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nazwa zadania jest wymagana');
      return;
    }
    if (!formData.project_id) {
      toast.error('Wybór projektu jest wymagany');
      return;
    }

    setLoading(true);
    try {
      await createTask({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        project_id: formData.project_id,
        priority: formData.priority,
        status: formData.status,
        end_date: formData.end_date || null,
        estimated_duration_days: formData.estimated_duration_days ? parseFloat(formData.estimated_duration_days) : null,
        assigned_to: null,
        start_date: null,
      });
      
      toast.success('Zadanie zostało utworzone pomyślnie!');
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        project_id: '',
        priority: 2,
        status: 'pending',
        end_date: '',
        estimated_duration_days: ''
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
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl border border-green-500/30">
              <Target className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Nowe zadanie</DialogTitle>
              <DialogDescription className="text-white/60 text-base">
                Utwórz nowe zadanie w projekcie
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-white/80 font-medium flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span>Nazwa zadania *</span>
            </Label>
            <Input
              id="name"
              placeholder="np. Zdemontować starą armaturę, Przygotować podłoże..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              placeholder="Szczegółowy opis zadania, wymagania, uwagi..."
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
                value={String(formData.priority)}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, priority: parseInt(value, 10) })
                }
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)} className="text-white hover:bg-white/20">
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
                onValueChange={(value: Task['status']) => 
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

          {/* Due Date and Estimated Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="end_date" className="text-white/80 font-medium flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-red-400" />
                <span>Termin wykonania</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="estimated_duration_days" className="text-white/80 font-medium flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span>Szacowana liczba dni</span>
              </Label>
              <Input
                id="estimated_duration_days"
                type="number"
                placeholder="0"
                value={formData.estimated_duration_days}
                onChange={(e) => setFormData({ ...formData, estimated_duration_days: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
                min="0"
                step="1"
              />
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
              disabled={loading || !formData.name.trim() || !formData.project_id}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Tworzenie...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
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

export default CreateTaskDialog;
