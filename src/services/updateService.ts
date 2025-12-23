import { check, Update, DownloadEvent } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { logger } from '../lib/logger.ts';

export interface UpdateInfo {
    version: string;
    currentVersion: string;
    date: string;
    body: string;
}

export type UpdateState =
    | 'no-update'
    | 'update-available'
    | 'downloading'
    | 'ready-to-install'
    | 'error';

export interface DownloadProgress {
    downloaded: number;
    total: number;
    percentage: number;
}

class UpdateService {
    private pendingUpdate: Update | null = null;

    /**
     * Check if updates are available
     */
    async checkForUpdates(): Promise<UpdateInfo | null> {
        try {
            const update = await check();

            if (update === null) {
                logger.info('No updates available', {
                module: 'UpdateService',
                action: 'no_update_available'
              });
                return null;
            }

            this.pendingUpdate = update;

            return {
                version: update.version,
                currentVersion: update.currentVersion,
                date: update.date,
                body: update.body || '',
            };
        } catch (error) {
            logger.error('Failed to check for updates', {
                module: 'UpdateService',
                action: 'check_failed',
                error: error
              });
            throw new Error(`Failed to check for updates: ${error}`);
        }
    }

    /**
     * Download update package
     * @param onProgress Progress callback
     */
    async downloadUpdate(
        onProgress: (progress: DownloadProgress) => void
    ): Promise<void> {
        if (!this.pendingUpdate) {
            throw new Error('No pending update to download');
        }

        let downloaded = 0;
        let total = 0;

        try {
            await this.pendingUpdate.download((event: DownloadEvent) => {
                switch (event.event) {
                    case 'Started':
                        total = event.data.contentLength || 0;
                        logger.info('Download started', {
                        module: 'UpdateService',
                        action: 'download_started',
                        totalBytes: total
                      });
                        onProgress({ downloaded: 0, total, percentage: 0 });
                        break;

                    case 'Progress':
                        downloaded += event.data.chunkLength;
                        const percentage = total > 0 ? Math.round((downloaded / total) * 100) : 0;
                        logger.debug('Download progress', {
                        module: 'UpdateService',
                        action: 'download_progress',
                        downloaded,
                        total,
                        percentage
                      });
                        onProgress({ downloaded, total, percentage });
                        break;

                    case 'Finished':
                        logger.info('Download completed', {
                        module: 'UpdateService',
                        action: 'download_completed',
                        totalBytes: total
                      });
                        onProgress({ downloaded: total, total, percentage: 100 });
                        break;
                }
            });
        } catch (error) {
            logger.error('Failed to download update', {
                module: 'UpdateService',
                action: 'download_failed',
                error: error
              });
            throw new Error(`Failed to download update: ${error}`);
        }
    }

    /**
     * Install update and restart application
     */
    async installAndRelaunch(): Promise<void> {
        if (!this.pendingUpdate) {
            throw new Error('No pending update to install');
        }

        try {
            logger.info('Starting update installation', {
                module: 'UpdateService',
                action: 'install_started'
              });
            await this.pendingUpdate.install();

            logger.info('Installation completed, preparing to restart', {
                module: 'UpdateService',
                action: 'install_completed'
              });
            // Wait a short time to ensure installation is complete
            await new Promise(resolve => setTimeout(resolve, 500));

            // Restart application
            await relaunch();
        } catch (error) {
            logger.error('Failed to install update', {
                module: 'UpdateService',
                action: 'install_failed',
                error: error
              });
            throw new Error(`Failed to install update: ${error}`);
        }
    }

    /**
     * Clear pending update
     */
    clearPendingUpdate(): void {
        this.pendingUpdate = null;
    }
}

export const updateService = new UpdateService();
