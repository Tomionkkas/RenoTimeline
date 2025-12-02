import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

export class DatabaseUtils {
  private static client: SupabaseClient;

  static initialize(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get project data with CalcReno integration fields
   */
  static async getProjectCalcRenoData(projectId: string) {
    try {
      const { data, error } = await this.client
        .from('projects')
        .select(`
          id, 
          name, 
          owner_id,
          end_date,
          source_app,
          calcreno_project_id,
          calcreno_reference_url,
          imported_at
        `)
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project CalcReno data:', error);
        return null;
      }

      return {
        ...data,
        created_by: data.owner_id
      };
    } catch (error) {
      console.error('Error in getProjectCalcRenoData:', error);
      return null;
    }
  }

  /**
   * Insert cross-app notification
   */
  static async insertCrossAppNotification(notification: {
    project_id: string;
    calcreno_project_id: string;
    source_app: string;
    type: string;
    title: string;
    message: string;
    priority: string;
    data: any;
    calcreno_reference_url?: string;
    user_id: string;
  }) {
    try {
      const { data, error } = await this.client
        .from('cross_app_notifications')
        .insert({
          ...notification,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting cross-app notification:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in insertCrossAppNotification:', error);
      return null;
    }
  }

  /**
   * Get tasks for project milestone calculation
   */
  static async getProjectTasks(projectId: string) {
    try {
      const { data, error } = await this.client
        .from('tasks')
        .select('id, status')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching project tasks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getProjectTasks:', error);
      return [];
    }
  }
} 