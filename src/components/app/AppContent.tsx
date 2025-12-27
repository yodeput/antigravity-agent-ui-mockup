import React, {useEffect, useRef, useState} from "react";
import BusinessUserDetail from "@/components/business/AccountDetailModal.tsx";
import {useAntigravityAccount, useCurrentAntigravityAccount} from "@/modules/use-antigravity-account.ts";
import {useAccountAdditionData, UserTier} from "@/modules/use-account-addition-data.ts";
import {useTrayMenu} from "@/hooks/use-tray-menu.ts";
import {Modal} from 'antd';
import toast from 'react-hot-toast';
import {maskEmail} from "@/lib/string-masking.ts";
import {useAppGlobalLoader} from "@/modules/use-app-global-loader.ts";
import {AccountSessionList, AccountSessionListAccountItem} from "@/components/business/AccountSessionList.tsx";
import AccountsListToolbar, {type ListToolbarValue} from "@/components/business/AccountsListToolbar.tsx";
import {logger} from "@/lib/logger.ts";
import {useAppNavigation} from "@/modules/use-app-navigation.ts";
import GeneratorPage from "@/components/business/GeneratorPage.tsx";

const tierRank: Record<UserTier, number> = {
  'g1-ultra-tier': 0,
  'g1-pro-tier': 1,
  'free-tier': 2,
};

export function AppContent() {
  const { currentView } = useAppNavigation();
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AccountSessionListAccountItem | null>(null);
  const antigravityAccount = useAntigravityAccount();
  const accountAdditionData = useAccountAdditionData();
  const currentAntigravityAccount = useCurrentAntigravityAccount();
  const appGlobalLoader = useAppGlobalLoader();
  const [condition, setCondition] = useState<ListToolbarValue>({
    sortKey: 'tier',
    query: '',
    tiers: null,
  });

  // Initialize tray menu updates
  useTrayMenu();

  // Fetch user list on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        await antigravityAccount.getAccounts();
      } catch (error) {
        toast.error(`Failed to get user list: ${error}`);
      } finally {
      }
    };

    loadUsers();
  }, []);

  // Periodically fetch user additional data
  const fetchAccountAdditionDataTimer = useRef(null)

  useEffect(() => {
    if (fetchAccountAdditionDataTimer.current) {
      clearInterval(fetchAccountAdditionDataTimer.current)
    }

    const task = () => {
      antigravityAccount.accounts.forEach(async (user) => {
        try {
          await accountAdditionData.update(user)
        } catch (e) {
          logger.error('Failed to get user additional data', {
            module: 'AppContent',
            email: user.context.email,
            error: e instanceof Error ? e.message : String(e)
          })
        }
      })
    }

    fetchAccountAdditionDataTimer.current = setInterval(() => {
      task()
    }, 1000 * 30)

    task()

    return () => {
      clearInterval(fetchAccountAdditionDataTimer.current)
    }
  }, [antigravityAccount.accounts]);

  // User details handling
  const handleUserClick = (account: AccountSessionListAccountItem) => {
    setSelectedUser(account);
    setIsUserDetailOpen(true);
  };

  const handleUserDetailClose = () => {
    setIsUserDetailOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteBackup = (user: AccountSessionListAccountItem) => {
    Modal.confirm({
      centered: true,
      title: 'Confirm Account Deletion',
      content: <p className={"wrap-break-word whitespace-pre-line"}>
        {`Are you sure you want to delete account "${user.email}"? This action cannot be undone.`}
      </p>,
      onOk() {
        return confirmDeleteAccount(user.email);
      },
      onCancel() {
      },
    });
  };

  const confirmDeleteAccount = async (email: string) => {
    await antigravityAccount.delete(email);
    toast.success(`Account "${email}" deleted successfully`);
  };

  const handleSwitchAccount = async (user: AccountSessionListAccountItem) => {
    try {
      appGlobalLoader.open({label: `Switching to user: ${maskEmail(user.email)}...`});
      await antigravityAccount.switchToAccount(user.email);
    } finally {
      appGlobalLoader.close();
    }
  };

  const handleClearAllBackups = () => {
    if (antigravityAccount.accounts.length === 0) {
      toast.error('No user backups to clear');
      return;
    }

    Modal.confirm({
      centered: true,
      title: 'Confirm Clear All Backups',
      content: <p className={"wrap-break-word whitespace-pre-line"}>
        {`This will permanently delete all ${antigravityAccount.accounts.length} accounts and cannot be undone. Are you sure you want to continue?`}
      </p>,
      onOk() {
        return confirmClearAllBackups();
      },
      onCancel() {
      },
    });
  };

  const confirmClearAllBackups = async () => {
    try {
      await antigravityAccount.clearAllAccounts();
      toast.success('All backups cleared successfully');
    } catch (error) {
      toast.error(`Failed to clear backups: ${error}`);
      throw error;
    }
  };

  const accounts: AccountSessionListAccountItem[] = antigravityAccount.accounts.map((account) => {
    const accountAdditionDatum = accountAdditionData.data[account.context.email]

    return {
      geminiProQuote: accountAdditionDatum?.geminiProQuote ?? -1,
      geminiProQuoteRestIn: accountAdditionDatum?.geminiProQuoteRestIn,
      geminiFlashQuote: accountAdditionDatum?.geminiFlashQuote ?? -1,
      geminiFlashQuoteRestIn: accountAdditionDatum?.geminiFlashQuoteRestIn,
      geminiImageQuote: accountAdditionDatum?.geminiImageQuote ?? -1,
      geminiImageQuoteRestIn: accountAdditionDatum?.geminiImageQuoteRestIn,
      claudeQuote: accountAdditionDatum?.claudeQuote ?? -1,
      claudeQuoteRestIn: accountAdditionDatum?.claudeQuoteRestIn,
      email: account.context.email,
      nickName: account.context.plan_name,
      userAvatar: accountAdditionDatum?.userAvatar ?? "",
      apiKey: account.auth.access_token,
      // In some cases plan might be null, adding null check here
      tier: (account.context.plan?.slug ?? '') as UserTier,
    }
  })

  const normalizedQuery = condition.query.trim().toLowerCase();
  const visibleAccounts = accounts
    .filter(account => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        account.email.toLowerCase().includes(normalizedQuery) ||
        account.nickName?.toLowerCase().includes(normalizedQuery);

      const matchesTier =
        condition.tiers == null ||
        condition.tiers.length === 0 ||
        condition.tiers.includes(account.tier);

      return matchesQuery && matchesTier;
    })
    .sort((a, b) => {
      const nameA = a.nickName || a.email;
      const nameB = b.nickName || b.email;
      const byName = nameA.localeCompare(nameB);

      switch (condition.sortKey) {
        case 'name':
          return byName;
        case 'claude': {
          const diff = (b.claudeQuote ?? -1) - (a.claudeQuote ?? -1);
          return diff !== 0 ? diff : byName;
        }
        case 'gemini-pro': {
          const diff = (b.geminiProQuote ?? -1) - (a.geminiProQuote ?? -1);
          return diff !== 0 ? diff : byName;
        }
        case 'gemini-flash': {
          const diff = (b.geminiFlashQuote ?? -1) - (a.geminiFlashQuote ?? -1);
          return diff !== 0 ? diff : byName;
        }
        case 'gemini-image': {
          const diff = (b.geminiImageQuote ?? -1) - (a.geminiImageQuote ?? -1);
          return diff !== 0 ? diff : byName;
        }
        case 'tier': {
          const diff = tierRank[a.tier] - tierRank[b.tier];
          return diff !== 0 ? diff : byName;
        }
        default:
          return byName;
      }
    });

  // Render Generators view
  if (currentView === 'generators') {
    return <GeneratorPage className="flex-1" />;
  }

  return (
    <>
      <section className="flex flex-col relative flex-1">
        <AccountsListToolbar
          tiers={condition.tiers}
          query={condition.query}
          sortKey={condition.sortKey}
          total={visibleAccounts.length}
          onChange={setCondition}
        />
        <AccountSessionList
          accounts={visibleAccounts}
          onSwitch={handleSwitchAccount}
          onDelete={handleDeleteBackup}
          onSelect={handleUserClick}
          currentUserEmail={currentAntigravityAccount?.context.email}
        />
      </section>

      <BusinessUserDetail
        isOpen={isUserDetailOpen}
        onOpenChange={handleUserDetailClose}
        account={selectedUser}
      />
    </>
  );
}
