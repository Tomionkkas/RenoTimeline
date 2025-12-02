import { supabase } from '@/integrations/supabase/client';
import { 
  RenoTimelineNotification, 
  NotificationType, 
  TaskCompletionEvent,
  MilestoneEvent,
  TimelineDelayEvent,
  TeamUpdateEvent,
  ProgressUpdateEvent,
  NOTIFICATION_TEMPLATES
} from '../types/notifications';

/**
 * CalcReno Event Detector - Monitors RenoTimeline events and generates notifications for CalcReno
 */
export class CalcRenoEventDetector {
  
  /**
   * Detect and notify when a task is completed
   */
  static async onTaskCompleted(
    taskId: string,
    projectId: string,
    taskName: string,
    hoursWorked: number,
    estimatedHours: number
  ): Promise<void> {
    console.log('🧪 CalcReno Event: Task Completed', { taskId, projectId, taskName, hoursWorked, estimatedHours });
    
    try {
      // Get project details - NO linking requirement, send to ALL users!
      const projectData = await this.getProjectData(projectId);
      if (!projectData) return;

      const eventData: TaskCompletionEvent = {
        task_id: taskId,
        task_title: taskName,
        completion_date: new Date().toISOString(),
        estimated_hours: estimatedHours,
        actual_hours: hoursWorked
      };

      const correlationData = {
        estimated_cost_impact: this.calculateCostImpact(estimatedHours, hoursWorked),
        timeline_change_days: 0, // Task completion doesn't change timeline
        affected_tasks: [taskId]
      };

      await this.sendNotificationToCalcReno(
        'task_completed',
        projectData,
        eventData,
        correlationData
      );

      // Auto-check for milestones after task completion
      await this.checkForMilestones(projectId);

    } catch (error) {
      console.error('Error detecting task completion:', error);
    }
  }

  /**
   * Detect and notify when a milestone is reached
   */
  static async onMilestoneReached(
    projectId: string,
    milestoneName: string,
    completionPercentage: number,
    tasksCompleted: number,
    totalTasks: number
  ): Promise<void> {
    console.log('🧪 CalcReno Event: Milestone Reached', { projectId, milestoneName, completionPercentage });
    
    try {
      const projectData = await this.getProjectData(projectId);
      if (!projectData) return;

      const eventData: MilestoneEvent = {
        milestone_name: milestoneName,
        completion_percentage: completionPercentage,
        planned_date: '', // This would come from project planning
        actual_date: new Date().toISOString(),
        tasks_completed: tasksCompleted,
        total_tasks: totalTasks
      };

      const correlationData = {
        progress_percentage: completionPercentage,
        affected_tasks: [] // Could be populated with completed task IDs
      };

      await this.sendNotificationToCalcReno(
        'milestone_reached',
        projectData,
        eventData,
        correlationData
      );

    } catch (error) {
      console.error('Error detecting milestone:', error);
    }
  }

  /**
   * Detect and notify about timeline delays
   */
  static async onTimelineDelay(
    projectId: string,
    delayDays: number,
    originalEndDate: string,
    newEndDate: string,
    delayReason: string,
    affectedTaskIds: string[]
  ): Promise<void> {
    console.log('🧪 CalcReno Event: Timeline Delay', { projectId, delayDays, delayReason });
    
    try {
      const projectData = await this.getProjectData(projectId);
      if (!projectData) return;

      const eventData: TimelineDelayEvent = {
        delay_days: delayDays,
        original_end_date: originalEndDate,
        new_end_date: newEndDate,
        affected_tasks: affectedTaskIds,
        delay_reason: delayReason
      };

      const correlationData = {
        timeline_change_days: delayDays,
        estimated_cost_impact: this.calculateDelayImpact(delayDays),
        affected_tasks: affectedTaskIds,
        delay_reason: delayReason
      };

      await this.sendNotificationToCalcReno(
        'timeline_delay',
        projectData,
        eventData,
        correlationData
      );

    } catch (error) {
      console.error('Error detecting timeline delay:', error);
    }
  }

  /**
   * Detect and notify about team updates
   */
  static async onTeamUpdate(
    projectId: string,
    updateType: 'member_added' | 'member_removed' | 'role_changed' | 'availability_changed',
    memberName: string,
    memberId: string,
    details: string
  ): Promise<void> {
    console.log('🧪 CalcReno Event: Team Update', { projectId, updateType, memberName });
    
    try {
      const projectData = await this.getProjectData(projectId);
      if (!projectData) return;

      const eventData: TeamUpdateEvent = {
        update_type: updateType,
        member_name: memberName,
        member_id: memberId,
        details: details
      };

      const correlationData = {
        team_members: [memberId],
        estimated_cost_impact: updateType === 'member_added' ? 100 : updateType === 'member_removed' ? -100 : 0
      };

      await this.sendNotificationToCalcReno(
        'team_update',
        projectData,
        eventData,
        correlationData
      );

    } catch (error) {
      console.error('Error detecting team update:', error);
    }
  }

  /**
   * Detect and notify when a task is moved to a different date
   */
  static async onTaskMoved(
    taskId: string,
    projectId: string,
    taskName: string,
    originalDate: string,
    newDate: string,
    timeChange?: { newTime?: string; isAllDay?: boolean }
  ): Promise<void> {
    console.log('🧪 CalcReno Event: Task Moved', { taskId, projectId, taskName, originalDate, newDate });
    
    try {
      const projectData = await this.getProjectData(projectId);
      if (!projectData) return;

      // Calculate timeline impact
      const originalDateObj = new Date(originalDate);
      const newDateObj = new Date(newDate);
      const daysDifference = Math.ceil((newDateObj.getTime() - originalDateObj.getTime()) / (1000 * 60 * 60 * 24));

      const eventData = {
        task_id: taskId,
        task_title: taskName,
        original_date: originalDate,
        new_date: newDate,
        days_moved: daysDifference,
        time_change: timeChange
      };

      const correlationData = {
        timeline_change_days: daysDifference,
        affected_tasks: [taskId],
        schedule_optimization_opportunity: Math.abs(daysDifference) > 7, // Flag for major moves
        estimated_cost_impact: Math.abs(daysDifference) * 10 // Rough estimate
      };

      // Try to send task_moved notification, fallback to timeline_updated if constraint fails
      try {
        await this.sendNotificationToCalcReno(
          'task_moved',
          projectData,
          eventData,
          correlationData
        );
      } catch (error) {
        console.warn('⚠️ task_moved type not supported, using timeline_updated fallback:', error);
        // Fallback to timeline_updated which should be supported
        await this.sendNotificationToCalcReno(
          'timeline_updated',
          projectData,
          {
            ...eventData,
            update_type: 'task_moved',
            change_description: `Zadanie "${eventData.task_title}" przeniesione z ${eventData.original_date} na ${eventData.new_date}`
          },
          correlationData
        );
      }

    } catch (error) {
      console.error('Error detecting task movement:', error);
    }
  }

  /**
   * Detect and notify about progress updates (daily/weekly reports)
   */
  static async onProgressUpdate(
    projectId: string,
    completionPercentage: number,
    tasksCompletedToday: number
  ): Promise<void> {
    console.log('🧪 CalcReno Event: Progress Update', { projectId, completionPercentage, tasksCompletedToday });
    
    try {
      const projectData = await this.getProjectData(projectId);
      if (!projectData) return;

      // Only send progress updates for significant milestones (every 25%)
      const milestones = [25, 50, 75, 100];
      const isSignificantMilestone = milestones.some(milestone => 
        Math.abs(completionPercentage - milestone) < 2
      );

      if (!isSignificantMilestone && tasksCompletedToday === 0) return;

      const eventData: ProgressUpdateEvent = {
        completion_percentage: completionPercentage,
        tasks_completed_today: tasksCompletedToday,
        upcoming_milestones: [], // Could be populated from project data
        budget_status: this.calculateBudgetStatus(completionPercentage)
      };

      const correlationData = {
        progress_percentage: completionPercentage
      };

      await this.sendNotificationToCalcReno(
        'progress_update',
        projectData,
        eventData,
        correlationData
      );

    } catch (error) {
      console.error('Error detecting progress update:', error);
    }
  }

  /**
   * Get project data for ANY project (no linking requirement)
   * Always returns project data so ALL users get notifications
   */
  private static async getProjectData(projectId: string) {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('id, name, owner_id, end_date')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project data:', error);
        return null;
      }

      // ALWAYS return project data - no linking requirement!
      // This ensures ALL users get CalcReno notifications regardless of project linking
      return {
        ...project,
        calcreno_project_id: null, // NULL is fine - send to all users!
        calcreno_reference_url: null,
        created_by: project.owner_id
      };

    } catch (error) {
      console.error('Error in getProjectData:', error);
      return null;
    }
  }

  /**
   * Send notification to CalcReno users
   * NOTE: This will create records in cross_app_notifications table
   * even if not currently linked to CalcReno (for testing purposes)
   */
  private static async sendNotificationToCalcReno(
    type: NotificationType,
    projectData: any,
    eventData: any,
    correlationData: any
  ): Promise<void> {
    try {
      const template = NOTIFICATION_TEMPLATES[type];
      
      // Generate notification content using templates
      const title = this.replaceTemplateVariables(template.title_template, {
        project_name: projectData.name,
        ...eventData
      });

      const message = this.replaceTemplateVariables(template.message_template, {
        project_name: projectData.name,
        ...eventData
      });

      const suggestedActions = template.suggested_actions_template.map(action => ({
        ...action,
        calcreno_url: action.calcreno_url?.replace('{{calcreno_project_id}}', projectData.calcreno_project_id || 'pending'),
        renotimeline_url: action.renotimeline_url?.replace('{{project_id}}', projectData.id)
      }));

      // Create notification payload - ALWAYS send to user, regardless of project linking
      const notificationData = {
        user_id: projectData.created_by,
        project_id: projectData.id,
        calcreno_project_id: projectData.calcreno_project_id, // NULL is perfectly fine!
        source_app: 'renotimeline',
        target_app: 'calcreno',
        notification_type: type,
        title: title,
        message: message,
        priority: template.priority,
        data: {
          project_name: projectData.name,
          event_data: eventData,
          correlation_data: correlationData,
          suggested_actions: suggestedActions,
          renotimeline_url: `https://renotimeline.app/project/${projectData.id}`
        },
        is_read: false
      };

      console.log(`Would send ${type} notification to CalcReno for project ${projectData.name}:`, {
        title,
        message,
        correlationData
      });

      // ✅ ENABLED: Real database notifications to CalcReno
      // Try using Edge Function first, fallback to notifications table
      try {
        const { data, error } = await supabase.functions.invoke('create-calcreno-notification', {
          body: { notification_data: notificationData }
        });

        if (error) {
          console.error('Edge function error, using fallback:', error);
          throw error;
        }

        console.log('✅ Cross-app notification sent to CalcReno:', data.method, notificationData.notification_type);
        return;

      } catch (edgeFunctionError) {
        console.log('📝 Edge function not available, using direct database insert...');
        
        // Fallback: Use existing notifications table with CalcReno metadata
        const calcreno_notification = {
          user_id: notificationData.user_id,
          project_id: notificationData.project_id,
          title: `[CalcReno] ${notificationData.title}`,
          message: notificationData.message,
          type: 'system' as const,
          priority: notificationData.priority,
          metadata: {
            ...notificationData,
            is_calcreno_notification: true,
            original_type: type
          }
        };

        const { error } = await supabase
          .from('notifications')
          .insert(calcreno_notification);

        if (error) {
          console.error('Error inserting CalcReno notification:', error);
          return;
        }

        console.log('✅ Cross-app notification sent to CalcReno (fallback):', notificationData.notification_type);
      }

    } catch (error) {
      console.error('Error sending notification to CalcReno:', error);
    }
  }

  /**
   * Replace template variables with actual values
   */
  private static replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    return result;
  }

  /**
   * Calculate cost impact based on time variance
   */
  private static calculateCostImpact(estimatedHours?: number, actualHours?: number): number {
    if (!estimatedHours || !actualHours) return 0;
    
    const hourlyRate = 150; // Average hourly rate - could be configured
    const variance = actualHours - estimatedHours;
    return variance * hourlyRate;
  }

  /**
   * Calculate delay impact on costs
   */
  private static calculateDelayImpact(delayDays: number): number {
    const dailyCost = 800; // Average daily project cost - could be configured
    return delayDays * dailyCost;
  }

  /**
   * Calculate budget status based on progress
   */
  private static calculateBudgetStatus(completionPercentage: number): 'on_track' | 'under_budget' | 'over_budget' {
    // Simple heuristic - could be more sophisticated
    if (completionPercentage >= 90) return 'on_track';
    if (completionPercentage >= 70) return 'under_budget';
    return 'over_budget';
  }

  /**
   * Auto-detect project milestones based on task completion
   */
  static async checkForMilestones(projectId: string): Promise<void> {
    try {
      // Get all tasks for the project
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('project_id', projectId);

      if (error || !tasks) return;

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'done').length;
      const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

      // Check for significant milestones
      const milestones = [
        { threshold: 25, name: 'Pierwszy kwartał' },
        { threshold: 50, name: 'Połowa projektu' },
        { threshold: 75, name: 'Trzeci kwartał' },
        { threshold: 100, name: 'Ukończenie projektu' }
      ];

      for (const milestone of milestones) {
        if (Math.abs(completionPercentage - milestone.threshold) <= 2) {
          await this.onMilestoneReached(
            projectId,
            milestone.name,
            completionPercentage,
            completedTasks,
            totalTasks
          );
          break;
        }
      }

    } catch (error) {
      console.error('Error checking for milestones:', error);
    }
  }

  private async createCalcRenoNotification(notificationData: any): Promise<void> {
    try {
      console.log('🚀 Creating CalcReno notification via Edge Function:', notificationData.notification_type);
      
      // Try Edge Function first (optimal path)
      try {
        const { data, error } = await supabase.functions.invoke('create-calcreno-notification', {
          body: { notification_data: notificationData }
        });

        if (error) throw error;
        
        console.log('✅ Edge Function success:', data.method, data.message);
        return;
      } catch (edgeFunctionError) {
        console.warn('⚠️ Edge Function failed, using smart fallback:', edgeFunctionError.message);
      }

      // Smart fallback: Use existing notifications table with CalcReno metadata
      const fallbackNotification = {
        user_id: notificationData.user_id,
        project_id: notificationData.project_id,
        title: `[CalcReno] ${notificationData.title}`,
        message: notificationData.message,
        type: 'system' as const,
        priority: notificationData.priority,
        metadata: {
          ...notificationData,
          is_calcreno_notification: true,
          original_type: notificationData.notification_type,
          source_app: 'renotimeline',
          target_app: 'calcreno'
        }
      };

      const { error: fallbackError } = await supabase
        .from('notifications')
        .insert(fallbackNotification);

      if (fallbackError) {
        throw fallbackError;
      }

      console.log('✅ Smart fallback success: CalcReno notification created in notifications table');
    } catch (error) {
      console.error('❌ Failed to create CalcReno notification:', error);
      // Don't throw to prevent workflow interruption
    }
  }
} 