import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Settings as SettingsIcon, AlertTriangle, Upload, Eye, EyeOff, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Profile Settings Component
const ProfileSettings = () => {
  const { user, uploadAvatar } = useAuth();
  const { profile, updateProfile, getInitials } = useProfile();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    expertise: '',
    avatar_url: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        expertise: profile.expertise || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Nieprawidłowy typ pliku',
        description: 'Proszę wybrać plik obrazu (PNG, JPG, JPEG, WebP)',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'Plik za duży',
        description: 'Rozmiar pliku nie może przekraczać 5MB',
        variant: 'destructive'
      });
      return;
    }

    setAvatarFile(file);
    setIsUploading(true);

    try {
      const avatarUrl = await uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));

      toast({
        title: 'Zdjęcie przesłane',
        description: 'Zdjęcie profilowe zostało zaktualizowane'
      });
    } catch (error) {
      toast({
        title: 'Błąd przesyłania',
        description: 'Nie udało się przesłać zdjęcia profilowego',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        expertise: formData.expertise,
        avatar_url: formData.avatar_url
      });
      
      toast({
        title: 'Profil zaktualizowany',
        description: 'Zmiany zostały pomyślnie zapisane'
      });
    } catch (error) {
      toast({
        title: 'Błąd aktualizacji',
        description: 'Nie udało się zaktualizować profilu',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <User className="h-5 w-5" />
          Ustawienia profilu
        </CardTitle>
        <CardDescription className="text-white/60">
          Zarządzaj swoimi danymi osobowymi i informacjami profilowymi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg">
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 rounded-full p-2 cursor-pointer transition-colors shadow-lg">
                <Upload className="h-4 w-4 text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>
            <div>
              <h3 className="font-medium text-white">Zdjęcie profilowe</h3>
              <p className="text-sm text-white/60">JPG, PNG lub WebP. Maksymalnie 5MB.</p>
              {isUploading && <p className="text-sm text-blue-400">Przesyłanie...</p>}
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-white/80">Imię</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="Wprowadź swoje imię"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-white/80">Nazwisko</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Wprowadź swoje nazwisko"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expertise" className="text-white/80">Specjalizacja / Bio</Label>
            <Textarea
              id="expertise"
              name="expertise"
              value={formData.expertise}
              onChange={handleInputChange}
              placeholder="Opisz swoją specjalizację lub dodaj krótką biografię..."
              rows={3}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
            />
            <p className="text-sm text-white/60">
              {formData.expertise.length}/500 znaków
            </p>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Account Settings Component
const AccountSettings = () => {
  const { user, changeEmail } = useAuth();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !currentPassword) {
      toast({
        title: 'Wypełnij wszystkie pola',
        description: 'Wprowadź nowy email i aktualne hasło',
        variant: 'destructive'
      });
      return;
    }

    setIsChangingEmail(true);
    try {
      await changeEmail(newEmail, currentPassword);
      
      toast({
        title: 'Email wysłany',
        description: 'Sprawdź swoją skrzynkę pocztową i potwierdź zmianę adresu email'
      });
      
      setNewEmail('');
      setCurrentPassword('');
    } catch (error) {
      toast({
        title: 'Błąd zmiany email',
        description: 'Nie udało się zmienić adresu email. Sprawdź hasło i spróbuj ponownie.',
        variant: 'destructive'
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Mail className="h-5 w-5" />
          Ustawienia konta
        </CardTitle>
        <CardDescription className="text-white/60">
          Zarządzaj podstawowymi ustawieniami swojego konta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Email */}
        <div className="space-y-2">
          <Label className="text-white/80">Aktualny adres email</Label>
          <Input 
            value={user?.email || ''} 
            disabled 
            className="bg-white/10 border-white/20 text-white/60"
          />
        </div>
        
        <Separator className="bg-white/10" />

        {/* Change Email */}
        <form onSubmit={handleEmailChange} className="space-y-4">
          <h3 className="text-lg font-medium text-white">Zmień adres email</h3>
          
          <div className="space-y-2">
            <Label htmlFor="new_email" className="text-white/80">Nowy adres email</Label>
            <Input
              id="new_email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nowy@email.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_password" className="text-white/80">Aktualne hasło</Label>
            <Input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Wprowadź aktualne hasło"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <p className="text-sm text-amber-200">
              ℹ️ Po zmianie adresu email otrzymasz wiadomość potwierdzającą na nowy adres. 
              Kliknij link w wiadomości, aby dokończyć zmianę.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isChangingEmail}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {isChangingEmail ? 'Wysyłanie...' : 'Wyślij email potwierdzający'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Security Settings Component
const SecuritySettings = () => {
  const { changePassword } = useAuth();
  const { toast } = useToast();
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
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        title: 'Wypełnij wszystkie pola',
        description: 'Wszystkie pola hasła są wymagane',
        variant: 'destructive'
      });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: 'Hasła nie są identyczne',
        description: 'Nowe hasło i potwierdzenie muszą być takie same',
        variant: 'destructive'
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        title: 'Hasło za słabe',
        description: 'Hasło musi mieć co najmniej 8 znaków',
        variant: 'destructive'
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwords.current, passwords.new);
      
      toast({
        title: 'Hasło zmienione',
        description: 'Hasło zostało pomyślnie zaktualizowane'
      });
      
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast({
        title: 'Błąd zmiany hasła',
        description: 'Nie udało się zmienić hasła. Sprawdź aktualne hasło i spróbuj ponownie.',
        variant: 'destructive'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5" />
          Bezpieczeństwo
        </CardTitle>
        <CardDescription className="text-white/60">
          Zarządzaj hasłem i ustawieniami bezpieczeństwa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <h3 className="text-lg font-medium text-white">Zmień hasło</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-white/80">Aktualne hasło</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  placeholder="Wprowadź aktualne hasło"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/60 hover:text-white"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-white/80">Nowe hasło</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Wprowadź nowe hasło"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/60 hover:text-white"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-white/80">Potwierdź nowe hasło</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Potwierdź nowe hasło"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/60 hover:text-white"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-200 mb-2">Wymagania dotyczące hasła:</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Co najmniej 8 znaków</li>
              <li>• Zalecane: wielkie i małe litery</li>
              <li>• Zalecane: cyfry i znaki specjalne</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            disabled={isChangingPassword}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {isChangingPassword ? 'Zmienianie hasła...' : 'Zmień hasło'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Preferences Settings Component
const PreferencesSettings = () => {
  const { settings, updateSettings } = useProfile();
  const { toast } = useToast();

  const updatePreference = async (key: string, value: any) => {
    try {
      await updateSettings({ [key]: value });
    } catch (error) {
      console.error('Update preference error:', error);
    }
  };

  return (
    <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <SettingsIcon className="h-5 w-5" />
          Preferencje
        </CardTitle>
        <CardDescription className="text-white/60">
          Dostosuj aplikację do swoich potrzeb
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Appearance */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Wygląd</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80">Motyw</Label>
              <Select value={settings.theme} onValueChange={(value) => updatePreference('theme', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                  <SelectItem value="dark" className="text-white/80 hover:text-white hover:bg-white/20">Ciemny</SelectItem>
                  <SelectItem value="light" className="text-white/80 hover:text-white hover:bg-white/20">Jasny</SelectItem>
                  <SelectItem value="system" className="text-white/80 hover:text-white hover:bg-white/20">Systemowy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Język</Label>
              <Select value={settings.language} onValueChange={(value) => updatePreference('language', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                  <SelectItem value="pl" className="text-white/80 hover:text-white hover:bg-white/20">Polski</SelectItem>
                  <SelectItem value="en" className="text-white/80 hover:text-white hover:bg-white/20">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Powiadomienia</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Powiadomienia email</p>
                <p className="text-sm text-white/60">Otrzymuj powiadomienia na adres email</p>
              </div>
              <Switch
                checked={settings.notifications_enabled}
                onCheckedChange={(checked) => updatePreference('notifications_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Automatyczne zapisywanie</p>
                <p className="text-sm text-white/60">Automatycznie zapisuj zmiany</p>
              </div>
              <Switch
                checked={settings.auto_save}
                onCheckedChange={(checked) => updatePreference('auto_save', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Wibracje</p>
                <p className="text-sm text-white/60">Włącz wibracje dotykowe</p>
              </div>
              <Switch
                checked={settings.haptic_feedback}
                onCheckedChange={(checked) => updatePreference('haptic_feedback', checked)}
              />
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Calendar */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Kalendarz</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80">Jednostka miary</Label>
              <Select value={settings.measurement_unit} onValueChange={(value) => updatePreference('measurement_unit', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                  <SelectItem value="metric" className="text-white/80 hover:text-white hover:bg-white/20">Metryczne</SelectItem>
                  <SelectItem value="imperial" className="text-white/80 hover:text-white hover:bg-white/20">Imperialne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Domyślny status projektu</Label>
              <Select value={settings.default_project_status} onValueChange={(value) => updatePreference('default_project_status', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                  <SelectItem value="Planowany" className="text-white/80 hover:text-white hover:bg-white/20">Planowany</SelectItem>
                  <SelectItem value="W trakcie" className="text-white/80 hover:text-white hover:bg-white/20">W trakcie</SelectItem>
                  <SelectItem value="Zakończony" className="text-white/80 hover:text-white hover:bg-white/20">Zakończony</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Godziny ciszy</p>
              <p className="text-sm text-white/60">Wycisz powiadomienia w określonych godzinach</p>
            </div>
            <Switch
              checked={settings.quiet_hours.enabled}
              onCheckedChange={(checked) => updatePreference('quiet_hours', { ...settings.quiet_hours, enabled: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Danger Zone Settings Component
const DangerZoneSettings = () => {
  const { user, deleteAccount } = useAuth();
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);

  const handleDataExport = async () => {
    setIsExportingData(true);
    try {
      // TODO: Implement data export functionality
      
      toast({
        title: 'Eksport rozpoczęty',
        description: 'Dane zostaną przygotowane i pobrane w ciągu kilku minut'
      });
    } catch (error) {
      toast({
        title: 'Błąd eksportu',
        description: 'Nie udało się wyeksportować danych',
        variant: 'destructive'
      });
    } finally {
      setIsExportingData(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (deleteConfirmation !== 'USUŃ KONTO') {
      toast({
        title: 'Nieprawidłowe potwierdzenie',
        description: 'Wpisz "USUŃ KONTO" aby potwierdzić',
        variant: 'destructive'
      });
      return;
    }

    if (!deletePassword) {
      toast({
        title: 'Wprowadź hasło',
        description: 'Hasło jest wymagane do usunięcia konta',
        variant: 'destructive'
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount(deletePassword, deleteConfirmation);
      
      toast({
        title: 'Konto zostało usunięte',
        description: 'Twoje konto i wszystkie dane zostały trwale usunięte'
      });
    } catch (error) {
      toast({
        title: 'Błąd usuwania konta',
        description: 'Nie udało się usunąć konta',
        variant: 'destructive'
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="h-5 w-5" />
          Zarządzanie kontem
        </CardTitle>
        <CardDescription className="text-white/60">
          Nieodwracalne akcje związane z Twoim kontem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Export */}
        <div className="border border-white/20 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-2">Eksport danych</h3>
          <p className="text-white/60 mb-4">
            Pobierz kopię wszystkich swoich danych w formacie JSON.
          </p>
          <Button
            onClick={handleDataExport}
            disabled={isExportingData}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExportingData ? 'Eksportowanie...' : 'Eksportuj dane'}
          </Button>
        </div>

        <Separator className="bg-white/10" />

        {/* Account Deletion */}
        <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-400 mb-2">Usuń konto</h3>
          <p className="text-white/60 mb-4">
            Ta akcja jest nieodwracalna. Wszystkie Twoje dane, projekty i zadania zostaną trwale usunięte.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete_confirmation" className="text-white/80">
                Wpisz "USUŃ KONTO" aby potwierdzić:
              </Label>
              <Input
                id="delete_confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="USUŃ KONTO"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete_password" className="text-white/80">Wprowadź hasło:</Label>
              <Input
                id="delete_password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Twoje hasło"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/30"
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={deleteConfirmation !== 'USUŃ KONTO' || !deletePassword}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Usuń konto na zawsze
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Czy jesteś pewny?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/60">
                    Ta akcja nie może zostać cofnięta. Spowoduje to trwałe usunięcie Twojego konta
                    i wszystkich powiązanych danych z naszych serwerów.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Anuluj
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAccountDeletion}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isDeletingAccount}
                  >
                    {isDeletingAccount ? 'Usuwanie...' : 'Tak, usuń konto'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Settings Panel Component
const SettingsPanel = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Ustawienia</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl inline-flex p-1 rounded-lg">
            <TabsTrigger value="profile" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Konto</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Bezpieczeństwo</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Preferencje</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center space-x-2 bg-transparent data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white rounded-md transition-all duration-300 px-4 py-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Zarządzanie</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="profile" className="animate-fadeIn">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="account" className="animate-fadeIn">
          <AccountSettings />
        </TabsContent>
        
        <TabsContent value="security" className="animate-fadeIn">
          <SecuritySettings />
        </TabsContent>
        
        <TabsContent value="preferences" className="animate-fadeIn">
          <PreferencesSettings />
        </TabsContent>
        
        <TabsContent value="danger" className="animate-fadeIn">
          <DangerZoneSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPanel;
