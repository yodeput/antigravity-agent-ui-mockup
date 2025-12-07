
// Antigravity 当前用户信息类型
export interface AntigravityCurrentUserInfo {
  email: string;
  apiKey?: string;
  userStatusProtoBinaryBase64?: string;
  [key: string]: any;
}

// 备份当前账户结果类型
export type BackupCurrentAccountResult = string;
