import {create} from 'zustand';
import {listen, UnlistenFn} from '@tauri-apps/api/event';
import {EventEmitter} from 'events';
import {logger} from '../lib/logger.ts';
import {DbMonitorCommands} from "@/commands/DbMonitorCommands.ts";

// Database change event data interface
export interface DatabaseChangeEvent {
    timestamp: number;
    old_data?: any;
    new_data?: any;
    diff?: any;
    originalEvent?: any;
}

// Export event related types
export type { DatabaseEventMap, DatabaseEventListener };

// Global database event emitter
const databaseEventEmitter = new EventEmitter();

// Global unlistenFn variable
let globalUnlistenFn: UnlistenFn | null = null;

// Database event types
export const DATABASE_EVENTS = {
  DATA_CHANGED: 'database:data-changed',
} as const;

// Event type mapping
type DatabaseEventMap = {
  [DATABASE_EVENTS.DATA_CHANGED]: DatabaseChangeEvent;
};

// Event listener type
type DatabaseEventListener<T extends keyof DatabaseEventMap> = (data: DatabaseEventMap[T]) => void;

// Actions interface - simplified version, removed settings management
interface DbMonitoringActions {
  // Initialize monitoring (called on startup)
  start: () => Promise<void>;

  // Stop listening (cleanup resources)
  stop: () => Promise<void>;

  // Add event listener
  addListener: <T extends keyof DatabaseEventMap>(
    event: T,
    listener: DatabaseEventListener<T>
  ) => (() => void);
}

// Create Store
export const useDbMonitoringStore = create<DbMonitoringActions>()(
  (set, get) => ({
      // Initialize monitoring (called on app startup)
      start: async (): Promise<void> => {
        logger.info('Initializing database monitoring', { module: 'DbMonitoringStore' });

        try {
          // Cleanup previous listener
          await get().stop();

          // Handle database change event
          const handleDatabaseChange = async (event: any) => {
            logger.info('Received database change event', {
              module: 'DbMonitoringStore',
              eventId: event.id || 'unknown'
            });

            // Parse event data: newData, oldData, diff
            const { newData, oldData, diff } = event.payload;

            // Emit internal database change event
            databaseEventEmitter.emit(DATABASE_EVENTS.DATA_CHANGED, {
              timestamp: Date.now(),
              newData,
              oldData,
              diff,
              originalEvent: event
            });

            logger.info('Database change event emitted', {
              module: 'DbMonitoringStore'
            });
          };

          // Listen for database change events pushed from backend
          globalUnlistenFn = await listen('database-changed', handleDatabaseChange);

          // Start backend monitoring
          await DbMonitorCommands.start();

          logger.info('Database monitoring started', {
            module: 'DbMonitoringStore'
          });
        } catch (error) {
          logger.error('Failed to start database monitoring', {
            module: 'DbMonitoringStore',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      },

      // Cleanup resources
      stop: async (): Promise<void> => {
        if (globalUnlistenFn) {
          try {
            await globalUnlistenFn();
            globalUnlistenFn = null;
            logger.info('Database listener cleaned up', {
              module: 'DbMonitoringStore'
            });
          } catch (error) {
            logger.warn('Failed to cleanup database listener', {
              module: 'DbMonitoringStore',
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      },

      addListener: <T extends keyof DatabaseEventMap>(
        event: T,
        listener: DatabaseEventListener<T>
      ): (() => void) => {
        databaseEventEmitter.on(event, listener);

        // Return unsubscribe function
        return () => {
          databaseEventEmitter.off(event, listener);
        };
      },
    }),
);
