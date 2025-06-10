import React, { useState, useEffect } from 'react';
import { Bell, User, Palette, Globe, Shield, TestTube, Settings, Calendar } from 'lucide-react';
import { useDummyMode } from '@/hooks/useDummyMode';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomFieldDefinitionManager } from '@/components/ui/CustomFieldDefinitionManager';

const settingsSections = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'custom-fields', label: 'Pola niestandardowe', icon: Settings },
  { id: 'calendar', label: 'Kalendarz', icon: Calendar },
  { id: 'notifications', label: 'Powiadomienia', icon: Bell },
  { id: 'appearance', label: 'Wygląd', icon: Palette },
  { id: 'language', label: 'Język', icon: Globe },
  { id: 'developer', label: 'Deweloper', icon: TestTube },
  { id: 'security', label: 'Bezpieczeństwo', icon: Shield },
];

const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.user_metadata) {
      setFormData({
        first_name: user.user_metadata.first_name || '',
        last_name: user.user_metadata.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateUser({
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
      // Email is not updated here as it's a separate process in Supabase Auth
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Ustawienia profilu</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Imię</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Nazwisko</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </Button>
      </div>
    </form>
  );
}

const CustomFieldsSettings = () => {
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<'task' | 'project'>('task');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Zarządzanie polami niestandardowymi</h2>
      <p className="text-gray-400">
        Twórz i zarządzaj polami niestandardowymi dla zadań i projektów.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Wybierz projekt</label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz projekt" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Typ elementu</label>
          <Select value={selectedEntityType} onValueChange={(value: 'task' | 'project') => setSelectedEntityType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task">Zadania</SelectItem>
              <SelectItem value="project">Projekty</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProject && (
        <CustomFieldDefinitionManager
          projectId={selectedProject}
          entityType={selectedEntityType}
        />
      )}

      {!selectedProject && (
        <div className="text-center py-8 text-gray-400">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Wybierz projekt, aby zarządzać polami niestandardowymi</p>
        </div>
      )}
    </div>
  );
};

const CalendarSettings = () => {
  const { toast } = useToast();
  
  // Load settings from localStorage
  const [calendarPrefs, setCalendarPrefs] = useState(() => {
    const stored = localStorage.getItem('calendar-preferences');
    return stored ? JSON.parse(stored) : {
      defaultView: 'month',
      firstDayOfWeek: 'monday',
      timeFormat: '24h',
      showWeekNumbers: false,
      showWeekends: true,
      workingHours: {
        start: '09:00',
        end: '17:00'
      }
    };
  });

  const savePreferences = (newPrefs: any) => {
    setCalendarPrefs(newPrefs);
    localStorage.setItem('calendar-preferences', JSON.stringify(newPrefs));
    toast({
      title: 'Ustawienia zapisane',
      description: 'Preferencje kalendarza zostały zaktualizowane',
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Ustawienia kalendarza</h2>
      <p className="text-gray-400">
        Dostosuj sposób wyświetlania i działania kalendarza.
      </p>
      
      <div className="space-y-6">
        {/* Default View */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Domyślny widok kalendarza</label>
          <Select 
            value={calendarPrefs.defaultView} 
            onValueChange={(value) => savePreferences({...calendarPrefs, defaultView: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Miesiąc</SelectItem>
              <SelectItem value="week">Tydzień</SelectItem>
              <SelectItem value="day">Dzień</SelectItem>
              <SelectItem value="timeline">Oś czasu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* First Day of Week */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Pierwszy dzień tygodnia</label>
          <Select 
            value={calendarPrefs.firstDayOfWeek} 
            onValueChange={(value) => savePreferences({...calendarPrefs, firstDayOfWeek: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Poniedziałek</SelectItem>
              <SelectItem value="sunday">Niedziela</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Format */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Format czasu</label>
          <Select 
            value={calendarPrefs.timeFormat} 
            onValueChange={(value) => savePreferences({...calendarPrefs, timeFormat: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24-godzinny</SelectItem>
              <SelectItem value="12h">12-godzinny (AM/PM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Working Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Godziny pracy</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Od</label>
              <input
                type="time"
                value={calendarPrefs.workingHours.start}
                onChange={(e) => savePreferences({
                  ...calendarPrefs, 
                  workingHours: {...calendarPrefs.workingHours, start: e.target.value}
                })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Do</label>
              <input
                type="time"
                value={calendarPrefs.workingHours.end}
                onChange={(e) => savePreferences({
                  ...calendarPrefs, 
                  workingHours: {...calendarPrefs.workingHours, end: e.target.value}
                })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="space-y-4">
          {[
            { 
              key: 'showWeekNumbers', 
              label: 'Pokaż numery tygodni', 
              description: 'Wyświetlaj numery tygodni w widoku kalendarza' 
            },
            { 
              key: 'showWeekends', 
              label: 'Pokaż weekendy', 
              description: 'Wyświetlaj soboty i niedziele w kalendarzu' 
            },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <p className="text-white font-medium">{setting.label}</p>
                <p className="text-gray-400 text-sm">{setting.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={calendarPrefs[setting.key]}
                  onChange={(e) => savePreferences({
                    ...calendarPrefs, 
                    [setting.key]: e.target.checked
                  })}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-sm">
            📅 Te ustawienia wpływają na sposób wyświetlania kalendarza w całej aplikacji. 
            Zmiany są zapisywane automatycznie i synchronizowane między sesjami.
          </p>
        </div>
      </div>
    </div>
  );
};

const SettingsPanel = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const { isDummyMode, toggleDummyMode } = useDummyMode();
  const { toast } = useToast();

  const handleDummyModeToggle = () => {
    toggleDummyMode();
    toast({
      title: isDummyMode ? 'Tryb produkcyjny aktywowany' : 'Tryb demo aktywowany',
      description: isDummyMode 
        ? 'Aplikacja używa teraz prawdziwych danych' 
        : 'Aplikacja używa teraz przykładowych danych',
    });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'custom-fields':
        return <CustomFieldsSettings />;
      case 'calendar':
        return <CalendarSettings />;
      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Ustawienia powiadomień</h2>
            <div className="space-y-4">
              {[
                { label: 'Powiadomienia email', description: 'Otrzymuj powiadomienia na email' },
                { label: 'Powiadomienia push', description: 'Powiadomienia w przeglądarce' },
                { label: 'Powiadomienia SMS', description: 'Ważne powiadomienia na telefon' },
                { label: 'Powiadomienia o zadaniach', description: 'Informacje o nowych zadaniach' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      case 'developer':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Ustawienia deweloperskie</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">Tryb demo</p>
                  <p className="text-gray-400 text-sm">
                    {isDummyMode 
                      ? 'Aplikacja używa przykładowych danych' 
                      : 'Aplikacja używa prawdziwych danych z bazy'
                    }
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isDummyMode}
                    onChange={handleDummyModeToggle}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  💡 Tryb demo pozwala na testowanie aplikacji z przykładowymi danymi. 
                  Przełącz na tryb produkcyjny aby używać prawdziwych danych z bazy.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">Wybierz sekcję z menu po lewej stronie</p>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Ustawienia</h1>
        <p className="text-gray-400">Dostosuj aplikację do swoich potrzeb</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-gray-800 p-4">
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gradient-accent text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-card rounded-xl border border-gray-800 p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
