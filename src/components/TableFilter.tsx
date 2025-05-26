import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface TableFilterProps {
  column: string;
  sortDirection: 'asc' | 'desc' | null;
  onSort: (column: string) => void;
  onClear: () => void;
  filterOptions?: FilterOption[];
  onFilter?: (value: string) => void;
  currentFilter?: string;
}

export default function TableFilter({ 
  column, 
  sortDirection, 
  onSort, 
  onClear, 
  filterOptions,
  onFilter,
  currentFilter
}: TableFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center space-x-1" ref={filterRef}>
      <span>{column}</span>
      <div className="flex items-center">
        <button
          onClick={() => onSort(column.toLowerCase())}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {sortDirection === 'asc' && <ChevronUp className="h-4 w-4" />}
          {sortDirection === 'desc' && <ChevronDown className="h-4 w-4" />}
          {!sortDirection && (
            <div className="flex flex-col h-4 w-4 -space-y-2">
              <ChevronUp className="h-3 w-3 text-gray-400" />
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </button>
        {filterOptions && (
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-1 hover:bg-gray-100 rounded ${currentFilter ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <Filter className="h-4 w-4" />
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${!currentFilter ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'} hover:bg-gray-100`}
                    onClick={() => {
                      onFilter?.('');
                      setIsFilterOpen(false);
                    }}
                  >
                    All
                  </button>
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`block w-full text-left px-4 py-2 text-sm ${currentFilter === option.value ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'} hover:bg-gray-100`}
                      onClick={() => {
                        onFilter?.(option.value);
                        setIsFilterOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {(sortDirection || currentFilter) && (
        <button
          onClick={() => {
            onClear();
            onFilter?.('');
          }}
          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}