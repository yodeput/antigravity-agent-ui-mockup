import type { AntigravityAccount } from '@/commands/types/account.types.ts';
import type { AccountSessionListAccountItem } from '@/components/business/AccountSessionList.tsx';
import type {
  AccountAdditionData,
  UserTier,
} from '@/modules/use-account-addition-data.ts';

type BaseMockAccount = {
  email: string;
  planName: string;
  tier: UserTier;
  nickName?: string;
  userAvatar?: string;
  accessToken?: string;
  idToken?: string;
  quotas?: Partial<AccountAdditionData>;
};

export const tierOptions: UserTier[] = ['free-tier', 'g1-pro-tier', 'g1-ultra-tier'];

const defaultQuotas: AccountAdditionData = {
  geminiProQuote: 0.7,
  geminiProQuoteRestIn: '2025-12-21T10:50:06Z',
  geminiFlashQuote: 0.5,
  geminiFlashQuoteRestIn: '2025-12-21T10:50:06Z',
  geminiImageQuote: 0.45,
  geminiImageQuoteRestIn: '2025-12-21T10:50:06Z',
  claudeQuote: 0.65,
  claudeQuoteRestIn: '2025-12-21T10:50:06Z',
  userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Default',
  userId: 'mock_default',
};

const baseMockAccounts: BaseMockAccount[] = [
  {
    email: 'admin.ops@company.com',
    planName: 'Admin User',
    nickName: 'Admin User',
    tier: 'g1-pro-tier',
    quotas: {
      geminiProQuote: 0.85,
      geminiFlashQuote: 0.66,
      geminiImageQuote: 0.42,
      claudeQuote: 0.92,
      userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin',
      userId: 'mock_admin',
    },
  },
  {
    email: 'jason.bourne@cia.gov',
    planName: 'Jason Bourne',
    nickName: 'Jason Bourne',
    tier: 'free-tier',
    quotas: {
      geminiProQuote: 0.15,
      geminiFlashQuote: 0.22,
      geminiImageQuote: 0.18,
      claudeQuote: 0.4,
      userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jason',
      userId: 'mock_jason',
    },
  },
  {
    email: 'guest.temp@provider.net',
    planName: 'Unknown Guest',
    nickName: 'Unknown Guest',
    tier: 'g1-ultra-tier',
    quotas: {
      geminiProQuote: -1,
      geminiFlashQuote: -1,
      geminiImageQuote: -1,
      claudeQuote: -1,
      geminiProQuoteRestIn: '',
      geminiFlashQuoteRestIn: '',
      geminiImageQuoteRestIn: '',
      claudeQuoteRestIn: '',
      userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Guest',
      userId: 'mock_guest',
    },
  },
  {
    email: 'sarah.connor@skynet.ai',
    planName: 'Sarah Connor',
    nickName: 'Sarah Connor',
    tier: 'g1-pro-tier',
    quotas: {
      geminiProQuote: 0.62,
      geminiFlashQuote: 0.6,
      geminiImageQuote: 0.5,
      claudeQuote: 0.7,
      userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah',
      userId: 'mock_sarah',
    },
  },
  {
    email: 'bruce.wayne@wayneenterprises.com',
    planName: 'Bruce Wayne',
    nickName: 'Bruce Wayne',
    tier: 'g1-ultra-tier',
    quotas: {
      geminiProQuote: 0.95,
      geminiFlashQuote: 0.9,
      geminiImageQuote: 0.75,
      claudeQuote: 0.88,
      userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bruce',
      userId: 'mock_bruce',
    },
  },
  {
    email: 'ellen.ripley@weyland.com',
    planName: 'Ellen Ripley',
    nickName: 'Ellen Ripley',
    tier: 'free-tier',
    quotas: {
      geminiProQuote: 0.3,
      geminiFlashQuote: 0.28,
      geminiImageQuote: 0.2,
      claudeQuote: 0.2,
      userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ripley',
      userId: 'mock_ripley',
    },
  },
  {
    email: 'neo.anderson@matrix.io',
    planName: 'Neo Anderson',
    nickName: 'Neo Anderson',
    tier: 'g1-pro-tier',
    quotas: {
      geminiProQuote: 0.55,
      geminiFlashQuote: 0.5,
      geminiImageQuote: 0.48,
      claudeQuote: 0.6,
      userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Neo',
      userId: 'mock_neo',
    },
  },
  {
    email: 'trinity@matrix.io',
    planName: 'Trinity',
    nickName: 'Trinity',
    tier: 'free-tier',
    quotas: {
      geminiProQuote: 0.25,
      geminiFlashQuote: 0.2,
      geminiImageQuote: 0.12,
      claudeQuote: 0.45,
      userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Trinity',
      userId: 'mock_trinity',
    },
  },
  {
    email: 'deckard@blade.runner',
    planName: 'Rick Deckard',
    nickName: 'Rick Deckard',
    tier: 'g1-ultra-tier',
    quotas: {
      geminiProQuote: 0.1,
      geminiFlashQuote: 0.08,
      geminiImageQuote: 0.05,
      claudeQuote: 0.12,
      userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Deckard',
      userId: 'mock_deckard',
    },
  },
];

function makeAccount(base: BaseMockAccount): AntigravityAccount {
  const [local] = base.email.split('@');
  return {
    auth: {
      access_token: base.accessToken ?? `sk_mock_${local}`,
      id_token: base.idToken ?? `id_mock_${local}`,
      meta: { expiry_timestamp: Date.now() + 60 * 60 * 1000 },
      type: 'oauth',
    },
    context: {
      email: base.email,
      models: {
        items: [],
        recommended: { names: [], unknown_f2_base64: '' },
        unknown_f3_base64: '',
      } as any,
      plan: {
        description: '',
        name: base.tier,
        slug: base.tier,
        upgrade_msg: '',
        upgrade_url: '',
      } as any,
      plan_name: base.planName,
      status: 1,
    },
    f11_base64: '',
    f18_base64: '',
    f7_base64: '',
    f9_base64: '',
    flags_f5_base64: '',
    history: [],
    user_id_raw_base64: '',
  };
}

function makeAdditionData(base: BaseMockAccount): AccountAdditionData {
  return {
    ...defaultQuotas,
    ...base.quotas,
  };
}

function makeSessionItem(
  base: BaseMockAccount,
  addition: AccountAdditionData
): AccountSessionListAccountItem {
  const [local] = base.email.split('@');
  return {
    nickName: base.nickName ?? local,
    email: base.email,
    userAvatar: addition.userAvatar ?? defaultQuotas.userAvatar,
    geminiProQuote: addition.geminiProQuote,
    geminiProQuoteRestIn: addition.geminiProQuoteRestIn,
    geminiFlashQuote: addition.geminiFlashQuote,
    geminiFlashQuoteRestIn: addition.geminiFlashQuoteRestIn,
    geminiImageQuote: addition.geminiImageQuote,
    geminiImageQuoteRestIn: addition.geminiImageQuoteRestIn,
    claudeQuote: addition.claudeQuote,
    claudeQuoteRestIn: addition.claudeQuoteRestIn,
    tier: base.tier,
    apiKey: `sk_${local}`,
  };
}

function buildGridItems(
  items: AccountSessionListAccountItem[],
  total = 9
): AccountSessionListAccountItem[] {
  return Array.from({ length: total }).map((_, i) => {
    const base = items[i % items.length];
    const [name, domain] = base.email.split('@');
    return {
      ...base,
      email: `${name}+${i}@${domain}`,
      nickName: `${base.nickName} #${i + 1}`,
      apiKey: `${base.apiKey}_${i}`,
    };
  });
}

const longEmailItem: AccountSessionListAccountItem = {
  nickName:
    'ThisIsAnExcessivelyLongNickName_ToTest_TextOverflow_AndLayoutStability_InUserCardHeader',
  email:
    'this.is.a.super.long.email.address.with.many.sections.and.tags+storybook-overflow-test@subdomain1.subdomain2.subdomain3.subdomain4.some-very-long-company-domain.example.corp.company.com',
  userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=LongEmail',
  geminiProQuote: 0.66,
  geminiProQuoteRestIn: '2025-12-22T09:00:00Z',
  geminiFlashQuote: 0.52,
  geminiFlashQuoteRestIn: '2025-12-22T09:00:00Z',
  geminiImageQuote: 0.48,
  geminiImageQuoteRestIn: '2025-12-22T09:00:00Z',
  claudeQuote: 0.77,
  claudeQuoteRestIn: '2025-12-22T09:00:00Z',
  tier: 'g1-pro-tier',
  apiKey: 'sk_mock_long_email',
};

export const mockAccounts = baseMockAccounts.map(makeAccount);

export const mockAdditionDataMap: Record<string, AccountAdditionData> =
  Object.fromEntries(
    baseMockAccounts.map((base) => [base.email, makeAdditionData(base)])
  );

export const mockSessionItems: AccountSessionListAccountItem[] =
  baseMockAccounts.map((base) =>
    makeSessionItem(base, makeAdditionData(base))
  );

export const gridSessionItems = buildGridItems(mockSessionItems);

export const longEmailSessionItems: AccountSessionListAccountItem[] = [
  longEmailItem,
  ...mockSessionItems,
];
