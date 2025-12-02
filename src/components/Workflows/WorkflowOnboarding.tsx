import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  X,
  Lightbulb,
  Zap,
  Target,
  Cog,
  Play,
  Bell,
  Sparkles,
  Code,
  Users
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: {
    mainPoints: string[];
    examples?: string[];
    tip?: string;
  };
}

interface WorkflowOnboardingProps {
  onClose: () => void;
  onCreateFirst: () => void;
  showForUser?: boolean;
}

const WorkflowOnboarding: React.FC<WorkflowOnboardingProps> = ({
  onClose,
  onCreateFirst,
  showForUser = true
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Witamy w świecie automatyzacji',
      description: 'Odkryj jak workflow mogą zrewolucjonizować sposób, w jaki zarządzasz projektami.',
      icon: <Sparkles className="w-10 h-10 text-yellow-500 animate-pulse" />,
      content: {
        mainPoints: [
          'Oszczędzaj godziny pracy każdego tygodnia',
          'Eliminuj błędy ludzkie w powtarzalnych procesach',
          'Zwiększ produktywność całego zespołu',
          'Automatyzuj zadania 24/7 bez Twojej interwencji'
        ],
        tip: 'Firmy używające automatyzacji zwiększają efektywność o średnio 30%!'
      }
    },
    {
      id: 'triggers',
      title: 'Kiedy magia się zaczyna',
      description: 'Wyzwalacze to wydarzenia, które uruchamiają Twoje automatyzacje.',
      icon: <Target className="w-10 h-10 text-blue-500" />,
      content: {
        mainPoints: [
          'Gdy zadanie zmieni status (todo → in progress → done)',
          'Gdy zostanie utworzone nowe zadanie',
          'Gdy zbliża się termin wykonania',
          'Gdy zadanie zostanie przypisane'
        ],
        examples: [
          'Status zadania: "todo" → "done"',
          'Nowe zadanie w kategorii "Urgent"',
          'Termin za mniej niż 2 dni'
        ],
        tip: 'Możesz dodać warunki, żeby workflow uruchamiał się tylko w konkretnych sytuacjach!'
      }
    },
    {
      id: 'actions',
      title: 'Co może się wydarzyć',
      description: 'Akcje to rzeczywiste operacje wykonywane automatycznie.',
      icon: <Cog className="w-10 h-10 text-green-500 animate-spin" style={{ animationDuration: '3s' }} />,
      content: {
        mainPoints: [
          'Wyślij powiadomienie do członków zespołu',
          'Zaktualizuj właściwości zadania',
          'Przypisz zadanie do konkretnej osoby',
          'Utwórz kolejne zadanie'
        ],
        examples: [
          'Powiadom managera o ukończeniu',
          'Zmień priorytet na "wysoki"',
          'Przypisz do testera'
        ],
        tip: 'Łącz wiele akcji w jednej automatyzacji dla bardziej złożonych procesów!'
      }
    },
    {
      id: 'variables',
      title: 'Dynamiczna inteligencja',
      description: 'Zmienne sprawiają, że Twoje automatyzacje są smart i personalizowane.',
      icon: <Code className="w-10 h-10 text-orange-500" />,
      content: {
        mainPoints: [
          '{task.title} - nazwa zadania, które wywołało workflow',
          '{task.assigned_to} - osoba odpowiedzialna',
          '{project.name} - nazwa projektu',
          '{trigger.timestamp} - kiedy się wydarzyło'
        ],
        examples: [
          '"Zadanie {task.title} zostało ukończone!"',
          '"Cześć {user.name}, masz nowe zadanie"',
          '"Projekt {project.name} wymaga uwagi"'
        ],
        tip: 'Zmienne są automatycznie zastępowane prawdziwymi wartościami!'
      }
    },
    {
      id: 'examples',
      title: 'Inspiracje dla Ciebie',
      description: 'Zobacz popularne scenariusze, które możesz wdrożyć już dziś.',
      icon: <Lightbulb className="w-10 h-10 text-purple-500 animate-bounce" />,
      content: {
        mainPoints: [
          '"Powiadom managera gdy zadanie jest gotowe"',
          '"Auto-przypisz zadania testowe po review"',
          '"Utwórz follow-up tydzień po zamknięciu"',
          '"Alert o zbliżających się deadline\'ach"'
        ],
        examples: [
          'Wyzwalacz: Status → "done" | Akcja: Powiadom managera',
          'Wyzwalacz: Status → "review" | Akcja: Przypisz do testera',
          'Wyzwalacz: Termin za 1 dzień | Akcja: Wyślij przypomnienie'
        ],
        tip: 'Zacznij od prostej automatyzacji i stopniowo dodawaj kolejne!'
      }
    },
    {
      id: 'monitoring',
      title: 'Pełna kontrola',
      description: 'Monitoruj swoje automatyzacje i otrzymuj szczegółowe raporty.',
      icon: <Bell className="w-10 h-10 text-red-500" />,
      content: {
        mainPoints: [
          'Historia wszystkich wykonań w real-time',
          'Powiadomienia o każdym uruchomieniu',
          'Automatyczne wykrywanie i raportowanie błędów',
          'Statystyki efektywności Twoich workflow'
        ],
        examples: [
          '"Workflow wykonano pomyślnie (2.3s)"',
          '"Błąd: Brak uprawnień do aktualizacji"',
          '"Średni czas wykonania: 1.8s"'
        ],
        tip: 'Regularnie sprawdzaj statystyki, żeby optymalizować swoje automatyzacje!'
      }
    }
  ];

  const currentStepData = onboardingSteps[currentStep];

  const handleNext = async () => {
    setIsAnimating(true);
    setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
    setIsAnimating(false);
  };

  const handlePrevious = async () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentStep(currentStep - 1);
      setIsAnimating(false);
    }
  };

  const handleFinish = async () => {
    setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
    localStorage.setItem('workflow_onboarding_completed', 'true');
    
    // Smooth transition out
    setIsAnimating(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onCreateFirst();
  };

  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Don't show if user has already completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem('workflow_onboarding_completed');
    if (completed === 'true' && !showForUser) {
      onClose();
    }
  }, [showForUser, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="w-full max-w-4xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-700 shadow-2xl animate-slideUp">
        <CardHeader className="relative pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 z-10"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* Progress bar */}
          <div className="mb-6 pr-12">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">Postęp</span>
              <span className="text-sm text-gray-400">
                {currentStep + 1} z {onboardingSteps.length}
              </span>
            </div>
                         <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-blue-500 to-purple-500 progress-bar"
                 style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
               />
             </div>
          </div>

          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-gray-800 rounded-xl border border-gray-600">
                {currentStepData.icon}
              </div>
              <div>
                <CardTitle className="text-2xl text-white mb-2">
                  {currentStepData.title}
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg">
                  {currentStepData.description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
            {/* Main content */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Main points */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Kluczowe informacje
                </h3>
                <div className="space-y-3">
                  {currentStepData.content.mainPoints.map((point, index) => (
                    <div 
                      key={index} 
                      className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Examples or tip */}
              <div className="space-y-4">
                {currentStepData.content.examples && (
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center mb-4">
                      <Play className="w-5 h-5 text-purple-500 mr-2" />
                      Przykłady
                    </h3>
                    <div className="space-y-3">
                      {currentStepData.content.examples.map((example, index) => (
                        <div 
                          key={index}
                          className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30"
                        >
                          <code className="text-purple-300 text-sm font-mono">{example}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStepData.content.tip && (
                  <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-500/30">
                    <h4 className="font-medium text-yellow-300 mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Wskazówka eksperta
                    </h4>
                    <p className="text-yellow-100 text-sm leading-relaxed">
                      {currentStepData.content.tip}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep || isAnimating}
                className="flex items-center space-x-2 border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Poprzedni</span>
              </Button>
              
              <div className="flex space-x-2">
                {onboardingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentStep 
                        ? 'bg-blue-500 scale-125' 
                        : completedSteps.has(step.id) || index < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              
              {isLastStep ? (
                <Button
                  onClick={handleFinish}
                  disabled={isAnimating}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  <Zap className="w-4 h-4" />
                  <span>Stwórz pierwszy workflow!</span>
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={isAnimating}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                >
                  <span>Dalej</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default WorkflowOnboarding; 