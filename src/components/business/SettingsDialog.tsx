import React, {useEffect, useState} from 'react';
import {FileCode, Monitor, Settings, VolumeX} from 'lucide-react';
import {open} from '@tauri-apps/plugin-dialog';
import {getVersion} from '@tauri-apps/api/app';
import {BaseButton} from '@/components/base-ui/BaseButton';
import {cn} from '@/lib/utils.ts';
import {logger} from '@/lib/logger.ts';
import {PlatformCommands} from "@/commands/PlatformCommands.ts";
import {Modal} from "antd";
import {SettingsCommands} from "@/commands/SettingsCommands.ts";
import {TrayCommands} from "@/commands/TrayCommands.ts";

interface BusinessSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BusinessSettingsDialog: React.FC<BusinessSettingsDialogProps> = ({
  isOpen,
  onOpenChange
}) => {
  const [dataPath, setDataPath] = useState<string>('');
  const [execPath, setExecPath] = useState<string>('');
  const [appVersion, setAppVersion] = useState<string>('');

  
  // 系统托盘状态
  const [isSystemTrayEnabled, setIsSystemTrayEnabled] = useState(true);
  const [isTrayLoading, setIsTrayLoading] = useState(false);

  // 静默启动状态
  const [isSilentStartEnabled, setIsSilentStartEnabled] = useState(false);
  const [isSilentStartLoading, setIsSilentStartLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentPaths();
      loadSystemTraySettings();
      loadSilentStartSettings();
      loadAppVersion();
    }
  }, [isOpen]);

  const loadAppVersion = async () => {
    const version = await getVersion();
    setAppVersion(version);
  };

  const loadCurrentPaths = async () => {
    const paths = await PlatformCommands.getCurrentPaths();
    let finalExecPath = paths.executablePath;

    if (!finalExecPath) {
      const detectedExec = await PlatformCommands.detectExecutable();
      if (detectedExec.found && detectedExec.path) {
        finalExecPath = detectedExec.path + ' (自动检测)';
      }
    }

    setDataPath('自动检测');
    setExecPath(finalExecPath || '未设置');
  };

  
  const loadSystemTraySettings = async () => {
    try {
      const trayEnabled = await TrayCommands.isEnabled();
      setIsSystemTrayEnabled(trayEnabled);
    } catch (error) {
      logger.error('加载系统托盘设置失败', {
        module: 'SettingsDialog',
        action: 'load_tray_settings_failed',
        error: error instanceof Error ? error.message : String(error)
      });
      setIsSystemTrayEnabled(false);
    }
  };

  const handleSystemTrayToggle = async () => {
    setIsTrayLoading(true);
    const result = await TrayCommands.toggle();
    setIsSystemTrayEnabled(result.enabled);
    setIsTrayLoading(false);
    if (!result.enabled && isSilentStartEnabled) {
      await handleSilentStartToggle();
    }
  };

  const loadSilentStartSettings = async () => {
    try {
      const silentStartEnabled = await SettingsCommands.isSilentStartEnabled();
      setIsSilentStartEnabled(silentStartEnabled);
    } catch (error) {
      setIsSilentStartEnabled(false);
    }
  };

  const handleSilentStartToggle = async () => {
    if (!isSystemTrayEnabled) {
      await handleSystemTrayToggle();
    }

    setIsSilentStartLoading(true);
    try {
      const result = await SettingsCommands.saveSilentStartState(!isSilentStartEnabled);
      setIsSilentStartEnabled(result);
    } catch (error) {
      console.log('切换静默启动状态失败', {
        module: 'SettingsDialog',
        action: 'toggle_silent_start_failed',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsSilentStartLoading(false);
    }
  };

  
  const handleBrowseExecPath = async () => {
    try {
      const result = await open({
        directory: false,
        multiple: false,
        title: '选择 Antigravity 可执行文件',
        filters: [
          { name: '可执行文件', extensions: ['exe', 'app', ''] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });

      if (result && typeof result === 'string') {
        const valid = await PlatformCommands.validateExecutable(result);
        if (valid) {
          await PlatformCommands.saveAntigravityExecutable(result);
          setExecPath(result);
        } else {
        }
      }
    } catch (error) {
    }
  };

  return (
    <Modal
      open={isOpen}
      footer={null}
      onCancel={() => onOpenChange(false)}
      title={<div className={"flex flex-row items-center gap-1.5"}>
        <Settings className="h-4 w-4 text-gray-500"/>
        <span>设置</span>
        <span
          className="ml-1 text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-normal">
          v{appVersion}
        </span>
      </div>
      }
    >
      <div className="p-5 space-y-6">
        {/* 路径设置组 */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="group">
              <label
                className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5 block px-1">Antigravity
                可执行文件</label>
              <div className="flex gap-2">
                <div
                  className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md px-3 py-2 text-xs font-mono text-gray-600 dark:text-gray-400 break-all select-all transition-colors group-hover:border-gray-300 dark:group-hover:border-gray-700">
                  {execPath}
                </div>
                <BaseButton
                  variant="outline"
                  size="icon"
                  className="h-[34px] w-[34px] shrink-0 border-gray-200 dark:border-gray-800"
                  onClick={handleBrowseExecPath}
                  title="Antigravity 可执行文件"
                >
                  <FileCode className="h-4 w-4 text-gray-500"/>
                </BaseButton>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800"/>

        <div className="space-y-1">
          <SettingToggle
            icon={<Monitor className="h-4 w-4 text-blue-500"/>}
            title="系统托盘"
            description="关闭窗口时最小化到托盘"
            checked={isSystemTrayEnabled}
            onChange={handleSystemTrayToggle}
            isLoading={isTrayLoading}
          />

          <SettingToggle
            icon={<VolumeX className="h-4 w-4 text-purple-500"/>}
            title="静默启动"
            description="启动时自动隐藏主窗口"
            checked={isSilentStartEnabled}
            onChange={handleSilentStartToggle}
            isLoading={isSilentStartLoading}
          />
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800"/>

        <div className="space-y-1">
          <a target={"_blank"} href={"https://github.com/MonchiLin/antigravity-agent/issues"}>遇到问题/请求新功能</a>
        </div>

      </div>
    </Modal>
  );
};

// 内部组件：设置开关项
const SettingToggle = ({
  icon,
  title,
  description,
  checked,
  onChange,
  isLoading
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isLoading: boolean;
}) => (
  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group cursor-pointer" onClick={() => !isLoading && onChange(!checked)}>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 group-hover:border-gray-200 dark:group-hover:border-gray-600 transition-colors">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
      </div>
    </div>

    <div className="relative">
      {isLoading ? (
        <div className="h-5 w-9 flex items-center justify-center">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
            checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              checked ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
      )}
    </div>
  </div>
);

export default BusinessSettingsDialog;
