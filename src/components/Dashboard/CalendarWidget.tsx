
import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const events = [
  {
    id: 1,
    title: 'Spotkanie zespołu',
    time: '10:00',
    type: 'meeting',
  },
  {
    id: 2,
    title: 'Prezentacja klienta',
    time: '14:00',
    type: 'presentation',
  },
  {
    id: 3,
    title: 'Code Review',
    time: '16:30',
    type: 'review',
  },
];

const CalendarWidget = () => {
  const today = new Date();
  const monthName = today.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  const dayName = today.toLocaleDateString('pl-PL', { weekday: 'long' });

  return (
    <div className="bg-card rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Kalendarz
        </h2>
        <div className="flex items-center space-x-2">
          <button className="p-1 hover:bg-gray-700 rounded">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-1 hover:bg-gray-700 rounded">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-400 text-sm mb-1 capitalize">{dayName}</p>
        <p className="text-2xl font-bold text-white">{today.getDate()}</p>
        <p className="text-gray-400 text-sm capitalize">{monthName}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Dzisiejsze wydarzenia</h3>
        {events.map((event, index) => (
          <div
            key={event.id}
            className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{event.title}</p>
              <p className="text-gray-400 text-xs">{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarWidget;
