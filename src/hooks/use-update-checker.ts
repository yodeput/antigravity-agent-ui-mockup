import {useCallback, useEffect, useState} from 'react';
import {DownloadProgress, UpdateInfo, updateService, UpdateState} from '../services/updateService';
import {logger} from '../lib/logger.ts';

export interface UseUpdateCheckerResult {
    updateState: UpdateState;
    updateInfo: UpdateInfo | null;
    downloadProgress: DownloadProgress | null;
    error: string | null;
    checkForUpdates: () => Promise<void>;
    startDownload: () => Promise<void>;
    installAndRelaunch: () => Promise<void>;
    dismissUpdate: () => void;
}

export function useUpdateChecker(autoCheck: boolean = true): UseUpdateCheckerResult {
    const [updateState, setUpdateState] = useState<UpdateState>('no-update');
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Check for updates
     */
    const checkForUpdates = useCallback(async () => {
        try {
            setError(null);
            logger.info('Checking for updates', {
            module: 'UpdateChecker',
            action: 'check_start'
          });

            const info = await updateService.checkForUpdates();

            if (info) {
                logger.info('New version found', {
                module: 'UpdateChecker',
                action: 'update_found',
                version: info.version
              });
                setUpdateInfo(info);
                setUpdateState('update-available');
            } else {
                logger.info('Already on latest version', {
                module: 'UpdateChecker',
                action: 'up_to_date'
              });
                setUpdateState('no-update');
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            logger.error('Failed to check for updates', {
            module: 'UpdateChecker',
            action: 'check_failed',
            error: errorMsg
          });
            setError(errorMsg);
            // Don't set error state, keep no-update state to avoid showing error badge
            setUpdateState('no-update');
        }
    }, []);

    /**
     * Start downloading update
     */
    const startDownload = useCallback(async () => {
        try {
            setError(null);
            setUpdateState('downloading');
            setDownloadProgress({ downloaded: 0, total: 0, percentage: 0 });

            await updateService.downloadUpdate((progress) => {
                setDownloadProgress(progress);
            });

            setUpdateState('ready-to-install');
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            logger.error('Failed to download update', {
            module: 'UpdateChecker',
            action: 'download_failed',
            error: errorMsg
          });
            setError(errorMsg);
            // Download failed, restore to update-available state so user can retry
            setUpdateState('update-available');
        }
    }, []);

    /**
     * Install update and restart
     */
    const installAndRelaunch = useCallback(async () => {
        try {
            setError(null);
            await updateService.installAndRelaunch();
            // If restart succeeds, this code won't execute
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            logger.error('Failed to install update', {
            module: 'UpdateChecker',
            action: 'install_failed',
            error: errorMsg
          });
            setError(errorMsg);
            // Install failed, restore to ready-to-install state so user can retry
            setUpdateState('ready-to-install');
        }
    }, []);

    /**
     * Dismiss this update
     */
    const dismissUpdate = useCallback(() => {
        updateService.clearPendingUpdate();
        setUpdateState('no-update');
        setUpdateInfo(null);
        setDownloadProgress(null);
        setError(null);
    }, []);

    /**
     * Auto check for updates (on app startup)
     */
    useEffect(() => {
        if (autoCheck) {
            // Delay 3 seconds before checking updates to avoid affecting app startup speed
            const timer = setTimeout(() => {
                checkForUpdates();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [autoCheck, checkForUpdates]);

    return {
        updateState,
        updateInfo,
        downloadProgress,
        error,
        checkForUpdates,
        startDownload,
        installAndRelaunch,
        dismissUpdate,
    };
}
