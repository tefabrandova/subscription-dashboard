import { useState, useMemo } from 'react';
import { filterCustomersByPackage } from '../utils/filters';
import { getSubscriptionStatus } from '../utils/subscription';
import type { Package } from '../types';

interface FilterState {
  [key: string]: string;
}

export function useTableSort<T>(
  data: T[],
  searchTerm: string,
  searchKeys: (keyof T)[],
  packages?: Package[]
) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc' | null;
  }>({
    key: null,
    direction: null,
  });

  const [filters, setFilters] = useState<FilterState>({});

  const sortedAndFilteredData = useMemo(() => {
    let filteredData = data;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = data.filter(item =>
        searchKeys.some(key => {
          const value = item[key];
          if (key === 'id') {
            return String(value).slice(0, 8).toLowerCase().includes(searchLower);
          }
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;

      if (key === 'package' && packages) {
        filteredData = filterCustomersByPackage(
          filteredData as any[],
          value,
          packages
        ) as T[];
        return;
      }

      if (key === 'status') {
        filteredData = filteredData.filter((item: any) =>
          item.subscriptionHistory?.some((sub: any) =>
            getSubscriptionStatus(sub) === value
          )
        );
        return;
      }

      filteredData = filteredData.filter(item => {
        const itemValue = item[key as keyof T];
        return String(itemValue).toLowerCase() === value.toLowerCase();
      });
    });

    if (!sortConfig.key || !sortConfig.direction) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === bValue) return 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });
  }, [data, searchTerm, sortConfig, filters, searchKeys, packages]);

  const requestSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }

    setSortConfig({ key, direction });
  };

  const clearSort = () => {
    setSortConfig({ key: null, direction: null });
  };

  const setFilter = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    items: sortedAndFilteredData,
    requestSort,
    clearSort,
    sortConfig,
    setFilter,
    clearFilters,
    filters
  };
}