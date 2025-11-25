/**
 * 语言服务器相关的类型定义
 */

export interface RequestMetadata {
  api_key: string;
  request_id?: string;
  user_agent?: string;
  client_version?: string;
}

export interface HttpConfig {
  request_timeout_ms: number;
  max_retries: number;
  retry_delay_ms: number;
}
