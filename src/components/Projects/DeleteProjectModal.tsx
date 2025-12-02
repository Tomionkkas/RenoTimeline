import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Calendar, DollarSign, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import type { Project } from '@/hooks/useProjects';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  project: Project | null;
  isDeleting?: boolean;
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  project,
  isDeleting = false
}: DeleteProjectModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  
  if (!project) return null;

  const isConfirmationValid = confirmationText.toLowerCase() === 'usuń projekt';

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm();
      setConfirmationText(''); // Reset confirmation text
    }
  };

  const handleClose = () => {
    onClose();
    setConfirmationText(''); // Reset confirmation text on close
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'Nie określono';
    return new Intl.NumberFormat('pl-PL', { 
      style: 'currency', 
      currency: 'PLN' 
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nie określono';
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 text-white">Aktywny</Badge>;
      case 'on_hold':
        return <Badge className="bg-yellow-600 text-white">Wstrzymany</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600 text-white">Zakończony</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">Nieokreślony</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-card via-card to-muted/20 border-destructive/30 shadow-2xl animate-scale-smooth">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Zamknij</span>
        </button>

        <DialogHeader className="text-center space-y-4 pb-4">
          {/* Warning Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-destructive/20 to-destructive/10 rounded-full flex items-center justify-center border border-destructive/40 animate-pulse">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <div>
            <DialogTitle className="text-xl font-bold text-foreground mb-2">
              Usuń projekt remontowy
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              Ta operacja jest nieodwracalna i spowoduje trwałe usunięcie wszystkich danych projektu
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Project Details Card */}
        <div className="bg-gradient-to-r from-muted/30 to-muted/20 border border-border rounded-lg p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground text-lg">{project.name}</h4>
            {getStatusBadge(project.status)}
          </div>
          
          {project.description && (
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Budżet:</span>
              <span className="font-medium text-foreground">{formatCurrency(project.budget)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Termin:</span>
              <span className="font-medium text-foreground">{formatDate(project.end_date)}</span>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-gradient-to-r from-amber-900/20 to-yellow-800/20 border border-amber-500/30 rounded-lg p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-amber-600/20 rounded border border-amber-500/30 mt-0.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-amber-300 mb-2">Uwaga!</h4>
              <ul className="text-amber-200 text-sm space-y-1">
                <li>• Wszystkie zadania i dane projektu zostaną usunięte</li>
                <li>• Historia plików i dokumentów zostanie utracona</li>
                <li>• Przypisani członkowie zespołu zostaną odłączeni</li>
                <li>• Ta akcja nie może być cofnięta</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-3 animate-fade-in">
          <Label htmlFor="confirmation" className="text-sm font-medium text-foreground">
            Aby potwierdzić usunięcie, wpisz: <span className="font-bold text-destructive">usuń projekt</span>
          </Label>
          <Input
            id="confirmation"
            type="text"
            placeholder="usuń projekt"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="border-border focus:border-destructive focus:ring-destructive"
            disabled={isDeleting}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 animate-fade-in">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground transition-all duration-200"
          >
            Anuluj
          </Button>
          
          <Button 
            onClick={handleConfirm}
            disabled={isDeleting || !isConfirmationValid}
            className="flex-1 bg-gradient-to-r from-destructive to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Usuwanie...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Usuń projekt
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 