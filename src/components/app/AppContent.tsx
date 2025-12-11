import React, {useEffect, useState} from "react";
import type {AntigravityAccount} from "@/commands/types/account.types.ts";
import BusinessUserDetail from "@/components/business/AccountDetailModal.tsx";
import {useAntigravityAccount, useCurrentAntigravityAccount} from "@/modules/use-antigravity-account.ts";
import {useAvailableModels} from "@/modules/use-available-models.ts";
import {useTrayMenu} from "@/hooks/useTrayMenu.ts";

import BusinessConfirmDialog from "@/components/business/ConfirmDialog.tsx";
import toast from 'react-hot-toast';
import {maskEmail} from "@/utils/string-masking.ts";
import {useAppGlobalLoader} from "@/modules/use-app-global-loader.ts";
import {AccountSessionList, AccountSessionListAccountItem} from "@/components/business/AccountSessionList.tsx";

export function AppContent() {
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AntigravityAccount | null>(null);
  const antigravityAccount = useAntigravityAccount();
  const availableModels = useAvailableModels();
  const currentAntigravityAccount = useCurrentAntigravityAccount();
  const appGlobalLoader = useAppGlobalLoader();

  // 初始化托盘菜单更新
  useTrayMenu();

  // 组件挂载时获取用户列表
  useEffect(() => {
    const loadUsers = async () => {
      try {
        await antigravityAccount.getAccounts();
      } catch (error) {
        toast.error(`获取用户列表失败: ${error}`);
      } finally {
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    antigravityAccount.updateCurrentAccount()
    antigravityAccount.accounts.forEach(user => {
      availableModels.fetchData(user)
    })
  }, [antigravityAccount.accounts]);

  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // 用户详情处理
  const handleUserClick = (account: AccountSessionListAccountItem) => {
    const foundAccount = antigravityAccount.accounts.find(item => item.id === account.id);
    setSelectedUser(foundAccount);
    setIsUserDetailOpen(true);
  };

  const handleUserDetailClose = () => {
    setIsUserDetailOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteBackup = (user: AccountSessionListAccountItem) => {
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

  const handleSwitchAccount = async (user: AccountSessionListAccountItem) => {
    try {
      appGlobalLoader.open({label: `正在切换到用户: ${maskEmail(user.email)}...`});
      await antigravityAccount.switchToAccount(user.email);
    } finally {
      appGlobalLoader.close();
    }
  };

  const handleClearAllBackups = () => {
    if (antigravityAccount.accounts.length === 0) {
      toast.error('当前没有用户备份可清空');
      return;
    }
    setIsClearDialogOpen(true);
  };

  const confirmClearAllBackups = async () => {
    try {
      await antigravityAccount.clearAllAccounts();
      toast.success('清空所有备份成功');
      setIsClearDialogOpen(false);
    } catch (error) {
      toast.error(`清空备份失败: ${error}`);
    }
  };

  const accounts: AccountSessionListAccountItem[] = antigravityAccount.accounts.map((account) => {
    const model = availableModels.data[account.api_key]
    let geminiQuota = model?.models["gemini-3-pro-high"].quotaInfo.remainingFraction || -1
    let claudeQuota = model?.models["claude-sonnet-4-5"].quotaInfo.remainingFraction || -1

    return {
      geminiQuota,
      claudeQuota,
      email: account.email,
      nickName: account.name,
      userAvatar: account.profile_url,
      id: account.id,
    }
  })

  return (
    <>
      <section className="flex flex-col relative flex-1">
        <AccountSessionList
          accounts={accounts}
          onSwitch={handleSwitchAccount}
          onDelete={handleDeleteBackup}
          onSelect={handleUserClick}
          currentUserId={currentAntigravityAccount?.id}
        />
      </section>

      {/* 清空所有备份确认对话框 */}
      <BusinessConfirmDialog
        isOpen={isClearDialogOpen}
        onOpenChange={setIsClearDialogOpen}
        title="确认清空所有备份"
        description={`此操作将永久删除所有 ${antigravityAccount.accounts.length} 个账户，且无法恢复。请确认您要继续此操作吗？`}
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
