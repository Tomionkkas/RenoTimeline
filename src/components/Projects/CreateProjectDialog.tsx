import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { Calendar, DollarSign, FileText, Target } from 'lucide-react';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onOpenChange }) => {
  const { createProject } = useProjects();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nazwa projektu jest wymagana');
      return;
    }

    setLoading(true);
    try {
      await createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      });
      
      toast.success('Projekt został utworzony pomyślnie!');
      onOpenChange(false);
      setFormData({ name: '', description: '', start_date: '', end_date: '', budget: '' });
    } catch (error) {
      toast.error('Nie udało się utworzyć projektu');
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
              <Target className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Nowy projekt remontowy</DialogTitle>
              <DialogDescription className="text-white/60 text-base">
                Utwórz nowy projekt i zacznij planowanie remontu
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-white/80 font-medium flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span>Nazwa projektu *</span>
            </Label>
            <Input
              id="name"
              placeholder="np. Remont łazienki, Renowacja kuchni..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
              required
            />
          </div>

          {/* Project Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-white/80 font-medium">
              Opis projektu
            </Label>
            <Textarea
              id="description"
              placeholder="Krótki opis projektu, cele, wymagania..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl min-h-[100px] resize-none"
              rows={4}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="start_date" className="text-white/80 font-medium flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-400" />
                <span>Data rozpoczęcia</span>
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
              <Label htmlFor="end_date" className="text-white/80 font-medium flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-red-400" />
                <span>Data zakończenia</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-3">
            <Label htmlFor="budget" className="text-white/80 font-medium flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              <span>Budżet (zł)</span>
            </Label>
            <Input
              id="budget"
              type="number"
              placeholder="0.00"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl h-12"
              min="0"
              step="0.01"
            />
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
              disabled={loading || !formData.name.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Tworzenie...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Utwórz projekt</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
