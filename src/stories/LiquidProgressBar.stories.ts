import type { Meta, StoryObj } from '@storybook/react';
import { LiquidProgressBar } from "@/components/ui/LiquidProgressBar";

const meta = {
    title: 'UI/LiquidProgressBar',
    component: LiquidProgressBar,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['gemini-pro', 'gemini-flash', 'claude', 'gemini-image'],
            description: 'The model type'
        },
        percentage: {
            control: { type: 'range', min: -1, max: 1, step: 0.01 },
        },
        resetIn: {
            control: 'text',
            description: 'ISO Date String (e.g. 2025-12-25T12:00:00Z)'
        },
    },
} satisfies Meta<typeof LiquidProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to get a future date ISO string
const getFutureDate = (addHours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + addHours);
    return d.toISOString();
};

// --- Gemini Pro ---
export const GeminiPro: Story = {
    args: {
        type: 'gemini-pro',
        percentage: 0.96,
        resetIn: getFutureDate(2), // 2 hours from now
        className: 'w-[350px]',
    },
};

// --- Gemini Flash ---
export const GeminiFlash: Story = {
    args: {
        type: 'gemini-flash',
        percentage: 0.45,
        resetIn: getFutureDate(26), // 1 day 2 hours from now
        className: 'w-[350px]',
    },
};

// --- Claude ---
export const Claude: Story = {
    args: {
        type: 'claude',
        percentage: 0.12,
        resetIn: getFutureDate(0.5), // 30 mins from now
        className: 'w-[350px]',
    },
};

// --- Gemini Image ---
export const GeminiImage: Story = {
    args: {
        type: 'gemini-image',
        percentage: 0.78,
        resetIn: getFutureDate(5),
        className: 'w-[350px]',
    },
};

// --- Full Usage (Hidden Timer) ---
export const FullUsageNoTimer: Story = {
    args: {
        type: 'gemini-pro',
        percentage: 1,
        resetIn: getFutureDate(2), // Should be hidden because percentage is 1
        className: 'w-[350px]',
    },
};

// --- Unknown ---
export const UnknownState: Story = {
    args: {
        type: 'gemini-pro',
        percentage: -1,
        resetIn: getFutureDate(0),
        className: 'w-[350px]',
    },
};
