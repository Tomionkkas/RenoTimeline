
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(false);
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
      <DialogContent className="sm:max-w-[425px] glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        <DialogHeader className="text-center space-y-4">
          <DialogTitle className="text-2xl font-bold gradient-text-animated">
            Resetowanie hasła
          </DialogTitle>
          <DialogDescription className="text-white/80 font-medium">
            Podaj swój adres email, a wyślemy Ci link do resetowania hasła.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-white/90 font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField(true)}
                onBlur={() => setFocusedField(false)}
                required
                placeholder="twoj@email.com"
                className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl transition-all duration-300 focus:bg-white/20 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 ${
                  focusedField ? 'scale-105 shadow-lg shadow-blue-500/20' : ''
                }`}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-xl transition-all duration-300"
              disabled={loading}
            >
              Anuluj
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading || !email}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Wysyłanie...</span>
                </div>
              ) : (
                'Wyślij link'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
