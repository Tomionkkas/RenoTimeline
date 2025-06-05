
import React from 'react';
import { Clock, User, CheckCircle2 } from 'lucide-react';

const tasks = [
  {
    id: 1,
    title: 'Przygotowanie prezentacji klienta',
    assignee: 'Anna Nowak',
    status: 'completed',
    priority: 'high',
    dueDate: 'Dzisiaj',
  },
  {
    id: 2,
    title: 'Review kodu modułu autoryzacji',
    assignee: 'Piotr Kowalski',
    status: 'in-progress',
    priority: 'medium',
    dueDate: 'Jutro',
  },
  {
    id: 3,
    title: 'Aktualizacja dokumentacji API',
    assignee: 'Maria Wiśniewska',
    status: 'pending',
    priority: 'low',
    dueDate: '3 dni',
  },
  {
    id: 4,
    title: 'Optymalizacja bazy danych',
    assignee: 'Tomasz Nowicki',
    status: 'in-progress',
    priority: 'high',
    dueDate: 'Za tydzień',
  },
];

const priorityColors = {
  high: 'bg-red-400/10 text-red-400',
  medium: 'bg-yellow-400/10 text-yellow-400',
  low: 'bg-green-400/10 text-green-400',
};

const statusColors = {
  completed: 'bg-green-400/10 text-green-400',
  'in-progress': 'bg-blue-400/10 text-blue-400',
  pending: 'bg-gray-400/10 text-gray-400',
};

const RecentTasks = () => {
  return (
    <div className="bg-card rounded-xl border border-gray-800 p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Ostatnie zadania</h2>
      <div className="space-y-4">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-medium flex-1">{task.title}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                  {task.priority === 'high' ? 'Wysoki' : task.priority === 'medium' ? 'Średni' : 'Niski'}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status as keyof typeof statusColors]}`}>
                  {task.status === 'completed' ? 'Ukończone' : task.status === 'in-progress' ? 'W toku' : 'Oczekuje'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{task.assignee}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{task.dueDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTasks;
