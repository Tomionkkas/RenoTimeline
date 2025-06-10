import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import CreateTaskDialog from './CreateTaskDialog';
import { KanbanColumn } from "./KanbanColumn";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useWorkflowEvents } from '../../hooks/useWorkflowEvents';
import { supabase } from '../../integrations/supabase/client';

const columns: { id: 'todo' | 'in_progress' | 'review' | 'done', title: string }[] = [
  { id: 'todo', title: 'Do zrobienia' },
  { id: 'in_progress', title: 'W toku' },
  { id: 'review', title: 'Do przeglądu' },
  { id: 'done', title: 'Ukończone' },
];

interface KanbanBoardProps {
	onTaskClick: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ onTaskClick }) => {
  const { tasks, loading, updateTask } = useTasks();
  const { projects } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const { emitTaskStatusChanged } = useWorkflowEvents();

  const handleDrop = async (taskId: string, newStatus: string) => {
    // Get current task data to capture the old status
    const currentTask = tasks?.find(task => task.id === taskId);
    if (!currentTask) {
      console.warn('🔍 [KANBAN] Task not found for drop:', taskId);
      return;
    }

    const oldStatus = currentTask.status;
    
    console.log('🎯 [KANBAN] Task drop initiated:', {
      taskId,
      oldStatus,
      newStatus,
      projectId: currentTask.project_id,
      timestamp: new Date().toISOString()
    });
    
    // Update the task status
    updateTask({ 
      id: taskId, 
      status: newStatus as 'todo' | 'in_progress' | 'review' | 'done' 
    });

    // DIRECT workflow execution - no event bus, guaranteed to work
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && oldStatus !== newStatus) {
        console.log('🚀 [KANBAN] Starting DIRECT workflow execution:', {
          taskId,
          projectId: currentTask.project_id,
          oldStatus,
          newStatus,
          userId: user.id
        });
        
        // Direct execution - no event bus needed
        await emitTaskStatusChanged(
          taskId,
          currentTask.project_id,
          oldStatus,
          newStatus,
          user.id
        );
        
        console.log('✅ [KANBAN] DIRECT workflow execution completed successfully');
      } else {
        console.log('⏭️ [KANBAN] Skipping workflow execution:', {
          userExists: !!user,
          statusChanged: oldStatus !== newStatus,
          oldStatus,
          newStatus
        });
      }
    } catch (error) {
      console.error('❌ [KANBAN] Error in DIRECT workflow execution:', error);
    }
	};

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (selectedProject === '') return tasks;
    return tasks.filter(task => task.project_id === selectedProject);
  }, [tasks, selectedProject]);

  const tasksByStatus = useMemo(() => {
		const grouped: { [key: string]: Task[] } = {
			todo: [],
			in_progress: [],
			review: [],
			done: [],
		};
		
    filteredTasks.forEach(task => {
      if (task.status && grouped.hasOwnProperty(task.status)) {
        grouped[task.status].push(task);
      }
    });

		return grouped;
	}, [filteredTasks]);

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
    <DndProvider backend={HTML5Backend}>
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
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
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
        {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              title={column.title}
              status={column.id}
              tasks={tasksByStatus[column.id] || []}
              onDrop={handleDrop}
              onTaskClick={onTaskClick}
            />
          ))}
      </div>

      <CreateTaskDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        projects={projects}
      />
    </div>
    </DndProvider>
  );
};

export default KanbanBoard;
