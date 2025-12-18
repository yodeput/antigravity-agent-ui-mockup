import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { AccountSessionList } from '@/components/business/AccountSessionList.tsx';
import { useAppSettings } from '@/modules/use-app-settings.ts';
import {
  gridSessionItems,
  longEmailSessionItems,
  mockSessionItems,
} from '@/stories/mocks/accountSessions.ts';

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
    currentUserEmail: {
      description: '当前登录用户的 Email',
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

// --- Stories ---

/**
 * 默认状态：展示列表数据。
 * 注意：邮箱和昵称应该会被组件内的 mask 工具自动脱敏。
 */
export const Default: Story = {
  render: (args) => {
    useAppSettings.setState({ privateMode: true });
    return <AccountSessionList {...args} />;
  },
  args: {
    accounts: mockSessionItems,
  },
};

/**
 * 高亮当前用户：
 * currentUserEmail 命中某个账号时，该卡片应显示“当前”徽标并禁用操作。
 */
export const WithCurrentUser: Story = {
  render: (args) => {
    useAppSettings.setState({ privateMode: true });
    return <AccountSessionList {...args} />;
  },
  args: {
    accounts: mockSessionItems,
    currentUserEmail: mockSessionItems[0].email,
  },
};

/**
 * 空状态：
 * 当 accounts 为空数组时，应该显示 SVG 图标和提示文案。
 */
export const EmptyState: Story = {
  render: (args) => {
    useAppSettings.setState({ privateMode: true });
    return <AccountSessionList {...args} />;
  },
  args: {
    accounts: [],
  },
};

/**
 * 大数据量布局测试：
 * 用于测试 flex-wrap 是否正常工作，以及卡片间距是否合适。
 */
export const GridWrapLayout: Story = {
  render: (args) => {
    useAppSettings.setState({ privateMode: true });
    return <AccountSessionList {...args} />;
  },
  args: {
    accounts: gridSessionItems,
    currentUserEmail: gridSessionItems[0].email,
  },
};

/**
 * 过长邮箱/昵称：
 * 用于复现 header 文本溢出问题（privateMode=false 显示全量文本）。
 */
export const LongEmailOverflow: Story = {
  render: (args) => {
    useAppSettings.setState({ privateMode: false });
    return <AccountSessionList {...args} />;
  },
  args: {
    accounts: longEmailSessionItems,
    currentUserEmail: longEmailSessionItems[0].email,
  },
};
