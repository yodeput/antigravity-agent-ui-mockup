import type { Meta, StoryObj } from '@storybook/react';
import { LiquidProgressBar } from "@/components/ui/liquid-progress-bar.tsx";

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

// --- Gemini Pro (Safe / High) ---
export const GeminiPro: Story = {
    args: {
        type: 'gemini-pro',
        percentage: 0.96,
        resetIn: getFutureDate(2),
        className: 'w-[350px]',
    },
};

// --- Gemini Flash (Warning / Medium) ---
export const GeminiFlashWarning: Story = {
    args: {
        type: 'gemini-flash',
        percentage: 0.35, // Below 0.45 threshold -> Warning Color
        resetIn: getFutureDate(26),
        className: 'w-[350px]',
    },
};

// --- Claude (Critical / Low) ---
export const ClaudeCritical: Story = {
    args: {
        type: 'claude',
        percentage: 0.12, // Below 0.2 threshold -> Critical Color + Pulse
        resetIn: getFutureDate(0.5),
        className: 'w-[350px]',
    },
};

export const GeminiImage: Story = {
    args: {
        type: 'gemini-image',
        percentage: 0.78,
        resetIn: getFutureDate(5),
        className: 'w-[350px]',
    },
};

export const FullUsageNoTimer: Story = {
    args: {
        type: 'gemini-pro',
        percentage: 1,
        resetIn: getFutureDate(2),
        className: 'w-[350px]',
    },
};

export const UnknownState: Story = {
    args: {
        type: 'gemini-pro',
        percentage: -1,
        resetIn: getFutureDate(0),
        className: 'w-[350px]',
    },
};
