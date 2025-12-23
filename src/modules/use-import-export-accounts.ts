/**
 * Configuration Management Store (fully integrated version)
 * Uses Zustand directly, integrates all configuration management logic, provides complete interface
 */

import {create} from 'zustand';
import {open, save} from '@tauri-apps/plugin-dialog';
import {readTextFile} from '@tauri-apps/plugin-fs';
import {logger} from '@/lib/logger.ts';
import toast from 'react-hot-toast';
import {AccountManageCommands} from "@/commands/AccountManageCommands.ts";
import {BackupData} from "@/commands/types/account-manage.types.ts";
import {LoggingCommands} from "@/commands/LoggingCommands.ts";

interface EncryptedConfigData {
  version: string;
  backupCount: number;
  backups: BackupData[];
}

// Store State
interface ConfigState {
  isImporting: boolean;
  isExporting: boolean;
  isCheckingData: boolean;
  // Dialog state
  importDialogIsOpen: boolean;
  exportDialogIsOpen: boolean;
  // Pending operation data
  pendingImportPath?: string;
  pendingExportData?: BackupData[];
}

// Store Actions
interface ConfigActions {
  setImporting: (isImporting: boolean) => void;
  setExporting: (isExporting: boolean) => void;
  setCheckingData: (isCheckingData: boolean) => void;
  // Dialog control
  openImportDialog: (filePath: string) => void;
  closeImportDialog: () => void;
  openExportDialog: (accountContent: BackupData[]) => void;
  closeExportDialog: () => void;
  // Password submit handling
  submitImportPassword: (password: string) => Promise<void>;
  submitExportPassword: (password: string) => Promise<void>;
  // Main operations
  importConfig: () => Promise<void>;
  exportConfig: () => Promise<void>;
}

// Create Zustand Store
export const useImportExportAccount = create<ConfigState & ConfigActions>()(
  (set, get) => {
    return {
      // Initial state
      isImporting: false,
      isExporting: false,
      isCheckingData: false,
      // Dialog initial state
      importDialogIsOpen: false,
      exportDialogIsOpen: false,
      // Pending operation data
      pendingImportPath: undefined,
      pendingExportData: undefined,

      // State setter methods
      setImporting: (isImporting: boolean) => set({ isImporting }),
      setExporting: (isExporting: boolean) => set({ isExporting }),
      setCheckingData: (isCheckingData: boolean) => set({ isCheckingData }),

      // Open import dialog
      openImportDialog: (filePath: string) => set({
        importDialogIsOpen: true,
        pendingImportPath: filePath
      }),

      // Close import dialog
      closeImportDialog: () => set({
        importDialogIsOpen: false,
        pendingImportPath: undefined
      }),

      // Open export dialog
      openExportDialog: (backupData: BackupData[]) => set({
        exportDialogIsOpen: true,
        pendingExportData: backupData
      }),

      // Close export dialog
      closeExportDialog: () => set({
        exportDialogIsOpen: false,
        pendingExportData: undefined
      }),

      // ============ Password Submit Handling ============
      submitImportPassword: async (password: string): Promise<void> => {
        // Capture required state at method start to avoid race conditions
        const { pendingImportPath } = get();
        if (!pendingImportPath) {
          toast.error('No pending import file');
          return;
        }

        try {
          get().closeImportDialog();
          set({ isImporting: true });
          toast.loading('Decrypting file with Rust...', {duration: 1});

          // Read file and decrypt
          const encryptedFile = await readTextFile(pendingImportPath);
          const decryptedJson: string = await AccountManageCommands.decryptConfig(encryptedFile, password);
          const configData: EncryptedConfigData = JSON.parse(decryptedJson);

          // Validate config data format
          if (!configData.version || !configData.backups || !Array.isArray(configData.backups)) {
            throw new Error('Invalid config file format');
          }

          logger.info('Starting backup data restoration', {
            module: 'useImportExportAccount',
            backupCount: configData.backups.length
          });
          toast.loading('Restoring account data...', {duration: 1});

          const result = await AccountManageCommands.restoreBackupFiles(configData.backups);

          if (result.failed.length > 0) {
            logger.warn('Some files failed to restore', {
              module: 'useImportExportAccount',
              restoredCount: result.restoredCount,
              failedCount: result.failed.length,
              failedFiles: result.failed
            });
            toast.success(`Config file imported successfully. Restored ${result.restoredCount} accounts, ${result.failed.length} failed`);
          } else {
            logger.info('All files restored successfully', {
              module: 'useImportExportAccount',
              restoredCount: result.restoredCount
            });
            toast.success(`Config file imported successfully. Restored ${result.restoredCount} accounts`);
          }
        } catch (error) {
          logger.error('Import failed', {
            module: 'useImportExportAccount',
            stage: 'import_process',
            error: error instanceof Error ? error.message : String(error)
          });
          toast.error(`Config file import failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          set({ isImporting: false });
        }
      },

      submitExportPassword: async (password: string): Promise<void> => {
        // Capture required state at method start to avoid race conditions
        const { pendingExportData } = get();
        if (!pendingExportData || pendingExportData.length === 0) {
          toast.error('No pending export data');
          return;
        }

        try {
          get().closeExportDialog();
          set({ isExporting: true });
          toast.loading('Generating encrypted config file...', {duration: 1});

          // Build config data
          const configData: EncryptedConfigData = {
            version: '1.1.0',
            backupCount: pendingExportData.length,
            backups: pendingExportData
          };

          // Call backend encryption
          const configJson = JSON.stringify(configData, null, 2);
          const configSize = new Blob([configJson]).size;

          logger.info('Config data generated', {
            module: 'useImportExportAccount',
            backupCount: pendingExportData.length,
            configSize
          });

          const encryptedData = await AccountManageCommands.encryptConfig(configJson, password);

          // Select save location
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          const defaultFileName = `antigravity_encrypted_config_${timestamp}.enc`;

          const savePath = await save({
            title: 'Save Config File',
            defaultPath: defaultFileName,
            filters: [
              {
                name: 'Antigravity Encrypted Config',
                extensions: ['enc']
              }
            ]
          });

          if (!savePath || typeof savePath !== 'string') {
            logger.warn('No save location selected', {
              module: 'useImportExportAccount'
            });
            toast.error('No save location selected');
            return;
          }

          // Save encrypted file
          await LoggingCommands.writeTextFile(savePath, encryptedData);

          toast.success(`Config file saved: ${savePath}`);
          logger.info('Export config successful', {
            module: 'useImportExportAccount',
            savePath,
            backupCount: pendingExportData.length,
            configSize
          });

        } catch (error) {
          logger.error('Export failed', {
            module: 'useImportExportAccount',
            stage: 'password_validation',
            error: error instanceof Error ? error.message : String(error)
          });
          toast.error(`Export config file failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          set({ isExporting: false });
        }
      },

      // ============ Import Config ============
      importConfig: async (): Promise<void> => {
        logger.info('Starting config file import', { module: 'useImportExportAccount' });

        try {
          // Select file
          const selected = await open({
            title: 'Select Config File',
            filters: [
              {
                name: 'Encrypted Config Files',
                extensions: ['enc']
              },
              {
                name: 'All Files',
                extensions: ['*']
              }
            ],
            multiple: false
          });

          if (!selected || typeof selected !== 'string') {
            logger.warn('No file selected', {
              module: 'useImportExportAccount'
            });
            toast.error('No file selected');
            return;
          }

          logger.info('File selected', {
            module: 'useImportExportAccount',
            filePath: selected
          });

          // Show password dialog, store file path
          get().openImportDialog(selected);

        } catch (error) {
          logger.error('File operation failed', {
            module: 'useImportExportAccount',
            stage: 'file_selection',
            error: error instanceof Error ? error.message : String(error)
          });
          toast.error(`File operation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      },

      // ============ Export Config ============
      exportConfig: async (): Promise<void> => {
        logger.info('Starting config export', { module: 'useImportExportAccount' });

        try {
          toast.loading('Collecting account data...', {duration: 1});

          // ✅ Get backup data with complete contents
          const accountContents = await AccountManageCommands.collectAccountContents();

          if (accountContents.length === 0) {
            logger.warn('No account information found', {
              module: 'useImportExportAccount'
            });
            toast.error('No account information found, cannot export config file');
            return;
          }

          logger.info('Account data found', {
            module: 'useImportExportAccount',
            backupCount: accountContents.length
          });

          // Show password dialog, pass backup data
          get().openExportDialog(accountContents);

        } catch (error) {
          logger.error('Data check failed', {
            module: 'useImportExportAccount',
            stage: 'data_collection',
            error: error instanceof Error ? error.message : String(error)
          });
          toast.error(`Data check failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    };
  }
);
