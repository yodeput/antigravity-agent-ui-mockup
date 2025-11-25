/**
 * 用户管理类型定义 - 简化版
 */

import type {AntigravityAccount, AntigravityAuthInfo} from '@/commands/types/account.types';

// Store 状态
export interface UserStoreState {
  users: AntigravityAccount[];
  isLoading: boolean;
}

// Store Actions
export interface UserStoreActions {
  // 基础操作
  deleteUser: (email: string) => Promise<void>;
  addCurrentUser: () => Promise<void>;
  switchUser: (email: string) => Promise<void>;
  getCurrentUser: () => Promise<AntigravityAuthInfo | null>;

  // 批量操作
  clearAllUsers: () => Promise<void>;

  // 查询
  getUsers: () => Promise<AntigravityAccount[]>;
  searchUsers: (keyword: string) => AntigravityAccount[];
}
