import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export const GreetingHeader = () => {
  const { user } = useAuth();
  const date = new Date();
  const hour = date.getHours();
  
  let greeting = 'Witaj';
  if (hour < 12) greeting = 'Dzień dobry';
  else if (hour < 18) greeting = 'Dzień dobry';
  else greeting = 'Dobry wieczór';

  const formattedDate = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);

  // Capitalize first letter of date
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="mb-8 animate-fadeIn">
      <div className="flex flex-col space-y-2">
        <span className="text-blue-400 font-medium tracking-wide text-sm uppercase">
          {capitalizedDate}
        </span>
        <h2 className="text-4xl font-bold text-white tracking-tight">
          {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{user?.user_metadata?.first_name || 'Użytkowniku'}</span>
        </h2>
        <p className="text-white/60 text-lg max-w-2xl">
          Oto podsumowanie Twoich projektów na dziś. Wygląda na to, że masz kilka spraw wymagających uwagi.
        </p>
      </div>
    </div>
  );
};

