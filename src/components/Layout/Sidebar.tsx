
import React from 'react';
import { 
  Calendar, 
  KanbanSquare, 
  Users, 
  FileText, 
  Settings, 
  Bell,
  Home,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'calendar', label: 'Kalendarz', icon: Calendar },
  { id: 'kanban', label: 'Zadania', icon: KanbanSquare },
  { id: 'team', label: 'Zespół', icon: Users },
  { id: 'documents', label: 'Dokumenty', icon: FileText },
  { id: 'notifications', label: 'Powiadomienia', icon: Bell },
  { id: 'settings', label: 'Ustawienia', icon: Settings },
];

const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  return (
    <div className="w-64 h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">RenoTimeline</h1>
            <p className="text-sm text-gray-400">Organizer zespołowy</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                    activeSection === item.id
                      ? "bg-gradient-accent text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">JK</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">Jan Kowalski</p>
            <p className="text-gray-400 text-sm">jan@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
