import React, {useCallback, useState} from 'react';
import {ArrowBigDownDash, ArrowBigUpDash, Settings, UserRoundPlus, Sparkles, Users} from 'lucide-react';
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
import {useAppNavigation} from "@/modules/use-app-navigation.ts";

const {confirm} = Modal;

const AppDock = () => {

  // ========== Application State ==========
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { currentView, setView } = useAppNavigation();

  const antigravityAccount = useAntigravityAccount();
  const importExportAccount = useImportExportAccount();
  // Use separate selectors to avoid infinite loops
  const isImporting = useImportExportAccount((state) => state.isImporting);
  const isExporting = useImportExportAccount((state) => state.isExporting);
  const isCheckingData = useImportExportAccount((state) => state.isCheckingData);
  const importDialogIsOpen = useImportExportAccount((state) => state.importDialogIsOpen);
  const exportDialogIsOpen = useImportExportAccount((state) => state.exportDialogIsOpen);

  // Handle import dialog cancel
  const handleImportDialogCancel = useCallback(() => {
    importExportAccount.closeImportDialog();
    toast.error('Operation cancelled');
  }, [importExportAccount]);

  // Handle export dialog cancel
  const handleExportDialogCancel = useCallback(() => {
    importExportAccount.closeExportDialog();
    toast.error('Operation cancelled');
  }, [importExportAccount]);

  // Wrapper methods to refresh user list
  const handleImportConfig = () => {
    importExportAccount.importConfig()
  };
  const handleExportConfig = () => importExportAccount.exportConfig();

  // Process management
  const signInNewAntigravityAccount = useSignInNewAntigravityAccount();

  // Calculate global loading state
  const isAnyLoading = signInNewAntigravityAccount.processing || isImporting || isExporting;
  
  // Handle sign in new account button click
  const handleBackupAndRestartClick = () => {
    confirm({
      centered: true,
      title: 'Sign In New Account',
      content: <p className={"wrap-break-word whitespace-pre-line"}>
        {`Are you sure you want to close Antigravity and sign in with a new account?

This action will:
1. Close all Antigravity processes
2. Clear Antigravity user data
3. Automatically restart Antigravity

Note: The system will automatically start Antigravity, please make sure all important work is saved`}
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
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <Dock>
          <DockIcon onClick={() => setView('accounts')}>
            <AnimatedTooltip text={"Account List"}>
              <Users className="size-6" />
            </AnimatedTooltip>
          </DockIcon>
          <DockIcon onClick={() => setView('generators')}>
            <AnimatedTooltip text={"Generators"}>
              <Sparkles className="size-6" />
            </AnimatedTooltip>
          </DockIcon>
          <DockIcon onClick={handleBackupAndRestartClick}>
            <AnimatedTooltip text={"Sign In New Account"}>
              <UserRoundPlus className="size-6" />
            </AnimatedTooltip>
          </DockIcon>
          <DockIcon onClick={handleImportConfig}>
            <AnimatedTooltip text={"Import Accounts"}>
              <ArrowBigUpDash className="size-6" />
            </AnimatedTooltip>
          </DockIcon>
          <DockIcon onClick={handleExportConfig}>
            <AnimatedTooltip text={"Export All Accounts"}>
              <ArrowBigDownDash className="size-6" />
            </AnimatedTooltip>
          </DockIcon>
          <DockIcon onClick={() => setIsSettingsOpen(true)}>
            <AnimatedTooltip text={"Preferences"}>
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
