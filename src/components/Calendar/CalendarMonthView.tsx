import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addDays, subDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import CalendarEventCard from './CalendarEventCard';
import { useCalendarManagement } from '@/hooks/useCalendarManagement';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  projectId: string;
  projectName: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  description?: string;
}

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  selectedProjectId?: string;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDoubleClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
  onEventDrop?: (eventId: string, newDate: string) => void;
  onCreateQuickTask?: (date: string) => void;
}

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  events,
  selectedProjectId,
  onEventClick,
  onEventDoubleClick,
  onDayClick,
  onDayDoubleClick,
  onEventDrop,
  onCreateQuickTask
}) => {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  // Calculate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Start from previous Monday to fill the grid
  const calendarStart = subDays(monthStart, monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1);
  // End on next Sunday to fill the grid
  const calendarEnd = addDays(monthEnd, 7 - (monthEnd.getDay() === 0 ? 7 : monthEnd.getDay()));
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    events.forEach(event => {
      const dateKey = event.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  const getEventsForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return eventsByDate[dateKey] || [];
  };

  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (day: Date, e: React.DragEvent) => {
    e.preventDefault();
    setHoveredDay(null);
    
    if (draggedEvent && onEventDrop) {
      const newDate = format(day, 'yyyy-MM-dd');
      if (newDate !== draggedEvent.date) {
        onEventDrop(draggedEvent.id, newDate);
      }
    }
    setDraggedEvent(null);
  };

  const handleDragEnter = (day: Date) => {
    setHoveredDay(day);
  };

  const handleDragLeave = () => {
    setHoveredDay(null);
  };

  const handleDayClick = (day: Date) => {
    onDayClick?.(day);
  };

  const handleDayDoubleClick = (day: Date) => {
    if (onCreateQuickTask) {
      const dateStr = format(day, 'yyyy-MM-dd');
      onCreateQuickTask(dateStr);
    }
    onDayDoubleClick?.(day);
  };

  const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'];

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700">
      {/* Header with weekday names */}
      <div className="grid grid-cols-7 border-b border-gray-700">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center font-medium text-gray-400 border-r border-gray-700 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);
          const isHovered = hoveredDay && isSameDay(day, hoveredDay);
          const visibleEvents = dayEvents.slice(0, 3);
          const hiddenEventsCount = dayEvents.length - 3;

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[120px] p-2 border-r border-b border-gray-700 
                last:border-r-0 bg-gray-800/50
                ${!isCurrentMonth ? 'bg-gray-800/30' : ''}
                ${isDayToday ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''}
                ${isHovered ? 'bg-green-500/10' : ''}
                hover:bg-gray-700/50
                transition-colors duration-200 cursor-pointer relative
              `}
              onClick={() => handleDayClick(day)}
              onDoubleClick={() => handleDayDoubleClick(day)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(day, e)}
              onDragEnter={() => handleDragEnter(day)}
              onDragLeave={handleDragLeave}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={`
                  text-sm font-medium
                  ${!isCurrentMonth ? 'text-gray-500' : 'text-gray-300'}
                  ${isDayToday ? 'text-blue-400 font-bold' : ''}
                `}>
                  {format(day, 'd')}
                </span>
                
                {/* Quick add button - only visible on hover */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDayDoubleClick(day);
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Events */}
              <div className="space-y-1">
                {visibleEvents.map(event => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(event, e)}
                    className="cursor-move"
                  >
                                         <CalendarEventCard
                       {...event}
                       projectName={event.projectName}
                       isCompact={true}
                       onClick={() => onEventClick?.(event)}
                       onDoubleClick={() => onEventDoubleClick?.(event)}
                     />
                  </div>
                ))}

                {/* Show more indicator */}
                {hiddenEventsCount > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-6 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3 h-3 mr-1" />
                        +{hiddenEventsCount} więcej
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                          Wydarzenia - {format(day, 'd MMMM', { locale: pl })}
                        </h4>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {dayEvents.map(event => (
                            <CalendarEventCard
                              key={event.id}
                              {...event}
                              projectName={event.projectName}
                              isCompact={false}
                              onClick={() => onEventClick?.(event)}
                              onDoubleClick={() => onEventDoubleClick?.(event)}
                            />
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Drop zone indicator */}
              {isHovered && draggedEvent && (
                <div className="absolute inset-0 border-2 border-dashed border-green-400 bg-green-100 dark:bg-green-900 opacity-50 rounded" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthView; 