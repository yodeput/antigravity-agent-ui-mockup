import React, {useCallback, useState} from 'react';
import {Download, Plus, Upload} from 'lucide-react';
import BusinessUpdateDialog from '../business/UpdateDialog.tsx';
import BusinessConfirmDialog from '../business/ConfirmDialog.tsx';
import BusinessActionButton from '../business/ActionButton.tsx';
import ToolbarTitle from '../ui/toolbar-title.tsx';
import {useUpdateChecker} from '../../hooks/useUpdateChecker.ts';
import {useAntigravityAccount} from '@/modules/use-antigravity-account.ts';
import {logger} from '../../utils/logger.ts';
import toast from 'react-hot-toast';
import {useImportExportAccount} from "@/modules/use-import-export-accounts.ts";
import {useAntigravityProcess} from "@/hooks/use-antigravity-process.ts";
import {ImportPasswordDialog} from "@/components/ImportPasswordDialog.tsx";
import ExportPasswordDialog from "@/components/ExportPasswordDialog.tsx";
import BusinessSettingsDialog from "@/components/business/SettingsDialog.tsx";
import {Modal} from 'antd';

const {confirm} = Modal;

const AppToolbar = () => {

  // ========== 应用状态 ==========
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const antigravityAccount = useAntigravityAccount();
  const importExportAccount = useImportExportAccount();
  // 使用单独的选择器避免无限循环
  const isImporting = useImportExportAccount((state) => state.isImporting);
  const isExporting = useImportExportAccount((state) => state.isExporting);
  const isCheckingData = useImportExportAccount((state) => state.isCheckingData);
  const importDialogIsOpen = useImportExportAccount((state) => state.importDialogIsOpen);
  const exportDialogIsOpen = useImportExportAccount((state) => state.exportDialogIsOpen);

  // 处理导入对话框取消
  const handleImportDialogCancel = useCallback(() => {
    importExportAccount.closeImportDialog();
    toast.error('操作已取消');
  }, [importExportAccount]);

  // 处理导出对话框取消
  const handleExportDialogCancel = useCallback(() => {
    importExportAccount.closeExportDialog();
    toast.error('操作已取消');
  }, [importExportAccount]);

  // 包装方法以刷新用户列表
  const handleImportConfig = () => {
    importExportAccount.importConfig()
  };
  const handleExportConfig = () => importExportAccount.exportConfig();

  // 进程管理
  const {isProcessLoading, backupAndRestartAntigravity} = useAntigravityProcess();

  // 计算全局加载状态
  const isAnyLoading = isProcessLoading || isImporting || isExporting;

  // 确认对话框状态（用于"登录新账户"操作）
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { }
  });

  
  // 处理登录新账户按钮点击
  const handleBackupAndRestartClick = () => {
    confirm({
      title: '登录新账户',
      content: <p className={"wrap-break-word whitespace-pre-line"}>
        {`确定要关闭 Antigravity 并登录新账户吗？

此操作将会：
1. 关闭所有 Antigravity 进程
2. 清除 Antigravity 用户信息
3. 自动重新启动 Antigravity

注意：系统将自动启动 Antigravity，请确保已保存所有重要工作`}
      </p>,
      onOk() {
        setConfirmDialog(prev => ({...prev, isOpen: false}));
        backupAndRestartAntigravity();
      },
      onCancel() {
        setConfirmDialog(prev => ({...prev, isOpen: false}));
      },
    });
  };

  // 使用自动更新检查 Hook
  const {
    updateState,
    updateInfo,
    downloadProgress,
    error: updateError,
    startDownload,
    installAndRelaunch,
    dismissUpdate,
  } = useUpdateChecker(true); // 启用自动检查

  // 更新对话框状态
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // 处理更新徽章点击
  const handleUpdateBadgeClick = () => {
    setIsUpdateDialogOpen(true);
  };

  // 处理开始下载
  const handleStartDownload = async () => {
    try {
      await startDownload();
      toast.success('更新包下载完成，点击重启按钮安装');
    } catch (error) {
      // 只在控制台打印错误，不提示用户
      logger.error('下载失败', {
        module: 'AppToolbar',
        action: 'download_update_failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // 处理安装并重启
  const handleInstallAndRelaunch = async () => {
    try {
      toast('正在安装更新并重启应用...');
      await installAndRelaunch();
      // 如果成功，应用会重启，这里的代码不会执行
    } catch (error) {
      // 只在控制台打印错误，不提示用户
      logger.error('安装失败', {
        module: 'AppToolbar',
        action: 'install_update_failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const handleSubmitImportPassword = (password: string) => {
    importExportAccount.submitImportPassword(password)
    .then(() => {
      antigravityAccount.getUsers()
    })
  };

  
  return (
    <>
      <div className="toolbar bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm shadow-sm">
        <div className="toolbar-content max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-row">
              <ToolbarTitle
                updateState={updateState}
                downloadProgress={downloadProgress}
                onUpdateClick={handleUpdateBadgeClick}
              />
            </div>

            <div className="flex items-center gap-2">

              {/* 操作按钮 */}
              <BusinessActionButton
                onClick={handleBackupAndRestartClick}
                variant="default"
                icon={<Plus className="h-4 w-4" />}
                tooltip="关闭 Antigravity，备份当前用户，清除用户信息，并自动重新启动"
                isLoading={isProcessLoading}
                loadingText="处理中..."
                isAnyLoading={isAnyLoading}
              >
                新账户
              </BusinessActionButton>

              <BusinessActionButton
                onClick={handleImportConfig}
                variant="secondary"
                icon={<Upload className="h-4 w-4" />}
                tooltip="导入加密的配置文件"
                isLoading={isImporting}
                loadingText="导入中..."
                isAnyLoading={isAnyLoading}
              >
                导入
              </BusinessActionButton>

              <BusinessActionButton
                onClick={handleExportConfig}
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                tooltip={antigravityAccount.users.length > 0 ? "导出为加密配置文件" : "没有用户信息可以导出"}
                disabled={antigravityAccount.users.length === 0}
                isLoading={isExporting || isCheckingData}
                loadingText={isCheckingData ? "检查中..." : "导出中..."}
                isAnyLoading={isAnyLoading}
              >
                导出
              </BusinessActionButton>

              {/* 设置按钮 */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                title="设置"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      <BusinessConfirmDialog
        isOpen={confirmDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        }}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }}
      />
  
      {/* 更新对话框 */}
      <BusinessUpdateDialog
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
        state={updateState}
        updateInfo={updateInfo}
        progress={downloadProgress}
        error={updateError}
        onDownload={handleStartDownload}
        onInstall={handleInstallAndRelaunch}
        onDismiss={() => {
          dismissUpdate();
          setIsUpdateDialogOpen(false);
        }}
      />

      <ImportPasswordDialog
        isOpen={importDialogIsOpen}
        onSubmit={handleSubmitImportPassword}
        onCancel={handleImportDialogCancel}
        onOpenChange={(open) => !open && importExportAccount.closeImportDialog()}
      />

      <ExportPasswordDialog
        isOpen={exportDialogIsOpen}
        onSubmit={importExportAccount.submitExportPassword}
        onCancel={handleExportDialogCancel}
        onOpenChange={(open) => !open && importExportAccount.closeExportDialog()}
      />

      <BusinessSettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </>
  );
};

export default AppToolbar;
