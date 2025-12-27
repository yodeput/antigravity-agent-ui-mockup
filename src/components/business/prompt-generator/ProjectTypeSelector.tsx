import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProjectType = 'web' | 'mobile';

interface ProjectTypeSelectorProps {
  value: ProjectType;
  onChange: (type: ProjectType) => void;
  className?: string;
}

const projectTypes = [
  {
    id: 'web' as ProjectType,
    name: 'Web App',
    icon: Monitor,
  },
  // {
  //   id: 'mobile' as ProjectType,
  //   name: 'Mobile App',
  //   icon: Smartphone,
  // },
];

const ProjectTypeSelector: React.FC<ProjectTypeSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Project Type
      </label>
      <div className="flex gap-2">
        {projectTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all flex-1',
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
              )}
            >
              <Icon className={cn('h-4 w-4', isSelected ? 'text-blue-500' : 'text-gray-400')} />
              <span className="text-sm font-medium">{type.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectTypeSelector;
