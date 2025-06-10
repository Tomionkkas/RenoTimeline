import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Zap, Activity, Clock, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { WorkflowDefinition } from '../../lib/types/workflow';

interface WorkflowDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workflow: WorkflowDefinition | null;
  isDeleting?: boolean;
}

export function WorkflowDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  workflow,
  isDeleting = false
}: WorkflowDeleteModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  
  if (!workflow) return null;

  const isConfirmationValid = confirmationText.toLowerCase() === 'usuń';

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm();
      onClose();
      setConfirmationText(''); // Reset confirmation text
    }
  };

  const handleClose = () => {
    onClose();
    setConfirmationText(''); // Reset confirmation text on close
  };

  const formatTriggerType = (triggerType: string) => {
    const translations: Record<string, string> = {
      'task_status_changed': 'Zmiana statusu zadania',
      'task_created': 'Utworzenie zadania',
      'task_assigned': 'Przypisanie zadania',
      'due_date_approaching': 'Zbliżający się termin',
      'custom_field_changed': 'Zmiana pola niestandardowego',
      'file_uploaded': 'Przesłanie pliku'
    };
    return translations[triggerType] || triggerType;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-red-500/30 shadow-2xl animate-fadeIn">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4 text-gray-400" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="text-center space-y-4 pb-4">
          {/* Warning Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-900/30 to-red-800/30 rounded-full flex items-center justify-center border border-red-500/40 animate-pulse">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <div>
            <DialogTitle className="text-2xl font-bold text-white mb-2">
              Usuń przepływ pracy
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-lg">
              Ta akcja jest nieodwracalna i nie może być cofnięta
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Workflow Details Card */}
        <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-lg p-6 space-y-4 animate-slideUp">
          {/* Workflow Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 rounded-lg border border-red-500/30">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl text-white">{workflow.name}</h3>
              {workflow.description && (
                <p className="text-red-200 text-sm mt-1">{workflow.description}</p>
              )}
            </div>
            <Badge className={`${workflow.is_active 
              ? 'bg-green-600/20 text-green-300 border-green-500/30' 
              : 'bg-gray-600/20 text-gray-300 border-gray-500/30'
            }`}>
              {workflow.is_active ? 'Aktywny' : 'Nieaktywny'}
            </Badge>
          </div>

          {/* Workflow Details */}
          <div className="grid grid-cols-1 gap-3">
            {/* Trigger Info */}
            <div className="bg-red-800/20 border border-red-500/20 rounded p-3">
              <div className="flex items-center gap-2 text-red-300 mb-1">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Wyzwalacz:</span>
              </div>
              <span className="text-red-100 text-sm">
                {formatTriggerType(workflow.trigger_type)}
              </span>
            </div>

            {/* Actions Info */}
            <div className="bg-red-800/20 border border-red-500/20 rounded p-3">
              <div className="flex items-center gap-2 text-red-300 mb-1">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Akcje:</span>
              </div>
              <span className="text-red-100 text-sm">
                {workflow.actions?.length || 0} zdefiniowanych działań
              </span>
            </div>

            {/* Created Date */}
            <div className="bg-red-800/20 border border-red-500/20 rounded p-3">
              <div className="flex items-center gap-2 text-red-300 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Utworzony:</span>
              </div>
              <span className="text-red-100 text-sm">
                {workflow.created_at ? new Date(workflow.created_at).toLocaleDateString('pl-PL') : 'Nieznana data'}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Section */}
        <div className="bg-gradient-to-r from-amber-900/20 to-yellow-800/20 border border-amber-500/30 rounded-lg p-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-3">
            <div className="p-1 bg-amber-600/20 rounded border border-amber-500/30 mt-0.5">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-amber-300 mb-2">Ostrzeżenie</h4>
              <ul className="text-amber-200 text-sm space-y-1">
                <li>• Wszystkie dane tego przepływu pracy zostaną usunięte</li>
                <li>• Historia wykonań zostanie zachowana</li>
                <li>• Automatyzacje przestaną działać natychmiast</li>
                <li>• Ta akcja nie może być cofnięta</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-3 animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <Label htmlFor="confirmation" className="text-white font-medium">
            Aby potwierdzić usunięcie, wpisz{' '}
            <span className="font-mono bg-red-900/30 px-2 py-1 rounded text-red-300 border border-red-500/30">
              USUŃ
            </span>
          </Label>
          <Input
            id="confirmation"
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Wpisz USUŃ"
            className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 transition-all duration-200 ${
              confirmationText 
                ? isConfirmationValid 
                  ? 'focus:ring-green-500 focus:border-green-500 border-green-500/50'
                  : 'focus:ring-red-500 focus:border-red-500 border-red-500/50'
                : 'focus:ring-blue-500 focus:border-blue-500'
            }`}
            disabled={isDeleting}
            autoComplete="off"
            autoFocus
          />
          {confirmationText && !isConfirmationValid && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <X className="h-3 w-3" />
              Nieprawidłowy tekst potwierdzenia
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 py-3 text-lg"
          >
            Anuluj
          </Button>
          
          <Button 
            onClick={handleConfirm}
            disabled={isDeleting || !isConfirmationValid}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none py-3 text-lg font-bold"
          >
            {isDeleting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Usuwanie...
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 mr-2" />
                Usuń przepływ
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 