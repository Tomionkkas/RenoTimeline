
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Home, Calendar, DollarSign, FileText, Sparkles, ArrowRight } from 'lucide-react';

interface ProjectSetupStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const ProjectSetupStep: React.FC<ProjectSetupStepProps> = ({ onComplete, onSkip }) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [fieldAnimations, setFieldAnimations] = useState<boolean[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    // Trigger main animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Trigger field animations with stagger
    const fieldTimer = setTimeout(() => {
      setFieldAnimations([true, false, false, false, false]);
    }, 300);
    
    const fieldTimer2 = setTimeout(() => {
      setFieldAnimations([true, true, false, false, false]);
    }, 500);
    
    const fieldTimer3 = setTimeout(() => {
      setFieldAnimations([true, true, true, false, false]);
    }, 700);
    
    const fieldTimer4 = setTimeout(() => {
      setFieldAnimations([true, true, true, true, false]);
    }, 900);
    
    const fieldTimer5 = setTimeout(() => {
      setFieldAnimations([true, true, true, true, true]);
    }, 1100);

    return () => {
      clearTimeout(timer);
      clearTimeout(fieldTimer);
      clearTimeout(fieldTimer2);
      clearTimeout(fieldTimer3);
      clearTimeout(fieldTimer4);
      clearTimeout(fieldTimer5);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          description: description || null,
          budget: budget ? parseFloat(budget) : null,
          start_date: startDate || null,
          end_date: endDate || null,
          owner_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Projekt utworzony!',
        description: 'Twój pierwszy projekt remontowy został pomyślnie utworzony.',
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    { id: 'projectName', label: 'Nazwa projektu', placeholder: 'np. Remont kuchni', required: true, icon: Home },
    { id: 'description', label: 'Opis projektu', placeholder: 'Krótki opis zakresu remontu...', required: false, icon: FileText, type: 'textarea' },
    { id: 'budget', label: 'Budżet (PLN)', placeholder: '50000', required: false, icon: DollarSign, type: 'number' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Main modal */}
      <div className={`relative z-10 w-full max-w-2xl transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}>
        <div className="card-glassmorphic rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center p-8 pb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full mb-8 animate-bounceIn shadow-2xl shadow-emerald-500/30">
              <Home className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-blue-purple animate-slideUp">
              Stwórz swój pierwszy projekt
            </h1>
            
            <p className="text-lg text-white/80 max-w-xl mx-auto animate-slideUp" style={{ animationDelay: '0.2s' }}>
              Zacznij od utworzenia projektu remontowego
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {formFields.map((field, index) => {
                const Icon = field.icon;
                const isAnimated = fieldAnimations[index] || false;
                const isTextareaField = field.type === 'textarea';
                const isNumberField = field.type === 'number';
                
                return (
                  <div 
                    key={field.id}
                    className={`transition-all duration-700 ease-out ${
                      isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 0.1}s` }}
                  >
                    <Label 
                      htmlFor={field.id} 
                      className="flex items-center space-x-2 text-white font-medium mb-3"
                    >
                      <Icon className="w-4 h-4 text-blue-400" />
                      <span>{field.label} {field.required && <span className="text-red-400">*</span>}</span>
                    </Label>
                    
                    {isTextareaField ? (
                      <Textarea
                        id={field.id}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="input-glassmorphic w-full resize-none"
                        required={field.required}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        type={field.type || 'text'}
                        value={field.id === 'projectName' ? projectName : budget}
                        onChange={(e) => {
                          if (field.id === 'projectName') setProjectName(e.target.value);
                          else if (field.id === 'budget') setBudget(e.target.value);
                        }}
                        placeholder={field.placeholder}
                        min={isNumberField ? "0" : undefined}
                        step={isNumberField ? "0.01" : undefined}
                        className="input-glassmorphic w-full"
                        required={field.required}
                      />
                    )}
                  </div>
                );
              })}
              
              {/* Date fields in a grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className={`transition-all duration-700 ease-out ${
                    fieldAnimations[3] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: '0.3s' }}
                >
                  <Label htmlFor="startDate" className="flex items-center space-x-2 text-white font-medium mb-3">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>Data rozpoczęcia</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-glassmorphic w-full"
                  />
                </div>
                
                <div 
                  className={`transition-all duration-700 ease-out ${
                    fieldAnimations[4] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: '0.4s' }}
                >
                  <Label htmlFor="endDate" className="flex items-center space-x-2 text-white font-medium mb-3">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>Planowane zakończenie</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-glassmorphic w-full"
                  />
                </div>
              </div>
              
              {/* Action buttons */}
              <div 
                className={`flex space-x-4 pt-6 transition-all duration-700 ease-out ${
                  fieldAnimations[4] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '0.5s' }}
              >
                <Button 
                  type="submit" 
                  className="flex-1 btn-primary px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
                  disabled={loading || !projectName}
                >
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Tworzenie...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>Utwórz projekt</span>
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={onSkip}
                  className="px-8 py-4 text-lg font-medium rounded-xl border border-white/30 bg-white/5 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                >
                  Pomiń
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetupStep;
