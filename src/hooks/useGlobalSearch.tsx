import { useState, useEffect } from 'react';
import { useProjects } from './useProjects';
import { useTasks } from './useTasks';
import { Project } from './useProjects';
import { Task } from './useTasks';

export interface SearchResult {
  type: 'project' | 'task';
  item: Project | Task;
}

export const useGlobalSearch = (query: string) => {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    setLoading(true);

    const lowerCaseQuery = query.toLowerCase();

    const projectResults: SearchResult[] = projects
      .filter(project => project.name.toLowerCase().includes(lowerCaseQuery))
      .map(project => ({ type: 'project', item: project }));

    const taskResults: SearchResult[] = tasks
      .filter(task => task.title.toLowerCase().includes(lowerCaseQuery))
      .map(task => ({ type: 'task', item: task }));

    setResults([...projectResults, ...taskResults]);
    setLoading(false);
  }, [query, projects, tasks]);

  return { results, loading };
}; 