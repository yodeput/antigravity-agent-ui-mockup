import React, { useState, useMemo } from 'react';
import { Wand2, Sparkles, Loader2 } from 'lucide-react';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { cn } from '@/lib/utils';
import { CloudCodeAPI } from '@/services/cloudcode-api';
import { useCurrentAntigravityAccount } from '@/modules/use-antigravity-account';
import { logger } from '@/lib/logger';
import {
  ProjectTypeSelector,
  ProjectType,
  TechStackPresets,
  TechStackValues,
  FeaturesList,
  PromptPreview,
} from './prompt-generator';
import ModelSelector from './ModelSelector';

interface PromptGeneratorProps {
  className?: string;
}

const defaultTechStack: TechStackValues = {
  framework: '',
  ui: '',
  database: '',
  mailing: '',
  storage: [],
  realtime: false,
  messageBroker: '',
};

// System prompt for AI to generate optimized prompts
const AI_SYSTEM_PROMPT = `You are an expert prompt engineer specializing in creating detailed, actionable prompts for AI coding assistants. Your task is to take the user's project specifications and transform them into a comprehensive, well-structured prompt that will help an AI agent create the best possible project.

Your generated prompt should:
1. Be clear, specific, and actionable
2. Include detailed technical specifications
3. Define clear project structure and file organization
4. Specify coding standards and best practices
5. Include acceptance criteria and testing requirements
6. Be formatted in clean markdown

Always output the prompt directly without any preamble or explanation.`;

const PromptGenerator: React.FC<PromptGeneratorProps> = ({ className }) => {
  const currentAccount = useCurrentAntigravityAccount();
  
  const [mainPurpose, setMainPurpose] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('web');
  const [techStack, setTechStack] = useState<TechStackValues>(defaultTechStack);
  const [features, setFeatures] = useState<string[]>([]);
  const [requirements, setRequirements] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [project, setProject] = useState<string>('');

  // Build user input summary for AI
  const buildUserInput = () => {
    const projectTypeName = projectType === 'web' ? 'Web Application' : 'Mobile Application';
    
    const techStackParts: string[] = [];
    if (techStack.framework) {
      techStackParts.push(`Framework: ${techStack.framework === 'nextjs' ? 'NextJS' : 'NuxtJS'}`);
    }
    if (techStack.ui) {
      techStackParts.push(`UI: ${techStack.ui === 'tailwindcss' ? 'TailwindCSS' : 'Shadcn/Reka UI'}`);
    }
    if (techStack.database) {
      techStackParts.push(`Database: ${techStack.database === 'prisma' ? 'Prisma' : 'Supabase'}`);
    }
    if (techStack.mailing) {
      techStackParts.push(`Mailing: ${techStack.mailing === 'smtp' ? 'SMTP' : 'Resend'}`);
    }
    if (techStack.storage.length > 0) {
      techStackParts.push(`Storage: ${techStack.storage.map(s => s === 'local' ? 'Local' : 'S3').join(', ')}`);
    }
    if (techStack.realtime) {
      techStackParts.push('Realtime: WebSocket');
    }
    if (techStack.messageBroker) {
      techStackParts.push(`Message Broker: ${techStack.messageBroker === 'redis' ? 'Redis' : 'RabbitMQ'}`);
    }

    return `
Project Purpose: ${mainPurpose || 'Not specified'}
Project Type: ${projectTypeName}

Tech Stack:
${techStackParts.map(p => `- ${p}`).join('\n')}

Features:
${features.length > 0 ? features.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'No specific features defined'}

Additional Requirements:
${requirements || 'None'}

Please generate a comprehensive, detailed prompt that an AI coding assistant can use to build this project. Include:
- Detailed project structure with file/folder organization
- Step-by-step implementation guide
- Code architecture and patterns to follow
- State management approach (${techStack.framework === 'nextjs' ? 'Zustand or React Context' : techStack.framework === 'nuxtjs' ? 'Pinia' : 'appropriate solution'})
- API design if applicable
- Testing strategy
- Security considerations
- Performance optimizations
`;
  };

  const generateWithAI = async () => {
    if (!currentAccount?.auth?.access_token) {
      setError('No authenticated account found');
      return;
    }

    if (!selectedModel) {
      setError('Please wait for models to load');
      return;
    }

    if (!project) {
      setError('Project not loaded');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const userInput = buildUserInput();

      logger.info('Generating prompt with AI', {
        module: 'PromptGenerator',
        model: selectedModel
      });

      // Call the generateText API to generate the prompt
      const response = await CloudCodeAPI.generateText(
        currentAccount.auth.access_token,
        selectedModel,
        userInput,
        project,
        AI_SYSTEM_PROMPT
      );

      // Extract the generated text from the response
      if (response.candidates && response.candidates.length > 0) {
        const textPart = response.candidates[0].content?.parts?.find(part => part.text);
        if (textPart?.text) {
          setGeneratedPrompt(textPart.text);
          logger.info('Prompt generated successfully', { module: 'PromptGenerator' });
        } else {
          throw new Error('No text in response');
        }
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      const errorMessage = err?.error?.message || err?.message || 'Failed to generate prompt';
      setError(errorMessage);
      logger.error('Failed to generate prompt with AI', {
        module: 'PromptGenerator',
        error: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isValid = useMemo(() => {
    return techStack.framework && techStack.ui && features.length > 0;
  }, [techStack, features]);

  return (
    <div className={cn('flex flex-row h-full', className)}>
      {/* Left Section - Inputs */}
      <div className="w-[40%] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 p-4 space-y-3 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="h-4 w-4 text-purple-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Prompt Generator
          </h2>
        </div>

        {/* Model Selector */}
        <ModelSelector
          value={selectedModel}
          onChange={setSelectedModel}
          filterType="text"
          onProjectLoaded={setProject}
        />

        {/* Main Purpose */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Main Purpose
          </label>
          <input
            type="text"
            value={mainPurpose}
            onChange={(e) => setMainPurpose(e.target.value)}
            placeholder="e.g., E-commerce platform, Task management app..."
            className="w-full px-2 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Project Type */}
        <ProjectTypeSelector value={projectType} onChange={setProjectType} />

        {/* Tech Stack */}
        <TechStackPresets value={techStack} onChange={setTechStack} />

        {/* Features */}
        <FeaturesList value={features} onChange={setFeatures} />

        {/* Requirements */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Additional Requirements
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Any additional requirements or constraints..."
            rows={3}
            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none text-xs"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <BaseButton
          onClick={generateWithAI}
          fullWidth
          size="sm"
          leftIcon={isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          disabled={!isValid || isGenerating}
          className="bg-purple-500 hover:bg-purple-600"
        >
          {isGenerating ? 'Generating...' : 'Generate with AI'}
        </BaseButton>

        {!isValid && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Please select a framework, UI library, and add at least one feature.
          </p>
        )}
      </div>

      {/* Right Section - Preview */}
      <div className="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
        <PromptPreview prompt={generatedPrompt} />
      </div>
    </div>
  );
};

export default PromptGenerator;
