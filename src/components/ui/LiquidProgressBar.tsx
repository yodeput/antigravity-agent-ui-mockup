import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Clock, Sparkles, Zap, Bot, Image as ImageIcon, HelpCircle } from 'lucide-react';
import { Tooltip } from 'antd';

export type LiquidProgressBarType = 'gemini-pro' | 'gemini-flash' | 'claude' | 'gemini-image';

export interface LiquidProgressBarProps {
    type: LiquidProgressBarType;
    /**
     * 0-1. If 1, timer is hidden. -1 for unknown.
     */
    percentage: number;
    /**
     * ISO Date string (e.g. "2025-12-18T20:19:38Z")
     */
    resetIn?: string;
    className?: string;
}

// Configuration for each type
const typeConfig: Record<LiquidProgressBarType, {
    label: string;
    icon: React.ElementType;
    colorFrom: string;
    colorTo: string;
    iconColor: string;
}> = {
    'gemini-pro': {
        label: 'Gemini Pro',
        icon: Sparkles,
        colorFrom: '#3b82f6', // blue-500
        colorTo: '#2563eb',   // blue-600
        iconColor: 'text-blue-600'
    },
    'gemini-flash': {
        label: 'Gemini Flash',
        icon: Zap,
        colorFrom: '#0ea5e9', // sky-500
        colorTo: '#0284c7',   // sky-600
        iconColor: 'text-sky-600'
    },
    'claude': {
        label: 'Claude',
        icon: Bot,
        colorFrom: '#8b5cf6', // violet-500
        colorTo: '#d946ef',   // fuchsia-500
        iconColor: 'text-violet-600'
    },
    'gemini-image': {
        label: 'Gemini Image',
        icon: ImageIcon,
        colorFrom: '#10b981', // emerald-500
        colorTo: '#059669',   // emerald-600
        iconColor: 'text-emerald-600'
    }
};

/**
 * Helper to calculate relative time string (e.g., "2d 5h", "3h 20m", "15m") from ISO string
 */
function getRelativeTime(isoString?: string): string | null {
    if (!isoString) return null;

    try {
        const target = new Date(isoString);
        const now = new Date();
        const diffMs = target.getTime() - now.getTime();

        if (diffMs <= 0) return null; // Already passed

        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            const h = diffHours % 24;
            return `${diffDays}d ${h}h`;
        }
        if (diffHours > 0) {
            const m = diffMins % 60;
            return `${diffHours}h ${m}m`;
        }
        return `${diffMins}m`;

    } catch (e) {
        console.error("Invalid date string provided to LiquidProgressBar", isoString);
        return null;
    }
}

export function LiquidProgressBar({
    type,
    percentage,
    resetIn,
    className
}: LiquidProgressBarProps) {
    const { label, icon: Icon, colorFrom, colorTo, iconColor } = typeConfig[type];

    const isUnknown = percentage === -1;
    const safePercentage = isUnknown ? 0 : Math.min(100, Math.max(0, Math.round(percentage * 100)));

    // Logic: "If percentage is 1 then do not show resetIn"
    const showTimer = resetIn && percentage !== 1 && !isUnknown;

    const relativeTime = useMemo(() => getRelativeTime(resetIn), [resetIn]);

    // If calculation failed or time passed, hide timer
    const finalShowTimer = showTimer && relativeTime;

    return (
        <div className={cn(
            "flex w-full h-[32px] rounded-full border border-slate-200 bg-white overflow-hidden shadow-sm select-none items-stretch",
            className
        )}>

            {/* 1. Left Section: Icon & Name */}
            <div className="flex items-center gap-2 pl-2 pr-3 bg-slate-50 border-r border-slate-100 shrink-0 min-w-[124px]">
                <Icon size={14} className={cn(iconColor, "shrink-0")} />
                <span className="text-xs font-bold text-slate-700 truncate">{label}</span>
            </div>

            {/* 2. Right Section: Progress Track */}
            {/* ADDED Padding (p-1) to act as the "gap" constraint for the inner bar */}
            <div className="flex-1 relative bg-slate-50/50 flex items-center overflow-hidden p-1">

                {/* Unknown State Background */}
                {isUnknown && (
                    <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
                    </div>
                )}

                {/* Progress Fill (Only when known) */}
                {/* Changed from absolute to static block with h-full to fit inside padding */}
                {!isUnknown && (
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${safePercentage}%` }}
                        transition={{ type: "spring", stiffness: 45, damping: 15 }}
                    />
                )}

                {/* Right Content */}
                <div className="absolute right-2 top-0 bottom-0 flex items-center z-10">

                    {/* "Unknown" Badge */}
                    {isUnknown && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/50 text-slate-500 border border-slate-200/50">
                            <HelpCircle size={10} />
                            <span className="text-[10px] font-medium">Unknown</span>
                        </div>
                    )}

                    {/* Timer Badge */}
                    {!isUnknown && finalShowTimer && (
                        <Tooltip title={`重置时间: ${resetIn}`} placement="top">
                            <div className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none cursor-help transition-colors",
                                // Visual contrast check
                                safePercentage > 90
                                    ? "text-white drop-shadow-md bg-white/10 backdrop-blur-[2px]"
                                    : "bg-white/80 text-slate-500 shadow-sm border border-slate-100/50 hover:bg-white"
                            )}>
                                <Clock size={9} className="stroke-[2.5]" />
                                <span>{relativeTime}</span>
                            </div>
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    );
}
