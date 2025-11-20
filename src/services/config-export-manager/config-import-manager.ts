/**
 * 配置导入管理器
 * 专门处理配置文件的导入和验证功能
 */

import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import type {
  ConfigImportResult,
  ConfigImportOptions,
  ConfigValidationResult,
  ConfigProgressCallback,
  EncryptedConfigData,
  EncryptionProvider,
  RestoreResult
} from './types';

/**
 * 配置导入管理器类
 */
export class ConfigImportManager {
  constructor(
    private encryptionProvider: EncryptionProvider,
    private onProgress?: ConfigProgressCallback
  ) {}

  /**
   * 导入加密配置文件
   *
   * @param options 导入选项
   * @returns 导入结果
   */
  async importEncryptedConfig(options: ConfigImportOptions = {}): Promise<ConfigImportResult> {
    try {
      this.updateProgress('reading', '正在选择配置文件...');

      // 选择文件
      const selected = await open({
        title: options.title || '选择要导入的配置文件',
        filters: options.filters || [
          {
            name: 'Antigravity 加密配置文件',
            extensions: ['enc']
          },
          {
            name: '所有文件',
            extensions: ['*']
          }
        ],
        multiple: options.multiple || false,
      });

      if (!selected) {
        return {
          success: false,
          message: '导入取消：未选择文件'
        };
      }

      this.updateProgress('reading', '正在读取配置文件...');

      // 读取文件内容
      const encryptedData = await this.readConfigFile(selected as string);

      return {
        success: true,
        message: '配置文件读取成功',
        encryptedData
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateProgress('error', '导入失败', errorMessage);

      return {
        success: false,
        message: `选择文件失败: ${errorMessage}`
      };
    }
  }

  /**
   * 解密配置文件
   *
   * @param encryptedData 加密数据
   * @param password 解密密码
   * @returns 解密结果
   */
  async decryptConfigData(
    encryptedData: string,
    password: string
  ): Promise<ConfigImportResult> {
    try {
      this.updateProgress('decrypting', '正在解密配置文件...');

      // 验证密码
      const passwordValidation = this.encryptionProvider.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message || '密码无效');
      }

      // 解密数据
      const decryptedData = this.encryptionProvider.decrypt(encryptedData, password);

      this.updateProgress('validating', '正在验证配置文件格式...');

      // 解析 JSON
      const configData = JSON.parse(decryptedData) as EncryptedConfigData;

      // 验证配置文件格式
      const validation = this.validateConfigFormat(configData);
      if (!validation.isValid) {
        throw new Error(`配置文件格式错误: ${validation.errors.join(', ')}`);
      }

      this.updateProgress('writing', '正在恢复备份数据...');

      // 恢复备份数据到本地
      const restoreInfo = await this.restoreBackupsToLocal(configData);

      this.updateProgress('completed', '配置文件解密成功');

      return {
        success: true,
        message: `配置文件解密成功，已恢复 ${restoreInfo.restoredCount} 个账号`,
        configData,
        restoreInfo
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '解密失败';
      this.updateProgress('error', '解密失败', errorMessage);

      return {
        success: false,
        message: `解密失败: ${errorMessage}`
      };
    }
  }

  /**
   * 读取配置文件内容
   *
   * @param filePath 文件路径
   * @returns 文件内容
   * @throws 读取失败时抛出错误
   */
  private async readConfigFile(filePath: string): Promise<string> {
    try {
      const content = await readTextFile(filePath);

      if (!content.trim()) {
        throw new Error('文件内容为空');
      }

      return content;
    } catch (error) {
      throw new Error(`无法读取文件: ${error}`);
    }
  }

  /**
   * 验证配置文件格式
   *
   * @param data 配置数据
   * @returns 验证结果
   */
  private validateConfigFormat(data: unknown): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('配置数据必须是一个对象');
      return { isValid: false, errors, warnings };
    }

    const config = data as any;

    // 必需字段验证
    if (!config.version) {
      errors.push('缺少版本信息');
    }

    if (!config.exportTime) {
      errors.push('缺少导出时间');
    }

    if (!config.metadata) {
      errors.push('缺少元数据');
    } else {
      if (!config.metadata.antigravityAgent) {
        errors.push('缺少 Antigravity Agent 信息');
      }
    }

    // 可选字段验证
    if (config.backups && !Array.isArray(config.backups)) {
      warnings.push('备份数据格式不正确');
    }

    if (config.backupCount && typeof config.backupCount !== 'number') {
      warnings.push('备份数量格式不正确');
    }

    // 版本兼容性检查
    if (config.version && !this.isVersionCompatible(config.version)) {
      warnings.push(`配置文件版本 ${config.version} 可能与当前版本不兼容`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 检查版本兼容性
   *
   * @param version 配置文件版本
   * @returns 是否兼容
   */
  private isVersionCompatible(version: string): boolean {
    const currentVersion = '1.1.0';

    // 简单的版本比较逻辑
    const currentParts = currentVersion.split('.').map(Number);
    const configParts = version.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, configParts.length); i++) {
      const current = currentParts[i] || 0;
      const config = configParts[i] || 0;

      if (config > current) {
        return false; // 配置文件版本更新，可能不兼容
      }
      if (config < current) {
        break; // 配置文件版本较旧，应该兼容
      }
    }

    return true;
  }

  /**
   * 恢复备份数据到本地
   *
   * @param configData 解密后的配置数据
   * @returns 恢复结果
   */
  private async restoreBackupsToLocal(configData: EncryptedConfigData): Promise<RestoreResult> {
    // 直接调用后端命令处理恢复逻辑
    const restoreResult = await invoke<RestoreResult>('restore_backup_files', {
      backups: configData.backups
    });

    // 更新进度
    if (restoreResult.restoredCount > 0) {
      this.updateProgress('writing', `已恢复 ${restoreResult.restoredCount} 个账号`);
    }
    if (restoreResult.failed.length > 0) {
      this.updateProgress('writing', `${restoreResult.failed.length} 个账号恢复失败`);
    }

    return restoreResult;
  }

  /**
   * 更新进度状态
   *
   * @param status 操作状态
   * @param message 状态消息
   * @param error 错误信息（可选）
   */
  private updateProgress(status: ConfigImportResult['message'], message: string, error?: string): void {
    if (this.onProgress) {
      this.onProgress({
        status: status as any,
        message,
        error
      });
    }
  }
}