import type { Meta, StoryObj } from '@storybook/react';
import UpdateBadge from '@/components/business/UpdateBadge.tsx';
import type { UpdateInfo } from '@/services/updateService.ts';

const sampleInfo: UpdateInfo = {
  version: '1.2.3',
  currentVersion: '1.0.0',
  date: '2025-12-12',
  body: '修复若干问题并提升稳定性。',
};

const meta: Meta<typeof UpdateBadge> = {
  title: 'Components/UpdateBadge',
  component: UpdateBadge,
  args: {
    autoCheck: false,
    onClick: () => {},
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof UpdateBadge>;

export const UpdateAvailable: Story = {
  args: {
    state: 'update-available',
    updateInfo: sampleInfo,
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

