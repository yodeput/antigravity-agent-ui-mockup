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
    // Use padded layout so the list isn't flush to the edges and looks closer to real pages
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
      description: 'List of user accounts',
      control: 'object',
    },
    currentUserEmail: {
      description: 'Email of the currently signed-in user',
      control: 'text',
    },
  },
  args: {
    // Mock event callbacks
    onSelect: fn(),
    onSwitch: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof AccountSessionList>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Stories ---

/**
 * Default state: displays list data.
 * Note: emails and display names should be masked by the component's masking utility.
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
 * Highlight current user:
 * When `currentUserEmail` matches an account, that card should show a "Current" badge and disable actions.
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
 * Empty state:
 * When `accounts` is an empty array, show an SVG illustration and a helper message.
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
 * Large dataset layout test:
 * Used to verify that `flex-wrap` works and that card spacing is appropriate.
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
 * Long email/display name:
 * Used to reproduce header text overflow issues (when `privateMode=false` full text is shown).
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
