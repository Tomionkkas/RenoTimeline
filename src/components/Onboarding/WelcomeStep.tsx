
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, CheckCircle, Users, Calendar } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
  userName: string;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, userName }) => {
  const features = [
    {
      icon: Home,
      title: 'Zarządzaj projektami',
      description: 'Organizuj swoje remonty w jednym miejscu'
    },
    {
      icon: CheckCircle,
      title: 'Śledź postępy',
      description: 'Monitoruj zadania i harmonogram'
    },
    {
      icon: Users,
      title: 'Współpracuj z zespołem',
      description: 'Zapraszaj wykonawców i koordynuj pracę'
    },
    {
      icon: Calendar,
      title: 'Planuj terminy',
      description: 'Kontroluj budżet i harmonogram'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl gradient-text mb-2">
            Witaj w RenoTimeline, {userName}! 🎉
          </CardTitle>
          <p className="text-lg text-muted-foreground">
            Twoja aplikacja do zarządzania projektami remontowymi
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="flex items-start space-x-3 p-4 rounded-lg border border-gray-800 card-hover"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center pt-4">
            <Button 
              onClick={onNext}
              className="btn-primary px-8 py-3 text-lg"
            >
              Zacznijmy! 🚀
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeStep;
