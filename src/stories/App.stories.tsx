import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import App from '@/App.tsx';
import { useAntigravityAccount } from '@/modules/use-antigravity-account.ts';
import {
  useAccountAdditionData,
  type AccountAdditionData,
} from '@/modules/use-account-addition-data.ts';
import { useDbMonitoringStore } from '@/modules/db-monitoring-store';
import { useAntigravityIsRunning } from '@/hooks/use-antigravity-is-running.ts';
import { useImportExportAccount } from '@/modules/use-import-export-accounts.ts';
import { useSignInNewAntigravityAccount } from '@/hooks/use-sign-in-new-antigravity-account.ts';
import { PlatformCommands } from '@/commands/PlatformCommands.ts';
import { TrayCommands } from '@/commands/TrayCommands.ts';
import type { AntigravityAccount } from '@/commands/types/account.types.ts';
import {
  mockAccounts,
  mockAdditionDataMap,
} from '@/stories/mocks/accountSessions.ts';

// Storybook 下不需要真实原生能力；只提供空壳避免运行时报错。
if (typeof window !== 'undefined') {
  const w = window as any;
  w.__TAURI_INTERNALS__ ??= {
    invoke: async () => null,
    transformCallback: () => 0,
    convertFileSrc: (p: string) => p,
  };
  w.__TAURI_EVENT_PLUGIN_INTERNALS__ ??= { unregisterListener: () => {} };
}

PlatformCommands.detectInstallation = async () => null as any;
TrayCommands.updateMenu = async () => '';

const seedMocks = (
  accounts: AntigravityAccount[],
  additionData: Record<string, AccountAdditionData>
) => {
  useAntigravityAccount.setState({
    accounts,
    currentAuthInfo: accounts[0] ?? null,
    getAccounts: async () => accounts,
    delete: async () => {},
    insertOrUpdateCurrentAccount: async () => {},
    switchToAccount: async () => {},
    clearAllAccounts: async () => {},
  });

  useAccountAdditionData.setState({
    data: additionData,
    update: async () => {},
  });

  useDbMonitoringStore.setState({
    start: async () => {},
    stop: async () => {},
    addListener: () => () => {},
  });

  useAntigravityIsRunning.setState({
    isRunning: false,
    isChecking: false,
    lastChecked: null,
    check: async () => {},
    start: () => {},
    stop: () => {},
  });

  useImportExportAccount.setState({
    isImporting: false,
    isExporting: false,
    isCheckingData: false,
    importDialogIsOpen: false,
    exportDialogIsOpen: false,
    pendingImportPath: undefined,
    pendingExportData: undefined,
    setImporting: () => {},
    setExporting: () => {},
    setCheckingData: () => {},
    openImportDialog: () => {},
    closeImportDialog: () => {},
    openExportDialog: () => {},
    closeExportDialog: () => {},
    submitImportPassword: async () => {},
    submitExportPassword: async () => {},
    importConfig: async () => {},
    exportConfig: async () => {},
  });

  useSignInNewAntigravityAccount.setState({
    processing: false,
    run: async () => {},
  });
};

const meta = {
  title: 'App/App',
  component: App,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light-gray',
      values: [
        { name: 'light-gray', value: '#f8fafc' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    seedMocks(mockAccounts, mockAdditionDataMap);
    return <App />;
  },
};

export const EmptyState: Story = {
  render: () => {
    seedMocks([], {});
    return <App />;
  },
};
