import React from 'react';
import { X, History, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import HistoryItem, { HistoryItemData } from './HistoryItem';

interface HistoryDialogProps {
  open: boolean;
  onClose: () => void;
  history: HistoryItemData[];
  onSelect: (item: HistoryItemData) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const HistoryDialog: React.FC<HistoryDialogProps> = ({
  open,
  onClose,
  history,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  if (!open) return null;

  const handleSelect = (item: HistoryItemData) => {
    onSelect(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className={cn(
        'relative w-full max-w-3xl max-h-[80vh] m-4',
        'bg-white dark:bg-gray-900 rounded-xl shadow-2xl',
        'flex flex-col overflow-hidden'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Generation History ({history.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              No history yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {history.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onSelect={handleSelect}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryDialog;
