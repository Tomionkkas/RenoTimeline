
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Bell, Mail, BellRing } from 'lucide-react';
import { useReminders, Reminder } from '@/hooks/useReminders';
import { toast } from 'sonner';

interface TaskRemindersProps {
  taskId: string;
}

const TaskReminders: React.FC<TaskRemindersProps> = ({ taskId }) => {
  const { reminders, loading, createReminder, deleteReminder } = useReminders(taskId);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    reminder_time: '',
    reminder_type: 'notification' as 'email' | 'notification' | 'both',
    message: ''
  });

  const handleAddReminder = async () => {
    if (!formData.reminder_time) {
      toast.error('Data i czas przypomnienia są wymagane');
      return;
    }

    try {
      await createReminder({
        task_id: taskId,
        reminder_type: formData.reminder_type,
        reminder_time: new Date(formData.reminder_time).toISOString(),
        message: formData.message.trim() || undefined
      });
      
      setFormData({
        reminder_time: '',
        reminder_type: 'notification',
        message: ''
      });
      setIsAdding(false);
      toast.success('Przypomnienie zostało dodane');
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast.error('Nie udało się dodać przypomnienia');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder(reminderId);
      toast.success('Przypomnienie zostało usunięte');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Nie udało się usunąć przypomnienia');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'notification':
        return <Bell className="w-3 h-3" />;
      case 'both':
        return <BellRing className="w-3 h-3" />;
      default:
        return <Bell className="w-3 h-3" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'notification':
        return 'Powiadomienie';
      case 'both':
        return 'Email + Powiadomienie';
      default:
        return 'Nieznany';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Przypomnienia</h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Przypomnienia</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Dodaj
        </Button>
      </div>

      <div className="space-y-2">
        {reminders.map((reminder) => (
          <ReminderItem
            key={reminder.id}
            reminder={reminder}
            onDelete={handleDeleteReminder}
            getTypeIcon={getTypeIcon}
            getTypeLabel={getTypeLabel}
          />
        ))}

        {isAdding && (
          <div className="space-y-3 p-3 border border-gray-300 rounded-md">
            <div className="space-y-2">
              <Label htmlFor="reminder_time">Data i czas przypomnienia</Label>
              <Input
                id="reminder_time"
                type="datetime-local"
                value={formData.reminder_time}
                onChange={(e) => setFormData(prev => ({ ...prev, reminder_time: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reminder_type">Typ przypomnienia</Label>
              <Select 
                value={formData.reminder_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, reminder_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">Powiadomienie</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="both">Email + Powiadomienie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Wiadomość (opcjonalna)</Label>
              <Textarea
                id="message"
                placeholder="Niestandardowa wiadomość przypomnienia..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={2}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button size="sm" onClick={handleAddReminder}>
                Dodaj
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setFormData({
                    reminder_time: '',
                    reminder_type: 'notification',
                    message: ''
                  });
                }}
              >
                Anuluj
              </Button>
            </div>
          </div>
        )}

        {reminders.length === 0 && !isAdding && (
          <div className="text-center py-4 text-gray-500">
            <p>Brak przypomnień</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj pierwsze przypomnienie
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ReminderItemProps {
  reminder: Reminder;
  onDelete: (id: string) => void;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeLabel: (type: string) => string;
}

const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onDelete, getTypeIcon, getTypeLabel }) => {
  const reminderDate = new Date(reminder.reminder_time);
  const now = new Date();
  const isPast = reminderDate < now;

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md group border border-gray-200">
      <div className="flex-shrink-0 mt-1">
        {getTypeIcon(reminder.reminder_type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <Badge variant={isPast ? "destructive" : "default"}>
            {getTypeLabel(reminder.reminder_type)}
          </Badge>
          {reminder.sent && (
            <Badge variant="secondary">Wysłane</Badge>
          )}
        </div>
        <p className="text-sm font-medium mt-1">
          {reminderDate.toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        {reminder.message && (
          <p className="text-sm text-gray-600 mt-1">{reminder.message}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(reminder.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  );
};

export default TaskReminders;
