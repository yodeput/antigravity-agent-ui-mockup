import React, {useEffect, useState} from "react";
import type {AntigravityAccount} from "@/commands/types/account.types.ts";
import BusinessUserDetail from "@/components/business/AccountDetailModal.tsx";
import {useAntigravityAccount, useCurrentAntigravityAccount} from "@/modules/use-antigravity-account.ts";
import {useAvailableModels} from "@/modules/use-available-models.ts";

import BusinessConfirmDialog from "@/components/business/ConfirmDialog.tsx";
import toast from 'react-hot-toast';
import {maskEmail, maskName} from "@/utils/string-masking.ts";
import {useAppGlobalLoader} from "@/modules/use-app-global-loader.ts";
import {AccountSessionListCard} from "@/components/business/AccountSessionListCard.tsx";

export function AppContent() {
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AntigravityAccount | null>(null);
  const antigravityAccount = useAntigravityAccount();
  const availableModels = useAvailableModels();
  const currentAntigravityAccount = useCurrentAntigravityAccount();
  const appGlobalLoader = useAppGlobalLoader();

  // 用户详情处理
  const handleUserClick = (user: AntigravityAccount) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };

  const handleUserDetailClose = () => {
    setIsUserDetailOpen(false);
    setSelectedUser(null);
  };


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
    antigravityAccount.updateCurrentAccount()
    antigravityAccount.users.forEach(user => {
      availableModels.fetchData(user)
    })
  }, [antigravityAccount.users]);

  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const handleDeleteBackup = (user: AntigravityAccount) => {
    setAccountToDelete(user.email);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    await antigravityAccount.delete(accountToDelete);
    toast.success(`账户 "${accountToDelete}" 删除成功`);
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleSwitchAccount = async (user: AntigravityAccount) => {
    try {
      appGlobalLoader.open({label: `正在切换到用户: ${maskEmail(user.email)}...`});
      await antigravityAccount.switchUser(user.email);
    } finally {
      appGlobalLoader.close();
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
      <section className="card section-span-full">
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
            <div className="flex flex-row gap-2 p-2">
              {antigravityAccount.users.map((user, index) => {
                const model = availableModels.data[user.api_key]
                const geminiQuota = model?.models["gemini-3-pro-high"].quotaInfo.remainingFraction || 0
                const claudeQuota = model?.models["claude-sonnet-4-5"].quotaInfo.remainingFraction || 0

                return <AccountSessionListCard
                  geminiQuota={geminiQuota}
                  claudeQuota={claudeQuota}
                  key={user.id}
                  isCurrentUser={currentAntigravityAccount?.id === user.id}
                  email={maskEmail(user.email)}
                  nickName={maskName(user.name)}
                  userAvatar={user.profile_url}
                  onSelect={() => handleUserClick(user)}
                  onSwitch={() => handleSwitchAccount(user)}
                  onDelete={() => handleDeleteBackup(user)}
                />

              })}
            </div>
          )}
        </div>
      </section>

      {/* 清空所有备份确认对话框 */}
      <BusinessConfirmDialog
        isOpen={isClearDialogOpen}
        onOpenChange={setIsClearDialogOpen}
        title="确认清空所有备份"
        description={`此操作将永久删除所有 ${antigravityAccount.users.length} 个账户，且无法恢复。请确认您要继续此操作吗？`}
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
        title="确认删除账户"
        description={`确定要删除账户 "${accountToDelete}" 吗？此操作无法撤销。`}
        onConfirm={confirmDeleteAccount}
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
