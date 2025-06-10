import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '@/hooks/useGlobalSearch';
import { Folder, KanbanSquare } from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { Task } from '@/hooks/useTasks';

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  onNavigate: () => void; // Callback to close the search results
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, loading, onNavigate }) => {
  const navigate = useNavigate();
  const projects = results.filter(r => r.type === 'project') as { type: 'project', item: Project }[];
  const tasks = results.filter(r => r.type === 'task') as { type: 'task', item: Task }[];

  const handleNavigate = (type: 'project' | 'task', id: string) => {
    onNavigate(); // Close search results dropdown
    if (type === 'project') {
      navigate('/', { state: { tab: 'projects', itemId: id } });
    } else {
      navigate('/', { state: { tab: 'kanban', itemId: id } });
    }
  };

  if (loading) {
    return (
      <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 p-4">
        <p className="text-center text-gray-400">Brak wyników</p>
      </div>
    );
  }

  return (
    <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
      <div className="p-2">
        {projects.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase px-3 py-2">Projekty</h4>
            <ul>
              {projects.map(({ item }) => (
                <li 
                  key={`project-${item.id}`} 
                  onClick={() => handleNavigate('project', item.id)}
                  className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
                >
                  <Folder className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-white">{item.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {tasks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase px-3 py-2 mt-2">Zadania</h4>
            <ul>
              {tasks.map(({ item }) => (
                <li 
                  key={`task-${item.id}`}
                  onClick={() => handleNavigate('task', item.id)}
                  className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center"
                >
                  <KanbanSquare className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-white">{item.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults; 