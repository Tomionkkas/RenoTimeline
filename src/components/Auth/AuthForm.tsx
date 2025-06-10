import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import TransitionWrapper from './TransitionWrapper';
import ForgotPasswordDialog from './ForgotPasswordDialog';

interface AuthFormProps {
  onSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  // Monitor user state changes
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    }
  }, [user, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Błąd logowania',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Zalogowano pomyślnie',
            description: 'Witaj z powrotem!',
          });
        }
      } else {
        const { error } = await signUp(email, password, firstName, lastName);
        if (error) {
          toast({
            title: 'Błąd rejestracji',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Rejestracja zakończona',
            description: 'Sprawdź swoją skrzynkę email, aby potwierdzić konto.',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <TransitionWrapper show={!user} className="w-full max-w-md">
        <Card className="smooth-entrance">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl gradient-text">
              {isLogin ? 'Logowanie' : 'Rejestracja'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Zaloguj się do swojego konta RenoTimeline'
                : 'Utwórz nowe konto RenoTimeline'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Imię</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required={!isLogin}
                      placeholder="Twoje imię"
                      className="transition-all duration-300 focus:scale-105"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nazwisko</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required={!isLogin}
                      placeholder="Twoje nazwisko"
                      className="transition-all duration-300 focus:scale-105"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="twoj@email.com"
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Hasło</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Twoje hasło"
                  minLength={6}
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>
              
              {isLogin && (
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-gray-400 hover:text-white p-0 h-auto"
                    onClick={() => setShowForgotPassword(true)}
                    disabled={loading}
                  >
                    Zapomniałem hasła
                  </Button>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Zarejestruj się')}
              </Button>
            </form>
            
            <div className="mt-4 space-y-3 text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm transition-all duration-300 hover:scale-105"
                disabled={loading}
              >
                {isLogin 
                  ? 'Nie masz konta? Zarejestruj się'
                  : 'Masz już konto? Zaloguj się'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </TransitionWrapper>

      <ForgotPasswordDialog 
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
};

export default AuthForm;
