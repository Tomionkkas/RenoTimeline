import React from 'react';
import { Sparkles } from 'lucide-react';

const ComingSoon = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center bg-slate-800/50 rounded-lg border border-slate-700">
      <Sparkles className="h-12 w-12 text-blue-400 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Funkcja wkrótce dostępna!</h3>
      <p className="text-slate-400 max-w-sm">
        Ciężko pracujemy nad wprowadzeniem tej funkcji. Będzie ona dostępna wkrótce, aby jeszcze bardziej ułatwić Ci pracę.
      </p>
    </div>
  );
};

export default ComingSoon;
