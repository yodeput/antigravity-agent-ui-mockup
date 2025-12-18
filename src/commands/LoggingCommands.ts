import { invoke } from '@tauri-apps/api/core';
import type { FrontendLogEntry } from './types/logging.types';

/**
 * 日志和加密命令
 */
export class LoggingCommands {
  /**
   * 写入前端日志到统一日志系统
   * @param logEntry 日志条目
   */
  static async writeFrontendLog(logEntry: FrontendLogEntry): Promise<void> {
    return invoke('write_frontend_log', { logEntry });
  }

  /**
   * 打开日志目录（在系统文件管理器中打开）
   */
  static async openLogDirectory(): Promise<void> {
    return invoke('open_log_directory');
  }

  /**
   * 获取日志目录路径
   */
  static async getLogDirectoryPath(): Promise<string> {
    return invoke('get_log_directory_path');
  }

  /**
   * 写入文本文件
   * @param path 文件路径
   * @param content 文件内容
   * @returns 写入结果消息
   */
  static async writeTextFile(path: string, content: string): Promise<string> {
    return invoke('write_text_file', { path, content });
  }
}
