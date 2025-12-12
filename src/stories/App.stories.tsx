import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import App from '@/App.tsx';
import { useAntigravityAccount } from '@/modules/use-antigravity-account.ts';
import {
  useAccountAdditionData,
  type AccountAdditionData,
  type UserTier,
} from '@/modules/use-account-addition-data.ts';
import { useDbMonitoringStore } from '@/modules/db-monitoring-store';
import { useAntigravityIsRunning } from '@/hooks/use-antigravity-is-running.ts';
import { useImportExportAccount } from '@/modules/use-import-export-accounts.ts';
import { useSignInNewAntigravityAccount } from '@/hooks/use-sign-in-new-antigravity-account.ts';
import type { AntigravityAccount } from '@/commands/types/account.types.ts';
import { PlatformCommands } from '@/commands/PlatformCommands.ts';
import { TrayCommands } from '@/commands/TrayCommands.ts';

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

const makeAccount = (opts: {
  email: string;
  planName: string;
  tier: UserTier;
  accessToken: string;
  idToken: string;
}): AntigravityAccount =>
  ({
    auth: {
      access_token: opts.accessToken,
      id_token: opts.idToken,
      meta: { expiry_timestamp: Date.now() + 60 * 60 * 1000 },
      type: 'oauth',
    },
    context: {
      email: opts.email,
      models: {
        items: [],
        recommended: { names: [], unknown_f2_base64: '' },
        unknown_f3_base64: '',
      } as any,
      plan: {
        description: '',
        name: opts.tier,
        slug: opts.tier,
        upgrade_msg: '',
        upgrade_url: '',
      } as any,
      plan_name: opts.planName,
      status: 1,
    },
  } as unknown as AntigravityAccount);

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
    fetchData: async () => {},
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

const mockAccounts: AntigravityAccount[] = [
  makeAccount({
    email: 'admin.ops@company.com',
    planName: 'Admin User',
    tier: 'g1-pro-tier',
    accessToken: 'sk_mock_admin',
    idToken: 'id_mock_admin',
  }),
  makeAccount({
    email: 'jason.bourne@cia.gov',
    planName: 'Jason Bourne',
    tier: 'free-tier',
    accessToken: 'sk_mock_jason',
    idToken: 'id_mock_jason',
  }),
  makeAccount({
    email: 'guest.temp@provider.net',
    planName: 'Unknown Guest',
    tier: 'g1-ultra-tier',
    accessToken: 'sk_mock_guest',
    idToken: 'id_mock_guest',
  }),
];

const mockAdditionData: Record<string, AccountAdditionData> = {
  'admin.ops@company.com': {
    geminiQuote: 0.85,
    claudeQuote: 0.92,
    userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin',
    userId: 'mock_admin',
  },
  'jason.bourne@cia.gov': {
    geminiQuote: 0.15,
    claudeQuote: 0.4,
    userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jason',
    userId: 'mock_jason',
  },
  'guest.temp@provider.net': {
    geminiQuote: -1,
    claudeQuote: 0.05,
    userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Guest',
    userId: 'mock_guest',
  },
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
    seedMocks(mockAccounts, mockAdditionData);
    return <App />;
  },
};

export const EmptyState: Story = {
  render: () => {
    seedMocks([], {});
    return <App />;
  },
};

