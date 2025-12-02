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
import { Edit3, Users, Calendar, DollarSign, FileText, Settings } from 'lucide-react';
import { sharedClient } from '@/integrations/supabase/client';

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
  const { updateProject, assignMember, removeMember } = useProjects();
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
      
      const fetchAssignedMembers = async () => {
        const { data, error } = await sharedClient
          .from('user_roles')
          .select('user_id')
          .eq('project_id', project.id)
          .eq('app_name', 'renotimeline');

        if (error) {
          toast.error("Błąd podczas pobierania członków projektu.");
          console.error(error);
          return;
        }

        const initialAssigned = new Set(data.map(role => role.user_id));
        setAssignedMembers(initialAssigned);
      };

      fetchAssignedMembers();
    }
  }, [project]);

  const handleMemberToggle = async (profileId: string, isAssigned: boolean) => {
    if (!project) return;
    
    const newAssignedMembers = new Set(assignedMembers);
    try {
      if (isAssigned) {
        newAssignedMembers.delete(profileId);
        await removeMember({ projectId: project.id, profileId });
        toast.info("Usunięto członka z projektu.");
      } else {
        newAssignedMembers.add(profileId);
        await assignMember({ projectId: project.id, profileId, role: 'member' });
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
      <DialogContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Edit3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Edytuj projekt</DialogTitle>
              <DialogDescription className="text-white/60 text-base">
                Zaktualizuj szczegóły swojego projektu i zarządzaj zespołem.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <Label htmlFor="edit-name" className="text-white font-medium">Nazwa projektu *</Label>
              </div>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl"
              />
            </div>
            
            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <Label htmlFor="edit-description" className="text-white font-medium">Opis</Label>
              </div>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl resize-none"
              />
            </div>
            
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <Label htmlFor="edit-start_date" className="text-white font-medium">Data rozpoczęcia</Label>
                </div>
                <Input
                  id="edit-start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <Label htmlFor="edit-end_date" className="text-white font-medium">Data zakończenia</Label>
                </div>
                <Input
                  id="edit-end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30 rounded-xl"
                />
              </div>
            </div>
            
            {/* Budget */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <Label htmlFor="edit-budget" className="text-white font-medium">Budżet (zł)</Label>
              </div>
              <Input
                id="edit-budget"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                min="0"
                step="0.01"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 rounded-xl"
              />
            </div>
            
            {/* Team Members */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <Label className="text-white font-medium">Członkowie projektu</Label>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-48 overflow-y-auto">
                {teamLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin"></div>
                    <span className="ml-2 text-white/60">Ładowanie zespołu...</span>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 text-white/40" />
                    <p className="text-sm text-white/60">Brak członków w zespole. Dodaj ich w zakładce "Zespół".</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map(member => {
                      const isAssigned = assignedMembers.has(member.id);
                      return (
                        <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={isAssigned}
                            onCheckedChange={() => handleMemberToggle(member.id, isAssigned)}
                            className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                          />
                          <Avatar className="h-8 w-8 ring-2 ring-white/10">
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1">
                            <Label htmlFor={`member-${member.id}`} className="font-medium text-white cursor-pointer">
                              {member.name}
                            </Label>
                            <span className="text-xs text-white/60">{member.role}</span>
                          </div>
                          {isAssigned && (
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Fields Section */}
            <Separator className="bg-white/10" />
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <Label className="text-white font-medium">Pola niestandardowe</Label>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <CustomFieldsSection
                  entityType="project"
                  entityId={project?.id}
                  projectId={project?.id || ''}
                  control={customFieldForm.control}
                  setValue={customFieldForm.setValue}
                  errors={customFieldForm.formState.errors}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="pt-6 border-t border-white/10">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-xl"
          >
            Anuluj
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Zapisywanie...</span>
              </div>
            ) : (
              'Zapisz zmiany'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog; 