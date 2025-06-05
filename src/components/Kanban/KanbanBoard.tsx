
import React, { useState } from 'react';
import { Plus, MoreHorizontal, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import CreateTaskDialog from './CreateTaskDialog';

const columns = [
  {
    id: 'todo' as const,
    title: 'Do zrobienia',
    color: 'bg-gray-400',
  },
  {
    id: 'in_progress' as const,
    title: 'W toku',
    color: 'bg-blue-400',
  },
  {
    id: 'review' as const,
    title: 'Do przeglądu',
    color: 'bg-yellow-400',
  },
  {
    id: 'done' as const,
    title: 'Ukończone',
    color: 'bg-green-400',
  },
];

const priorityColors = {
  urgent: 'border-l-red-600',
  high: 'border-l-red-400',
  medium: 'border-l-yellow-400',
  low: 'border-l-green-400',
};

const priorityLabels = {
  urgent: 'Pilne',
  high: 'Wysoki',
  medium: 'Średni',
  low: 'Niski',
};

const KanbanBoard: React.FC = () => {
  const { tasks, loading, updateTask } = useTasks();
  const { projects } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    try {
      await updateTask(taskId, { 
        status: newStatus as 'todo' | 'in_progress' | 'review' | 'done' 
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Tablica Kanban</h1>
          <p className="text-gray-400">Zarządzaj zadaniami zespołu</p>
        </div>
        <div className="flex items-center space-x-4">
          {projects.length > 0 && (
            <select 
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="">Wszystkie projekty</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nowe zadanie
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {columns.map((column, columnIndex) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div
              key={column.id}
              className="bg-card rounded-xl border border-gray-800 p-4 animate-fade-in"
              style={{ animationDelay: `${columnIndex * 100}ms` }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                  <h3 className="font-semibold text-white">{column.title}</h3>
                  <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                <button className="p-1 hover:bg-gray-700 rounded">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {columnTasks.map((task, taskIndex) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className={`p-3 bg-gray-800 rounded-lg border-l-4 ${priorityColors[task.priority]} hover:bg-gray-700 transition-colors cursor-move animate-fade-in`}
                    style={{ animationDelay: `${(columnIndex * 100) + (taskIndex * 50)}ms` }}
                  >
                    <h4 className="text-white text-sm font-medium mb-2">{task.title}</h4>
                    {task.description && (
                      <p className="text-gray-400 text-xs mb-2 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {task.assigned_to ? (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-400" />
                          </div>
                        )}
                        {task.due_date && (
                          <span className="text-xs text-gray-400">
                            {new Date(task.due_date).toLocaleDateString('pl-PL')}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          task.priority === 'urgent' ? 'border-red-400 text-red-400' :
                          task.priority === 'high' ? 'border-red-400 text-red-400' :
                          task.priority === 'medium' ? 'border-yellow-400 text-yellow-400' :
                          'border-green-400 text-green-400'
                        }`}
                      >
                        {priorityLabels[task.priority]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowCreateDialog(true)}
                className="w-full p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Dodaj zadanie</span>
              </button>
            </div>
          );
        })}
      </div>

      <CreateTaskDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        projects={projects}
      />
    </div>
  );
};

export default KanbanBoard;
