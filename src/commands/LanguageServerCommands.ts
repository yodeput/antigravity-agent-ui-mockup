/**
 * 语言服务器相关的前端命令封装
 */

import { invoke } from '@tauri-apps/api/core';
import {LanguageServerResponse} from "@/commands/types/language-server-response.types.ts";

/**
 * 语言服务器命令
 */
export class LanguageServerCommands {
  /**
   * 获取用户状态信息
   * @param apiKey API密钥
   * @returns 用户状态信息（JSON数据，具体格式取决于Antigravity API响应）
   */
  static async getUserStatus(apiKey: string): Promise<LanguageServerResponse.Root> {
    return await invoke<LanguageServerResponse.Root>('language_server_get_user_status', { apiKey });
  }
}
