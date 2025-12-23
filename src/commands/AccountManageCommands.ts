import {invoke} from '@tauri-apps/api/core';
import type {BackupData, RestoreResult} from './types/account-manage.types.ts';

/**
 * Account and Backup Management Commands
 */
export class AccountManageCommands {
  static collectAccountContents(): Promise<BackupData[]> {
    return invoke('collect_account_contents');
  }

  static restoreBackupFiles(backups: BackupData[]): Promise<RestoreResult> {
    return invoke('restore_backup_files', { accountFileData: backups });
  }

  static deleteBackup(name: string): Promise<string> {
    return invoke('delete_backup', { name });
  }

  static clearAllBackups(): Promise<string> {
    return invoke('clear_all_backups');
  }

  // ==== Config Encryption/Decryption ====
  static encryptConfig(jsonData: string, password: string): Promise<string> {
    return invoke('encrypt_config_data', { jsonData: jsonData, password });
  }

  static decryptConfig(encryptedData: string, password: string): Promise<string> {
    return invoke('decrypt_config_data', { encryptedData: encryptedData, password });
  }

  static signInNewAntigravityAccount(): Promise<string> {
    return invoke('sign_in_new_antigravity_account');
  }
}
