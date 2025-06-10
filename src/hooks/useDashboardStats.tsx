import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDummyMode } from './useDummyMode';
import { useProjects } from './useProjects';
import { useTasks } from './useTasks';

interface ProductivityMetrics {
  timelinessScore: number;
  priorityEfficiency: number;
  consistencyScore: number;
  overallTrend: number;
}

interface DashboardStats {
  completedTasks: number;
  activeTasks: number;
  totalProjects: number;
  productivity: number;
  completedTasksChange: string;
  activeTasksChange: string;
  projectsChange: string;
  productivityChange: string;
  productivityMetrics?: ProductivityMetrics;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    completedTasks: 0,
    activeTasks: 0,
    totalProjects: 0,
    productivity: 0,
    completedTasksChange: '+0%',
    activeTasksChange: '+0',
    projectsChange: '+0',
    productivityChange: '+0%'
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isDummyMode } = useDummyMode();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  // Enhanced productivity calculation for dummy mode
  const calculateDummyProductivity = (tasks: any[]) => {
    if (tasks.length === 0) return { productivity: 0, metrics: null };

    const completedTasks = tasks.filter(t => t.status === 'done');
    const now = new Date();

    // 1. Timeliness Score (40% weight)
    let onTimeCompletions = 0;
    let totalCompletionsWithDueDate = 0;

    completedTasks.forEach(task => {
      if (task.due_date) {
        totalCompletionsWithDueDate++;
        const dueDate = new Date(task.due_date);
        const completedDate = new Date(task.updated_at || task.created_at);
        if (completedDate <= dueDate) {
          onTimeCompletions++;
        }
      }
    });

    const timelinessScore = totalCompletionsWithDueDate > 0 
      ? (onTimeCompletions / totalCompletionsWithDueDate) * 100 
      : 85; // Default good score if no due dates

    // 2. Priority Efficiency (30% weight)
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const completedHighPriority = completedTasks.filter(t => t.priority === 'high').length;
    const priorityEfficiency = highPriorityTasks.length > 0 
      ? (completedHighPriority / highPriorityTasks.length) * 100 
      : 80; // Default if no high priority tasks

    // 3. Consistency Score (20% weight)
    const recentTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= weekAgo;
    });
    
    const recentCompletions = recentTasks.filter(t => t.status === 'done').length;
    const consistencyScore = recentTasks.length > 0 
      ? Math.min((recentCompletions / Math.max(recentTasks.length * 0.7, 1)) * 100, 100)
      : 75; // Default consistency

    // 4. Overall Trend (10% weight)
    const overallTrend = 85; // Simulated positive trend

    // Calculate weighted productivity
    const productivity = Math.round(
      (timelinessScore * 0.4) + 
      (priorityEfficiency * 0.3) + 
      (consistencyScore * 0.2) + 
      (overallTrend * 0.1)
    );

    return {
      productivity: Math.min(Math.max(productivity, 0), 100),
      metrics: {
        timelinessScore: Math.round(timelinessScore),
        priorityEfficiency: Math.round(priorityEfficiency),
        consistencyScore: Math.round(consistencyScore),
        overallTrend: Math.round(overallTrend)
      }
    };
  };

  useEffect(() => {
    if (isDummyMode) {
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const activeTasks = tasks.filter(t => ['todo', 'in_progress', 'review'].includes(t.status)).length;
      
      const { productivity, metrics } = calculateDummyProductivity(tasks);

      setStats({
        completedTasks,
        activeTasks,
        totalProjects: projects.length,
        productivity,
        completedTasksChange: '+12%',
        activeTasksChange: '+3',
        projectsChange: '+2',
        productivityChange: '+5%',
        productivityMetrics: metrics
      });
      setLoading(false);
      return;
    }

    if (!user) {
      setStats({
        completedTasks: 0,
        activeTasks: 0,
        totalProjects: 0,
        productivity: 0,
        completedTasksChange: '+0%',
        activeTasksChange: '+0',
        projectsChange: '+0',
        productivityChange: '+0%'
      });
      setLoading(false);
      return;
    }

    fetchStats();
  }, [user, isDummyMode, projects, tasks]);

  const calculateAdvancedProductivity = async (allProjectIds: string[]) => {
    if (allProjectIds.length === 0) return { productivity: 0, metrics: null, previousProductivity: 0 };

    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get all tasks with detailed information
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .in('project_id', allProjectIds);

    if (!allTasks || allTasks.length === 0) {
      return { productivity: 0, metrics: null, previousProductivity: 0 };
    }

    const completedTasks = allTasks.filter(t => t.status === 'done');
    const lastWeekTasks = allTasks.filter(t => new Date(t.created_at) >= lastWeek);
    const twoWeeksAgoTasks = allTasks.filter(t => 
      new Date(t.created_at) >= twoWeeksAgo && new Date(t.created_at) < lastWeek
    );

    // 1. TIMELINESS SCORE (40% weight)
    let onTimeCompletions = 0;
    let totalCompletionsWithDueDate = 0;
    let overdueTasksPenalty = 0;

    completedTasks.forEach(task => {
      if (task.due_date) {
        totalCompletionsWithDueDate++;
        const dueDate = new Date(task.due_date);
        const completedDate = new Date(task.updated_at);
        if (completedDate <= dueDate) {
          onTimeCompletions++;
        }
      }
    });

    // Penalty for current overdue tasks
    const overdueTasks = allTasks.filter(task => {
      if (!task.due_date || task.status === 'done') return false;
      return new Date(task.due_date) < now;
    });
    overdueTasksPenalty = Math.min(overdueTasks.length * 5, 25); // Max 25% penalty

    const timelinessScore = Math.max(
      (totalCompletionsWithDueDate > 0 
        ? (onTimeCompletions / totalCompletionsWithDueDate) * 100 
        : 85) - overdueTasksPenalty,
      0
    );

    // 2. PRIORITY EFFICIENCY (30% weight)
    const highPriorityTasks = allTasks.filter(t => t.priority === 'high');
    const mediumPriorityTasks = allTasks.filter(t => t.priority === 'medium');
    const lowPriorityTasks = allTasks.filter(t => t.priority === 'low' || !t.priority);

    const completedHighPriority = completedTasks.filter(t => t.priority === 'high').length;
    const completedMediumPriority = completedTasks.filter(t => t.priority === 'medium').length;
    const completedLowPriority = completedTasks.filter(t => t.priority === 'low' || !t.priority).length;

    // Weighted priority score (high=3, medium=2, low=1)
    const totalPriorityPoints = (highPriorityTasks.length * 3) + (mediumPriorityTasks.length * 2) + (lowPriorityTasks.length * 1);
    const completedPriorityPoints = (completedHighPriority * 3) + (completedMediumPriority * 2) + (completedLowPriority * 1);

    const priorityEfficiency = totalPriorityPoints > 0 
      ? (completedPriorityPoints / totalPriorityPoints) * 100 
      : 80;

    // 3. CONSISTENCY SCORE (20% weight)
    const thisWeekCompletions = lastWeekTasks.filter(t => t.status === 'done').length;
    const lastWeekCompletions = twoWeeksAgoTasks.filter(t => t.status === 'done').length;
    
    // Calculate daily average completion rate
    const expectedDailyCompletions = Math.max(allTasks.length * 0.1 / 7, 0.5); // 10% of tasks per week
    const actualDailyCompletions = thisWeekCompletions / 7;
    
    const consistencyScore = Math.min((actualDailyCompletions / expectedDailyCompletions) * 100, 100);

    // 4. OVERALL TREND (10% weight)
    const trendMultiplier = lastWeekCompletions > 0 
      ? thisWeekCompletions / lastWeekCompletions 
      : (thisWeekCompletions > 0 ? 1.2 : 0.8);
    
    const overallTrend = Math.min(trendMultiplier * 80, 100);

    // Calculate weighted productivity
    const productivity = Math.round(
      (timelinessScore * 0.4) + 
      (priorityEfficiency * 0.3) + 
      (consistencyScore * 0.2) + 
      (overallTrend * 0.1)
    );

    // Calculate previous week productivity for comparison
    const previousWeekProductivity = Math.round(
      (timelinessScore * 0.4) + 
      (priorityEfficiency * 0.3) + 
      (Math.min((lastWeekCompletions / 7 / expectedDailyCompletions) * 100, 100) * 0.2) + 
      (75 * 0.1) // Base trend for previous week
    );

    return {
      productivity: Math.min(Math.max(productivity, 0), 100),
      previousProductivity: Math.min(Math.max(previousWeekProductivity, 0), 100),
      metrics: {
        timelinessScore: Math.round(timelinessScore),
        priorityEfficiency: Math.round(priorityEfficiency),
        consistencyScore: Math.round(consistencyScore),
        overallTrend: Math.round(overallTrend)
      }
    };
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Get current date ranges
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get user's project IDs first
      const { data: ownedProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user.id);

      const { data: assignments } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('profile_id', user.id);

      const ownedProjectIds = ownedProjects?.map(p => p.id) || [];
      const assignedProjectIds = assignments?.map(a => a.project_id) || [];
      const allProjectIds = [...new Set([...ownedProjectIds, ...assignedProjectIds])];

      // Current stats
      const currentProjects = allProjectIds.length;

      let currentCompletedTasks = 0;
      let currentActiveTasks = 0;
      let lastWeekCompletedTasks = 0;
      let lastWeekActiveTasks = 0;

      if (allProjectIds.length > 0) {
        // Current completed tasks
        const { data: completedTasksData } = await supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .in('project_id', allProjectIds)
          .eq('status', 'done');

        // Current active tasks
        const { data: activeTasksData } = await supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .in('project_id', allProjectIds)
          .in('status', ['todo', 'in_progress', 'review']);

        // Last week completed tasks (tasks completed in the last week)
        const { data: lastWeekCompletedData } = await supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .in('project_id', allProjectIds)
          .eq('status', 'done')
          .gte('updated_at', lastWeek.toISOString());

        // Tasks that were active last week (created before last week, not completed yet)
        const { data: lastWeekActiveData } = await supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .in('project_id', allProjectIds)
          .in('status', ['todo', 'in_progress', 'review'])
          .lte('created_at', lastWeek.toISOString());

        currentCompletedTasks = completedTasksData?.length || 0;
        currentActiveTasks = activeTasksData?.length || 0;
        lastWeekCompletedTasks = lastWeekCompletedData?.length || 0;
        lastWeekActiveTasks = lastWeekActiveData?.length || 0;
      }

      // Calculate advanced productivity
      const { productivity, previousProductivity, metrics } = await calculateAdvancedProductivity(allProjectIds);

      // Calculate changes
      const completedTasksChange = lastWeekCompletedTasks > 0 
        ? `+${lastWeekCompletedTasks}` 
        : currentCompletedTasks > 0 ? '+1' : '+0';

      const activeTasksChange = currentActiveTasks - lastWeekActiveTasks;
      const activeTasksChangeStr = activeTasksChange > 0 
        ? `+${activeTasksChange}` 
        : activeTasksChange < 0 ? `${activeTasksChange}` : '+0';

      const projectsChange = currentProjects > 0 ? '+1' : '+0';

      // Enhanced productivity change calculation
      const productivityDifference = productivity - previousProductivity;
      const productivityChange = productivityDifference > 0 
        ? `+${Math.round(productivityDifference)}%` 
        : productivityDifference < 0 
        ? `${Math.round(productivityDifference)}%` 
        : '+0%';

      setStats({
        completedTasks: currentCompletedTasks,
        activeTasks: currentActiveTasks,
        totalProjects: currentProjects,
        productivity,
        completedTasksChange,
        activeTasksChange: activeTasksChangeStr,
        projectsChange,
        productivityChange,
        productivityMetrics: metrics
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
};
