
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, CheckCircle, Users, Calendar, Sparkles } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
  userName: string;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, userName }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [featureAnimations, setFeatureAnimations] = useState<boolean[]>([]);

  useEffect(() => {
    // Trigger main animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Trigger feature animations with stagger
    const featureTimer = setTimeout(() => {
      setFeatureAnimations([true, false, false, false]);
    }, 300);
    
    const featureTimer2 = setTimeout(() => {
      setFeatureAnimations([true, true, false, false]);
    }, 500);
    
    const featureTimer3 = setTimeout(() => {
      setFeatureAnimations([true, true, true, false]);
    }, 700);
    
    const featureTimer4 = setTimeout(() => {
      setFeatureAnimations([true, true, true, true]);
    }, 900);

    return () => {
      clearTimeout(timer);
      clearTimeout(featureTimer);
      clearTimeout(featureTimer2);
      clearTimeout(featureTimer3);
      clearTimeout(featureTimer4);
    };
  }, []);

  const features = [
    {
      icon: Home,
      title: 'Zarządzaj projektami',
      description: 'Organizuj swoje remonty w jednym miejscu',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: CheckCircle,
      title: 'Śledź postępy',
      description: 'Monitoruj zadania i harmonogram',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Users,
      title: 'Współpracuj z zespołem',
      description: 'Zapraszaj wykonawców i koordynuj pracę',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: Calendar,
      title: 'Planuj terminy',
      description: 'Kontroluj budżet i harmonogram',
      color: 'from-orange-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Main modal */}
      <div className={`relative z-10 w-full max-w-4xl transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}>
        <div className="card-glassmorphic rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center p-8 pb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-6 animate-bounceIn">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-blue-purple animate-slideUp">
              Witaj w RenoTimeline, {userName}!
            </h1>
            
            <p className="text-xl text-white/80 max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.2s' }}>
              Twoja aplikacja do zarządzania projektami remontowymi
            </p>
          </div>

          {/* Features grid */}
          <div className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isAnimated = featureAnimations[index] || false;
                
                return (
                  <div 
                    key={index}
                    className={`group relative overflow-hidden rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-700 ease-out hover:bg-white/10 hover:border-white/30 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 ${
                      isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 0.1}s` }}
                  >
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                    
                    <div className="relative p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-blue-300 transition-colors duration-300">
                            {feature.title}
                          </h3>
                          <p className="text-white/70 text-sm leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="text-center pb-8 px-8">
            <Button 
              onClick={onNext}
              className="btn-primary px-12 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 animate-slideUp"
              style={{ animationDelay: '1.2s' }}
            >
              <span className="flex items-center space-x-2">
                <span>Zacznijmy!</span>
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeStep;
