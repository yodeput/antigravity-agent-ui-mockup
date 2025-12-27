import React, { useState } from 'react';
import { Image, Wand2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import MockupGenerator from './MockupGenerator';
import PromptGenerator from './PromptGenerator';

type GeneratorView = 'menu' | 'ui-generator' | 'prompt-generator';

interface GeneratorPageProps {
  className?: string;
}

const menuItems = [
  {
    id: 'ui-generator' as GeneratorView,
    name: 'UI Generator',
    description: 'Generate UI with AI',
    icon: Image,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    hoverBorder: 'hover:border-blue-400',
  },
  {
    id: 'prompt-generator' as GeneratorView,
    name: 'Prompt Generator',
    description: 'Create optimized prompts for AI agents',
    icon: Wand2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    hoverBorder: 'hover:border-purple-400',
  },
];

const GeneratorPage: React.FC<GeneratorPageProps> = ({ className }) => {
  const [currentView, setCurrentView] = useState<GeneratorView>('menu');

  // Render UI Generator
  if (currentView === 'ui-generator') {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        {/* Back button */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <button
            onClick={() => setCurrentView('menu')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Generators
          </button>
        </div>
        <MockupGenerator className="flex-1" />
      </div>
    );
  }

  // Render Prompt Generator
  if (currentView === 'prompt-generator') {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        {/* Back button */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <button
            onClick={() => setCurrentView('menu')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Generators
          </button>
        </div>
        <PromptGenerator className="flex-1" />
      </div>
    );
  }

  // Render Menu
  return (
    <div className={cn('flex flex-col h-full items-center justify-center p-8', className)}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Generators
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Choose a generator to get started
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                'flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all',
                item.bgColor,
                item.borderColor,
                item.hoverBorder,
                'hover:shadow-lg hover:scale-[1.02]'
              )}
            >
              <div className={cn('p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm')}>
                <Icon className={cn('h-12 w-12', item.color)} />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {item.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GeneratorPage;
