import React from 'react';
import { Download } from 'lucide-react';
import { exportData } from '../utils/export';
import { useStore } from '../store';

interface ExportButtonProps {
  data: any[];
  type: string;
  className?: string;
}

export default function ExportButton({ data, type, className = '' }: ExportButtonProps) {
  const packages = useStore((state) => state.packages);

  const handleExport = () => {
    exportData(data, type, 'csv', type === 'customers' ? packages : undefined);
  };

  return (
    <button
      onClick={handleExport}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className}`}
    >
      <Download className="h-4 w-4 mr-2" />
      Export
    </button>
  );
}