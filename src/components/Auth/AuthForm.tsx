
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UserX } from 'lucide-react';

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
  
  const { signIn, signUp, signInAsGuest } = useAuth();
  const { toast } = useToast();

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
          onSuccess?.();
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

  const handleSkipLogin = () => {
    signInAsGuest();
    toast({
      title: 'Tryb gościa',
      description: 'Możesz testować aplikację bez logowania. Dane nie będą zachowane.',
    });
    onSuccess?.();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Main Auth Card */}
        <Card>
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
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Zarejestruj się')}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm"
              >
                {isLogin 
                  ? 'Nie masz konta? Zarejestruj się'
                  : 'Masz już konto? Zaloguj się'
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skip Login Card */}
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg flex items-center justify-center space-x-2">
              <UserX className="w-5 h-5 text-yellow-500" />
              <span>Pomiń logowanie</span>
            </CardTitle>
            <CardDescription className="text-sm">
              Testuj aplikację bez tworzenia konta
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSkipLogin}
            >
              Kontynuuj jako gość
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Dane nie będą zachowane po odświeżeniu strony
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;
