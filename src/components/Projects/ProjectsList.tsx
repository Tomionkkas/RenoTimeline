import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, DollarSign, MoreHorizontal, Edit, Trash2, Eye, FolderOpen } from 'lucide-react';
import { useProjects, Project } from '@/hooks/useProjects';
import CreateProjectDialog from './CreateProjectDialog';
import { DeleteProjectModal } from './DeleteProjectModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner';

// Status translation utility
const getStatusDisplay = (status: string | null | undefined) => {
  const statusMap: { [key: string]: { label: string; color: string; bgColor: string } } = {
    'in_progress': { 
      label: 'W trakcie', 
      color: 'text-blue-100', 
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600' 
    },
    'completed': { 
      label: 'Ukończony', 
      color: 'text-emerald-100', 
      bgColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
    },
    'pending': { 
      label: 'Oczekujący', 
      color: 'text-amber-100', 
      bgColor: 'bg-gradient-to-r from-amber-500 to-amber-600' 
    },
    'on_hold': { 
      label: 'Wstrzymany', 
      color: 'text-gray-100', 
      bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600' 
    },
    'cancelled': { 
      label: 'Anulowany', 
      color: 'text-red-100', 
      bgColor: 'bg-gradient-to-r from-red-500 to-red-600' 
    }
  };
  
  return statusMap[status || ''] || { 
    label: 'Aktywny', 
    color: 'text-emerald-100', 
    bgColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
  };
};

interface ProjectsListProps {
  onEditProject: (project: Project) => void;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ onEditProject }) => {
  const { projects, loading, error, deleteProject } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    project: Project | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    project: null,
    isDeleting: false
  });
  const navigate = useNavigate();

  const handleDelete = (project: Project) => {
    setDeleteModal({
      isOpen: true,
      project,
      isDeleting: false
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.project) return;
    
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      await deleteProject(deleteModal.project.id);
      toast.success('Projekt został usunięty pomyślnie.');
      setDeleteModal({
        isOpen: false,
        project: null,
        isDeleting: false
      });
    } catch (err) {
      toast.error('Nie udało się usunąć projektu.');
      console.error(err);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      project: null,
      isDeleting: false
    });
  };

  const handleProjectClick = (project: Project) => {
    // Navigate to project dashboard
    const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/project/${projectSlug}`, { state: { projectId: project.id, project } });
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="relative">
          <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-400">Błąd podczas ładowania projektów: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Projekty</h2>
          <p className="text-white/60 text-lg">Zarządzaj swoimi projektami remontowymi</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nowy projekt
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="text-center py-16">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <h3 className="text-xl font-semibold text-white mb-2">Brak projektów</h3>
            <p className="text-white/60 mb-6">Utwórz swój pierwszy projekt remontowy</p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Utwórz projekt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in cursor-pointer group"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleProjectClick(project)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="text-white/60 text-sm mt-2 line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                        onClick={handleMenuClick}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProject(project);
                        }}
                        className="text-white/80 hover:text-white hover:bg-white/20"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edytuj
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge 
                    className={`${getStatusDisplay(project.status).bgColor} ${getStatusDisplay(project.status).color} border-0 font-medium px-3 py-1 text-xs`}
                  >
                    {getStatusDisplay(project.status).label}
                  </Badge>
                  {project.imported_from_calcreno && (
                    <Badge 
                      variant="outline" 
                      className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs"
                    >
                      Import z CalcReno
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.budget && (
                    <div className="flex items-center text-sm text-white/70">
                      <DollarSign className="w-4 h-4 mr-2 text-emerald-400" />
                      <span>Budżet: {project.budget.toLocaleString()} zł</span>
                    </div>
                  )}
                  {project.end_date && (
                    <div className="flex items-center text-sm text-white/70">
                      <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                      <span>Do: {new Date(project.end_date).toLocaleDateString('pl-PL')}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Utworzony: {new Date(project.created_at).toLocaleDateString('pl-PL')}</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-blue-400 group-hover:text-blue-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Kliknij aby otworzyć projekt →
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <DeleteProjectModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        project={deleteModal.project}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
};

export default ProjectsList;
