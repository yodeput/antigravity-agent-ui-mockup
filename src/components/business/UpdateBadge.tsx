import React, {useState} from 'react';
import {useUpdateChecker} from '@/hooks/use-update-checker.ts';
import toast from 'react-hot-toast';
import {logger} from '@/lib/logger.ts';
import BusinessUpdateDialog from '@/components/business/UpdateDialog.tsx';
import {cn} from '@/lib/utils.ts';
import {AlertTriangle, Download, Loader2, RotateCw} from 'lucide-react';
import type {DownloadProgress, UpdateInfo, UpdateState} from '@/services/updateService.ts';
import {Tooltip} from "antd";

type BadgeVariant = 'secondary' | 'destructive' | 'success' | 'warning';

const badgeVariantClasses: Record<BadgeVariant, string> = {
  secondary: 'bg-gray-600 text-gray-100',
  destructive: 'bg-red-600 text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-600 text-white',
};

interface InlineBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const InlineBadge: React.FC<InlineBadgeProps> = ({
  variant,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        badgeVariantClasses[variant],
        'px-2 py-0.5 text-xs',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};


/**
 * Update Badge Component
 * Inline badge styles to avoid BaseBadge dependency
 * Maintains original functionality
 */
export interface UpdateBadgeProps {
  state?: UpdateState;
  updateInfo?: UpdateInfo | null;
  progress?: DownloadProgress | null;
  error?: string | null;
  onClick?: () => void;
  autoCheck?: boolean;
  className?: string;
}

const UpdateBadge: React.FC<UpdateBadgeProps> = ({
  state,
  updateInfo: updateInfoOverride,
  progress: progressOverride,
  error: errorOverride,
  onClick,
  autoCheck = true,
  className,
}) => {

  // Use auto-update checker Hook
  const {
    updateState: internalState,
    updateInfo: internalUpdateInfo,
    downloadProgress: internalDownloadProgress,
    error: internalError,
    startDownload,
    installAndRelaunch,
    dismissUpdate,
  } = useUpdateChecker(state == null ? autoCheck : false); // Disable auto-check when controlled

  const updateState = state ?? internalState;
  const updateInfo = updateInfoOverride ?? internalUpdateInfo;
  const downloadProgress = progressOverride ?? internalDownloadProgress;
  const updateError = errorOverride ?? internalError;

  // Update dialog state
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Handle update badge click
  const handleUpdateBadgeClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    setIsUpdateDialogOpen(true);
  };

  // Handle start download
  const handleStartDownload = async () => {
    try {
      await startDownload();
      toast.success('Update package downloaded. Click restart button to install.');
    } catch (error) {
      // Only log error to console, don't notify user
      logger.error('Download failed', {
        module: 'AppDock',
        action: 'download_update_failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Handle install and restart
  const handleInstallAndRelaunch = async () => {
    try {
      toast('Installing update and restarting app...');
      await installAndRelaunch();
      // If successful, the app will restart and this code won't execute
    } catch (error) {
      // Only log error to console, don't notify user
      logger.error('Installation failed', {
        module: 'AppDock',
        action: 'install_update_failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };


  if (updateState === 'no-update') {
        return null;
  }

  const badgeVariant: BadgeVariant = updateError
    ? 'destructive'
    : updateState === 'ready-to-install'
      ? 'success'
      : updateState === 'downloading'
        ? 'secondary'
        : 'warning';

  const badgeContent = (() => {
    switch (updateState) {
      case 'update-available':
        return (
          <>
            <Download className="h-3.5 w-3.5" />
            <span>Update Available</span>
          </>
        );
      case 'downloading':
        return (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{downloadProgress?.percentage ?? 0}%</span>
          </>
        );
      case 'ready-to-install':
        return (
          <>
            <RotateCw className="h-3.5 w-3.5" />
            <span>Restart to Update</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Update Failed</span>
          </>
        );
      default:
        return (
          <>
            <Download className="h-3.5 w-3.5" />
            <span>Update</span>
          </>
        );
    }
  })();

  const tooltipContent = updateError
    ? `Update failed: ${updateError}`
    : updateState === 'update-available' && updateInfo
      ? `New version v${updateInfo.version} found, click to view`
      : updateState === 'downloading'
        ? `Downloading update ${downloadProgress?.percentage ?? 0}%`
        : updateState === 'ready-to-install'
          ? 'Update downloaded, click to restart and install'
          : 'Click to view updates';

  return (
    <>
      {/* Update Badge */}
      <Tooltip title={tooltipContent}>
        <button
          type="button"
          onClick={handleUpdateBadgeClick}
          className={cn('ml-2 inline-flex cursor-pointer', className)}
          aria-label="Application update"
        >
          <InlineBadge
            variant={badgeVariant}
            className={cn(
              'gap-1.5 select-none',
              updateState === 'update-available' && !updateError && 'animate-pulse'
            )}
          >
            {badgeContent}
          </InlineBadge>
        </button>
      </Tooltip>

      {/* Update Dialog */}
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
    </>
  );

};

export default UpdateBadge;
