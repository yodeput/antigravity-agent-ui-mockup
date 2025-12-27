import React, { useState, useEffect } from 'react';
import { Select as AntSelect } from 'antd';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CloudCodeAPI } from '@/services/cloudcode-api';
import { CloudCodeAPITypes } from '@/services/cloudcode-api.types';
import { useCurrentAntigravityAccount } from '@/modules/use-antigravity-account';
import { logger } from '@/lib/logger';

export type ModelFilterType = 'all' | 'image' | 'text';

export interface ModelOption {
  id: string;
  name: string;
  isImageModel: boolean;
}

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  filterType?: ModelFilterType;
  onProjectLoaded?: (projectId: string) => void;
  className?: string;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  filterType = 'all',
  onProjectLoaded,
  className,
  disabled = false,
}) => {
  const currentAccount = useCurrentAntigravityAccount();
  
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      if (!currentAccount?.auth?.access_token) {
        setError('No authenticated account found');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // First, get the project from loadCodeAssist
        const codeAssistResponse = await CloudCodeAPI.loadCodeAssist(currentAccount.auth.access_token);
        const projectId = codeAssistResponse.cloudaicompanionProject;
        
        // Notify parent about the project ID
        if (onProjectLoaded) {
          onProjectLoaded(projectId);
        }

        // Then fetch available models
        const response = await CloudCodeAPI.fetchAvailableModels(
          currentAccount.auth.access_token,
          projectId
        );

        // Get image generation model IDs
        const imageModelIds = response.imageGenerationModelIds || [];

        // Extract all models from the response
        const allModelIds = Object.keys(response.models || {});
        const modelOptions: ModelOption[] = allModelIds.map((modelId: string) => {
          const modelData = response.models[modelId as keyof CloudCodeAPITypes.Models];
          const displayName = modelData && 'displayName' in modelData 
            ? modelData.displayName 
            : modelId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          
          return {
            id: modelId,
            name: displayName,
            isImageModel: imageModelIds.includes(modelId),
          };
        });

        setModels(modelOptions);
        
        // Auto-select first matching model if no value is set
        if (!value) {
          const filteredModels = filterModels(modelOptions, filterType);
          if (filteredModels.length > 0) {
            // For image type, prefer image models
            if (filterType === 'image') {
              const imageModel = filteredModels.find(m => m.isImageModel);
              onChange(imageModel?.id || filteredModels[0].id);
            } else if (filterType === 'text') {
              // For text type, prefer flash models
              const textModel = filteredModels.find(m => m.id.includes('flash')) || filteredModels[0];
              onChange(textModel.id);
            } else {
              onChange(filteredModels[0].id);
            }
          }
        }

        logger.info('Models fetched successfully', {
          module: 'ModelSelector',
          totalModels: modelOptions.length,
          filterType
        });
      } catch (err: any) {
        const errorMessage = err?.error?.message || err?.message || 'Failed to fetch models';
        setError(errorMessage);
        logger.error('Failed to fetch models', {
          module: 'ModelSelector',
          error: errorMessage
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [currentAccount?.auth?.access_token]);

  // Filter models based on type
  const filterModels = (modelList: ModelOption[], type: ModelFilterType): ModelOption[] => {
    switch (type) {
      case 'image':
        return modelList.filter(m => m.isImageModel);
      case 'text':
        return modelList.filter(m => !m.isImageModel);
      default:
        return modelList;
    }
  };

  const filteredModels = filterModels(models, filterType);

  if (error) {
    return (
      <div className={cn('space-y-1', className)}>
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Model
        </label>
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Model
      </label>
      {isLoading ? (
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading models...
        </div>
      ) : (
        <AntSelect
          value={value || undefined}
          onChange={onChange}
          placeholder="Select a model"
          className="w-full"
          size="small"
          disabled={disabled || filteredModels.length === 0}
          options={filteredModels.map(model => ({
            value: model.id,
            label: model.name,
          }))}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      )}
    </div>
  );
};

export default ModelSelector;
