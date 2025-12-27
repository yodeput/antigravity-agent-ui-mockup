import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Image, Sparkles, Loader2, Download, Plus, History as HistoryIcon, Pencil, Trash2, Copy } from 'lucide-react';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { cn } from '@/lib/utils.ts';
import { CloudCodeAPI } from '@/services/cloudcode-api';
import { useCurrentAntigravityAccount } from '@/modules/use-antigravity-account';
import { logger } from '@/lib/logger';
import { HistoryPanel, HistoryDialog, HistoryItemData, ScreenDefinition, ScreenEditorDialog } from './mockup-generator';
import ModelSelector from './ModelSelector';


// Platform options
const PLATFORMS = [
  { id: 'desktop', name: 'Desktop' },
  { id: 'phone', name: 'Phone' },
] as const;

// Fixed output dimensions (always 16:9 desktop size)
const OUTPUT_DIMENSIONS = {
  width: 768,
  height: 432,
  aspectRatio: '16:9'
};

type PlatformId = typeof PLATFORMS[number]['id'];

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
  platform: string;
  screens?: ScreenDefinition[];
  designLanguage: string;
  fullPrompt?: string;
  timestamp: Date;
}

const MockupGenerator: React.FC<MockupGeneratorProps> = ({ className }) => {
  const currentAccount = useCurrentAntigravityAccount();
  
  // Model and project state
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-pro-image');
  const [project, setProject] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>(PLATFORMS[0].id);
  const [screens, setScreens] = useState<ScreenDefinition[]>([]);
  const [selectedDesignLanguage, setSelectedDesignLanguage] = useState<DesignLanguageId>(DESIGN_LANGUAGES[0].id);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItemData[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  // Screen Dialog state
  const [isScreenDialogOpen, setIsScreenDialogOpen] = useState(false);
  const [editingScreenIndex, setEditingScreenIndex] = useState<number | null>(null);

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

  const constructFullPrompt = (
    userPrompt: string, 
    platformId: string, 
    designLangId: string, 
    screenDefs: ScreenDefinition[]
  ): string => {
    const platformName = PLATFORMS.find(p => p.id === platformId)?.name || platformId;
    const designLang = DESIGN_LANGUAGES.find(d => d.id === designLangId)?.name || designLangId;
    
    // Build specific prompt parts based on platform
    let platformContext = `Platform: ${platformName}`;
    let layoutInstruction = `Output Format: Landscape (16:9) presentation functionality showcasing the ${platformId} interface.`;

    if (platformId === 'phone') {
      const screensContext = screenDefs.map((s, i) => `Screen ${i + 1}: ${s.title} - ${s.description}`).join('\n');
      platformContext += `\n\nApp Screens to Showcase:\n${screensContext}`;
      
      if (screenDefs.length > 1) {
        layoutInstruction += `\n\nLAYOUT REQUIREMENT: Create a clean, side-by-side presentation layout displaying ALL ${screenDefs.length} screens. The screens should be arranged horizontally with even spacing, similar to a Dribbble shot or design portfolio showcase. Ensure each screen is fully visible and clearly labeled if possible.`;
      } else {
         layoutInstruction += `\n\nPresent this single phone screen within a high-quality device frame or presentation setting that fits the 16:9 output aspect ratio.`;
      }
    }

    // Build a comprehensive UI/UX prompt
    return `${MOCKUP_SYSTEM_PROMPT}

Design Language: ${designLang}
${platformContext}
${layoutInstruction}

User Request: ${userPrompt}

Generate a high-fidelity UI design based on the above specifications. The design should be clean, professional, and production-ready.`;
  };


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
      const fullPrompt = constructFullPrompt(
        prompt,
        selectedPlatform,
        selectedDesignLanguage,
        selectedPlatform === 'phone' ? screens : []
      );

      logger.info('Generating image', {
        module: 'MockupGenerator',
        model: selectedModel,
        platform: selectedPlatform,
        designLanguage: selectedDesignLanguage
      });

      // Call the actual image generation API - ALWAYS use fixed desktop dimensions
      const response = await CloudCodeAPI.generateImage(
        currentAccount.auth.access_token,
        selectedModel,
        fullPrompt,
        project,
        OUTPUT_DIMENSIONS.aspectRatio
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
          platform: selectedPlatform,
          screens: selectedPlatform === 'phone' ? screens : undefined,
          designLanguage: selectedDesignLanguage,
          fullPrompt: fullPrompt,
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
    toast.success('Download started');
  };

  const handleCopyPrompt = () => {
    if (!result) return;
    
    let textToCopy = result.fullPrompt;
    
    // Fallback: Reconstruct prompt if missing (for legacy history items)
    if (!textToCopy && result.prompt) {
      textToCopy = constructFullPrompt(
        result.prompt,
        result.platform || 'desktop',
        result.designLanguage || 'modern',
        result.screens || []
      );
    }

    if (!textToCopy) return;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast.success('Prompt copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        toast.error('Failed to copy prompt');
      });
  };

  // History handlers
  const handleSelectHistoryItem = (item: HistoryItemData) => {
    // Load all details back into the editor
    setResult(item);
    setPrompt(item.prompt);
    setSelectedModel(item.model);
    // Backward compatibility for old history items that might have 'aspectRatio'
    // If it has 'platform', use it, otherwise default to desktop
    // Backward compatibility for old history items
    const itemWithPlatform = item as any;
    if (itemWithPlatform.prioritySrc) {
        // Handle really old items if any
    }

    if (item.screens) {
      setScreens(item.screens);
    } else if (itemWithPlatform.screenTitle) {
      // Map legacy single fields to array
      setScreens([{ 
        title: itemWithPlatform.screenTitle, 
        description: itemWithPlatform.screenDescription || '' 
      }]);
    } else {
      // Default empty
      setScreens([]);
    }

    if (itemWithPlatform.platform) {
      setSelectedPlatform(itemWithPlatform.platform as PlatformId);
    } else {
       setSelectedPlatform('desktop');
    }
    
    setSelectedDesignLanguage(item.designLanguage as DesignLanguageId);
  };

  const handleAddScreen = () => {
    setScreens([...screens, { title: '', description: '' }]);
  };

  const handleRemoveScreen = (index: number) => {
    const newScreens = [...screens];
    newScreens.splice(index, 1);
    setScreens(newScreens);
  };

  const openAddScreenDialog = () => {
    setEditingScreenIndex(null);
    setIsScreenDialogOpen(true);
  };

  const openEditScreenDialog = (index: number) => {
    setEditingScreenIndex(index);
    setIsScreenDialogOpen(true);
  };

  const handleSaveScreen = (screen: ScreenDefinition) => {
    if (editingScreenIndex !== null) {
      // Edit existing
      const newScreens = [...screens];
      newScreens[editingScreenIndex] = screen;
      setScreens(newScreens);
    } else {
      // Add new
      setScreens([...screens, screen]);
    }
    setIsScreenDialogOpen(false);
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

  const handleResetForm = () => {
    setPrompt('');
    setScreens([]);
    setResult(null);
  };

  return (
    <div className={cn('flex flex-row h-full', className)}>
      {/* Left Section - Controls */}
      <div className="w-[35%] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Generator
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleResetForm}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="New Design"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowHistoryDialog(true)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors relative"
              title="History"
            >
              <HistoryIcon className="h-4 w-4" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white shadow ring-2 ring-white dark:ring-gray-900">
                  {history.length > 9 ? '9+' : history.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Model Selector - Hidden but used for project initialization */}
        <ModelSelector
          className="hidden"
          value={selectedModel}
          onChange={setSelectedModel}
          filterType="image"
          onProjectLoaded={setProject}
        />

        {/* Platform Options */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Platform
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg border transition-all',
                  selectedPlatform === platform.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800'
                )}
              >
                {platform.name}
              </button>
            ))}
          </div>
        </div>

    

        {/* Design Language Options */}
        <div className="space-y-3">
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
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the UI/UX mockup you want to generate..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          />
        </div>

            {/* Phone Specific Inputs - Multiple Screens */}
        {selectedPlatform === 'phone' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                App Screens
              </label>
              <button
                onClick={openAddScreenDialog}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                + Add Screen
              </button>
            </div>
            
            <div className="space-y-2">
              {screens.length === 0 ? (
                <div 
                  onClick={openAddScreenDialog}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer group text-center"
                >
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-2 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                    <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                    No screens added
                  </p>
                  <p className="text-[10px] text-gray-400 group-hover:text-blue-500 mt-0.5">
                    Click to add your first screen
                  </p>
                </div>
              ) : (
                screens.map((screen, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 relative group flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {screen.title || <span className="text-gray-400 italic">Untitled Screen</span>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {screen.description || <span className="text-gray-400 italic">No description</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditScreenDialog(index)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveScreen(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
        {/* <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <HistoryPanel
            history={history}
            onSelect={handleSelectHistoryItem}
            onDelete={handleDeleteHistoryItem}
            onClearAll={handleClearHistory}
            onSeeAll={() => setShowHistoryDialog(true)}
          />
        </div> */}
      </div>

      {/* Right Section - Result */}
      <div className="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Result
          </h3>
          {result && (
            <div className="flex items-center gap-2">
              <BaseButton
                variant="outline"
                size="sm"
                onClick={handleCopyPrompt}
                leftIcon={<Copy className="h-4 w-4" />}
                title="Copy complete prompt"
              >
                Copy Prompt
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                onClick={handleDownload}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Download
              </BaseButton>
            </div>
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
                <p>Model: {result.model}</p>
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

      {/* Screen Editor Dialog */}
      <ScreenEditorDialog
        open={isScreenDialogOpen}
        onClose={() => setIsScreenDialogOpen(false)}
        screen={editingScreenIndex !== null ? screens[editingScreenIndex] : undefined}
        onSave={handleSaveScreen}
      />
    </div>
  );
};

export default MockupGenerator;
