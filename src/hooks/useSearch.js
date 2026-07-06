import { useState, useCallback, useMemo } from 'react';

export const useSearch = (items, searchFields = ['name']) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    setIsSearching(true);
    const term = searchTerm.toLowerCase().trim();
    
    const results = items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(term);
      });
    });
    
    setIsSearching(false);
    return results;
  }, [items, searchTerm, searchFields]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
    clearSearch,
    hasResults: filteredItems.length > 0,
    resultCount: filteredItems.length,
  };
};
