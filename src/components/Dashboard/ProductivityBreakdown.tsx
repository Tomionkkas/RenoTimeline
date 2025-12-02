import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  BarChart3, 
  Zap,
  Info,
  CheckCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface ProductivityMetrics {
  timelinessScore: number;
  priorityEfficiency: number;
  consistencyScore: number;
  overallTrend: number;
}

interface ProductivityBreakdownProps {
  productivity: number;
  metrics?: ProductivityMetrics | null;
  trigger?: React.ReactNode;
}

const ProductivityBreakdown: React.FC<ProductivityBreakdownProps> = ({ 
  productivity, 
  metrics,
  trigger 
}) => {
  const [open, setOpen] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Doskonały', color: 'bg-green-600' };
    if (score >= 80) return { label: 'Bardzo dobry', color: 'bg-green-500' };
    if (score >= 70) return { label: 'Dobry', color: 'bg-blue-500' };
    if (score >= 60) return { label: 'Przeciętny', color: 'bg-yellow-500' };
    if (score >= 40) return { label: 'Słaby', color: 'bg-orange-500' };
    return { label: 'Bardzo słaby', color: 'bg-red-500' };
  };

  const overallBadge = getScoreBadge(productivity);

  const metricDetails = [
    {
      id: 'timeliness',
      title: 'Terminowość',
      description: 'Jak często ukańczasz zadania na czas',
      icon: Clock,
      score: metrics?.timelinessScore || 0,
      weight: '40%',
      explanation: 'Bazuje na zadaniach ukończonych przed terminem vs. po terminie. Uwzględnia karę za aktualnie zaległe zadania.'
    },
    {
      id: 'priority',
      title: 'Efektywność priorytetów',
      description: 'Czy skupiasz się na najważniejszych zadaniach',
      icon: Target,
      score: metrics?.priorityEfficiency || 0,
      weight: '30%',
      explanation: 'Mierzy ile zadań o wysokim priorytecie ukończyłeś w stosunku do wszystkich. Zadania wysokie=3pkt, średnie=2pkt, niskie=1pkt.'
    },
    {
      id: 'consistency',
      title: 'Konsystencja',
      description: 'Czy regularnie ukańczasz zadania',
      icon: BarChart3,
      score: metrics?.consistencyScore || 0,
      weight: '20%',
      explanation: 'Porównuje twoją tygodniową częstotliwość ukończeń z oczekiwanym tempem (10% zadań tygodniowo).'
    },
    {
      id: 'trend',
      title: 'Trend ogólny',
      description: 'Czy twoja produktywność rośnie',
      icon: TrendingUp,
      score: metrics?.overallTrend || 0,
      weight: '10%',
      explanation: 'Porównuje aktualny tydzień z poprzednim. Pozytywny trend zwiększa wynik.'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Info className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-lg flex-wrap">
            <Zap className="w-5 h-5 text-yellow-400" />
            Analiza Produktywności
            <Badge className={`${overallBadge.color} text-white text-xs`}>
              {productivity}% - {overallBadge.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overall Score */}
          <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Ogólny Wynik Produktywności
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl font-bold text-white">{productivity}%</div>
                <div className="flex-1">
                  <Progress 
                    value={productivity} 
                    className="h-2 bg-gray-700"
                  />
                </div>
              </div>
              <p className="text-gray-300 text-xs">
                Wynik obliczany na podstawie czterech kluczowych metryk produktywności.
              </p>
            </CardContent>
          </Card>

          {/* Metrics Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {metricDetails.map((metric) => {
              const Icon = metric.icon;
              const scoreColor = getScoreColor(metric.score);
              
              return (
                <Card key={metric.id} className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="p-1.5 rounded-lg bg-blue-600/20 shrink-0">
                          <Icon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-white text-sm truncate">{metric.title}</CardTitle>
                          <p className="text-gray-400 text-xs line-clamp-2">{metric.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs text-gray-300 bg-gray-700/50 border-gray-600 shrink-0">
                        {metric.weight}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${scoreColor}`}>
                        {metric.score}%
                      </span>
                      <div className="flex-1">
                        <Progress 
                          value={metric.score} 
                          className="h-1.5 bg-gray-700"
                        />
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {metric.explanation}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tips Section */}
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-300 flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4" />
                Jak Poprawić Produktywność
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                <div>
                  <h4 className="text-white font-medium mb-1.5 text-sm">Terminowość</h4>
                  <ul className="text-gray-300 space-y-0.5">
                    <li>• Ustaw realistyczne terminy</li>
                    <li>• Używaj powiadomień o terminach</li>
                    <li>• Planuj buffer time</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1.5 text-sm">Priorytety</h4>
                  <ul className="text-gray-300 space-y-0.5">
                    <li>• Oznaczaj zadania jako "wysokie"</li>
                    <li>• Zacznij od zadań wysokiego priorytetu</li>
                    <li>• Używaj automatyzacji priorytetów</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1.5 text-sm">Konsystencja</h4>
                  <ul className="text-gray-300 space-y-0.5">
                    <li>• Ustal codzienną rutynę pracy</li>
                    <li>• Dziel duże zadania na części</li>
                    <li>• Śledź postęp regularnie</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1.5 text-sm">Trend</h4>
                  <ul className="text-gray-300 space-y-0.5">
                    <li>• Analizuj wzorce pracy</li>
                    <li>• Ucz się z projektów</li>
                    <li>• Wykorzystuj automatyzacje</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400">
              Dane aktualizowane w czasie rzeczywistym
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 flex-1 sm:flex-none"
              >
                Zamknij
              </Button>
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                onClick={() => {
                  setOpen(false);
                  // Could navigate to tasks or calendar
                }}
              >
                <Calendar className="w-3 h-3 mr-1" />
                Zobacz zadania
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductivityBreakdown; 