
import React, { useState } from 'react';
import { Bell, User, Palette, Globe, Shield, TestTube } from 'lucide-react';
import { useDummyMode } from '@/hooks/useDummyMode';
import { useToast } from '@/hooks/use-toast';

const settingsSections = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'notifications', label: 'Powiadomienia', icon: Bell },
  { id: 'appearance', label: 'Wygląd', icon: Palette },
  { id: 'language', label: 'Język', icon: Globe },
  { id: 'developer', label: 'Deweloper', icon: TestTube },
  { id: 'security', label: 'Bezpieczeństwo', icon: Shield },
];

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
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Ustawienia profilu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Imię i nazwisko</label>
                <input
                  type="text"
                  defaultValue="Jan Kowalski"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="jan@example.com"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stanowisko</label>
                <input
                  type="text"
                  defaultValue="Project Manager"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Telefon</label>
                <input
                  type="tel"
                  defaultValue="+48 123 456 789"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );
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
