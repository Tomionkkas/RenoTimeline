
import { useState, useEffect } from 'react';

interface DemoUser {
  id: string;
  user_metadata: {
    first_name: string;
    last_name: string;
  };
  email: string;
}

interface DemoProject {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  created_at: string;
}

interface DemoTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id: string;
  due_date: string;
  estimated_hours: number;
}

export const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser] = useState<DemoUser>({
    id: 'demo-user-123',
    user_metadata: {
      first_name: 'Jan',
      last_name: 'Kowalski'
    },
    email: 'demo@renotimeline.pl'
  });

  const [demoProjects] = useState<DemoProject[]>([
    {
      id: 'demo-project-1',
      name: 'Remont łazienki',
      description: 'Kompleksowy remont głównej łazienki - wymiana płytek, instalacji i armatury',
      status: 'active',
      start_date: '2024-01-15',
      end_date: '2024-03-30',
      budget: 25000,
      created_at: '2024-01-10T10:00:00Z'
    },
    {
      id: 'demo-project-2',
      name: 'Modernizacja kuchni',
      description: 'Wymiana mebli kuchennych, AGD i oświetlenia',
      status: 'active',
      start_date: '2024-02-01',
      end_date: '2024-04-15',
      budget: 35000,
      created_at: '2024-01-25T14:30:00Z'
    }
  ]);

  const [demoTasks] = useState<DemoTask[]>([
    {
      id: 'demo-task-1',
      title: 'Zdemontować starą armaturę',
      description: 'Usunięcie starej baterii, sedesu i umywalki',
      status: 'done',
      priority: 'high',
      project_id: 'demo-project-1',
      due_date: '2024-01-20',
      estimated_hours: 8
    },
    {
      id: 'demo-task-2',
      title: 'Położyć nowe płytki',
      description: 'Układanie płytek ceramicznych na ścianach i podłodze',
      status: 'in_progress',
      priority: 'high',
      project_id: 'demo-project-1',
      due_date: '2024-02-15',
      estimated_hours: 24
    },
    {
      id: 'demo-task-3',
      title: 'Zamontować nową armaturę',
      description: 'Instalacja nowej baterii, sedesu i umywalki',
      status: 'todo',
      priority: 'medium',
      project_id: 'demo-project-1',
      due_date: '2024-03-10',
      estimated_hours: 12
    },
    {
      id: 'demo-task-4',
      title: 'Zaprojektować układ mebli',
      description: 'Stworzenie projektu rozmieszczenia mebli kuchennych',
      status: 'done',
      priority: 'high',
      project_id: 'demo-project-2',
      due_date: '2024-02-05',
      estimated_hours: 6
    },
    {
      id: 'demo-task-5',
      title: 'Zamówić meble kuchenne',
      description: 'Złożenie zamówienia na meble zgodnie z projektem',
      status: 'in_progress',
      priority: 'medium',
      project_id: 'demo-project-2',
      due_date: '2024-02-28',
      estimated_hours: 4
    }
  ]);

  const enableDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem('renotimeline_demo_mode', 'true');
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem('renotimeline_demo_mode');
  };

  useEffect(() => {
    const storedDemoMode = localStorage.getItem('renotimeline_demo_mode');
    if (storedDemoMode === 'true') {
      setIsDemoMode(true);
    }
  }, []);

  return {
    isDemoMode,
    demoUser,
    demoProjects,
    demoTasks,
    enableDemoMode,
    disableDemoMode
  };
};
