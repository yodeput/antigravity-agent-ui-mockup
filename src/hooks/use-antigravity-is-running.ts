/**
 * Antigravity Process Running State Store
 * Global singleton, automatically checks if Antigravity is running every 5 seconds
 */

import {create} from 'zustand';
import {ProcessCommands} from '@/commands/ProcessCommands';
import {logger} from '../lib/logger.ts';

// State interface
interface AntigravityIsRunningState {
  /** Whether it is running */
  isRunning: boolean;
  /** Whether it is checking */
  isChecking: boolean;
  /** Last check time */
  lastChecked: Date | null;
}

// Actions interface
interface AntigravityIsRunningActions {
  /** Check running state */
  check: () => Promise<void>;
  /** Start auto check */
  start: () => void;
  /** Stop auto check */
  stop: () => void;
}

// Global timer ID
let checkIntervalId: NodeJS.Timeout | null = null;

// Check interval (5 seconds)
const CHECK_INTERVAL = 5000;

/**
 * Antigravity Running State Store
 */
export const useAntigravityIsRunning = create<
  AntigravityIsRunningState & AntigravityIsRunningActions
>((set, get) => ({
  // Initial state
  isRunning: false,
  isChecking: false,
  lastChecked: null,

  // Check running state
  check: async () => {
    // Prevent concurrent checks
    if (get().isChecking) {
      return;
    }

    set({ isChecking: true });

    try {
      const running = await ProcessCommands.isRunning();
      set({
        isRunning: running,
        lastChecked: new Date(),
        isChecking: false,
      });
    } catch (error) {
      logger.error('Failed to check status', {
        module: 'AntigravityIsRunning',
        action: 'check_status_failed',
        error: error instanceof Error ? error.message : String(error)
      });
      // Assume not running when check fails
      set({
        isRunning: false,
        lastChecked: new Date(),
        isChecking: false,
      });
    }
  },

  // Start auto check
  start: () => {
    // Clear existing timer
    if (checkIntervalId !== null) {
      clearInterval(checkIntervalId);
    }

    // Check immediately once
    get().check();

    // Start periodic check
    checkIntervalId = setInterval(() => {
      get().check();
    }, CHECK_INTERVAL);

    logger.info('Auto check started', {
        module: 'AntigravityIsRunning',
        action: 'start_auto_check',
        interval: CHECK_INTERVAL
      });
  },

  // Stop auto check
  stop: () => {
    if (checkIntervalId !== null) {
      clearInterval(checkIntervalId);
      checkIntervalId = null;
      logger.info('Auto check stopped', {
        module: 'AntigravityIsRunning',
        action: 'stop_auto_check'
      });
    }
  },
}));
