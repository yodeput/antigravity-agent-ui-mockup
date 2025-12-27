import React from 'react';
import { cn } from '@/lib/utils';

export interface TechStackValues {
  framework: 'nextjs' | 'nuxtjs' | '';
  ui: 'tailwindcss' | 'shadcn' | '';
  database: 'prisma' | 'supabase' | '';
  mailing: 'smtp' | 'resend' | '';
  storage: ('local' | 's3')[];
  realtime: boolean;
  messageBroker: 'redis' | 'rabbitmq' | '';
}

interface TechStackPresetsProps {
  value: TechStackValues;
  onChange: (value: TechStackValues) => void;
  className?: string;
}

interface PresetOption {
  id: string;
  label: string;
}

const frameworks: PresetOption[] = [
  { id: 'nextjs', label: 'NextJS' },
  { id: 'nuxtjs', label: 'NuxtJS' },
];

const uiOptions: PresetOption[] = [
  { id: 'tailwindcss', label: 'TailwindCSS' },
  { id: 'shadcn', label: 'Shadcn/Reka' },
];

const databaseOptions: PresetOption[] = [
  { id: 'prisma', label: 'Prisma' },
  { id: 'supabase', label: 'Supabase' },
];

const mailingOptions: PresetOption[] = [
  { id: 'smtp', label: 'SMTP' },
  { id: 'resend', label: 'Resend' },
];

const storageOptions: PresetOption[] = [
  { id: 'local', label: 'Local' },
  { id: 's3', label: 'S3' },
];

const messageBrokerOptions: PresetOption[] = [
  { id: 'redis', label: 'Redis' },
  { id: 'rabbitmq', label: 'RabbitMQ' },
];

const TechStackPresets: React.FC<TechStackPresetsProps> = ({
  value,
  onChange,
  className,
}) => {
  const updateValue = <K extends keyof TechStackValues>(
    key: K,
    newValue: TechStackValues[K]
  ) => {
    onChange({ ...value, [key]: newValue });
  };

  const toggleStorage = (storageId: 'local' | 's3') => {
    const current = value.storage;
    if (current.includes(storageId)) {
      updateValue('storage', current.filter((s) => s !== storageId));
    } else {
      updateValue('storage', [...current, storageId]);
    }
  };

  const chipClass = (selected: boolean) =>
    cn(
      'px-2 py-1 text-xs rounded-md border transition-colors',
      selected
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
    );

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Tech Stack
      </label>

      <div className="space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        {/* Row 1: Framework & UI */}
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Framework</span>
            <div className="flex gap-1">
              {frameworks.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateValue('framework', opt.id as TechStackValues['framework'])}
                  className={chipClass(value.framework === opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">UI Library</span>
            <div className="flex gap-1">
              {uiOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateValue('ui', opt.id as TechStackValues['ui'])}
                  className={chipClass(value.ui === opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Database & Mailing */}
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Database</span>
            <div className="flex gap-1">
              {databaseOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateValue('database', opt.id as TechStackValues['database'])}
                  className={chipClass(value.database === opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mailing</span>
            <div className="flex gap-1">
              {mailingOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateValue('mailing', opt.id as TechStackValues['mailing'])}
                  className={chipClass(value.mailing === opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Storage & Realtime */}
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Storage</span>
            <div className="flex gap-1">
              {storageOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleStorage(opt.id as 'local' | 's3')}
                  className={chipClass(value.storage.includes(opt.id as 'local' | 's3'))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Realtime</span>
            <button
              onClick={() => updateValue('realtime', !value.realtime)}
              className={chipClass(value.realtime)}
            >
              WebSocket
            </button>
          </div>
        </div>

        {/* Row 4: Message Broker */}
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Message Broker</span>
          <div className="flex gap-1">
            {messageBrokerOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => updateValue('messageBroker', opt.id as TechStackValues['messageBroker'])}
                className={chipClass(value.messageBroker === opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechStackPresets;
