import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { countryPhoneCodes } from '../utils/phone';

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CountryCodeSelect({ value, onChange }: CountryCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = countryPhoneCodes.find(c => c.code === value);

  const filteredCountries = countryPhoneCodes.filter(country => 
    country.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.includes(searchTerm)
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-l-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <span className="flex items-center">
          <span className="mr-2">{selectedCountry?.flag}</span>
          <span>{selectedCountry?.code}</span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Search country or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-auto py-1">
            {filteredCountries.map((country) => (
              <li
                key={country.code}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center ${
                  country.code === value ? 'bg-indigo-50 text-indigo-600' : ''
                }`}
                onClick={() => {
                  onChange(country.code);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                <span className="mr-2">{country.flag}</span>
                <span>{country.country}</span>
                <span className="ml-2 text-gray-500">{country.code}</span>
              </li>
            ))}
            {filteredCountries.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}