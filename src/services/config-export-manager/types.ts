/**
 * 配置导出管理器类型定义
 * 统一管理导入导出相关的所有类型
 */

export interface BackupData {
  filename: string;
  content: any;
  timestamp: number;
}

export interface EncryptedConfigData {
  version: string;
  exportTime: string;
  exportUser: string;
  backupCount: number;
  backups: BackupData[];
  settings: {
    theme: string;
    autoBackup: boolean;
  };
  metadata: {
    platform: string;
    userAgent: string;
    antigravityAgent: string;
    encryptionType: string;
  };
}

export interface RestoreResult {
  restoredCount: number;
  failed: Array<{
    filename: string;
    error: string;
  }>;
}

export interface ConfigImportResult {
  success: boolean;
  message: string;
  encryptedData?: string;
  configData?: EncryptedConfigData;
  restoreInfo?: RestoreResult;
}

export interface ConfigExportResult {
  success: boolean;
  message: string;
  filePath?: string;
}

export interface ConfigImportOptions {
  title?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  multiple?: boolean;
}

export interface ConfigExportOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

export type ConfigOperationStatus = 'idle' | 'reading' | 'decrypting' | 'encrypting' | 'writing' | 'validating' | 'completed' | 'error';

export interface ConfigOperationProgress {
  status: ConfigOperationStatus;
  message: string;
  progress?: number; // 0-100
  error?: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 配置导出进度回调函数类型
 */
export type ConfigProgressCallback = (progress: ConfigOperationProgress) => void;

/**
 * 配置验证函数类型
 */
export type ConfigValidator = (data: unknown) => ConfigValidationResult;

/**
 * 加密提供者接口
 */
export interface EncryptionProvider {
  encrypt(data: string, password: string): string;
  decrypt(encryptedData: string, password: string): string;
  validatePassword(password: string): { isValid: boolean; message?: string };
}