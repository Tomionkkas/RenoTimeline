import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import SearchResults from './SearchResults';
import { useDebounce } from '@/hooks/useDebounce';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { results, loading } = useGlobalSearch(debouncedQuery);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const showResults = isFocused && query.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigation = () => {
    setIsFocused(false);
    setQuery('');
  }

  return (
    <div className="relative w-full max-w-md" ref={searchContainerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Szukaj projektów, zadań..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>
      {showResults && <SearchResults results={results} loading={loading} onNavigate={handleNavigation} />}
    </div>
  );
};

export default GlobalSearch; 