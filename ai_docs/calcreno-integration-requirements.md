# CalcReno Integration Requirements - Cross-App Notifications

## Overview

This document outlines the implementation requirements for CalcReno to receive and process cross-app notifications from RenoTimeline. The RenoTimeline side is already fully implemented and sending notifications via Edge Functions to the shared Supabase database.

## Current Integration Status

### ✅ RenoTimeline (Completed)
- **Event Detection System** - `CalcRenoEventDetector` monitors task movements, completions, delays
- **Notification Templates** - Polish message templates with suggested actions
- **Edge Function** - `create-calcreno-notification` deployed and working
- **Database Schema** - `cross_app_notifications` table with RLS policies
- **Real-time Triggers** - Task movements automatically trigger notifications

### ❌ CalcReno (Needs Implementation)
- **Notification Subscription System** - Listen for incoming notifications
- **Real-time Updates** - Supabase real-time subscriptions
- **Notification UI Components** - Display notifications in-app
- **Push Notification Service** - React Native push notifications
- **Notification Actions** - Handle suggested actions from RenoTimeline

## Required Implementation in CalcReno

### 1. Supabase Integration Setup

CalcReno needs to connect to the same Supabase instance as RenoTimeline to receive cross-app notifications.

**Environment Configuration:**
```typescript
// .env or expo-constants
EXPO_PUBLIC_SUPABASE_URL=https://qxyuayjpllrndylxhgoq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[shared_anon_key]
```

**Supabase Client Setup:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://qxyuayjpllrndylxhgoq.supabase.co'
const supabaseAnonKey = '[shared_anon_key]'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### 2. Cross-App Notification Types

CalcReno should handle these notification types from RenoTimeline:

```typescript
// types/notifications.ts
export type NotificationType = 
  | 'task_completed'      // Task finished - check if cost estimates were accurate
  | 'task_moved'          // Task rescheduled - may affect timeline/costs
  | 'milestone_reached'   // Project milestone - update budget status
  | 'timeline_delay'      // Project delayed - calculate additional costs
  | 'team_update'         // Team changes - update labor costs
  | 'progress_update'     // Progress reports - budget vs reality check

export interface CrossAppNotification {
  id: string
  user_id: string
  project_id: string
  calcreno_project_id: string | null
  source_app: 'renotimeline'
  target_app: 'calcreno'
  notification_type: NotificationType
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  data: {
    event_data: any
    correlation_data: any
    suggested_actions: SuggestedAction[]
  }
  is_read: boolean
  created_at: string
}

export interface SuggestedAction {
  action: string
  description: string
  calcreno_url?: string
  renotimeline_url?: string
}
```

### 3. Real-time Notification Subscription

Implement Supabase real-time subscription to receive notifications instantly:

```typescript
// hooks/useNotificationSubscription.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CrossAppNotification } from '../types/notifications'

export const useNotificationSubscription = (userId: string) => {
  const [notifications, setNotifications] = useState<CrossAppNotification[]>([])
  const [newNotification, setNewNotification] = useState<CrossAppNotification | null>(null)

  useEffect(() => {
    if (!userId) return

    // Subscribe to new notifications
    const subscription = supabase
      .channel('cross-app-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cross_app_notifications',
          filter: `user_id=eq.${userId} AND target_app=eq.calcreno`
        },
        (payload) => {
          const notification = payload.new as CrossAppNotification
          setNewNotification(notification)
          setNotifications(prev => [notification, ...prev])
          
          // Trigger push notification
          handlePushNotification(notification)
          
          // Show in-app notification
          showInAppNotification(notification)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  return { notifications, newNotification }
}
```

### 4. Push Notification Service

Set up React Native push notifications for background alerts:

```bash
# Install required packages
npm install @react-native-async-storage/async-storage
npm install expo-notifications
npm install expo-device
npm install expo-constants
```

**Push Notification Setup:**
```typescript
// services/PushNotificationService.ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export class PushNotificationService {
  static async registerForPushNotifications() {
    let token

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      
      if (finalStatus !== 'granted') {
        alert('Nie udało się uzyskać uprawnień do powiadomień!')
        return
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data
    }

    return token
  }

  static async sendLocalNotification(notification: CrossAppNotification) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.message,
        data: { 
          notificationId: notification.id,
          type: notification.notification_type,
          projectId: notification.project_id
        },
        sound: true,
        priority: notification.priority === 'high' 
          ? Notifications.AndroidImportance.HIGH 
          : Notifications.AndroidImportance.DEFAULT,
      },
      trigger: null, // Show immediately
    })
  }
}
```

### 5. Notification UI Components

Create components to display notifications in CalcReno:

**Notification Center:**
```typescript
// components/NotificationCenter.tsx
import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { CrossAppNotification } from '../types/notifications'

interface NotificationCenterProps {
  notifications: CrossAppNotification[]
  onNotificationPress: (notification: CrossAppNotification) => void
  onMarkAsRead: (notificationId: string) => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onNotificationPress,
  onMarkAsRead
}) => {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Text className="text-xl font-bold p-4">Powiadomienia z RenoTimeline</Text>
      
      {notifications.map((notification) => (
        <TouchableOpacity
          key={notification.id}
          className={`p-4 m-2 rounded-lg ${
            notification.is_read ? 'bg-gray-100' : 'bg-blue-50 border-l-4 border-blue-500'
          }`}
          onPress={() => onNotificationPress(notification)}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">
                {notification.title}
              </Text>
              <Text className="text-gray-600 mt-1">
                {notification.message}
              </Text>
              <Text className="text-xs text-gray-400 mt-2">
                {new Date(notification.created_at).toLocaleString('pl-PL')}
              </Text>
            </View>
            
            <View className={`px-2 py-1 rounded ${
              notification.priority === 'high' 
                ? 'bg-red-100' 
                : notification.priority === 'medium'
                ? 'bg-yellow-100'
                : 'bg-green-100'
            }`}>
              <Text className={`text-xs ${
                notification.priority === 'high' 
                  ? 'text-red-800' 
                  : notification.priority === 'medium'
                  ? 'text-yellow-800'
                  : 'text-green-800'
              }`}>
                {notification.priority.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {!notification.is_read && (
            <TouchableOpacity
              className="mt-2 bg-blue-500 px-3 py-1 rounded"
              onPress={() => onMarkAsRead(notification.id)}
            >
              <Text className="text-white text-sm">Oznacz jako przeczytane</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}
```

**Notification Badge:**
```typescript
// components/NotificationBadge.tsx
import React from 'react'
import { View, Text } from 'react-native'

interface NotificationBadgeProps {
  count: number
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
  if (count === 0) return null
  
  return (
    <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-5 h-5 items-center justify-center">
      <Text className="text-white text-xs font-bold">
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  )
}
```

### 6. Notification Actions Handler

Implement handlers for suggested actions from RenoTimeline:

```typescript
// services/NotificationActionHandler.ts
import { SuggestedAction, CrossAppNotification } from '../types/notifications'
import { router } from 'expo-router'

export class NotificationActionHandler {
  static async handleAction(
    action: SuggestedAction, 
    notification: CrossAppNotification
  ) {
    switch (action.action) {
      case 'update_cost_estimate':
        // Navigate to cost estimation screen for the project
        router.push(`/projects/${notification.calcreno_project_id}/costs`)
        break
        
      case 'check_savings':
        // Navigate to savings/budget summary
        router.push(`/projects/${notification.calcreno_project_id}/summary`)
        break
        
      case 'update_budget_status':
        // Navigate to budget status screen
        router.push(`/projects/${notification.calcreno_project_id}/budget`)
        break
        
      case 'recalculate_budget':
        // Trigger budget recalculation
        await this.triggerBudgetRecalculation(notification.calcreno_project_id)
        break
        
      case 'check_timeline_impact':
        // Show timeline impact analysis
        router.push(`/projects/${notification.calcreno_project_id}/timeline-impact`)
        break
        
      case 'update_labor_costs':
        // Navigate to labor cost management
        router.push(`/projects/${notification.calcreno_project_id}/labor`)
        break
        
      default:
        console.warn(`Unknown action: ${action.action}`)
    }
  }
  
  private static async triggerBudgetRecalculation(projectId: string) {
    // Implement budget recalculation logic
    console.log(`Recalculating budget for project: ${projectId}`)
  }
}
```

### 7. Integration with CalcReno Navigation

Add notification access to CalcReno's main navigation:

```typescript
// Add to main navigation/header
import { NotificationBadge } from '../components/NotificationBadge'
import { useNotificationSubscription } from '../hooks/useNotificationSubscription'

const HeaderComponent = () => {
  const { user } = useAuth()
  const { notifications } = useNotificationSubscription(user?.id)
  const unreadCount = notifications.filter(n => !n.is_read).length
  
  return (
    <View className="flex-row items-center">
      <TouchableOpacity 
        className="relative p-2"
        onPress={() => router.push('/notifications')}
      >
        <BellIcon size={24} />
        <NotificationBadge count={unreadCount} />
      </TouchableOpacity>
    </View>
  )
}
```

### 8. Database Operations

Implement functions to manage notifications:

```typescript
// services/NotificationService.ts
import { supabase } from '../lib/supabase'
import { CrossAppNotification } from '../types/notifications'

export class NotificationService {
  static async getNotifications(userId: string): Promise<CrossAppNotification[]> {
    const { data, error } = await supabase
      .from('cross_app_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('target_app', 'calcreno')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
  
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('cross_app_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
    
    if (error) throw error
  }
  
  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('cross_app_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('target_app', 'calcreno')
      .eq('is_read', false)
    
    if (error) throw error
  }
  
  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('cross_app_notifications')
      .delete()
      .eq('id', notificationId)
    
    if (error) throw error
  }
}
```

## Implementation Priority

### Phase 1: Core Integration (2-3 days)
1. **Supabase Client Setup** - Connect CalcReno to shared database
2. **Real-time Subscription** - Implement notification listener
3. **Basic Notification Display** - Simple list of notifications

### Phase 2: Enhanced UX (3-4 days)
1. **Push Notifications** - Background notifications when app is closed
2. **Notification Center UI** - Polished notification interface
3. **Badge System** - Show unread count in navigation

### Phase 3: Smart Actions (2-3 days)
1. **Action Handlers** - Implement suggested action navigation
2. **Deep Linking** - Direct navigation to relevant screens
3. **Budget Recalculation** - Automatic cost updates based on timeline changes

### Phase 4: Advanced Features (1-2 days)
1. **Notification Settings** - User preferences for notification types
2. **Smart Filtering** - Group and categorize notifications
3. **Analytics Integration** - Track which notifications lead to cost adjustments

## Testing Strategy

### Integration Testing
1. **Move a task in RenoTimeline** → Should appear in CalcReno notifications
2. **Complete a task in RenoTimeline** → Should trigger cost review notification
3. **Delay a project in RenoTimeline** → Should suggest budget recalculation

### User Experience Testing
1. **Background notifications** work when CalcReno is closed
2. **Badge counts** update correctly
3. **Suggested actions** navigate to correct screens
4. **Performance** with large numbers of notifications

## Database Schema Reference

The `cross_app_notifications` table is already created in Supabase:

```sql
CREATE TABLE cross_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    calcreno_project_id TEXT,
    source_app TEXT NOT NULL CHECK (source_app IN ('calcreno', 'renotimeline')),
    target_app TEXT NOT NULL CHECK (target_app IN ('calcreno', 'renotimeline')),
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    data JSONB DEFAULT '{}',
    calcreno_reference_url TEXT,
    renotimeline_reference_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Expected Business Impact

Once implemented, this integration will provide:

### Immediate Value
- **Proactive Cost Management** - CalcReno users get alerts when project changes affect budgets
- **Real-time Synchronization** - No manual checking required between apps
- **Smart Suggestions** - Guided actions for cost adjustments

### Long-term Benefits
- **Data-Driven Decisions** - Historical correlation between timeline changes and cost impacts
- **Improved Accuracy** - Cost estimates become more accurate based on real project data
- **Professional Workflow** - Seamless integration enhances user experience

## Conclusion

The RenoTimeline side is fully implemented and ready to send notifications. CalcReno needs approximately 8-12 days of development to complete the integration, with the most critical components being the Supabase connection and real-time subscription system.

The suggested implementation order prioritizes core functionality first, ensuring basic notification delivery works before adding advanced features like push notifications and smart actions. 