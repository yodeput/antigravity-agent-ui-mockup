import { invoke } from '@tauri-apps/api/core';
import {AntigravityAccount} from "@/commands/types/account.types.ts";

/**
 * Antigravity account management commands
 */
export class AccountCommands {
  /**
   * Get the currently signed-in account info
   * @returns Account auth information, including email, database path, etc.
   */
  static async getCurrentAntigravityAccount(): Promise<AntigravityAccount> {
    return invoke('get_current_antigravity_account_info');
  }

  /**
   * Get the list of all backed-up accounts
   * @returns Array of accounts
   */
  static async getAntigravityAccounts(): Promise<AntigravityAccount[]> {
    return invoke('get_antigravity_accounts');
  }

  /**
   * Backup the currently signed-in account
   * @returns Backup result message
   */
  static async saveAntigravityCurrentAccount(): Promise<string> {
    return invoke('save_antigravity_current_account');
  }

  /**
   * Switch to a specified account (process: stop process → restore data → restart)
   * @param accountName Account identifier (email)
   * @returns Result message for the switch operation
   */
  static async switchToAntigravityAccount(accountName: string): Promise<string> {
    return invoke('switch_to_antigravity_account', { accountName: accountName });
  }

  /**
   * Clear all Antigravity data (sign out)
   * @returns Result message for the clear operation
   */
  static async clearAllData(): Promise<string> {
    return invoke('clear_all_antigravity_data');
  }
}
