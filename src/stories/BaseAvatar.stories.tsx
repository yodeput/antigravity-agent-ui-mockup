import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '@/components/ui/avatar.tsx';

const meta = {
  title: 'Base UI/Avatar',
  component: Avatar,
  parameters: {
      description: 'Avatar size (px)',
    backgrounds: {
      default: 'dark',
      values: [
      description: 'Avatar image URL; when empty shows gradient placeholder + initial',
        { name: 'light', value: '#f8fafc' },
      ],
    },
      description: 'Alt text for the img element; does not affect fallback icon',
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'range', min: 32, max: 96, step: 4 },
      description: '头像尺寸 (px)',
    },
    src: {
      control: 'text',
      description: '头像图片地址；为空时显示渐变占位 + 首字母',
    },
    alt: {
      control: 'text',
      description: '仅用于 img 的 alt 文本；不影响 fallback 图标',
    },
  },
  args: {
    size: 48,
    alt: 'No Source', // Will display built-in gradient avatar icon
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aceternity',
    alt: 'Aceternity User',
  },
};

export const Fallback: Story = {
  args: {
    src: '',
    alt: 'No Source', // 会显示内置的渐变头像图标
  },
};

export const CustomSize: Story = {
  args: {
    src: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Neon',
    alt: 'Neon',
    size: 72,
  },
};

export const CustomText: Story = {
  args: {
    src: '',
    size: 56,
  },
};
