# Quick Setup Checklist: RenoTimeline ↔ CalcReno Integration

## ✅ **Prerequisites** 
- [ ] CalcReno app already uses Supabase ✅ (confirmed from GitHub)
- [ ] Both apps use same Supabase project
- [ ] Both apps have same user authentication system

## 🚀 **5-Minute Setup**

### **Step 1: Enable Database** (RenoTimeline)
```bash
cd supabase
supabase migration up
```

### **Step 2: Uncomment Real Notifications** (RenoTimeline)
In `src/lib/services/CalcRenoEventDetector.ts` line ~300:
```typescript
// UNCOMMENT THIS:
const { error } = await supabase
  .from('cross_app_notifications')
  .insert(notificationData);
```

### **Step 3: Add CalcReno Hook** (CalcReno)
Copy from `docs/CALCRENO_CONNECTION_GUIDE.md` Step 3 → create `useRenoTimelineNotifications.ts`

### **Step 4: Add CalcReno Component** (CalcReno)  
Copy from `docs/CALCRENO_CONNECTION_GUIDE.md` Step 4 → create `RenoTimelineNotifications.tsx`

### **Step 5: Add to CalcReno Navigation** (CalcReno)
Add notification screen to your navigation

## 🧪 **Test It**

1. **RenoTimeline**: Move task to "Ukończone" 
2. **Check console**: See "🧪 CalcReno Event: Task Completed"
3. **CalcReno**: Should receive real-time notification

## 🔧 **If Issues**

**No notifications in CalcReno?**
- Check environment variables (Supabase URL/keys)
- Check user ID matches between apps
- Check database migrations applied
- Check RLS policies on `cross_app_notifications`

**Notifications created but not received?**
- Check CalcReno Supabase connection
- Check real-time subscription logs
- Check user authentication

## 🎯 **Expected Flow**

```
RenoTimeline Task Complete → Database Insert → Real-time → CalcReno Notification
```

**Ready in ~10 minutes!** 🚀 