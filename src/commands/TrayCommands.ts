import { invoke } from '@tauri-apps/api/core';

/**
 * System Tray Commands
 */
export class TrayCommands {
  /**
   * Minimize window to tray
   * @returns Minimize result message
   */
  static async minimize(): Promise<string> {
    return invoke('minimize_to_tray');
  }

  /**
   * Restore window from tray
   * @returns Restore result message
   */
  static async restore(): Promise<string> {
    return invoke('restore_from_tray');
  }

  
  /**
   * Update tray menu
   * @param accounts Account email list
   * @returns Update result message
   */
  static async updateMenu(accounts: string[]): Promise<string> {
    return invoke('update_tray_menu_command', { accounts });
  }
}
