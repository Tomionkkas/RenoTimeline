import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { 
  LayoutDashboard, 
  Folder, 
  Kanban, 
  Calendar, 
  Settings, 
  Plus, 
  Search,
  FileText,
  User,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DialogTitle } from '@radix-ui/react-dialog';

export function CommandCenter() {
  const [open, setOpen] = useState(false);
  const [platformKey, setPlatformKey] = useState('Ctrl');
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Detect platform
    if (typeof navigator !== 'undefined') {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                    navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
      setPlatformKey(isMac ? '⌘' : 'Ctrl');
    }

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden shadow-2xl max-w-2xl bg-slate-950 border-slate-800">
        <VisuallyHidden>
            <DialogTitle>Command Center</DialogTitle>
        </VisuallyHidden>
        <Command className="[&_[cmdk-root]]:h-full w-full bg-transparent">
          <div className="flex items-center border-b border-slate-800 px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-white" />
            <Command.Input 
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 text-white disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden py-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-medium text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-slate-500">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/', { state: { action: 'create-task' } }))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create New Task</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/', { state: { action: 'create-project' } }))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
              >
                <Folder className="mr-2 h-4 w-4" />
                <span>Create New Project</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-slate-500">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/', { state: { tab: 'dashboard' } }))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/', { state: { tab: 'kanban' } }))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
              >
                <Kanban className="mr-2 h-4 w-4" />
                <span>Kanban Board</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/', { state: { tab: 'projects' } }))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
              >
                <Folder className="mr-2 h-4 w-4" />
                <span>Projects</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/', { state: { tab: 'calendar' } }))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Calendar</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/', { state: { tab: 'settings' } }))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>

            {projects && projects.length > 0 && (
              <Command.Group heading="Projects" className="px-2 py-1.5 text-xs font-medium text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-slate-500">
                {projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    onSelect={() => runCommand(() => navigate(`/project/${project.id}`))}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    <span>{project.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {tasks && tasks.length > 0 && (
              <Command.Group heading="Recent Tasks" className="px-2 py-1.5 text-xs font-medium text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-slate-500">
                {tasks.slice(0, 5).map((task) => (
                  <Command.Item
                    key={task.id}
                    onSelect={() => runCommand(() => navigate('/', { state: { tab: 'kanban', itemId: task.id } }))}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{task.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Theme" className="px-2 py-1.5 text-xs font-medium text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-slate-500">
              <Command.Item
                onSelect={() => runCommand(() => setTheme('light'))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
              >
                <Sun className="mr-2 h-4 w-4" />
                <span>Light Mode</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setTheme('dark'))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
              >
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark Mode</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setTheme('system'))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-800 aria-selected:text-white text-slate-300"
              >
                <Laptop className="mr-2 h-4 w-4" />
                <span>System Theme</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

