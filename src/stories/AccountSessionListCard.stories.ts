import type { Meta, StoryObj } from '@storybook/react';
import {AccountSessionListCard} from "@/components/business/AccountSessionListCard.tsx";
import {fn} from "storybook/test";

// 定义元数据
const meta = {
  title: 'Components/AccountSessionListCard',
  component: AccountSessionListCard,
  parameters: {
    // 让组件在画板居中显示
    layout: 'centered',
    // 背景色微调，方便看清卡片的阴影
    backgrounds: {
      default: 'light-gray',
      values: [
        { name: 'light-gray', value: '#f8fafc' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  tags: ['autodocs'],
  // 配置控件类型
  argTypes: {
    geminiQuota: {
      control: { type: 'range', min: -1, max: 1, step: 0.01 },
      description: 'Gemini 使用配额 (0-1, 或 -1 代表未知)',
    },
    claudeQuota: {
      control: { type: 'range', min: -1, max: 1, step: 0.01 },
      description: 'Claude 使用配额 (0-1, 或 -1 代表未知)',
    },
    userAvatar: {
      control: 'text',
      description: '用户头像 URL',
    },
    isCurrentUser: {
      control: 'boolean',
      description: '是否为当前登录用户',
    },
  },
  // 模拟回调函数
  args: {
    onSelect: fn(),
    onSwitch: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof AccountSessionListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// 示例 1: 默认状态（其他用户）
export const Default: Story = {
  args: {
    nickName: 'Alex Johnson',
    email: 'alex.j@example.com',
    userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
    geminiQuota: 0.45,
    claudeQuota: 0.72,
    isCurrentUser: false,
  },
};

// 示例 2: 当前用户
// 此时应该显示 "当前" 徽标，且操作按钮被禁用
export const CurrentUser: Story = {
  args: {
    nickName: 'Master Admin',
    email: 'admin@system.com',
    userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix',
    geminiQuota: 0.12,
    claudeQuota: 0.30,
    isCurrentUser: true,
  },
};

// 示例 3: 配额未知状态 (-1)
// 进度条应该显示灰色或未知样式
export const UnknownUsage: Story = {
  args: {
    nickName: 'Guest User',
    email: 'guest@temp.com',
    userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Guest',
    geminiQuota: -1,
    claudeQuota: -1,
    isCurrentUser: false,
  },
};

// 示例 4: 额度即将耗尽
export const HighUsage: Story = {
  args: {
    nickName: 'Power User',
    email: 'heavy.usage@work.com',
    userAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Power',
    geminiQuota: 0.98,
    claudeQuota: 1.0,
    isCurrentUser: false,
  },
};
