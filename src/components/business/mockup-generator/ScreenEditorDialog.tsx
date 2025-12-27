import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScreenDefinition } from './HistoryItem';
import { BaseButton } from '@/components/base-ui/BaseButton';

interface ScreenEditorDialogProps {
  open: boolean;
  onClose: () => void;
  screen?: ScreenDefinition;
  onSave: (screen: ScreenDefinition) => void;
}

const ScreenEditorDialog: React.FC<ScreenEditorDialogProps> = ({
  open,
  onClose,
  screen,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(screen?.title || '');
      setDescription(screen?.description || '');
    }
  }, [open, screen]);

  if (!open) return null;

  const handleSave = () => {
    onSave({ title, description });
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
        'relative w-full max-w-md m-4',
        'bg-white dark:bg-gray-900 rounded-xl shadow-2xl',
        'flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {screen ? 'Edit Screen' : 'Add Screen'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Screen Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Home, Profile, Settings"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the screen's purpose and key elements..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <BaseButton
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </BaseButton>
          <BaseButton
            onClick={handleSave}
            disabled={!title.trim()}
          >
            Save Screen
          </BaseButton>
        </div>
      </div>
    </div>
  );
};

export default ScreenEditorDialog;
