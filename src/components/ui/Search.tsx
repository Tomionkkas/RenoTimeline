import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

export const Search = () => {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Szukaj..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
};

export default Search; 