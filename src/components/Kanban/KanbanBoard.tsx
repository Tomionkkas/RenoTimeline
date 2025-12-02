import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Settings, Inbox, Zap, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTeam } from '@/hooks/useTeam';
import CreateTaskDialog from './CreateTaskDialog';
import { KanbanColumn } from "./KanbanColumn";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useWorkflowEvents } from '../../hooks/useWorkflowEvents';
import { WorkflowTriggers } from '../../lib/workflow/WorkflowTriggers';
import { supabase } from '../../integrations/supabase/client';

// Corrected column definitions
const columns: {
  id: Task['status'];
  title: string;
  color: string;
  bgGradient: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'pending',
    title: 'Do zrobienia',
    color: 'text-slate-300',
    bgGradient: 'from-slate-500/20 to-slate-600/20',
    icon: Inbox,
  },
  {
    id: 'in_progress',
    title: 'W toku',
    color: 'text-blue-300',
    bgGradient: 'from-blue-500/20 to-blue-600/20',
    icon: Zap,
  },
  {
    id: 'completed',
    title: 'Ukończone',
    color: 'text-emerald-300',
    bgGradient: 'from-emerald-500/20 to-emerald-600/20',
    icon: CheckCircle2,
  },
  {
    id: 'blocked',
    title: 'Zablokowane',
    color: 'text-red-400',
    bgGradient: 'from-red-500/20 to-red-600/20',
    icon: AlertTriangle,
  },
];

interface KanbanBoardProps {
	onTaskClick: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ onTaskClick }) => {
  const { tasks, loading, updateTask } = useTasks();
  const { projects } = useProjects();
  const { teamMembers } = useTeam();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<Task['status'] | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const [hasError, setHasError] = useState(false);
  const { emitTaskStatusChanged } = useWorkflowEvents();

  // Error boundary effect
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Kanban Board Error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleShowCreateDialog = (status?: Task['status']) => {
    setDefaultStatus(status);
    setShowCreateDialog(true);
  };

  const handleDrop = async (taskId: string, newStatus: string) => {
    // Get current task data to capture the old status
    const currentTask = tasks?.find(task => task.id === taskId);
    if (!currentTask) {
      console.warn('🔍 [KANBAN] Task not found for drop:', taskId);
      return;
    }

    const oldStatus = currentTask.status;
    
          console.log('[KANBAN] Task drop initiated:', {
      taskId,
      oldStatus,
      newStatus,
      projectId: currentTask.project_id,
      timestamp: new Date().toISOString()
    });
    
    // Update the task status
    updateTask({ 
      id: taskId, 
      status: newStatus as 'pending' | 'in_progress' | 'completed' | 'blocked' 
    });

    // DIRECT workflow execution - no event bus, guaranteed to work
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && oldStatus !== newStatus) {
        console.log('[KANBAN] Starting DIRECT workflow execution:', {
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

        // 🧪 CalcReno Integration - trigger CalcReno notifications
        console.log('🧪 [KANBAN] Triggering CalcReno integration...');
        await WorkflowTriggers.onTaskStatusChanged(
          taskId,
          currentTask.project_id,
          oldStatus,
          newStatus,
          user.id
        );
        
        console.log('[KANBAN] DIRECT workflow execution completed successfully');
      } else {
        console.log('[KANBAN] Skipping workflow execution:', {
          userExists: !!user,
          statusChanged: oldStatus !== newStatus,
          oldStatus,
          newStatus
        });
      }
    } catch (error) {
              console.error('[KANBAN] Error in DIRECT workflow execution:', error);
    }
	};

  const filteredTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    let filtered = tasks;

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(task => task.project_id === selectedProject);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === parseInt(priorityFilter, 10));
    }

    // Assignee filter
    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(task => task.assigned_to === assigneeFilter);
    }

    return filtered;
  }, [tasks, selectedProject, searchQuery, priorityFilter, assigneeFilter]);

  const tasksByStatus = useMemo(() => {
    const grouped: { [key in Task['status']]: Task[] } = {
      pending: [],
      in_progress: [],
      completed: [],
      blocked: [],
    };
    for (const task of filteredTasks) {
      if (task && task.status && grouped.hasOwnProperty(task.status)) {
        grouped[task.status].push(task);
      }
    }
    return grouped;
  }, [filteredTasks]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const pending = tasksByStatus.pending.length;
    const inProgress = tasksByStatus.in_progress.length;
    const completed = tasksByStatus.completed.length;
    const blocked = tasksByStatus.blocked.length;
    return { total, pending, inProgress, completed, blocked };
  }, [filteredTasks, tasksByStatus]);

  // Safety check for projects
  const safeProjects = projects || [];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-gray-400">Ładowanie zadań...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error handling
  if (hasError || (!tasks && !loading)) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-red-400">Błąd podczas ładowania zadań</p>
            <Button onClick={() => {
              setHasError(false);
              window.location.reload();
            }}>
              Odśwież stronę
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Tablica Kanban
            </h1>
            <p className="text-gray-400 mt-1">Zarządzaj zadaniami zespołu efektywnie</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={() => handleShowCreateDialog()} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Nowe zadanie
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 p-4 rounded-xl border border-gray-700/50">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-gray-400 text-sm">Wszystkich zadań</div>
          </div>
          <div className="bg-gradient-to-r from-slate-700/30 to-slate-600/20 p-4 rounded-xl border border-slate-600/30">
            <div className="text-2xl font-bold text-slate-300">{stats.pending}</div>
            <div className="text-slate-400 text-sm">Do zrobienia</div>
          </div>
          <div className="bg-gradient-to-r from-blue-700/30 to-blue-600/20 p-4 rounded-xl border border-blue-600/30">
            <div className="text-2xl font-bold text-blue-300">{stats.inProgress}</div>
            <div className="text-blue-400 text-sm">W toku</div>
          </div>
          <div className="bg-gradient-to-r from-red-700/30 to-red-600/20 p-4 rounded-xl border border-red-600/30">
            <div className="text-2xl font-bold text-red-300">{stats.blocked}</div>
            <div className="text-red-400 text-sm">Po Terminie</div>
          </div>
          <div className="bg-gradient-to-r from-emerald-700/30 to-emerald-600/20 p-4 rounded-xl border border-emerald-600/30">
            <div className="text-2xl font-bold text-emerald-300">{stats.completed}</div>
            <div className="text-emerald-400 text-sm">Ukończone</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Szukaj zadań..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400"
            />
          </div>
          
          {safeProjects.length > 0 && (
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48 bg-gray-700/50 border-gray-600/50 text-white">
                <SelectValue placeholder="Wszystkie projekty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie projekty</SelectItem>
                {safeProjects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40 bg-gray-700/50 border-gray-600/50 text-white">
              <SelectValue placeholder="Priorytet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="1">Niski</SelectItem>
              <SelectItem value="2">Średni</SelectItem>
              <SelectItem value="3">Wysoki</SelectItem>
              <SelectItem value="4">Pilny</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-40 bg-gray-700/50 border-gray-600/50 text-white">
              <SelectValue placeholder="Przypisany" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszyscy</SelectItem>
              {teamMembers?.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchQuery || selectedProject !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedProject('all');
                setPriorityFilter('all');
                setAssigneeFilter('all');
              }}
              className="border-gray-600/50 text-gray-400 hover:bg-gray-700/50"
            >
              Wyczyść filtry
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              title={column.title}
              status={column.id}
              tasks={tasksByStatus[column.id] || []}
              onDrop={handleDrop}
              onTaskClick={onTaskClick}
              onAddTask={handleShowCreateDialog}
              color={column.color}
              bgGradient={column.bgGradient}
              icon={column.icon}
            />
          ))}
      </div>

      <CreateTaskDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        projects={safeProjects}
        defaultStatus={defaultStatus}
      />
    </div>
    </DndProvider>
  );
};

export default KanbanBoard;
