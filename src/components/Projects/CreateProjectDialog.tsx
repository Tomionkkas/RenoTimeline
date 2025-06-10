import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProject } = useProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nazwa projektu jest wymagana');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null
      };

      await createProject(projectData);
      
      toast.success('Projekt został utworzony pomyślnie!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        budget: ''
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Nie udało się utworzyć projektu');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nowy projekt remontowy</DialogTitle>
          <DialogDescription>
            Utwórz nowy projekt i zacznij planowanie remontu
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nazwa projektu *</Label>
            <Input
              id="name"
              placeholder="np. Remont łazienki"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              placeholder="Opisz projekt remontowy..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data rozpoczęcia</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_date">Data zakończenia</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="budget">Budżet (zł)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="0"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Tworzenie...' : 'Utwórz projekt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
