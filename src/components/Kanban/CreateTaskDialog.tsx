import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTeam } from '@/hooks/useTeam';
import { useTaskAssignments } from '@/hooks/useTaskAssignments';
import { toast } from 'sonner';
import { Calendar, Clock, FileText, Target, User, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { Task } from '@/hooks/useTasks';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
  defaultStatus?: Task['status'];
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ open, onOpenChange, projects, defaultStatus }) => {
  const { createTask } = useTasks();
  const { teamMembers } = useTeam();
  const [loading, setLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]); // stores team_member IDs
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    priority: 2, // Default to Medium
    status: defaultStatus || 'pending' as Task['status'],
    end_date: '', // Was due_date
    estimated_duration_days: '',
  });

  React.useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        status: defaultStatus || 'pending'
      }));
    }
    // Reset selected members when dialog opens/closes
    setSelectedMembers([]);
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

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

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
      // Create the task first
      const newTask = await createTask({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        project_id: formData.project_id,
        priority: formData.priority,
        status: formData.status,
        end_date: formData.end_date || null,
        estimated_duration_days: formData.estimated_duration_days ? parseFloat(formData.estimated_duration_days) : null,
        assigned_to: selectedMembers.length > 0 ? selectedMembers[0] : null,
        start_date: null,
      });

      // Create task assignments if members were selected
      if (selectedMembers.length > 0 && newTask?.id) {
        const { renotimelineClient } = await import('@/integrations/supabase/client');

        const assignmentsToCreate = selectedMembers.map((teamMemberId, index) => ({
          task_id: newTask.id,
          team_member_id: teamMemberId,
          assignment_order: index + 1,
        }));

        const { error: assignmentError } = await renotimelineClient
          .from('task_assignments')
          .insert(assignmentsToCreate);

        if (assignmentError) {
          console.error('Error creating assignments:', assignmentError);
          toast.error('Zadanie utworzone, ale błąd przy przypisywaniu członków zespołu');
        }
      }

      toast.success('Zadanie zostało utworzone pomyślnie!');
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        project_id: '',
        priority: 2,
        status: 'pending',
        end_date: '',
        estimated_duration_days: '',
      });
      setSelectedMembers([]);
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

          {/* Team Member Assignment */}
          <div className="space-y-3">
            <Label className="text-white/80 font-medium flex items-center space-x-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span>Przypisz członków zespołu (opcjonalne)</span>
            </Label>
            <div className="text-xs text-white/60 mb-2">
              Zaznacz członków zespołu ({selectedMembers.length} wybrano)
            </div>

            {teamMembers.length === 0 ? (
              <p className="text-sm text-white/50">Brak członków zespołu w tym projekcie</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {teamMembers.map((member) => {
                  const isSelected = selectedMembers.includes(member.id);
                  const selectedIndex = selectedMembers.indexOf(member.id);

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white/10 border-white/30 hover:bg-white/15'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => handleMemberToggle(member.id)}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/30 bg-transparent'
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
                      <User className={`h-4 w-4 ${isSelected ? 'text-blue-400' : 'text-white/40'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-white/70'}`}>
                          {member.first_name} {member.last_name}
                        </p>
                        {member.expertise && (
                          <p className={`text-xs truncate ${isSelected ? 'text-white/60' : 'text-white/50'}`}>
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
