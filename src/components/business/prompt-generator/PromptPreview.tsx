import React from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptPreviewProps {
  prompt: string;
  className?: string;
}

const PromptPreview: React.FC<PromptPreviewProps> = ({ prompt, className }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([prompt], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simple markdown rendering with basic styling
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="text-base font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2 first:mt-0">
            {line.slice(3)}
          </h2>
        );
      }
      // List items with dash
      if (line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300 ml-2">
            <span className="text-gray-400">•</span>
            <span>{line.slice(2)}</span>
          </div>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          return (
            <div key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300 ml-2">
              <span className="text-gray-500 font-medium w-5">{match[1]}.</span>
              <span>{match[2]}</span>
            </div>
          );
        }
      }
      // [Key]: Value format
      if (line.startsWith('[') && line.includes(']:')) {
        const match = line.match(/^\[([^\]]+)\]:\s*(.*)$/);
        if (match) {
          return (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-purple-600 dark:text-purple-400 font-medium">[{match[1]}]:</span>
              <span className="text-gray-700 dark:text-gray-300">{match[2]}</span>
            </div>
          );
        }
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // Regular text
      return (
        <p key={i} className="text-sm text-gray-700 dark:text-gray-300">
          {line}
        </p>
      );
    });
  };

  const buttonClass = (enabled: boolean, active?: boolean) =>
    cn(
      'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
      enabled
        ? active
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
    );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Generated Prompt
        </label>
        <div className="flex gap-2">
          <button onClick={handleDownload} disabled={!prompt} className={buttonClass(!!prompt)}>
            <Download className="h-4 w-4" />
            Download
          </button>
          <button onClick={handleCopy} disabled={!prompt} className={buttonClass(!!prompt, copied)}>
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'flex-1 p-4 rounded-xl border overflow-auto',
          'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
        )}
      >
        {prompt ? (
          <div className="space-y-0.5">{renderMarkdown(prompt)}</div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500 text-sm">
              Your generated prompt will appear here...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptPreview;
