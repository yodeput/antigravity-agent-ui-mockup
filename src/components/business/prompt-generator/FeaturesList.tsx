import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturesListProps {
  value: string[];
  onChange: (features: string[]) => void;
  className?: string;
}

const FeaturesList: React.FC<FeaturesListProps> = ({
  value,
  onChange,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Features
      </label>

      {/* Input row */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a feature..."
          className="flex-1 px-2 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={cn(
            'px-2 py-1.5 rounded-md transition-colors',
            inputValue.trim()
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          )}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Features list */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {value.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-xs text-gray-700 dark:text-gray-300"
            >
              <span className="max-w-[150px] truncate">{feature}</span>
              <button
                onClick={() => handleRemove(index)}
                className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          No features added yet
        </p>
      )}
    </div>
  );
};

export default FeaturesList;
