
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: 'Błąd',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email wysłany',
          description: 'Sprawdź swoją skrzynkę email z instrukcjami resetowania hasła.',
        });
        onOpenChange(false);
        setEmail('');
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Resetowanie hasła</DialogTitle>
          <DialogDescription>
            Podaj swój adres email, a wyślemy Ci link do resetowania hasła.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="twoj@email.com"
              className="transition-all duration-300 focus:scale-105"
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Anuluj
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading || !email}
            >
              {loading ? 'Wysyłanie...' : 'Wyślij link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
