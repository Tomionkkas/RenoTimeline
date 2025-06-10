import React, { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { X, Calendar, Clock, AlignLeft, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Project {
  id: string;
  name: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description: string;
    projectId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    isAllDay: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }) => void;
  selectedDate: Date;
  projects: Project[];
  selectedProjectId?: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedDate,
  projects,
  selectedProjectId
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(selectedProjectId || '');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !projectId) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      projectId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      priority
    });

    // Reset form
    setTitle('');
    setDescription('');
    setIsAllDay(true);
    setStartTime('09:00');
    setEndTime('10:00');
    setPriority('medium');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setIsAllDay(true);
    setStartTime('09:00');
    setEndTime('10:00');
    setPriority('medium');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md max-h-[90vh] flex items-center justify-center">
        <Card className="w-full overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Nowe zadanie</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: pl })}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tytuł zadania *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Wprowadź tytuł zadania..."
                required
                autoFocus
              />
            </div>

            {/* Project */}
            <div className="space-y-2">
              <Label htmlFor="project">Projekt *</Label>
              <Select value={projectId} onValueChange={setProjectId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz projekt" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dodaj opis zadania..."
                rows={3}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priorytet</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <Flag className="w-4 h-4 text-green-500" />
                      <span>Niski</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <Flag className="w-4 h-4 text-yellow-500" />
                      <span>Średni</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <Flag className="w-4 h-4 text-orange-500" />
                      <span>Wysoki</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center space-x-2">
                      <Flag className="w-4 h-4 text-red-500" />
                      <span>Pilny</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <Label htmlFor="all-day">Cały dzień</Label>
              </div>
              <Switch
                id="all-day"
                checked={isAllDay}
                onCheckedChange={setIsAllDay}
              />
            </div>

            {/* Time inputs - only visible when not all day */}
            {!isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Rozpoczęcie</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Zakończenie</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!title.trim() || !projectId}
              >
                Utwórz zadanie
              </Button>
            </div>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTaskModal; 