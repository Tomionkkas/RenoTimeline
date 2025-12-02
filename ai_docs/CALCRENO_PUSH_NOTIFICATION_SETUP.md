# 🔔 CalcReno Push Notification Setup - Quick Implementation

## Current Status
- ✅ **RenoTimeline**: Sending beautiful notifications to database
- ✅ **Database**: `cross_app_notifications` table working perfectly
- ❌ **CalcReno**: Missing real-time subscription and push notifications

## Why No Push Notifications?
CalcReno needs to implement the notification subscription system. Right now:
- Notifications are stored in the database ✅
- CalcReno notification hub shows them when refreshed ✅
- But CalcReno doesn't listen for real-time updates ❌
- No push notifications are triggered ❌

## Quick Fix - 3 Steps to Enable Push Notifications

### Step 1: Add Real-time Subscription (5 minutes)

```typescript
// In your main CalcReno app component or notification hook
import { supabase } from './lib/supabase'

export const useRenoTimelineNotifications = (userId: string) => {
  useEffect(() => {
    if (!userId) return

    // Subscribe to new notifications from RenoTimeline
    const subscription = supabase
      .channel('calcreno-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cross_app_notifications',
          filter: `user_id=eq.${userId} AND target_app=eq.calcreno`
        },
        (payload) => {
          const notification = payload.new
          console.log('🔔 New RenoTimeline notification:', notification)
          
          // Show push notification
          showPushNotification(notification)
          
          // Update notification count
          updateNotificationBadge()
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [userId])
}
```

### Step 2: Add Push Notification Function (5 minutes)

```typescript
// Add this function to show push notifications
const showPushNotification = (notification) => {
  // For React Native with Expo
  if (typeof Notifications !== 'undefined') {
    Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.message,
        data: { 
          type: 'renotimeline',
          projectId: notification.project_id,
          notificationId: notification.id
        },
        sound: true,
      },
      trigger: null, // Show immediately
    })
  }
  
  // For web browsers
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/calcreno-icon.png',
      tag: notification.id
    })
  }
}
```

### Step 3: Add Notification Badge (5 minutes)

```typescript
// Add notification badge to your main navigation
const NotificationBadge = ({ count }: { count: number }) => {
  if (count === 0) return null
  
  return (
    <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-5 h-5 flex items-center justify-center">
      <Text className="text-white text-xs font-bold">
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  )
}

// Use in your navigation
<TouchableOpacity onPress={() => navigateToNotifications()}>
  <Bell size={24} />
  <NotificationBadge count={unreadNotificationCount} />
</TouchableOpacity>
```

## Complete Working Example

Here's a complete hook you can add to CalcReno:

```typescript
// hooks/useRenoTimelineIntegration.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const useRenoTimelineIntegration = (userId: string) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotification, setLatestNotification] = useState(null)

  useEffect(() => {
    if (!userId) return

    // 1. Get initial unread count
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('cross_app_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('target_app', 'calcreno')
        .eq('is_read', false)
      
      setUnreadCount(count || 0)
    }

    fetchUnreadCount()

    // 2. Subscribe to new notifications
    const subscription = supabase
      .channel('calcreno-live-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cross_app_notifications',
          filter: `user_id=eq.${userId} AND target_app=eq.calcreno`
        },
        (payload) => {
          const notification = payload.new
          
          console.log('🎉 New RenoTimeline notification:', notification.title)
          
          // Update state
          setLatestNotification(notification)
          setUnreadCount(prev => prev + 1)
          
          // Show push notification
          showPushNotification(notification)
          
          // Optional: Show in-app toast
          showInAppToast(notification)
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [userId])

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('cross_app_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
    
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  return {
    unreadCount,
    latestNotification,
    markAsRead
  }
}

// Helper functions
const showPushNotification = (notification) => {
  // React Native/Expo
  if (typeof Notifications !== 'undefined') {
    Notifications.scheduleNotificationAsync({
      content: {
        title: `📱 ${notification.title}`,
        body: notification.message,
        sound: true,
      },
      trigger: null,
    })
  }
  
  // Web browsers
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`🏗️ ${notification.title}`, {
      body: notification.message,
      icon: '/calcreno-icon.png',
    })
  }
}

const showInAppToast = (notification) => {
  // If you're using a toast library like react-hot-toast
  // toast.success(notification.title, {
  //   description: notification.message,
  //   action: {
  //     label: 'Zobacz',
  //     onClick: () => navigateToNotification(notification)
  //   }
  // })
}
```

## Usage in CalcReno App

```typescript
// In your main App component or navigation
import { useRenoTimelineIntegration } from './hooks/useRenoTimelineIntegration'

export default function App() {
  const { user } = useAuth()
  const { unreadCount, latestNotification } = useRenoTimelineIntegration(user?.id)

  return (
    <NavigationContainer>
      {/* Your existing navigation */}
      <Tab.Screen 
        name="Notifications" 
        component={NotificationScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Bell color={color} size={size} />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4" />
              )}
            </View>
          ),
        }}
      />
    </NavigationContainer>
  )
}
```

## Test the Integration

1. **Add the hook** to your CalcReno app
2. **Complete a task** in RenoTimeline (drag to "Done" in Kanban)
3. **Expect to see**:
   - ✅ Push notification appears immediately
   - ✅ Notification badge shows count
   - ✅ Beautiful message: "✅ Zadanie ukończone - [Task Name]"

## Current Test Data

RenoTimeline is already sending beautiful notifications like:
```
Title: ✅ Zadanie ukończone - Montaż płytek łazienkowych
Message: Zadanie "Montaż płytek łazienkowych" zostało ukończone w projekcie Mieszkanie na Matejki. Sprawdź postęp i zaktualizuj kalkulacje kosztów.
```

These are stored in `cross_app_notifications` table - CalcReno just needs to subscribe to them!

## Minimal Implementation Time
- **5 minutes**: Add real-time subscription
- **5 minutes**: Add push notification function  
- **5 minutes**: Add notification badge to navigation
- **Total**: 15 minutes to get push notifications working

Once this is implemented, users will get immediate push notifications whenever they complete tasks, reach milestones, or move deadlines in RenoTimeline! 🚀 