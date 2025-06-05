
import React from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';

const columns = [
  {
    id: 'todo',
    title: 'Do zrobienia',
    color: 'bg-gray-400',
    tasks: [
      { id: 1, title: 'Przygotowanie mockupów', assignee: 'AN', priority: 'high' },
      { id: 2, title: 'Aktualizacja dokumentacji', assignee: 'MW', priority: 'low' },
    ],
  },
  {
    id: 'progress',
    title: 'W toku',
    color: 'bg-blue-400',
    tasks: [
      { id: 3, title: 'Implementacja API', assignee: 'PK', priority: 'high' },
      { id: 4, title: 'Testy jednostkowe', assignee: 'TN', priority: 'medium' },
    ],
  },
  {
    id: 'review',
    title: 'Do przeglądu',
    color: 'bg-yellow-400',
    tasks: [
      { id: 5, title: 'Code review modułu auth', assignee: 'JK', priority: 'medium' },
    ],
  },
  {
    id: 'done',
    title: 'Ukończone',
    color: 'bg-green-400',
    tasks: [
      { id: 6, title: 'Setup projektu', assignee: 'AN', priority: 'high' },
      { id: 7, title: 'Konfiguracja CI/CD', assignee: 'PK', priority: 'medium' },
    ],
  },
];

const priorityColors = {
  high: 'border-l-red-400',
  medium: 'border-l-yellow-400',
  low: 'border-l-green-400',
};

const KanbanBoard = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Tablica Kanban</h1>
        <p className="text-gray-400">Zarządzaj zadaniami zespołu</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {columns.map((column, columnIndex) => (
          <div
            key={column.id}
            className="bg-card rounded-xl border border-gray-800 p-4 animate-fade-in"
            style={{ animationDelay: `${columnIndex * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                <h3 className="font-semibold text-white">{column.title}</h3>
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                  {column.tasks.length}
                </span>
              </div>
              <button className="p-1 hover:bg-gray-700 rounded">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {column.tasks.map((task, taskIndex) => (
                <div
                  key={task.id}
                  className={`p-3 bg-gray-800 rounded-lg border-l-4 ${priorityColors[task.priority as keyof typeof priorityColors]} hover:bg-gray-700 transition-colors cursor-pointer animate-fade-in`}
                  style={{ animationDelay: `${(columnIndex * 100) + (taskIndex * 50)}ms` }}
                >
                  <h4 className="text-white text-sm font-medium mb-2">{task.title}</h4>
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">{task.assignee}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.priority === 'high' ? 'bg-red-400/10 text-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
                      'bg-green-400/10 text-green-400'
                    }`}>
                      {task.priority === 'high' ? 'Wysoki' : task.priority === 'medium' ? 'Średni' : 'Niski'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center space-x-2">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Dodaj zadanie</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
