import React from 'react';
import {ArrowUpDown, Search, X} from 'lucide-react';
import {cn} from '@/lib/utils.ts';
import {BaseInput} from '@/components/base-ui/BaseInput';
import type {UserTier} from '@/modules/use-account-addition-data.ts';
import {Select as AntSelect} from 'antd';
import {LineShadowText} from "@/components/ui/line-shadow-text.tsx";
import UpdateBadge from "@/components/business/UpdateBadge.tsx";

export type ListSortKey = 'name' | 'claude' | 'gemini-pro' | 'gemini-flash' | 'gemini-image' | 'tier';
export type ListToolbarValue = {
  query: string;
  sortKey: ListSortKey;
  tiers: UserTier[] | null;
};

const defaultSortOptions: Array<{ value: ListSortKey; label: string }> = [
  { value: 'name', label: 'Username (A-Z)' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini-flash', label: 'Gemini Flash' },
  { value: 'gemini-image', label: 'Gemini Image' },
  { value: 'tier', label: 'Account Tier' },
];

const tierUiMap: Record<UserTier, { label: string; accentClass: string }> = {
  'free-tier': {
    label: 'Free',
    accentClass: 'text-slate-900 dark:text-slate-50',
  },
  'g1-pro-tier': {
    label: 'Pro',
    accentClass: 'text-amber-700 dark:text-amber-300',
  },
  'g1-ultra-tier': {
    label: 'Ultra',
    accentClass: 'text-violet-700 dark:text-violet-300',
  },
};

const allTiers: UserTier[] = ['free-tier', 'g1-pro-tier', 'g1-ultra-tier'];

export interface BusinessListToolbarProps {
  /** Total count of items in the list */
  total: number;
  /** Search keyword */
  query: string;
  /** Sort key */
  sortKey: ListSortKey;
  /** Callback when any item changes (returns complete state) */
  onChange: (next: ListToolbarValue) => void;
  className?: string;
  // When null, shows all tiers
  tiers?: UserTier[] | null;
}

/**
 * Business Component: ListToolbar
 * List top toolbar (title + search + custom action/filter slots)
 */
const AccountsListToolbar: React.FC<BusinessListToolbarProps> = ({
  total,
  query,
  sortKey,
  onChange,
  className,
  tiers,
}) => {
  const normalizedTiers = tiers && tiers.length > 0 ? tiers : null;
  const selectedTiers = normalizedTiers ?? [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ query: e.target.value, sortKey, tiers: normalizedTiers });
  };

  const handleClearSearch = () => {
    onChange({ query: '', sortKey, tiers: normalizedTiers });
  };

  const handleSortChange = (next: ListSortKey) => {
    onChange({ query, sortKey: next, tiers: normalizedTiers });
  };

  const toggleTier = (tier: UserTier) => {
    const exists = selectedTiers.includes(tier);
    const nextTiers = exists
      ? selectedTiers.filter(t => t !== tier)
      : [...selectedTiers, tier];

    const nextNormalized =
      nextTiers.length === 0 || nextTiers.length === allTiers.length
        ? null
        : nextTiers;

    onChange({ query, sortKey, tiers: nextNormalized });
  };

  const clearTiers = () => {
    onChange({ query, sortKey, tiers: null });
  };

  const containerClasses = [
    'flex items-center justify-between gap-3 px-3 py-2 rounded-xl border',
    'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700',
    'backdrop-blur-sm shadow-sm',
  ];

  return (
    <div className={cn(...containerClasses, className)}>
      <div>
        <a target={"_blank"} href={"https://github.com/MonchiLin/antigravity-agent"} className="text-4xl leading-none font-semibold tracking-tighter text-balance cursor-pointer">
          <span>Antigravity</span>
          {/* padding 修复截断 */}
          <LineShadowText className={"pr-2 pb-1"}>Agent</LineShadowText>
        </a>
        <UpdateBadge/>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="inline-flex items-center w-fit rounded-full border border-slate-200 bg-slate-100 p-0.5 transition-colors hover:border-slate-300">
          {/* Left: Label section (weaker visual) */}
          <span className="px-2 py-0.5 text-xs font-medium text-slate-600">
          Accounts
         </span>
          <span className="flex min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-slate-800 shadow-sm">
          {total}
        </span>
        </div>

        <BaseInput
          value={query}
          onChange={handleSearchChange}
          placeholder="Search email or name..."
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={
            query ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : undefined
          }
          containerClassName="w-64 !space-y-0 ml-2"
          className="py-1.5 h-8 text-sm"
        />
        {/* Tier filter: segmented buttons */}
        <div
          className={cn(
            'flex items-center gap-0.5 p-0.5 rounded-lg border',
            'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          )}
        >
          <button
            type="button"
            onClick={clearTiers}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              selectedTiers.length === 0
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/60'
            )}
          >
            All
          </button>
          {allTiers.map(tier => {
            const isActive = selectedTiers.includes(tier);
            const { label, accentClass } = tierUiMap[tier];
            return (
              <button
                key={tier}
                type="button"
                onClick={() => toggleTier(tier)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  isActive
                    ? cn('bg-white dark:bg-slate-900 shadow-sm', accentClass)
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/60'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Sort selection: compact capsule */}
        <div
          className={cn(
            'flex items-center gap-1 h-8 px-2 rounded-lg border',
            'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          )}
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <AntSelect
            value={sortKey}
            onChange={(v) => handleSortChange(v as ListSortKey)}
            size="small"
            variant="borderless"
            popupMatchSelectWidth={false}
            options={defaultSortOptions.map(opt => ({
              value: opt.value,
              label: opt.label,
            }))}
            className={cn(
              'min-w-[120px]',
              '[&_.ant-select-selection-item]:text-xs'
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountsListToolbar;
