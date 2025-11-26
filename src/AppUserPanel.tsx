import React, {useCallback, useEffect, useState} from "react";
import type {AntigravityAccount} from "@/commands/types/account.types.ts";
import BusinessUserDetail from "@/components/business/UserDetail.tsx";
import {useAntigravityAccount, useCurrentAntigravityAccount} from "@/modules/use-antigravity-account.ts";
import {useLanguageServerUserInfo} from "@/modules/use-language-server-user-info";
import {useLanguageServerState} from "@/hooks/use-language-server-state.ts";
import {BaseTooltip} from "@/components/base-ui/BaseTooltip.tsx";
import BusinessActionButton from "@/components/business/ActionButton.tsx";
import {Trash2} from "lucide-react";

import BusinessConfirmDialog from "@/components/business/ConfirmDialog.tsx";
import toast from 'react-hot-toast';
import {QuotaDashboard} from "@/components/business/QuotaDashboard";
import {UserListItem} from "@/components/business/UserListItem.tsx";
import {maskEmail} from "@/utils/username-masking.ts";

export function AppUserPanel() {
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AntigravityAccount | null>(null);
  const antigravityAccount = useAntigravityAccount();
  const languageServerUserInfo = useLanguageServerUserInfo();
  const { isLanguageServerStateInitialized } = useLanguageServerState();
  const currentAntigravityAccount = useCurrentAntigravityAccount();

  // 用户详情处理
  const handleUserClick = useCallback((user: AntigravityAccount) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  }, []);

  const handleUserDetailClose = useCallback(() => {
    setIsUserDetailOpen(false);
    setSelectedUser(null);
  }, []);


  // 组件挂载时获取用户列表
  useEffect(() => {
    const loadUsers = async () => {
      try {
        await antigravityAccount.getUsers();
      } catch (error) {
        toast.error(`获取用户列表失败: ${error}`);
      } finally {
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (isLanguageServerStateInitialized) {
      antigravityAccount.users.forEach(user => {
        languageServerUserInfo.fetchData(user)
      })
    }
    antigravityAccount.updateCurrentAccount()
  }, [antigravityAccount.users, isLanguageServerStateInitialized]);

  // 获取当前用户的配额数据
  const currentQuotaData = currentAntigravityAccount && languageServerUserInfo.users[currentAntigravityAccount?.id]?.userStatus
    ? languageServerUserInfo.users[currentAntigravityAccount.id].userStatus.cascadeModelConfigData.clientModelConfigs
    : [];

  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);

  const handleDeleteBackup = (backupName: string) => {
    setBackupToDelete(backupName);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBackup = async () => {
    if (!backupToDelete) return;

    try {
      await antigravityAccount.delete(backupToDelete);
      toast.success(`备份 "${backupToDelete}" 删除成功`);
      setDeleteDialogOpen(false);
      setBackupToDelete(null);
    } catch (error) {
      toast.error(`删除备份失败: ${error}`);
    }
  };

  const handleSwitchAccount = async (backupName: string) => {
    try {
      // 显示正在切换的提示
      toast.loading(`正在切换到用户: ${maskEmail(backupName)}...`, {
        id: `switching-${backupName}`,
      });

      await antigravityAccount.switchUser(backupName);

      // 切换成功，替换loading提示为成功提示
      toast.success(`✅ 已成功切换到用户: ${maskEmail(backupName)}`, {
        id: `switching-${backupName}`,
        duration: 3000,
      });
    } catch (error) {
      toast.error(`❌ 切换用户失败: ${error}`, {
        id: `switching-${backupName}`,
        duration: 4000,
      });
    }
  };

  const handleClearAllBackups = () => {
    if (antigravityAccount.users.length === 0) {
      toast.error('当前没有用户备份可清空');
      return;
    }
    setIsClearDialogOpen(true);
  };

  const confirmClearAllBackups = async () => {
    try {
      await antigravityAccount.clearAllUsers();
      toast.success('清空所有备份成功');
      setIsClearDialogOpen(false);
    } catch (error) {
      toast.error(`清空备份失败: ${error}`);
    }
  };

  return (
    <>
      <section className="card section-span-full mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2>用户管理</h2>
          {antigravityAccount.users.length > 0 && (
            <BaseTooltip content="清空所有备份" side="bottom">
              <BusinessActionButton
                variant="destructive"
                size="sm"
                onClick={handleClearAllBackups}
                icon={<Trash2 className="h-3 w-3" />}
              >
                {''}
              </BusinessActionButton>
            </BaseTooltip>
          )}
        </div>

        {/* 配额仪表盘 */}
        {currentQuotaData.length > 0 && (
          <QuotaDashboard models={currentQuotaData} />
        )}

        <div className={antigravityAccount.users.length === 0 ? "backup-list-empty" : "backup-list-vertical"}>
          {antigravityAccount.users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                暂无用户备份
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
                在 Antigravity 登录账户后，本程序会自动读取。
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {antigravityAccount.users.map((user, index) => (
                <UserListItem
                  key={`${user.email}-${index}`}
                  user={user}
                  isCurrent={currentAntigravityAccount?.email === user.email}
                  onSelect={handleUserClick}
                  onSwitch={handleSwitchAccount}
                  onDelete={handleDeleteBackup}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 清空所有备份确认对话框 */}
      <BusinessConfirmDialog
        isOpen={isClearDialogOpen}
        onOpenChange={setIsClearDialogOpen}
        title="确认清空所有备份"
        description={`此操作将永久删除所有 ${antigravityAccount.users.length} 个用户备份文件，且无法恢复。请确认您要继续此操作吗？`}
        onConfirm={confirmClearAllBackups}
        onCancel={() => setIsClearDialogOpen(false)}
        variant="destructive"
        isLoading={false}
        confirmText="确认删除"
      />

      {/* 单个删除确认对话框 */}
      <BusinessConfirmDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="确认删除备份"
        description={`确定要删除备份 "${backupToDelete}" 吗？此操作无法撤销。`}
        onConfirm={confirmDeleteBackup}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="destructive"
        isLoading={false}
        confirmText="确认删除"
      />

      <BusinessUserDetail
        isOpen={isUserDetailOpen}
        onOpenChange={handleUserDetailClose}
        user={selectedUser}
      />
    </>
  );
}
