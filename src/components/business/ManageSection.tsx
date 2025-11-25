import React, {useEffect, useState} from 'react';
import {Trash2} from 'lucide-react';
import {maskBackupFilename} from '../../utils/username-masking';
import {useUserManagement} from '@/modules/user-management/store';
import {BaseTooltip} from '@/components/base-ui/BaseTooltip';
import {BaseButton} from '@/components/base-ui/BaseButton';
import {BaseSpinner} from '@/components/base-ui/BaseSpinner';
import BusinessConfirmDialog from './ConfirmDialog';
import BusinessActionButton from './ActionButton';
import type {AntigravityAccount} from '@/commands/types/account.types';
import {useLanguageServerState} from "@/hooks/use-language-server-state.ts";
import {useLanguageServerUserInfo} from "@/modules/use-language-server-user-info.ts";
import {GlassProgressBar} from "@/components/base-ui/GlassProgressBar.tsx";

interface BusinessManageSectionProps {
  showStatus: (message: string, isError?: boolean) => void;
  isInitialLoading?: boolean;
  onUserClick?: (user: AntigravityAccount) => void;
}

const BusinessManageSection: React.FC<BusinessManageSectionProps> = ({
  showStatus,
  isInitialLoading = false,
  onUserClick
}) => {
  const {users, getUsers, deleteUser, clearAllUsers, switchUser, getCurrentUser} = useUserManagement();
  // email
  const [currentUser, setCurrentUser] = useState<string>(null);
  const languageServerUserInfo = useLanguageServerUserInfo();
  const {isLanguageServerStateInitialized} = useLanguageServerState();
  const [isLoading, setIsLoading] = useState(true);

  // 组件挂载时获取用户列表
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        await getUsers();
      } catch (error) {
        showStatus(`获取用户列表失败: ${error}`, true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [getUsers, showStatus]);

  useEffect(() => {
    if (isLanguageServerStateInitialized) {
      users.forEach(user => {
        languageServerUserInfo.fetchData(user)
      })
    }
    getCurrentUser()
      .then(user => {
        setCurrentUser(user.email)
      })
  }, [users, isLanguageServerStateInitialized]);

  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);

  // 解码 Base64 头像
  const getAvatarUrl = (base64Url: string) => {
    try {
      // 如果已经是完整URL，直接返回
      if (base64Url.startsWith('http') || base64Url.startsWith('data:')) {
        return base64Url;
      }
      // 如果是 Base64 编码，尝试解码
      return atob(base64Url);
    } catch (error) {
      // 解码失败，返回空字符串
      return '';
    }
  };

  const handleDeleteBackup = (backupName: string) => {
    setBackupToDelete(backupName);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBackup = async () => {
    if (!backupToDelete) return;

    try {
      await deleteUser(backupToDelete);
      showStatus(`备份 "${backupToDelete}" 删除成功`);
      setDeleteDialogOpen(false);
      setBackupToDelete(null);
    } catch (error) {
      showStatus(`删除备份失败: ${error}`, true);
    }
  };

  const handleSwitchAccount = async (backupName: string) => {
    try {
      await switchUser(backupName);
      showStatus(`已切换到用户: ${backupName}`);
    } catch (error) {
      showStatus(`切换用户失败: ${error}`, true);
    }
  };

  const handleClearAllBackups = () => {
    if (users.length === 0) {
      showStatus('当前没有用户备份可清空', true);
      return;
    }
    setIsClearDialogOpen(true);
  };

  const confirmClearAllBackups = async () => {
    try {
      await clearAllUsers();
      showStatus('清空所有备份成功');
      setIsClearDialogOpen(false);
    } catch (error) {
      showStatus(`清空备份失败: ${error}`, true);
    }
  };

  return (
    <>
      <section className="card section-span-full mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2>用户管理</h2>
          {users.length > 0 && (
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
        <div className={users.length === 0 ? "backup-list-empty" : "backup-list-vertical"}>
          {isLoading || isInitialLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-light-text-muted">
              <BaseSpinner size="lg" />
              <p className="mt-3">正在加载用户列表...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="text-light-text-muted">暂无用户</p>
          ) : (
            users.map((user, index) => {
        const avatarUrl = getAvatarUrl(user.profile_url);
        return (
              <div
                key={`${user.email}-${index}`}
                className="backup-item-vertical cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group"
                onClick={() => onUserClick?.(user)}
                title="点击查看用户详情"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      className="h-6 w-6 rounded-full object-cover border border-gray-200 dark:border-gray-700 group-hover:border-blue-400 dark:group-hover:border-blue-600 transition-colors flex-shrink-0"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <BaseTooltip content={user.email} side="bottom" className="flex-1 min-w-0">
                    <span className="backup-name text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {maskBackupFilename(user.email)}
                    </span>
                  </BaseTooltip>
                </div>
                <div className="flex gap-2 flex-shrink-0 items-center">
                  {
                    currentUser === user.email && languageServerUserInfo.users[user.id] && <div className={"flex flex-col flex-wrap gap-1"}>
                      {languageServerUserInfo.users[user.id].userStatus.cascadeModelConfigData.clientModelConfigs.map((model) => {
                        return <GlassProgressBar
                          key={model.label}
                          value={1 - model.quotaInfo.remainingFraction}
                          gradientFrom="from-purple-500"
                          gradientTo="to-pink-500"
                          label={model.label}
                          className={"h-5"}
                        />
                      })}
                    </div>
                  }
                  <BaseTooltip content="切换到此用户并自动启动 Antigravity" side="bottom">
                    <div onClick={(e) => e.stopPropagation()}>
                      <BusinessActionButton
                        variant="default"
                        size="sm"
                        onClick={() => handleSwitchAccount(user.email)}
                        loadingText="切换中..."
                      >
                        切换
                      </BusinessActionButton>
                    </div>
                  </BaseTooltip>
                  <div onClick={(e) => e.stopPropagation()}>
                    <BaseButton
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBackup(user.email)}
                    >
                      删除
                    </BaseButton>
                  </div>
                </div>
              </div>
            );
        })
          )}
        </div>
      </section>

      {/* 清空所有备份确认对话框 */}
      <BusinessConfirmDialog
        isOpen={isClearDialogOpen}
        onOpenChange={setIsClearDialogOpen}
        title="确认清空所有备份"
        description={`此操作将永久删除所有 ${users.length} 个用户备份文件，且无法恢复。请确认您要继续此操作吗？`}
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
    </>
  );
};

export default BusinessManageSection;
