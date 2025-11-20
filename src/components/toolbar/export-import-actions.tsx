import React, { useCallback, useState } from 'react';
import {
  Download,
  Upload
} from 'lucide-react';
import { ConfigExportManager } from '../../services/config-export-manager';
import type { ConfigProgressCallback, ConfigImportResult, ConfigExportResult } from '../../services/config-export-manager';

interface ExportImportActionsProps {
  isAnyLoading: boolean;
  showStatus: (message: string, isError?: boolean) => void;
  setLoadingState: React.Dispatch<React.SetStateAction<{
    isProcessLoading: boolean;
    isImporting: boolean;
    isExporting: boolean;
  }>>;
  showPasswordDialog: (config: {
    title: string;
    description?: string;
    requireConfirmation?: boolean;
    onSubmit: (password: string) => void;
    validatePassword?: (password: string) => { isValid: boolean; message?: string };
  }) => void;
  closePasswordDialog: () => void;
  onRefresh: () => void;
}

/**
 * 导入导出操作组件
 * 专门处理配置文件的导入和导出功能
 */
const ExportImportActions: React.FC<ExportImportActionsProps> = ({
  isAnyLoading,
  showStatus,
  setLoadingState,
  showPasswordDialog,
  closePasswordDialog,
  onRefresh
}) => {
  // 状态管理
  const [configManager] = useState(() => new ConfigExportManager());

  /**
   * 进度回调函数
   */
  const handleProgress: ConfigProgressCallback = useCallback((progress) => {
    showStatus(progress.message, progress.status === 'error');
  }, [showStatus]);

  /**
   * 导入配置文件
   */
  const handleImportConfig = useCallback(async () => {
    try {
      // 使用新的导入接口
      const result = await configManager.importEncryptedConfig();

      if (!result.success) {
        showStatus(result.message, true);
        return;
      }

      // 获取解密密码
      showPasswordDialog({
        title: '导入配置文件',
        description: '请输入配置文件的解密密码',
        requireConfirmation: false,
        validatePassword: (password) => configManager.validatePassword(password),
        onSubmit: async (password) => {
          try {
            closePasswordDialog();
            setLoadingState(prev => ({ ...prev, isImporting: true }));

            const decryptResult = await configManager.decryptConfigData(
              result.encryptedData!,
              password
            );

            if (decryptResult.success && decryptResult.configData) {
              const configData = decryptResult.configData;
              const restoreInfo = decryptResult.restoreInfo;

              if (restoreInfo) {
                // 显示详细的恢复结果
                const successCount = restoreInfo.restoredCount;
                const failedCount = restoreInfo.failed.length;

                let statusMessage = `导入成功！已恢复 ${successCount} 个账号`;
                if (failedCount > 0) {
                  statusMessage += `，${failedCount} 个失败`;
                  showStatus(statusMessage, true);
                  console.error('恢复失败的账号:', restoreInfo.failed);
                } else {
                  showStatus(statusMessage, false);
                }

                // 显示配置摘要
                const summary = configManager.generateConfigSummary(configData);
                console.log('配置文件摘要:', summary);
              } else {
                showStatus(`配置文件导入成功 (版本: ${configData.version})`);

                // 显示配置摘要
                const summary = configManager.generateConfigSummary(configData);
                console.log('配置文件摘要:', summary);
              }

              // 延迟刷新以确保数据完整性
              setTimeout(() => {
                onRefresh();
              }, 500);
            } else {
              showStatus(decryptResult.message, true);
            }

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            showStatus(`导入配置文件失败: ${errorMessage}`, true);
          } finally {
            setLoadingState(prev => ({ ...prev, isImporting: false }));
          }
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showStatus(`选择文件失败: ${errorMessage}`, true);
    }
  }, [configManager, showStatus, setLoadingState, showPasswordDialog, closePasswordDialog, onRefresh]);

  /**
   * 导出配置文件
   */
  const handleExportConfig = useCallback(async () => {
    // 检查是否有可导出的数据
    const hasData = await configManager.hasExportableData();
    if (!hasData) {
      showStatus('没有找到任何用户信息，无法导出配置文件', true);
      return;
    }

    // 显示密码设置对话框
    showPasswordDialog({
      title: '导出配置文件',
      description: '请设置导出密码，用于保护您的配置文件',
      requireConfirmation: true,
      validatePassword: (password) => configManager.validatePassword(password),
      onSubmit: async (password) => {
        try {
          closePasswordDialog();
          setLoadingState(prev => ({ ...prev, isExporting: true }));
          showStatus('正在生成加密配置文件...');

          const exportResult = await configManager.exportEncryptedConfig(password);

          if (exportResult.success) {
            showStatus(`配置文件已保存: ${exportResult.filePath}`);
          } else {
            showStatus(exportResult.message, true);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          showStatus(`导出配置文件失败: ${errorMessage}`, true);
        } finally {
          setLoadingState(prev => ({ ...prev, isExporting: false }));
        }
      }
    });
  }, [configManager, showStatus, setLoadingState, showPasswordDialog, closePasswordDialog]);

  return (
    <>
      {/* 导出按钮 */}
      <ToolbarButton
        icon={<Download className="w-4 h-4" />}
        label="导出"
        onClick={handleExportConfig}
        disabled={isAnyLoading}
        tooltip="导出所有用户配置到加密文件"
        variant="default"
      />

      {/* 导入按钮 */}
      <ToolbarButton
        icon={<Upload className="w-4 h-4" />}
        label="导入"
        onClick={handleImportConfig}
        disabled={isAnyLoading}
        tooltip="从加密文件导入用户配置"
        variant="default"
      />
    </>
  );
};

// ToolbarButton 组件的简单实现（如果还没有的话）
interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  variant?: 'default' | 'primary' | 'danger';
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  tooltip,
  variant = 'default'
}) => {
  const baseClasses = "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium";

  const variantClasses = {
    default: disabled
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer",
    primary: disabled
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : "bg-green-500 text-white hover:bg-green-600 cursor-pointer",
    danger: disabled
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export default ExportImportActions;