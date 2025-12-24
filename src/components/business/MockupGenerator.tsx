import React, { useState, useEffect } from 'react';
import { Image, Sparkles, Loader2, Download } from 'lucide-react';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { cn } from '@/lib/utils.ts';
import { Select as AntSelect } from 'antd';
import { CloudCodeAPI } from '@/services/cloudcode-api';
import { CloudCodeAPITypes } from '@/services/cloudcode-api.types';
import { useCurrentAntigravityAccount } from '@/modules/use-antigravity-account';
import { logger } from '@/lib/logger';
import { HistoryPanel, HistoryDialog, HistoryItemData } from './mockup-generator';

// Model option interface
interface ModelOption {
  id: string;
  name: string;
}

// Aspect ratio options
const ASPECT_RATIOS = [
  { id: '9:16', name: 'Phone', width: 432, height: 768 },
  { id: '16:9', name: 'Desktop', width: 768, height: 432 },
] as const;

type AspectRatioId = typeof ASPECT_RATIOS[number]['id'];

// Design language options
const DESIGN_LANGUAGES = [
  { id: 'modern', name: 'Modern/Minimal' },
  { id: 'material', name: 'Material Design' },
  { id: 'ios', name: 'iOS Human Interface' },
  { id: 'fluent', name: 'Fluent Design' },
  { id: 'glassmorphism', name: 'Glassmorphism' },
  { id: 'neomorphism', name: 'Neomorphism' },
  { id: 'flat', name: 'Flat Design' },
  { id: 'skeuomorphic', name: 'Skeuomorphic' },
] as const;

type DesignLanguageId = typeof DESIGN_LANGUAGES[number]['id'];

// System prompt for UI/UX mockup generation
export const MOCKUP_SYSTEM_PROMPT = `YYou are an AI agent specialized in creating mobile app designs. Your role is to assist users in conceptualizing, developing, and refining mobile app UI/UX designs. Start by generating innovative design ideas and proceed to create wireframes that establish basic layouts and user flow. Transform wireframes into high-fidelity mockups, featuring detailed design elements and interactions. Regularly review and suggest improvements to the design, ensuring it meets modern standards in user experience and visual aesthetics. Your goal is to help users create apps that are both functional and beautiful.`;

interface MockupGeneratorProps {
  className?: string;
}

interface GeneratedResult {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  designLanguage: string;
  timestamp: Date;
}

const MockupGenerator: React.FC<MockupGeneratorProps> = ({ className }) => {
  const currentAccount = useCurrentAntigravityAccount();
  
  // Dynamic models state
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [project, setProject] = useState<string>('');
  
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioId>(ASPECT_RATIOS[0].id);
  const [selectedDesignLanguage, setSelectedDesignLanguage] = useState<DesignLanguageId>(DESIGN_LANGUAGES[0].id);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItemData[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const HISTORY_STORAGE_KEY = 'ui-design-generator-history';
  const MAX_HISTORY_ITEMS = 20;

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const items = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(items);
      }
    } catch (err) {
      logger.error('Failed to load history from localStorage', { error: err });
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (items: HistoryItemData[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      logger.error('Failed to save history to localStorage', { error: err });
    }
  };

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      if (!currentAccount?.auth?.access_token) {
        setModelsError('No authenticated account found');
        return;
      }

      setIsLoadingModels(true);
      setModelsError(null);

      try {
        // First, get the project from loadCodeAssist
        const codeAssistResponse = await CloudCodeAPI.loadCodeAssist(currentAccount.auth.access_token);
        const projectId = codeAssistResponse.cloudaicompanionProject;
        setProject(projectId);

        // Then fetch available models
        const response = await CloudCodeAPI.fetchAvailableModels(
          currentAccount.auth.access_token,
          projectId
        );

        // Extract all models from the response (including non-image models)
        const allModelIds = Object.keys(response.models || {});
        const modelOptions: ModelOption[] = allModelIds.map((modelId: string) => {
          // Try to get display name from models object
          const modelData = response.models[modelId as keyof CloudCodeAPITypes.Models];
          const displayName = modelData && 'displayName' in modelData 
            ? modelData.displayName 
            : modelId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          
          return {
            id: modelId,
            name: displayName
          };
        });

        setModels(modelOptions);
        
        // Set default selected model (prefer image generation model if available)
        if (modelOptions.length > 0 && !selectedModel) {
          const imageModelIds = response.imageGenerationModelIds || [];
          const defaultModel = imageModelIds[0] || modelOptions[0].id;
          setSelectedModel(defaultModel);
        }

        logger.info('Fetched available models', {
          module: 'MockupGenerator',
          modelCount: modelOptions.length,
          models: modelOptions.map(m => m.id)
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
        setModelsError(errorMessage);
        logger.error('Failed to fetch models', {
          module: 'MockupGenerator',
          error: errorMessage
        });
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [currentAccount?.auth?.access_token]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!currentAccount?.auth?.access_token) {
      setError('No authenticated account found');
      return;
    }

    if (!selectedModel) {
      setError('Please select a model');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get the selected aspect ratio and design language
      const aspectRatio = ASPECT_RATIOS.find(r => r.id === selectedAspectRatio) || ASPECT_RATIOS[0];
      const designLang = DESIGN_LANGUAGES.find(d => d.id === selectedDesignLanguage)?.name || selectedDesignLanguage;
      
      // Build a comprehensive UI/UX prompt
      const fullPrompt = `${MOCKUP_SYSTEM_PROMPT}

Design Language: ${designLang}
Aspect Ratio: ${aspectRatio.id} (${aspectRatio.width}x${aspectRatio.height})

User Request: ${prompt}

Generate a high-fidelity UI design based on the above specifications. The design should be clean, professional, and production-ready.`;

      logger.info('Generating image', {
        module: 'MockupGenerator',
        model: selectedModel,
        aspectRatio: selectedAspectRatio,
        designLanguage: selectedDesignLanguage
      });

      // Call the actual image generation API
      const response = await CloudCodeAPI.generateImage(
        currentAccount.auth.access_token,
        selectedModel,
        fullPrompt,
        project,
        selectedAspectRatio
      );

      // Extract the generated image from the response
      console.log('[MockupGenerator] API response:', response);
      
      // Handle different response formats
      let imageUrl: string | null = null;
      
      // Format 1: Standard Gemini format with candidates
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        
        if (imagePart?.inlineData) {
          imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
      }
      
      // Format 2: Direct image data in response (sandbox API)
      if (!imageUrl && (response as any).imageData) {
        const imgData = (response as any).imageData;
        imageUrl = `data:${imgData.mimeType || 'image/png'};base64,${imgData.data}`;
      }
      
      // Format 3: Direct base64 string
      if (!imageUrl && (response as any).image) {
        imageUrl = `data:image/png;base64,${(response as any).image}`;
      }
      
      if (imageUrl) {
        const newResult: GeneratedResult = {
          id: crypto.randomUUID(),
          imageUrl,
          prompt: prompt,
          model: selectedModel,
          aspectRatio: selectedAspectRatio,
          designLanguage: selectedDesignLanguage,
          timestamp: new Date(),
        };
        
        setResult(newResult);

        // Add to history (prepend and limit to max items)
        const newHistory = [newResult, ...history].slice(0, MAX_HISTORY_ITEMS);
        setHistory(newHistory);
        saveHistory(newHistory);

        logger.info('Image generated successfully', {
          module: 'MockupGenerator',
          model: selectedModel
        });
      } else {
        console.error('[MockupGenerator] Could not extract image from response:', response);
        throw new Error('No image data in response');
      }
    } catch (err: any) {
      const errorMessage = err?.error?.message || err?.message || 'Failed to generate mockup';
      setError(errorMessage);
      logger.error('Failed to generate image', {
        module: 'MockupGenerator',
        error: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    
    // Determine file extension from the data URL
    let extension = 'png';
    if (result.imageUrl.includes('image/jpeg')) {
      extension = 'jpg';
    } else if (result.imageUrl.includes('image/webp')) {
      extension = 'webp';
    } else if (result.imageUrl.includes('image/svg')) {
      extension = 'svg';
    }
    
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `mockup-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // History handlers
  const handleSelectHistoryItem = (item: HistoryItemData) => {
    // Load all details back into the editor
    setResult(item);
    setPrompt(item.prompt);
    setSelectedModel(item.model);
    setSelectedAspectRatio(item.aspectRatio as AspectRatioId);
    setSelectedDesignLanguage(item.designLanguage as DesignLanguageId);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    saveHistory(newHistory);
    // Clear result if the deleted item is currently displayed
    if (result?.id === id) {
      setResult(null);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setResult(null);
  };

  return (
    <div className={cn('flex flex-row h-full', className)}>
      {/* Left Section - Controls */}
      <div className="w-[35%] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 p-6 space-y-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            UI Design Generator
          </h2>
        </div>

        {/* Model Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Model
          </label>
          {isLoadingModels ? (
            <div className="w-full px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Loading models...
            </div>
          ) : modelsError ? (
            <div className="w-full px-3 py-2 text-sm text-red-500 dark:text-red-400">
              {modelsError}
            </div>
          ) : (
            <AntSelect
              value={selectedModel || undefined}
              onChange={(v) => setSelectedModel(v)}
              placeholder="Select a model"
              disabled={models.length === 0}
              options={models.map((model) => ({
                value: model.id,
                label: model.name,
              }))}
              className="w-full [&_.ant-select-selector]:!rounded-lg"
            />
          )}
        </div>

        {/* Aspect Ratio Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setSelectedAspectRatio(ratio.id)}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg border transition-colors',
                  selectedAspectRatio === ratio.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                )}
              >
                {ratio.name}
              </button>
            ))}
          </div>
        </div>

        {/* Design Language Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Design Language
          </label>
          <div className="flex flex-wrap gap-2">
            {DESIGN_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedDesignLanguage(lang.id)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full border transition-colors',
                  selectedDesignLanguage === lang.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                )}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the UI/UX mockup you want to generate..."
            rows={5}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <BaseButton
          onClick={handleGenerate}
          isLoading={isGenerating}
          loadingText="Generating..."
          fullWidth
          leftIcon={<Sparkles className="h-4 w-4" />}
          disabled={isGenerating || !prompt.trim()}
        >
          Generate Mockup
        </BaseButton>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* History Panel */}
          <HistoryPanel
            history={history}
            onSelect={handleSelectHistoryItem}
            onDelete={handleDeleteHistoryItem}
            onClearAll={handleClearHistory}
            onSeeAll={() => setShowHistoryDialog(true)}
          />
        </div>
      </div>

      {/* Right Section - Result */}
      <div className="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Result
          </h3>
          {result && (
            <BaseButton
              variant="outline"
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download
            </BaseButton>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-sm">Generating your mockup...</p>
            </div>
          ) : result ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <img
                src={result.imageUrl}
                alt="Generated mockup"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                <p>Model: {models.find(m => m.id === result.model)?.name || result.model}</p>
                <p>Design: {DESIGN_LANGUAGES.find(d => d.id === result.designLanguage)?.name}</p>
                <p>Generated at: {result.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-gray-400 dark:text-gray-500">
              <Image className="h-16 w-16" />
              <p className="text-sm">Your generated mockup will appear here</p>
              <p className="text-xs">Enter a prompt and click Generate to create a UI/UX mockup</p>
            </div>
          )}
        </div>
      </div>

      {/* History Dialog */}
      <HistoryDialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        history={history}
        onSelect={handleSelectHistoryItem}
        onDelete={handleDeleteHistoryItem}
        onClearAll={handleClearHistory}
      />
    </div>
  );
};

export default MockupGenerator;
