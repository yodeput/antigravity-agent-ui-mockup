import {invoke} from '@tauri-apps/api/core';

/**
 * Process Management Commands
 */
export class ProcessCommands {
  /**
   * Check if Antigravity process is running
   * @returns Whether it is running
   */
  static async isRunning(): Promise<boolean> {
    return invoke('is_antigravity_running');
  }
}
