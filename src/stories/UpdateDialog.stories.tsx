import type { Meta, StoryObj } from '@storybook/react';
import BusinessUpdateDialog from '@/components/business/UpdateDialog.tsx';
import type { UpdateInfo } from '@/services/updateService.ts';

const sampleInfo: UpdateInfo = {
  version: '1.4.4',
  currentVersion: '1.4.3',
  date: '2025-12-12',
  body: '修复若干问题并提升稳定性。\n\n详见：https://github.com/MonchiLin/antigravity-agent/releases',
};

const meta: Meta<typeof BusinessUpdateDialog> = {
  title: 'Components/UpdateDialog',
  component: BusinessUpdateDialog,
  args: {
    isOpen: true,
    onClose: () => {},
    state: 'update-available',
    updateInfo: sampleInfo,
    progress: null,
    error: null,
    onDownload: () => {},
    onInstall: () => {},
    onDismiss: () => {},
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen p-8 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof BusinessUpdateDialog>;

export const UpdateAvailable: Story = {};

export const UpdateAvailableWithoutNotes: Story = {
  args: {
    updateInfo: {
      ...sampleInfo,
      body: '',
    },
  },
};

export const Downloading: Story = {
  args: {
    state: 'downloading',
    updateInfo: sampleInfo,
    progress: { downloaded: 50, total: 100, percentage: 50 },
  },
};

export const ReadyToInstall: Story = {
  args: {
    state: 'ready-to-install',
    updateInfo: sampleInfo,
  },
};

export const ErrorState: Story = {
  args: {
    state: 'update-available',
    updateInfo: sampleInfo,
    error: 'Network error, please try again later.',
  },
};

