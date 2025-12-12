import React, {useCallback, useState} from 'react';
import {ArrowBigDownDash, ArrowBigUpDash, Settings, UserRoundPlus} from 'lucide-react';
import {useAntigravityAccount} from '@/modules/use-antigravity-account.ts';
import toast from 'react-hot-toast';
import {useImportExportAccount} from "@/modules/use-import-export-accounts.ts";
import {ImportPasswordDialog} from "@/components/ImportPasswordDialog.tsx";
import ExportPasswordDialog from "@/components/ExportPasswordDialog.tsx";
import BusinessSettingsDialog from "@/components/business/SettingsDialog.tsx";
import {Modal} from 'antd';
import {useSignInNewAntigravityAccount} from "@/hooks/use-sign-in-new-antigravity-account.ts";
import {Dock, DockIcon} from "@/components/ui/dock";
import {AnimatedTooltip} from "@/components/ui/animated-tooltip.tsx";

const {confirm} = Modal;

const AppDock = () => {

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
  const signInNewAntigravityAccount = useSignInNewAntigravityAccount();

  // 计算全局加载状态
  const isAnyLoading = signInNewAntigravityAccount.processing || isImporting || isExporting;
  
  // 处理登录新账户按钮点击
  const handleBackupAndRestartClick = () => {
    confirm({
      centered: true,
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
        signInNewAntigravityAccount.run();
      },
      onCancel() {
      },
    });
  };

  const handleSubmitImportPassword = (password: string) => {
    importExportAccount.submitImportPassword(password)
    .then(() => {
      antigravityAccount.getAccounts()
    })
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Dock>
          <DockIcon onClick={handleBackupAndRestartClick}>
            <AnimatedTooltip text={"登录新账户"}>
              <UserRoundPlus className="size-6" />
            </AnimatedTooltip>
          </DockIcon>
          <DockIcon onClick={handleImportConfig}>
            <AnimatedTooltip text={"导入账户"}>
              <ArrowBigUpDash className="size-6" />
            </AnimatedTooltip>
          </DockIcon>
          <DockIcon onClick={handleExportConfig}>
            <AnimatedTooltip text={"导出所有账户"}>
              <ArrowBigDownDash className="size-6" />
            </AnimatedTooltip>
          </DockIcon>
          <DockIcon onClick={() => setIsSettingsOpen(true)}>
            <AnimatedTooltip text={"偏好设置"}>
              <Settings className="size-6" />
            </AnimatedTooltip>
          </DockIcon>
        </Dock>
      </div>

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

export default AppDock;
