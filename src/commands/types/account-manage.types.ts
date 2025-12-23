/**
 * Backup-related type definitions
 */

/**
 * JSON value type (matches Rust's serde_json::Value)
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Backup data structure
 */
export interface BackupData {
  /** Backup filename */
  filename: string;

  /** Backup content (JSON format, any valid JSON value) */
  content: JsonValue;

  /** Backup timestamp (Unix timestamp, seconds) */
  timestamp: number;
}

/**
 * Information about backups that failed during restore
 */
export interface FailedBackup {
  /** Filename */
  filename: string;

  /** Error message */
  error: string;
}

/**
 * Restore operation result
 */
export interface RestoreResult {
  /** Number of successfully restored items */
  restoredCount: number;

  /** List of failed backups */
  failed: FailedBackup[];
}
