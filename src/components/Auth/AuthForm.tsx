import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import TransitionWrapper from './TransitionWrapper';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, Star, Users, Calendar, TrendingUp, Shield, Zap, ArrowRight, Play, ChevronRight } from 'lucide-react';
import ForgotPasswordDialog from './ForgotPasswordDialog'; // Import the dialog

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
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false); // State for the dialog
  const [particles, setParticles] = useState<Array<{left: string; top: string; animationDelay: string; animationDuration: string;}>>([]);

  useEffect(() => {
    const newParticles = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${3 + Math.random() * 4}s`,
    }));
    setParticles(newParticles);
  }, []);
  
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

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Inteligentne Planowanie",
      description: "Automatyczne harmonogramy i optymalizacja czasu pracy"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Analityka w Czasie Rzeczywistym",
      description: "Śledź postęp i wydajność zespołu na żywo"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Zarządzanie Zespołem",
      description: "Przydzielanie zadań i koordynacja pracy zespołu"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Bezpieczeństwo Danych",
      description: "Zaawansowane szyfrowanie i ochrona prywatności"
    }
  ];

  const testimonials = [
    {
      name: "Marek Kowalski",
      role: "Kierownik Projektów",
      company: "Renovation Pro",
      content: "RenoTimeline zrewolucjonizował nasze zarządzanie projektami. Oszczędzamy 30% czasu na planowaniu.",
      rating: 5
    },
    {
      name: "Anna Nowak",
      role: "Właścicielka",
      company: "DomPerfect",
      content: "Intuicyjny interfejs i potężne funkcje. Polecam każdemu, kto poważnie myśli o zarządzaniu renowacjami.",
      rating: 5
    }
  ];

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] animate-pulse-slow"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-bounce"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-bounce-slow"></div>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 p-6 bg-black/20 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center">
              <img 
                src="/renotimeline-logo.png" 
                alt="RenoTimeline Logo" 
                className="h-16 w-auto"
              />
              <span className="text-2xl font-bold gradient-text-animated -ml-2 -mt-1">RenoTimeline</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Content */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                    Inteligentne Zarządzanie
                    <span className="block gradient-text-animated">Projektami Renowacyjnymi</span>
                  </h1>
                  
                  <p className="text-xl text-white/80 leading-relaxed">
                    RenoTimeline to zaawansowana platforma, która łączy planowanie, zarządzanie zespołem 
                    i analitykę w jednym miejscu. Zoptymalizuj swoje projekty renowacyjne i zwiększ zyski.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="h-14 px-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105">
                    Rozpocznij za darmo
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>

                <div className="flex items-center space-x-8 text-white/60">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>14-dniowe darmowe konto</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Bez zobowiązań</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Pełne wsparcie</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Auth Form */}
              <div className="flex justify-center">
                <TransitionWrapper show={!user} className="w-full max-w-md">
                  <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 ease-out hover:scale-105">
                    <CardHeader className="text-center space-y-4">
                      <div className="space-y-2">
                        <CardTitle className="text-3xl font-bold gradient-text-animated">
                          {isLogin ? 'Logowanie' : 'Rejestracja'}
                        </CardTitle>
                        <CardDescription className="text-lg text-white/80 font-medium">
                          {isLogin 
                            ? 'Witaj z powrotem w RenoTimeline'
                            : 'Utwórz nowe konto RenoTimeline'
                          }
                        </CardDescription>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName" className="text-white/90 font-medium">
                                Imię
                              </Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                                <Input
                                  id="firstName"
                                  type="text"
                                  value={firstName}
                                  onChange={(e) => setFirstName(e.target.value)}
                                  onFocus={() => setFocusedField('firstName')}
                                  onBlur={() => setFocusedField(null)}
                                  required={!isLogin}
                                  placeholder="Twoje imię"
                                  className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl transition-all duration-300 focus:bg-white/20 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 ${
                                    focusedField === 'firstName' ? 'scale-105 shadow-lg shadow-blue-500/20' : ''
                                  }`}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName" className="text-white/90 font-medium">
                                Nazwisko
                              </Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                                <Input
                                  id="lastName"
                                  type="text"
                                  value={lastName}
                                  onChange={(e) => setLastName(e.target.value)}
                                  onFocus={() => setFocusedField('lastName')}
                                  onBlur={() => setFocusedField(null)}
                                  required={!isLogin}
                                  placeholder="Twoje nazwisko"
                                  className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl transition-all duration-300 focus:bg-white/20 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 ${
                                    focusedField === 'lastName' ? 'scale-105 shadow-lg shadow-blue-500/20' : ''
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white/90 font-medium">
                            Email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField(null)}
                              required
                              placeholder="twoj@email.com"
                              className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl transition-all duration-300 focus:bg-white/20 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 ${
                                focusedField === 'email' ? 'scale-105 shadow-lg shadow-blue-500/20' : ''
                              }`}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-white/90 font-medium">
                            Hasło
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onFocus={() => setFocusedField('password')}
                              onBlur={() => setFocusedField(null)}
                              required
                              placeholder="Twoje hasło"
                              minLength={6}
                              className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl transition-all duration-300 focus:bg-white/20 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 ${
                                focusedField === 'password' ? 'scale-105 shadow-lg shadow-blue-500/20' : ''
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        
                        {isLogin && (
                          <div className="text-right">
                            <Button
                              type="button"
                              variant="link"
                              className="text-sm text-white/70 hover:text-white hover:underline p-0 h-auto font-medium transition-all duration-300"
                              onClick={() => setShowForgotPassword(true)}
                              disabled={loading}
                            >
                              Zapomniałem hasła
                            </Button>
                          </div>
                        )}
                        
                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Przetwarzanie...</span>
                            </div>
                          ) : (
                            isLogin ? 'Zaloguj się' : 'Zarejestruj się'
                          )}
                        </Button>
                      </form>
                      
                      <div className="text-center">
                        <Button
                          variant="link"
                          onClick={() => setIsLogin(!isLogin)}
                          className="text-sm text-white/70 hover:text-white hover:underline transition-all duration-300 font-medium"
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
                <ForgotPasswordDialog open={showForgotPassword} onOpenChange={setShowForgotPassword} />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl font-bold text-white">Dlaczego RenoTimeline?</h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Odkryj funkcje, które sprawiają, że RenoTimeline jest najlepszym wyborem dla firm renowacyjnych w Polsce
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-105 group">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <div className="text-blue-400">
                        {feature.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-white/70 leading-relaxed">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="glassmorphic-card backdrop-blur-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/20 shadow-2xl">
              <CardContent className="p-12 space-y-8">
                <h2 className="text-4xl font-bold text-white">
                  Gotowy na rewolucję w zarządzaniu projektami?
                </h2>
                <p className="text-xl text-white/80 max-w-2xl mx-auto">
                  Dołącz do RenoTimeline już dziś i odkryj, jak łatwo można zoptymalizować 
                  procesy renowacyjne i zwiększyć zyski
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="h-14 px-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105">
                    Rozpocznij za darmo
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button variant="outline" className="h-14 px-8 border-white/20 text-white hover:bg-white/10 rounded-xl">
                    Skontaktuj się z nami
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <p className="text-white/70">
                  Inteligentne zarządzanie projektami renowacyjnymi dla nowoczesnych firm.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Produkt</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-white/70 hover:text-white transition-colors">Funkcje</a>
                  <a href="#" className="block text-white/70 hover:text-white transition-colors">Cennik</a>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Firma</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-white/70 hover:text-white transition-colors">O nas</a>
                  <a href="#" className="block text-white/70 hover:text-white transition-colors">Kariera</a>
                  <a href="#" className="block text-white/70 hover:text-white transition-colors">Kontakt</a>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Wsparcie</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-white/70 hover:text-white transition-colors">Centrum pomocy</a>
                  <a href="#" className="block text-white/70 hover:text-white transition-colors">Dokumentacja</a>
                  <a href="#" className="block text-white/70 hover:text-white transition-colors">Status systemu</a>
                </div>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/60">
              <p>&copy; 2025 RenoTimeline. Wszystkie prawa zastrzeżone.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AuthForm;
