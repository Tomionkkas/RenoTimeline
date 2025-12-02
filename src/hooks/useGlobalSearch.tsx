import { useState, useEffect, useMemo } from 'react';
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
  const [loading, setLoading] = useState(false);

  const results = useMemo(() => {
    if (query.trim() === '') {
      return [];
    }

    setLoading(true);

    const lowerCaseQuery = query.toLowerCase();

    const projectResults: SearchResult[] = projects
      .filter(project => project.name.toLowerCase().includes(lowerCaseQuery))
      .map(project => ({ type: 'project', item: project }));

    const taskResults: SearchResult[] = tasks
      .filter(task => task.title.toLowerCase().includes(lowerCaseQuery))
      .map(task => ({ type: 'task', item: task }));

    setLoading(false);
    return [...projectResults, ...taskResults];
  }, [query, projects, tasks]);

  return { results, loading };
}; 