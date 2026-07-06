import { useState, useMemo, useCallback } from 'react';

export const useFilter = (items, filterConfig = {}) => {
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSortBy(null);
    setSortOrder('asc');
  }, []);

  const applySort = useCallback((field, order = 'asc') => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter(item => {
          const itemValue = item[key];
          if (typeof value === 'string') {
            return String(itemValue).toLowerCase().includes(value.toLowerCase());
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return result;
  }, [items, filters, sortBy, sortOrder]);

  return {
    filters,
    updateFilter,
    resetFilters,
    sortBy,
    sortOrder,
    applySort,
    filteredItems: filteredAndSortedItems,
    hasFilters: Object.keys(filters).length > 0,
  };
};
