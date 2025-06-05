
import React, { useState } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import RecentTasks from '@/components/Dashboard/RecentTasks';
import CalendarWidget from '@/components/Dashboard/CalendarWidget';
import KanbanBoard from '@/components/Kanban/KanbanBoard';
import TeamOverview from '@/components/Team/TeamOverview';
import SettingsPanel from '@/components/Settings/SettingsPanel';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Witaj z powrotem! 👋
              </h1>
              <p className="text-gray-400">
                Oto przegląd Twojej produktywności dzisiaj
              </p>
            </div>
            <DashboardStats />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentTasks />
              </div>
              <div className="lg:col-span-1">
                <CalendarWidget />
              </div>
            </div>
          </div>
        );
      case 'kanban':
        return <KanbanBoard />;
      case 'team':
        return <TeamOverview />;
      case 'settings':
        return <SettingsPanel />;
      case 'calendar':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Kalendarz</h1>
              <p className="text-gray-400">Zarządzaj swoim czasem i wydarzeniami</p>
            </div>
            <div className="bg-card rounded-xl border border-gray-800 p-6">
              <p className="text-center text-gray-400 py-12">
                Integracja z Google Calendar i Apple Calendar będzie dostępna wkrótce
              </p>
            </div>
          </div>
        );
      case 'documents':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Dokumenty</h1>
              <p className="text-gray-400">Przechowuj i zarządzaj dokumentami zespołu</p>
            </div>
            <div className="bg-card rounded-xl border border-gray-800 p-6">
              <p className="text-center text-gray-400 py-12">
                System zarządzania dokumentami będzie dostępny wkrótce
              </p>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Powiadomienia</h1>
              <p className="text-gray-400">Centrum powiadomień i alertów</p>
            </div>
            <div className="bg-card rounded-xl border border-gray-800 p-6">
              <p className="text-center text-gray-400 py-12">
                Centrum powiadomień będzie dostępne wkrótce
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Witaj w RenoTimeline! 🚀
              </h1>
              <p className="text-gray-400">
                Nowoczesny organizer zespołowy do zarządzania projektami
              </p>
            </div>
            <DashboardStats />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
