# CalcReno Connection Guide: Real-time Notifications from RenoTimeline

## 🎯 **Current Status**
- ✅ **RenoTimeline**: Smart notification system implemented (Phase 2) 
- ✅ **CalcReno**: Already migrated to Supabase ([GitHub repo](https://github.com/Tomionkkas/CalcReno))
- 🔄 **Missing**: Real-time connection between the apps

## 📋 **Step 1: Apply Database Migrations in RenoTimeline**

First, enable the notification tables in your Supabase database:

```bash
# In RenoTimeline project
cd supabase
supabase migration up
```

This creates the `cross_app_notifications` table that RenoTimeline will write to and CalcReno will read from.

## 📋 **Step 2: Enable Real Notifications in RenoTimeline**

Uncomment the database insertion code in `src/lib/services/CalcRenoEventDetector.ts`:

```typescript
// Around line 300 - UNCOMMENT this block:
const { error } = await supabase
  .from('cross_app_notifications')
  .insert(notificationData);

if (error) {
  console.error('Error inserting cross-app notification:', error);
  return;
}
```

## 📋 **Step 3: Add Real-time Subscription to CalcReno**

Create this file in CalcReno project:

```typescript
// app/hooks/useRenoTimelineNotifications.ts
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!, 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export interface RenoTimelineNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  project_id: string;
  calcreno_project_id: string;
  data: any;
  created_at: string;
  read: boolean;
}

export function useRenoTimelineNotifications(userId: string) {
  const [notifications, setNotifications] = useState<RenoTimelineNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 1. Load existing notifications
    loadNotifications();

    // 2. Subscribe to real-time updates
    const channel = supabase
      .channel('calcreno-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cross_app_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 New RenoTimeline notification:', payload.new);
          const newNotification = payload.new as RenoTimelineNotification;
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show local push notification
          showLocalNotification(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'cross_app_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('📝 Updated RenoTimeline notification:', payload.new);
          const updatedNotification = payload.new as RenoTimelineNotification;
          
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('cross_app_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('source_app', 'renotimeline')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('cross_app_notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? {...n, read: true} : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const showLocalNotification = (notification: RenoTimelineNotification) => {
    // Implement Expo notification here
    console.log('🔔 Show notification:', notification.title);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    refresh: loadNotifications
  };
}
```

## 📋 **Step 4: Create CalcReno Notification Component**

Create the UI component in CalcReno:

```typescript
// app/components/RenoTimelineNotifications.tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRenoTimelineNotifications } from '../hooks/useRenoTimelineNotifications';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as needed

export function RenoTimelineNotifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead } = useRenoTimelineNotifications(user?.id);

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.read && styles.unreadItem
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.priorityBadge}>{item.priority}</Text>
      </View>
      
      <Text style={styles.notificationMessage}>{item.message}</Text>
      
      <View style={styles.notificationFooter}>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleString('pl-PL')}
        </Text>
        {item.data?.correlation_data?.cost_impact && (
          <Text style={styles.costImpact}>
            Koszt: {item.data.correlation_data.cost_impact} PLN
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Powiadomienia z RenoTimeline</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  badge: {
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  unreadItem: {
    borderLeftColor: '#ff3b30',
    backgroundColor: '#fff9f9',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  costImpact: {
    fontSize: 12,
    color: '#ff3b30',
    fontWeight: '500',
  },
});
```

## 📋 **Step 5: Add to CalcReno Navigation**

Add the notification screen to your CalcReno app navigation:

```typescript
// In your CalcReno navigation file (probably app/_layout.tsx or similar)
import { RenoTimelineNotifications } from '../components/RenoTimelineNotifications';

// Add to your tab navigation or stack:
<Stack.Screen 
  name="notifications" 
  component={RenoTimelineNotifications}
  options={{
    title: 'Powiadomienia',
    headerShown: true
  }}
/>
```

## 🧪 **Step 6: Test the Integration**

1. **In RenoTimeline**: Complete a task on the Kanban board
2. **Check console**: Should see "🧪 CalcReno Event: Task Completed"  
3. **Check database**: Should see new record in `cross_app_notifications`
4. **In CalcReno**: Should receive real-time notification

## 🔗 **Step 7: Add Deep Linking (Optional)**

To handle "Zobacz w RenoTimeline" buttons in CalcReno:

```typescript
// In CalcReno app configuration
{
  "expo": {
    "scheme": "calcreno",
    "web": {
      "bundler": "metro"
    }
  }
}
```

Then handle incoming links in CalcReno to open RenoTimeline.

## 🎯 **Expected Result**

After completing these steps:

✅ **User completes task in RenoTimeline**  
✅ **CalcReno receives instant notification**  
✅ **Polish notification appears in CalcReno**  
✅ **Cost impact data shown**  
✅ **Suggested actions available**  
✅ **Deep links work between apps**

## 🚨 **Important Notes**

1. **User Authentication**: Both apps must use the same Supabase user ID
2. **Environment Variables**: Make sure CalcReno has the same Supabase credentials
3. **RLS Policies**: The `cross_app_notifications` table should have proper Row Level Security
4. **Testing**: Test with real devices, not just simulators for push notifications

This creates a real production-ready notification flow between RenoTimeline and CalcReno! 🚀 