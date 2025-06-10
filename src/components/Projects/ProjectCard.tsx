import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, MoreHorizontal, Edit, Eye } from 'lucide-react';
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

  const formatBudget = (budget: string | undefined) => {
    if (!budget) return 'Not specified';
    return `${parseInt(budget).toLocaleString()} zł`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    return dateString;
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

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] group"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-xs">
                Aktywny
              </Badge>
            </div>
            <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
              {project.name}
            </CardTitle>
            {project.description && (
              <CardDescription className="mt-1">
                {project.description}
              </CardDescription>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleMenuClick}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCardClick}>
                <Eye className="mr-2 h-4 w-4" />
                View Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditClick}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

          {/* Creation date */}
          {project.created_at && (
            <div className="text-xs text-gray-500">
              Utworzony: {new Date(project.created_at).toLocaleDateString('pl-PL')}
            </div>
          )}

          {/* Action hint */}
          <div className="pt-2 border-t">
            <p className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">
              Click to open project dashboard →
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard; 