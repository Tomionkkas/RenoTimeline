
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, DollarSign, MoreHorizontal } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import CreateProjectDialog from './CreateProjectDialog';

const ProjectsList: React.FC = () => {
  const { projects, loading, error } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Błąd: {error}</p>
      </div>
    );
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'on_hold':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'Aktywny';
      case 'on_hold':
        return 'Wstrzymany';
      case 'completed':
        return 'Ukończony';
      default:
        return 'Nieznany';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Projekty</h1>
          <p className="text-gray-400">Zarządzaj swoimi projektami remontowymi</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nowy projekt
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Brak projektów</h3>
              <p>Zacznij od utworzenia swojego pierwszego projektu remontowego</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Utwórz pierwszy projekt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <Card 
              key={project.id} 
              className="hover:border-gray-600 transition-all duration-200 animate-fade-in cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`}></div>
                    <Badge variant="outline">{getStatusLabel(project.status)}</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description || 'Brak opisu'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.budget && (
                    <div className="flex items-center text-sm text-gray-400">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>Budżet: {project.budget.toLocaleString()} zł</span>
                    </div>
                  )}
                  {project.end_date && (
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Do: {new Date(project.end_date).toLocaleDateString('pl-PL')}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    <span>1 członek</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Utworzony: {new Date(project.created_at).toLocaleDateString('pl-PL')}</span>
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
    </div>
  );
};

export default ProjectsList;
