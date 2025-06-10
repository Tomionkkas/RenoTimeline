import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, MoreHorizontal, Edit, Eye, ExternalLink, ArrowUpRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    budget?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    created_at?: string;
    source_app?: string;
    calcreno_reference_url?: string;
    imported_at?: string;
  };
  onEdit?: (project: any) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Navigate to project dashboard with project ID
    const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/project/${projectSlug}`, { state: { projectId: project.id } });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    if (onEdit) {
      onEdit(project);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
  };

  const formatBudget = (budget: number | null): string => {
    if (!budget) return 'Nie określono';
    return `${budget.toLocaleString()} zł`;
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'Nie określono';
    return new Date(date).toLocaleDateString('pl-PL');
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'aktywny':
      case 'active':
        return 'default';
      case 'completed':
      case 'ukończony':
        return 'secondary';
      case 'on-hold':
      case 'wstrzymany':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const isCalcRenoProject = project.source_app === 'calcreno';

  const handleCalcRenoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.calcreno_reference_url) {
      window.open(project.calcreno_reference_url, '_blank');
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] group border-gray-200 hover:border-blue-300"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
              {project.name}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600 line-clamp-2">
              {project.description || "Brak opisu"}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {project.status || 'Aktywny'}
            </Badge>
            {isCalcRenoProject && (
              <div className="flex items-center gap-1">
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors"
                >
                  📊 CalcReno
                </Badge>
                {project.calcreno_reference_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCalcRenoClick}
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                    title="Otwórz w CalcReno"
                  >
                    <ExternalLink className="h-3 w-3 text-blue-600" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Budget */}
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Budżet:</span>
            <span className="font-medium">{formatBudget(project.budget)}</span>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Do:</span>
            <span className="font-medium">{formatDate(project.end_date)}</span>
          </div>

          {/* CalcReno import info */}
          {isCalcRenoProject && project.imported_at && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <ArrowUpRight className="w-4 h-4" />
              <span>Zaimportowano: {new Date(project.imported_at).toLocaleDateString('pl-PL')}</span>
            </div>
          )}

          {/* Creation date */}
          {project.created_at && (
            <div className="text-xs text-gray-500">
              Utworzony: {new Date(project.created_at).toLocaleDateString('pl-PL')}
            </div>
          )}

          {/* Action hint */}
          <div className="pt-2 border-t">
            <p className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">
              {isCalcRenoProject ? 'Projekt z CalcReno → Kliknij aby zarządzać harmonogramem' : 'Click to open project dashboard →'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard; 