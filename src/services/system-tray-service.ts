/**
 * 系统托盘服务
 *
 * 提供系统托盘功能的简化前端接口 - 所有逻辑由后端处理
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from '../utils/logger';

export interface SystemTrayStatus {
  enabled: boolean;
  message: string;
}

/**
 * 系统托盘服务类 - 纯调用接口，所有逻辑由后端处理
 */
export class SystemTrayService {
  /**
   * 获取系统托盘状态（持久化状态）
   */
  static async getSystemTrayState(): Promise<boolean> {
    try {
      return await invoke<boolean>('get_system_tray_state');
    } catch (error) {
      logger.warn('获取系统托盘状态失败，使用默认值', {
        module: 'SystemTrayService',
        action: 'get_state_failed',
        error: error instanceof Error ? error.message : String(error)
      });
      return true; // 默认启用
    }
  }

  /**
   * 切换系统托盘状态（纯后端处理所有逻辑）
   * 后端会自动处理状态检查、防重复创建、状态同步等
   */
  static async toggleSystemTray(): Promise<SystemTrayStatus> {
    try {
      const result = await invoke<any>('toggle_system_tray');

      return {
        enabled: result.enabled,
        message: result.message
      };
    } catch (error) {
      // 出错时返回当前状态
      const currentState = await this.getSystemTrayState();
      return {
        enabled: currentState,
        message: `操作失败: ${error}`
      };
    }
  }

}
