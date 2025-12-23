import React from 'react';
import { AccountSessionListCard } from './AccountSessionListCard';
import {motion, AnimatePresence, Variants} from 'motion/react';
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern.tsx";
import { maskEmail, maskName } from "@/lib/string-masking.ts";
import {UserTier} from "@/modules/use-account-addition-data.ts";
import {useAppSettings} from "@/modules/use-app-settings.ts";

export interface AccountSessionListAccountItem {
  geminiProQuote: number | -1
  geminiProQuoteRestIn: string
  geminiFlashQuote: number | -1
  geminiFlashQuoteRestIn: string
  geminiImageQuote: number | -1
  geminiImageQuoteRestIn: string
  claudeQuote: number | -1
  claudeQuoteRestIn: string
  email: string;
  nickName: string;
  userAvatar: string;
  tier: UserTier;
  apiKey: string;
}

export interface AccountSessionListProps {
  accounts: AccountSessionListAccountItem[];
  currentUserEmail?: string;
  onSelect: (user: AccountSessionListAccountItem) => void;
  onSwitch: (user: AccountSessionListAccountItem) => void;
  onDelete: (user: AccountSessionListAccountItem) => void;
}

// 1. Parent container animation: controls child elements to appear like dominoes
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // 0.08 second interval between each card
      delayChildren: 0.1     // Wait a bit before starting
    }
  }
};

// 2. Child element animation: defines enter/exit effects for individual cards
const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,      // Initial position 20px down
    scale: 0.95 // Initially slightly smaller
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

export function AccountSessionList({
                                     accounts,
                                     currentUserEmail,
                                     onSelect,
                                     onSwitch,
                                     onDelete,
                                   }: AccountSessionListProps) {
  const privateMode = useAppSettings(state => state.privateMode);

  return (
    <motion.div
      className="flex flex-row flex-1 gap-4 p-4 flex-wrap items-start content-start relative min-h-[200px]"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Background component is usually set to absolute, not participating in flow layout animation */}
      <AnimatedGridPattern />

      {/* AnimatePresence handles exit animations when elements are removed */}
      <AnimatePresence mode="popLayout">
        {accounts.map((account) => (
          <motion.div
            key={account.email}
            layout // Key: when elements are removed, other elements automatically smooth-fill the gap
            variants={itemVariants} // Inherits parent's hidden/show state
            className="z-10" // Ensures it's above the background
          >
            <AccountSessionListCard
              geminiProQuote={account.geminiProQuote}
              geminiProQuoteRestIn={account.geminiProQuoteRestIn}
              geminiFlashQuote={account.geminiFlashQuote}
              geminiFlashQuoteRestIn={account.geminiFlashQuoteRestIn}
              geminiImageQuote={account.geminiImageQuote}
              geminiImageQuoteRestIn={account.geminiImageQuoteRestIn}
              claudeQuote={account.claudeQuote}
              claudeQuoteRestIn={account.claudeQuoteRestIn}
              userAvatar={account.userAvatar}
              tier={account.tier}
              isCurrentUser={currentUserEmail === account.email}
              email={privateMode ? maskEmail(account.email) : account.email}
              nickName={privateMode ? maskName(account.nickName) : account.nickName}
              onSelect={() => onSelect(account)}
              onSwitch={() => onSwitch(account)}
              onDelete={() => onDelete(account)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state animation */}
      {accounts.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center py-12 px-6 text-center flex-1 z-10 w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Account Information
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
            After signing in to an account in Antigravity, this app will automatically read it.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
