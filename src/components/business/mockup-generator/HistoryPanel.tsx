import React from 'react';
import { History, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import HistoryItem, { HistoryItemData } from './HistoryItem';

interface HistoryPanelProps {
  history: HistoryItemData[];
  onSelect: (item: HistoryItemData) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onSeeAll: () => void;
  className?: string;
}

const MAX_VISIBLE_ITEMS = 6;

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onSelect,
  onDelete,
  onClearAll,
  onSeeAll,
  className,
}) => {
  const visibleItems = history.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = history.length > MAX_VISIBLE_ITEMS;

  if (history.length === 0) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">History</span>
        </div>
        <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
          No history yet. Generated designs will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            History ({history.length})
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Clear All
        </button>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-2 gap-2">
        {visibleItems.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* See All button */}
      {hasMore && (
        <button
          onClick={onSeeAll}
          className={cn(
            'w-full py-2 text-sm font-medium rounded-lg',
            'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
            'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
          )}
        >
          See All ({history.length})
        </button>
      )}
    </div>
  );
};

export default HistoryPanel;
