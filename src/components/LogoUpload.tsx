import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useStore } from '../store';

export default function LogoUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const { logo, updateLogo } = useStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      updateLogo(base64String);
      localStorage.setItem('appLogo', base64String);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    updateLogo(null);
    localStorage.removeItem('appLogo');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Logo Management</h3>
        {logo && (
          <button
            onClick={removeLogo}
            className="text-red-600 hover:text-red-800 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Remove Logo
          </button>
        )}
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {logo ? (
          <div className="flex flex-col items-center">
            <img
              src={logo}
              alt="Current logo"
              className="h-20 w-auto mb-4 object-contain"
            />
            <p className="text-sm text-gray-500">
              Drag and drop a new image to replace the current logo
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500">
              Drag and drop your logo here, or{' '}
              <label className="text-indigo-600 hover:text-indigo-800 cursor-pointer">
                browse
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileInput}
                />
              </label>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Recommended size: 200x60 pixels
            </p>
          </div>
        )}
      </div>
    </div>
  );
}