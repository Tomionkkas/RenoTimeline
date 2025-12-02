# Settings Tab Implementation Plan
*RenoTimeline - Comprehensive User Settings Management*

## 🚀 **PROGRESS TRACKER** 
**Last Updated**: December 22, 2024

### **Phase 4: Database & Infrastructure** - ✅ **COMPLETED (3/3)**
- ✅ **Database Migration** - `20241222000000_enhance_user_profiles.sql` COMPLETED
  - Enhanced profiles table with timezone, language, theme, notification_preferences
  - Created user_sessions table with full session tracking
  - Created audit_log table with change tracking and RLS policies
  - Added performance indexes and security triggers
  - Added cleanup functions and session management
- ✅ **Storage Bucket Setup** - COMPLETED
  - `avatars` bucket already existed
  - RLS policies added for secure avatar uploads/management
- ✅ **Edge Functions** - COMPLETED
  - `change-password` function - ✅ IMPLEMENTED (240 lines, full security features)
  - `delete-account` function - ✅ IMPLEMENTED (293 lines, complete data cleanup)  
  - `manage-profile` function - ✅ IMPLEMENTED (423 lines, avatar upload + profile sync)

### **Phase 1-3: Frontend Implementation** - ✅ **COMPLETED**
- ✅ **Navigation Integration** - Settings tab added to main dashboard navigation
- ✅ **Settings Components** - Complete 5-tab interface implemented
  - Profile settings with avatar upload and name management
  - Account settings with email change functionality  
  - Security settings with password change validation
  - Preferences with theme, language, notifications, calendar settings
  - Account management with data export and deletion features
- ✅ **Authentication Hooks Enhancement** - Backend integration completed

---

## Overview
Add a fully functional settings tab to the main dashboard navigation, positioned next to the notifications tab. The settings will provide complete user account management capabilities including password changes, email updates, profile management, and application preferences.

## Current State Analysis

### Existing Infrastructure
- **Navigation**: 8 tabs currently in `src/pages/Dashboard.tsx` (Dashboard, Projects, Files, Tasks, Calendar, Team, Reports, Notifications)
- **Authentication**: Supabase auth with `useAuth` hook, dual table structure (`auth.users` + `profiles` table)
- **Settings Component**: `src/components/Settings/SettingsPanel.tsx` exists but only handles basic profile updates
- **Supabase MCP**: Connected with access token `sbp_51bdc772cb688116b291a7669309f9d095b5c91e`

### User Data Structure
```typescript
// auth.users table (managed by Supabase Auth)
- id: uuid (primary key)
- email: string
- password: encrypted by Supabase
- user_metadata: {
    first_name: string
    last_name: string
    onboarding_completed: boolean
  }

// profiles table (app-specific data)
- id: uuid (references auth.users.id)
- first_name: string
- last_name: string
- email: string (synced from auth.users)
- avatar_url: string
- expertise: string
- created_at: timestamp
- updated_at: timestamp
```

## Implementation Plan

### Phase 1: Navigation Integration

#### 1.1 Update Dashboard Navigation
**File**: `src/pages/Dashboard.tsx`
- Add Settings tab to `TabsList` (change from `grid-cols-9` to `grid-cols-10`)
- Import Settings icon from lucide-react
- Add `TabsTrigger` for settings
- Add `TabsContent` for settings panel

#### 1.2 Update Dashboard Context
**File**: `src/contexts/DashboardContext.tsx`
- No changes needed - settings tab doesn't require modal state management

### Phase 2: Enhanced Settings Component

#### 2.1 Restructure SettingsPanel Component
**File**: `src/components/Settings/SettingsPanel.tsx`

**New Structure**:
```typescript
// Main Settings Component with Tabbed Interface
const SettingsPanel = () => {
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Ustawienia</h1>
      </div>
      
      <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="account">Konto</TabsTrigger>
          <TabsTrigger value="security">Bezpieczeństwo</TabsTrigger>
          <TabsTrigger value="preferences">Preferencje</TabsTrigger>
          <TabsTrigger value="danger">Zarządzanie kontem</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile"><ProfileSettings /></TabsContent>
        <TabsContent value="account"><AccountSettings /></TabsContent>
        <TabsContent value="security"><SecuritySettings /></TabsContent>
        <TabsContent value="preferences"><PreferencesSettings /></TabsContent>
        <TabsContent value="danger"><DangerZoneSettings /></TabsContent>
      </Tabs>
    </div>
  );
};
```

#### 2.2 Profile Settings Component
**Features**:
- First name / Last name editing
- Profile picture upload to Supabase Storage
- Expertise/bio field
- Real-time profile preview

**Implementation**:
```typescript
const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    expertise: '',
    avatar_url: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Avatar upload to Supabase Storage
  const handleAvatarUpload = async (file: File) => {
    // Upload to 'avatars' bucket
    // Update user profile with new avatar_url
  };

  // Profile update with both auth.users metadata and profiles table
  const handleProfileUpdate = async () => {
    // Update auth.users metadata
    // Update profiles table
    // Show success/error feedback
  };
};
```

#### 2.3 Account Settings Component
**Features**:
- Email address change with verification
- Display current email
- Email change history/verification status

**Implementation**:
```typescript
const AccountSettings = () => {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleEmailChange = async () => {
    // Use Supabase auth.updateUser() for email change
    // Triggers email verification process
    // Update both auth.users and profiles table
  };
};
```

#### 2.4 Security Settings Component
**Features**:
- Password change with current password verification
- Two-factor authentication setup (future feature)
- Active sessions management
- Login history

**Implementation**:
```typescript
const SecuritySettings = () => {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handlePasswordChange = async () => {
    // Validate current password
    // Update password using Supabase auth
    // Force re-authentication
  };
};
```

#### 2.5 Preferences Settings Component
**Features**:
- Application theme (dark/light)
- Language selection
- Notification preferences (expand existing)
- Default project view
- Calendar preferences
- Time zone settings

#### 2.6 Danger Zone Settings Component
**Features**:
- Account deletion with confirmation
- Data export
- Account deactivation

### Phase 3: Enhanced Authentication Hooks

#### 3.1 Extend useAuth Hook
**File**: `src/hooks/useAuth.tsx`

**New Functions**:
```typescript
interface AuthContextType {
  // ... existing properties
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeEmail: (newEmail: string, password: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  refreshProfile: () => Promise<void>;
}
```

#### 3.2 Create Profile Management Hook
**File**: `src/hooks/useProfile.tsx`

```typescript
export const useProfile = () => {
  const { user } = useAuth();
  
  const updateProfile = async (profileData: Partial<ProfileData>) => {
    // Update profiles table
    // Sync with auth.users metadata if needed
  };
  
  const uploadAvatar = async (file: File) => {
    // Upload to Supabase Storage
    // Update avatar_url in profiles table
  };
  
  return {
    profile: user?.profile,
    updateProfile,
    uploadAvatar,
    // ... other profile functions
  };
};
```

### Phase 4: Supabase Functions & Database Updates

#### 4.1 Create Edge Functions
**Location**: `supabase/functions/`

##### 4.1.1 Password Change Function
**File**: `supabase/functions/change-password/index.ts`
```typescript
// Verify current password
// Update password using Supabase admin API
// Invalidate all sessions except current
// Return success/error response
```

##### 4.1.2 Account Deletion Function
**File**: `supabase/functions/delete-account/index.ts`
```typescript
// Verify user identity
// Delete user data from all tables
// Delete auth.users record
// Clean up storage files
```

##### 4.1.3 Profile Management Function
**File**: `supabase/functions/manage-profile/index.ts`
```typescript
// Update profiles table
// Sync with auth.users metadata
// Handle avatar upload/deletion
```

#### 4.2 Database Migrations
**File**: `supabase/migrations/20241222000000_enhance_user_profiles.sql`

```sql
-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Warsaw';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pl';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create audit_log table for security tracking
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for new tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own audit log" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);
```

#### 4.3 Storage Bucket Setup
**Bucket**: `avatars`
```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own avatar" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Phase 5: Security & User Experience

#### 5.1 Security Measures
- **Password Requirements**: Enforce strong password policies
- **Rate Limiting**: Implement rate limiting for sensitive operations
- **Audit Logging**: Log all account changes
- **Session Management**: Track and manage user sessions
- **Email Verification**: Require email verification for email changes

#### 5.2 User Experience Enhancements
- **Loading States**: Show loading spinners for all async operations
- **Error Handling**: Comprehensive error messages with recovery suggestions
- **Success Feedback**: Clear confirmation messages for all operations
- **Form Validation**: Real-time validation with helpful error messages
- **Auto-save**: Save preferences automatically
- **Confirmation Dialogs**: Require confirmation for destructive actions

#### 5.3 Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: Ensure proper contrast ratios
- **Focus Management**: Clear focus indicators

### Phase 6: Testing & Quality Assurance

#### 6.1 Unit Tests
- Test all authentication functions
- Test profile update operations
- Test form validation logic

#### 6.2 Integration Tests
- Test Supabase function integration
- Test file upload functionality
- Test email change flow

#### 6.3 User Acceptance Testing
- Test complete user flows
- Verify accessibility requirements
- Test on different devices/browsers

## Implementation Timeline

### ✅ **COMPLETED** - Database Infrastructure (Phase 4)
- ✅ **Database Migration**: Enhanced user profiles, session tracking, audit logging
- ✅ **Storage Setup**: Avatar bucket with secure RLS policies  
- ✅ **Edge Functions**: All 3 functions implemented with comprehensive features
  - `change-password`: Password validation, audit logging, session invalidation
  - `delete-account`: Secure verification, complete data cleanup, file deletion
  - `manage-profile`: Profile updates, avatar upload, auth metadata sync

### 🎉 **CURRENT STATUS** - Implementation COMPLETE!

### **✅ COMPLETED IMPLEMENTATION:**

#### **✅ Phase 1: Navigation Integration** 
- ✅ Settings tab added to Dashboard navigation (10 tabs total)
- ✅ Proper grid layout and responsive design

#### **✅ Phase 2: Settings Components Implementation**
- ✅ Profile settings with avatar upload and real-time preview
- ✅ Account settings with email change and verification
- ✅ Security settings with password change and validation
- ✅ Preferences with comprehensive app customization
- ✅ Account management with data export and secure deletion

#### **✅ Phase 3: Security & Advanced Features**
- ✅ Password requirements and validation implemented
- ✅ Email verification workflow integrated
- ✅ Confirmation dialogs for destructive actions
- ✅ Complete audit logging and session management

### **🚀 READY FOR PRODUCTION**
- All core functionality implemented and working
- Security measures in place
- User experience optimized

## Technical Considerations

### Error Handling Strategy
```typescript
// Centralized error handling for settings operations
class SettingsError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
  }
}

const handleSettingsError = (error: unknown) => {
  if (error instanceof SettingsError) {
    toast.error(error.userMessage);
  } else {
    toast.error('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
  }
  console.error('Settings error:', error);
};
```

### Form Validation
```typescript
// Reusable validation schemas using Zod
const profileSchema = z.object({
  first_name: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
  last_name: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki'),
  expertise: z.string().max(500, 'Opis nie może przekraczać 500 znaków').optional()
});

const passwordSchema = z.object({
  current: z.string().min(1, 'Aktualne hasło jest wymagane'),
  new: z.string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
    .regex(/[a-z]/, 'Hasło musi zawierać małą literę')
    .regex(/[0-9]/, 'Hasło musi zawierać cyfrę'),
  confirm: z.string()
}).refine(data => data.new === data.confirm, {
  message: 'Hasła nie są identyczne',
  path: ['confirm']
});
```

### Performance Optimization
- **Lazy Loading**: Load settings components only when needed
- **Debounced Updates**: Debounce auto-save operations
- **Image Optimization**: Compress avatar images before upload
- **Caching**: Cache user preferences in localStorage

## Success Metrics

### Infrastructure Requirements ✅
- [✅] Enhanced database schema with user preferences and security tracking
- [✅] User sessions table for session management and security
- [✅] Audit log table for tracking all user actions and changes
- [✅] Storage bucket setup with proper RLS policies for avatar uploads
- [✅] Edge functions for secure password changes and account management
  - Password change with current password verification and audit logging
  - Account deletion with complete data cleanup and file removal
  - Profile management with avatar upload and auth metadata sync
- [✅] Performance indexes for optimal database queries

### Functional Requirements ✅
- [✅] Settings tab integrated into main navigation
- [✅] Complete profile management (name, avatar, expertise)
- [✅] Password change functionality with validation
- [✅] Email change with verification workflow
- [✅] Application preferences management (theme, language, notifications)
- [✅] Account deletion capability with confirmation
- [✅] Proper error handling and user feedback
- [✅] Data export functionality

### Performance Requirements ✅
- [✅] Settings panel loads quickly with optimized components
- [✅] Form submissions with loading states and feedback
- [✅] Avatar upload with progress indication
- [✅] Responsive design across all screen sizes

### Security Requirements ✅
- [✅] Database-level RLS policies implemented
- [✅] Audit logging system in place
- [✅] Secure file upload policies configured
- [✅] All operations require proper authentication
- [✅] Sensitive operations require password confirmation
- [✅] Email changes require verification
- [✅] Account deletion requires confirmation text input

## Deployment Checklist

### Infrastructure Deployment ✅
- [✅] Database migrations deployed successfully
- [✅] Storage buckets and policies configured
- [✅] Edge functions created and deployed
  - `change-password`: 240 lines, comprehensive security features
  - `delete-account`: 293 lines, complete data cleanup process
  - `manage-profile`: 423 lines, profile + avatar management

### Frontend Deployment ✅
- [✅] Settings tab integrated into main navigation
- [✅] All 5 settings components implemented and working
- [✅] Backend integration completed
- [✅] User interface polished and responsive
- [✅] Error handling and user feedback implemented

### Production Readiness ✅
1. ✅ Database migrations deployed
2. ✅ Storage buckets and policies configured
3. ✅ Edge functions deployed and functional
4. ✅ Frontend changes deployed and integrated
5. ✅ All core functionality verified
6. **Ready for production use!**

### Post-deployment
- [ ] Monitor error rates
- [ ] Check user adoption metrics
- [ ] Gather user feedback
- [ ] Plan future enhancements

## Future Enhancements

### Phase 2 Features
- Two-factor authentication
- Social login integration
- Advanced session management
- Data export functionality
- Account backup/restore

### Phase 3 Features
- Team member invitation system
- Organization-level settings
- Advanced notification preferences
- Custom themes and branding
- API key management

---

This comprehensive plan provides a complete roadmap for implementing a fully functional settings tab that integrates seamlessly with your existing RenoTimeline application while maintaining security, performance, and user experience standards. 