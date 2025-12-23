import {create} from 'zustand';
import {logger} from '../lib/logger.ts';
import {AccountCommands} from '@/commands/AccountCommands.ts';
import type {AntigravityAccount} from '@/commands/types/account.types.ts';
import {AccountManageCommands} from "@/commands/AccountManageCommands.ts";

// Constants
const FILE_WRITE_DELAY_MS = 500; // delay to wait for file writes to complete

// Store state
export interface AntigravityAccountState {
  accounts: AntigravityAccount[];
  currentAuthInfo: AntigravityAccount | null;
}

// Store Actions
export interface AntigravityAccountActions {
  // Basic operations
  delete: (email: string) => Promise<void>;
  insertOrUpdateCurrentAccount: () => Promise<void>;
  switchToAccount: (email: string) => Promise<void>;

  // Batch operations
  clearAllAccounts: () => Promise<void>;

  // Queries
  getAccounts: () => Promise<AntigravityAccount[]>;
}

// Create store
export const useAntigravityAccount = create<AntigravityAccountState & AntigravityAccountActions>()((set, get) => ({
  // Initial state
  accounts: [],
  currentAuthInfo: null,

  // ============ Basic operations ============
  delete: async (email: string): Promise<void> => {
    try {
      await AccountManageCommands.deleteBackup(email);

      // Refresh data after successful deletion
      const accounts = await AccountCommands.getAntigravityAccounts();
      set({ accounts: accounts });
    } catch (error) {
      logger.error('Failed to delete user', {
        module: 'UserManagement',
        email,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  },

  insertOrUpdateCurrentAccount: async (): Promise<void> => {
    try {
      // 1. Get current Antigravity account info
      const currentInfo = await AccountCommands.getCurrentAntigravityAccount();
      // 2. Check whether there is valid account info (via API key or auth status)
      if (currentInfo?.auth.access_token) {
        // 3. Perform backup operation
        await AccountCommands.saveAntigravityCurrentAccount();

        // 4. Wait for file write to complete
        await new Promise(resolve => setTimeout(resolve, FILE_WRITE_DELAY_MS));

        // 5. Re-fetch account list
        const accounts = await AccountCommands.getAntigravityAccounts();
        set({ accounts });

        // 6. Update current auth info
        set({currentAuthInfo: currentInfo});
      } else {
        throw new Error('No valid account information detected');
      }
    } catch (error) {
      logger.error('Failed to backup current user', {
        module: 'UserManagement',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  },

  switchToAccount: async (email: string): Promise<void> => {
    try {
      // Call backend to switch account
      await AccountCommands.switchToAntigravityAccount(email);
    } catch (error) {
      logger.error('Failed to switch user', {
        module: 'UserManagement',
        email,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  },

  // ============ Batch operations ============

  clearAllAccounts: async (): Promise<void> => {
    // Call command to clear all backups
    await AccountManageCommands.clearAllBackups();
    // Refresh data after clearing
    const accounts = await AccountCommands.getAntigravityAccounts();
    set({ accounts: accounts });
  },

  // ============ Queries ============
  getAccounts: async (): Promise<AntigravityAccount[]> => {
    try {
      // Fetch account list from backend
      const accounts = await AccountCommands.getAntigravityAccounts();

      // Update store state
      set({ accounts });
      return accounts;
    } catch (error) {
      logger.error('Failed to fetch user list', {
        module: 'UserManagement',
        error: error instanceof Error ? error.message : String(error)
      });
      // If fetch fails, return current store accounts
      return get().accounts;
    }
  },
}));

export const useCurrentAntigravityAccount: () => AntigravityAccount | undefined = () => useAntigravityAccount(state => state.accounts.find(user => user.context.email === state.currentAuthInfo?.context.email));
