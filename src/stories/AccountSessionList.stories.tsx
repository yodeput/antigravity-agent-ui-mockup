import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import {AccountSessionList, AccountSessionListAccountItem} from "@/components/business/AccountSessionList.tsx";

const meta = {
  title: 'Business/AccountSessionList',
  component: AccountSessionList,
  parameters: {
    // 使用 padded 布局，这样列表不会紧贴边缘，更接近真实页面效果
    layout: 'padded',
    backgrounds: {
      default: 'light-gray',
      values: [
        { name: 'light-gray', value: '#f8fafc' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    accounts: {
      description: '用户账户列表',
      control: 'object',
    },
    currentUserId: {
      description: '当前登录用户的 ID',
      control: 'text',
    },
  },
  args: {
    // 模拟事件回调
    onSelect: fn(),
    onSwitch: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof AccountSessionList>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Mock Data 生成器 ---
// 这里传入的是"未脱敏"的数据，组件内部会处理脱敏
const mockAccounts: AccountSessionListAccountItem[] = [
  {
    id: 'user_01',
    nickName: 'Admin User',
    email: 'admin.ops@company.com',
    userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin',
    geminiQuota: 0.85,
    claudeQuota: 0.92,
  },
  {
    id: 'user_02',
    nickName: 'Jason Bourne',
    email: 'jason.bourne@cia.gov',
    userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jason',
    geminiQuota: 0.15, // 低配额
    claudeQuota: 0.40,
  },
  {
    id: 'user_03',
    nickName: 'Unknown Guest',
    email: 'guest.temp@provider.net',
    userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Guest',
    geminiQuota: -1,   // 未知配额
    claudeQuota: 0.05, // 极低配额
  },
];

// --- Stories ---

/**
 * 默认状态：展示列表数据。
 * 注意：邮箱和昵称应该会被组件内的 mask 工具自动脱敏。
 */
export const Default: Story = {
  args: {
    accounts: mockAccounts,
    currentUserId: 'user_01', // 模拟第一个用户是当前登录状态
  },
};

/**
 * 空状态：
 * 当 accounts 为空数组时，应该显示 SVG 图标和提示文案。
 */
export const EmptyState: Story = {
  args: {
    accounts: [],
    currentUserId: '',
  },
};

/**
 * 大数据量布局测试：
 * 用于测试 flex-wrap 是否正常工作，以及卡片间距是否合适。
 */
export const GridWrapLayout: Story = {
  args: {
    // 复制 3 份数据生成 9 个卡片
    accounts: [...mockAccounts, ...mockAccounts, ...mockAccounts].map((acc, i) => ({
      ...acc,
      id: `user_gen_${i}`, // 确保 key 唯一
    })),
    currentUserId: 'user_gen_0',
  },
};
