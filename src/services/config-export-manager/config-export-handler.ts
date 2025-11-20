/**
 * 配置导出处理器
 * 专门处理配置文件的导出和加密功能
 */

import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import type {
  ConfigExportResult,
  ConfigExportOptions,
  EncryptedConfigData,
  EncryptionProvider,
  BackupData
} from './types';
import { AntigravityService } from '../antigravity-service';

/**
 * 配置导出处理器类
 */
export class ConfigExportHandler {
  constructor(
    private encryptionProvider: EncryptionProvider
  ) {}

  /**
   * 导出加密配置文件
   *
   * @param password 加密密码
   * @param options 导出选项
   * @returns 导出结果
   */
  async exportEncryptedConfig(
    password: string,
    options: ConfigExportOptions = {}
  ): Promise<ConfigExportResult> {
    try {
      // 1. 验证密码
      const passwordValidation = this.encryptionProvider.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message || '密码无效');
      }

      // 2. 收集配置数据
      const configData = await this.collectConfigData();

      // 3. 加密数据
      const encryptedData = await this.encryptConfigData(configData, password);

      // 4. 选择保存位置并写入文件
      const filePath = await this.saveEncryptedConfigFile(encryptedData, options);

      return {
        success: true,
        message: '配置文件导出成功',
        filePath
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `导出失败: ${errorMessage}`
      };
    }
  }

  /**
   * 收集配置数据
   *
   * @returns 配置数据对象
   * @throws 当没有用户数据时抛出错误
   */
  private async collectConfigData(): Promise<EncryptedConfigData> {
    // 从后端获取所有备份文件的内容
    const backupsWithContent = await invoke<BackupData[]>('collect_backup_contents');

    // 检查是否有用户数据可以导出
    if (backupsWithContent.length === 0) {
      throw new Error('没有找到任何用户信息，无法导出配置文件');
    }

    // 构建配置数据
    const configData: EncryptedConfigData = {
      version: '1.1.0',
      exportTime: new Date().toISOString(),
      exportUser: 'Antigravity Agent User',
      backupCount: backupsWithContent.length,
      backups: backupsWithContent,
      settings: {
        theme: 'dark',
        autoBackup: true,
      },
      metadata: {
        platform: this.getPlatformInfo(),
        userAgent: this.getUserAgentInfo(),
        antigravityAgent: 'encrypted_config',
        encryptionType: 'XOR-Base64'
      }
    };

    return configData;
  }

  /**
   * 加密配置数据
   *
   * @param configData 配置数据
   * @param password 加密密码
   * @returns 加密后的数据
   */
  private async encryptConfigData(
    configData: EncryptedConfigData,
    password: string
  ): Promise<string> {
    // 转换为 JSON 字符串
    const jsonData = JSON.stringify(configData, null, 2);

    // 使用加密提供者加密数据
    return this.encryptionProvider.encrypt(jsonData, password);
  }

  /**
   * 保存加密配置文件
   *
   * @param encryptedData 加密数据
   * @param options 保存选项
   * @returns 保存的文件路径
   */
  private async saveEncryptedConfigFile(
    encryptedData: string,
    options: ConfigExportOptions
  ): Promise<string> {
    // 生成默认文件名
    const timestamp = new Date().toISOString()
      .slice(0, 19)
      .replace(/:/g, '-');
    const defaultFileName = `antigravity_encrypted_config_${timestamp}.enc`;

    // 选择保存位置
    const selectedPath = await save({
      title: options.title || '保存加密配置文件',
      defaultPath: options.defaultPath || defaultFileName,
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
    });

    if (!selectedPath) {
      throw new Error('导出取消：未选择保存位置');
    }

    // 写入文件
    try {
      await writeTextFile(selectedPath as string, encryptedData);
      return selectedPath as string;
    } catch (error) {
      throw new Error(`保存文件失败: ${error}`);
    }
  }

  /**
   * 获取平台信息
   *
   * @returns 平台信息字符串
   */
  private getPlatformInfo(): string {
    return navigator.platform || 'Unknown';
  }

  /**
   * 获取用户代理信息（截断以避免过长）
   *
   * @returns 用户代理字符串
   */
  private getUserAgentInfo(): string {
    if (navigator.userAgent) {
      return navigator.userAgent.substring(0, 100);
    }
    return 'Unknown';
  }

  /**
   * 生成配置摘要信息
   *
   * @param configData 配置数据
   * @returns 配置摘要
   */
  generateConfigSummary(configData: EncryptedConfigData): string {
    const { version, exportTime, backupCount, metadata } = configData;

    return [
      `版本: ${version}`,
      `导出时间: ${new Date(exportTime).toLocaleString()}`,
      `备份账户数: ${backupCount}`,
      `加密类型: ${metadata.encryptionType}`,
      `平台: ${metadata.platform}`
    ].join(' | ');
  }

  /**
   * 验证导出配置
   *
   * @param configData 配置数据
   * @returns 验证结果
   */
  validateExportConfig(configData: EncryptedConfigData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!configData.version) {
      errors.push('缺少版本信息');
    }

    if (!configData.exportTime) {
      errors.push('缺少导出时间');
    }

    if (!configData.backups || !Array.isArray(configData.backups)) {
      errors.push('备份数据格式不正确');
    }

    if (configData.backupCount !== configData.backups?.length) {
      errors.push('备份数量与实际数据不匹配');
    }

    if (!configData.metadata) {
      errors.push('缺少元数据');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}