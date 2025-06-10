import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useProjects, Project } from '@/hooks/useProjects';
import { useTeam } from '@/hooks/useTeam';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { CustomFieldsSection } from '@/components/ui/CustomFieldsSection';

interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ project, open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateProject, assignMemberToProject, removeMemberFromProject } = useProjects();
  const { teamMembers, loading: teamLoading } = useTeam();
  const [assignedMembers, setAssignedMembers] = useState<Set<string>>(new Set());

  // React Hook Form for custom fields
  const customFieldForm = useForm({
    defaultValues: {}
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
        end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
        budget: project.budget?.toString() || ''
      });
      
      const initialAssigned = new Set(
        project.project_assignments?.map(a => a.profiles?.id).filter(Boolean) as string[]
      );
      setAssignedMembers(initialAssigned);

    }
  }, [project]);

  const handleMemberToggle = async (profileId: string, isAssigned: boolean) => {
    if (!project) return;
    
    const newAssignedMembers = new Set(assignedMembers);
    try {
      if (isAssigned) {
        newAssignedMembers.delete(profileId);
        await removeMemberFromProject({ projectId: project.id, profileId });
        toast.info("Usunięto członka z projektu.");
      } else {
        newAssignedMembers.add(profileId);
        await assignMemberToProject({ projectId: project.id, profileId });
        toast.success("Dodano członka do projektu.");
      }
      setAssignedMembers(newAssignedMembers);
    } catch (error) {
      toast.error("Wystąpił błąd podczas zmiany przypisania.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    if (!formData.name.trim()) {
      toast.error('Nazwa projektu jest wymagana');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const projectData = {
        id: project.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      };

      await updateProject(projectData);
      
      toast.success('Projekt został zaktualizowany!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Nie udało się zaktualizować projektu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj projekt</DialogTitle>
          <DialogDescription>
            Zaktualizuj szczegóły swojego projektu i zarządzaj zespołem.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nazwa projektu *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-description">Opis</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start_date">Data rozpoczęcia</Label>
              <Input
                id="edit-start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-end_date">Data zakończenia</Label>
              <Input
                id="edit-end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-budget">Budżet (zł)</Label>
            <Input
              id="edit-budget"
              type="number"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Członkowie projektu</Label>
            <ScrollArea className="h-40 w-full rounded-md border p-4">
              {teamLoading ? (
                 <p>Ładowanie zespołu...</p>
              ) : teamMembers.length === 0 ? (
                <p className="text-sm text-gray-500">Brak członków w zespole. Dodaj ich w zakładce "Zespół".</p>
              ) : (
                <div className="space-y-2">
                {teamMembers.map(member => {
                  const isAssigned = assignedMembers.has(member.id);
                  return (
                    <div key={member.id} className="flex items-center space-x-3">
                       <Checkbox
                        id={`member-${member.id}`}
                        checked={isAssigned}
                        onCheckedChange={() => handleMemberToggle(member.id, isAssigned)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{member.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Label htmlFor={`member-${member.id}`} className="font-normal cursor-pointer">
                          {member.name}
                        </Label>
                         <span className="text-xs text-gray-400">{member.role}</span>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Custom Fields Section */}
          <Separator />
          <div className="space-y-2">
            <Label>Pola niestandardowe</Label>
            <CustomFieldsSection
              entityType="project"
              entityId={project?.id}
              projectId={project?.id || ''}
              control={customFieldForm.control}
              setValue={customFieldForm.setValue}
              errors={customFieldForm.formState.errors}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog; 