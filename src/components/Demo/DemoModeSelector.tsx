
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, UserPlus } from 'lucide-react';

interface DemoModeSelectorProps {
  onSelectDemo: () => void;
  onSelectAuth: () => void;
}

const DemoModeSelector: React.FC<DemoModeSelectorProps> = ({ onSelectDemo, onSelectAuth }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Witaj w RenoTimeline
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Profesjonalne zarządzanie projektami remontowymi
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelectDemo}>
            <CardHeader className="text-center">
              <PlayCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
              <CardTitle className="text-2xl">Tryb Demo</CardTitle>
              <CardDescription className="text-lg">
                Przetestuj aplikację z przykładowymi danymi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Przeglądaj przykładowe projekty
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Testuj tablicę Kanban
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Sprawdź kalendarz zadań
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Bez rejestracji
                </div>
              </div>
              <Button className="w-full mt-6 btn-primary">
                Rozpocznij Demo
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelectAuth}>
            <CardHeader className="text-center">
              <UserPlus className="w-16 h-16 mx-auto mb-4 text-secondary" />
              <CardTitle className="text-2xl">Pełna Wersja</CardTitle>
              <CardDescription className="text-lg">
                Zaloguj się lub utwórz konto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Twoje własne projekty
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Zespołowa współpraca
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Synchronizacja w chmurze
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Wszystkie funkcje
                </div>
              </div>
              <Button className="w-full mt-6" variant="outline">
                Zaloguj się / Zarejestruj
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            W trybie demo możesz przełączyć się na pełną wersję w każdej chwili
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoModeSelector;
