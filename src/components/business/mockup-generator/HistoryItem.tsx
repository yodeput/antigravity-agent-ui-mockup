import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HistoryItemData {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  designLanguage: string;
  timestamp: Date;
}

interface HistoryItemProps {
  item: HistoryItemData;
  onSelect: (item: HistoryItemData) => void;
  onDelete: (id: string) => void;
  className?: string;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  item,
  onSelect,
  onDelete,
  className,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className={cn(
        'group relative cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-800 overflow-hidden transition-all hover:shadow-md hover:border-blue-400',
        className
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
        <img
          src={item.imageUrl}
          alt="Generated design"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mb-1">
          {item.prompt}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          {formatDate(item.timestamp)}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className={cn(
          'absolute top-1 right-1 p-1 rounded-md',
          'bg-red-500/80 text-white opacity-0 group-hover:opacity-100',
          'transition-opacity hover:bg-red-600'
        )}
        title="Delete"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
};

export default HistoryItem;
