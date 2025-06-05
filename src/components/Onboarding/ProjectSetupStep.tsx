
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectSetupStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const ProjectSetupStep: React.FC<ProjectSetupStepProps> = ({ onComplete, onSkip }) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          description: description || null,
          budget: budget ? parseFloat(budget) : null,
          start_date: startDate || null,
          end_date: endDate || null,
          owner_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Projekt utworzony!',
        description: 'Twój pierwszy projekt remontowy został pomyślnie utworzony.',
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text">
            Stwórz swój pierwszy projekt 🏠
          </CardTitle>
          <p className="text-muted-foreground">
            Zacznij od utworzenia projektu remontowego
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nazwa projektu *</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="np. Remont kuchni"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Opis projektu</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Krótki opis zakresu remontu..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget">Budżet (PLN)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="50000"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data rozpoczęcia</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Planowane zakończenie</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 btn-primary"
                disabled={loading || !projectName}
              >
                {loading ? 'Tworzenie...' : 'Utwórz projekt'}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={onSkip}
                className="btn-secondary"
              >
                Pomiń
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectSetupStep;
