import type { Meta, StoryObj } from '@storybook/react';
import { AccountSessionListCard } from '@/components/business/AccountSessionListCard.tsx';
import { fn } from 'storybook/test';
import {
  mockSessionItems,
  tierOptions,
} from '@/stories/mocks/accountSessions.ts';

// Define metadata
const meta = {
  title: 'Components/AccountSessionListCard',
  component: AccountSessionListCard,
  parameters: {
    // Center the component on the canvas
    layout: 'centered',
    // Background tweak to make card shadow easier to see
    backgrounds: {
      default: 'light-gray',
      values: [
        { name: 'light-gray', value: '#f8fafc' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  tags: ['autodocs'],
  // Configure control types
  argTypes: {
    geminiProQuote: {
      control: { type: 'range', min: -1, max: 1, step: 0.01 },
      description: 'Gemini Pro usage quota (0-1, or -1 for unknown)',
    },
    geminiProQuoteRestIn: {
      control: 'text',
      description: 'Gemini Pro reset time',
    },
    geminiFlashQuote: {
      control: { type: 'range', min: -1, max: 1, step: 0.01 },
      description: 'Gemini Flash usage quota (0-1, or -1 for unknown)',
    },
    geminiFlashQuoteRestIn: {
      control: 'text',
      description: 'Gemini Flash reset time',
    },
    geminiImageQuote: {
      control: { type: 'range', min: -1, max: 1, step: 0.01 },
      description: 'Gemini Image usage quota (0-1, or -1 for unknown)',
    },
    geminiImageQuoteRestIn: {
      control: 'text',
      description: 'Gemini Image reset time',
    },
    claudeQuote: {
      control: { type: 'range', min: -1, max: 1, step: 0.01 },
      description: 'Claude usage quota (0-1, or -1 for unknown)',
    },
    claudeQuoteRestIn: {
      control: 'text',
      description: 'Claude reset time',
    },
    tier: {
      control: { type: 'select' },
      options: tierOptions,
      description: 'Account tier',
    },
    userAvatar: {
      control: 'text',
      description: 'User avatar URL',
    },
    isCurrentUser: {
      control: 'boolean',
      description: 'Whether this is the currently signed-in user',
    },
  },
  // Mock callbacks
  args: {
    onSelect: fn(),
    onSwitch: fn(),
    onDelete: fn(),
    tier: 'free-tier',
  },
} satisfies Meta<typeof AccountSessionListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Example 1: Default state (other user)
export const Default: Story = {
  args: {
    ...mockSessionItems[0],
    isCurrentUser: false,
  },
};

// Example 2: Current user
// The card should show a "Current" badge and disable action buttons
export const CurrentUser: Story = {
  args: {
    ...mockSessionItems[0],
    isCurrentUser: true,
  },
};

// Example 3: Unknown quota state (-1)
// The progress bar should show a gray or unknown style
export const UnknownUsage: Story = {
  args: {
    ...mockSessionItems[2],
    isCurrentUser: false,
  },
};

// Example 4: High usage (quota nearly exhausted)
export const HighUsage: Story = {
  args: {
    ...mockSessionItems[1],
    geminiProQuote: 0.98,
    claudeQuote: 1.0,
    isCurrentUser: false,
  },
};
