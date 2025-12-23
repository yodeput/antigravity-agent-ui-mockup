import React, { useState } from 'react';
import { Image, Sparkles, Loader2, Download } from 'lucide-react';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { cn } from '@/lib/utils.ts';

// Model options for image generation
const MODELS = [
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
  { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro Image' },
] as const;

type ModelId = typeof MODELS[number]['id'];

// Aspect ratio options
const ASPECT_RATIOS = [
  { id: '1:1', name: '1:1 (Square)', width: 512, height: 512 },
  { id: '16:9', name: '16:9 (Landscape)', width: 768, height: 432 },
  { id: '9:16', name: '9:16 (Portrait)', width: 432, height: 768 },
  { id: '4:3', name: '4:3 (Standard)', width: 640, height: 480 },
  { id: '3:4', name: '3:4 (Portrait Standard)', width: 480, height: 640 },
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
export const MOCKUP_SYSTEM_PROMPT = `You are an expert UI/UX designer specializing in creating high-fidelity mockups. When generating a UI/UX mockup:

1. Follow the specified design language and visual principles
2. Use appropriate spacing, typography, and color schemes
3. Include realistic content placeholders
4. Ensure the design is visually appealing and professional
5. Consider accessibility and usability best practices
6. Add subtle shadows, borders, and visual hierarchy
7. Include appropriate icons and visual elements
8. Make the design feel polished and production-ready

Generate a clean, professional UI/UX mockup based on the user's description.`;

interface MockupGeneratorProps {
  className?: string;
}

interface GeneratedResult {
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  designLanguage: string;
  timestamp: Date;
}

const MockupGenerator: React.FC<MockupGeneratorProps> = ({ className }) => {
  const [selectedModel, setSelectedModel] = useState<ModelId>(MODELS[0].id);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioId>(ASPECT_RATIOS[0].id);
  const [selectedDesignLanguage, setSelectedDesignLanguage] = useState<DesignLanguageId>(DESIGN_LANGUAGES[0].id);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Simulate API call for now - this would be replaced with actual API integration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll show a placeholder result
      // In a real implementation, this would call the actual image generation API
      setResult({
        imageUrl: 'data:image/svg+xml,' + encodeURIComponent(`
          <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="20" fill="#666" text-anchor="middle">UI/UX Mockup Preview</text>
            <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="middle">${selectedDesignLanguage} Design</text>
          </svg>
        `),
        prompt: prompt,
        model: selectedModel,
        aspectRatio: selectedAspectRatio,
        designLanguage: selectedDesignLanguage,
        timestamp: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate mockup');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `mockup-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn('flex flex-row h-full', className)}>
      {/* Left Section - Controls */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 p-6 space-y-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            UI/UX Mockup Generator
          </h2>
        </div>

        {/* Model Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelId)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
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
                <p>Model: {MODELS.find(m => m.id === result.model)?.name}</p>
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
    </div>
  );
};

export default MockupGenerator;
