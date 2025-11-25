import React from 'react';
import { cn } from '@/utils/utils';

interface GlassProgressBarProps {
    /**
     * Current progress value between 0 and 1
     */
    value: number;
    /**
     * Optional height of the progress bar (default: h-2)
     */
    height?: string;
    /**
     * Optional custom class names
     */
    className?: string;
    /**
     * Optional color gradient for the fill
     * Default: from-blue-400 to-cyan-300
     */
    gradientFrom?: string;
    gradientTo?: string;
    /**
     * Optional text to display in the center of the progress bar
     */
    label?: React.ReactNode;
    /**
     * Optional class names for the label
     */
    labelClassName?: string;
}

export const GlassProgressBar: React.FC<GlassProgressBarProps> = ({
    value,
    className,
    gradientFrom = 'from-blue-500',
    gradientTo = 'to-cyan-400',
    label,
    labelClassName,
}) => {
    // Ensure value is between 0 and 1
    const clampedValue = Math.min(Math.max(value, 0), 1);
    const percentage = Math.round(clampedValue * 100);

    return (
        <div
            className={cn(
                "relative w-[240px] overflow-hidden rounded-full",
                "bg-gray-100/80 dark:bg-gray-800/80", // Track background - slightly more opaque for text readability
                "border border-white/20 dark:border-white/10", // Subtle border
                "backdrop-blur-md", // Stronger blur
                className
            )}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            {/* The Progress Fill */}
            <div
                className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    "bg-gradient-to-r shadow-[0_0_15px_rgba(56,189,248,0.4)]", // Enhanced glow
                    gradientFrom,
                    gradientTo
                )}
                style={{ width: `${percentage}%` }}
            >
                {/* Shine effect */}
                <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-white/40 to-transparent rounded-t-full" />
            </div>

            {/* Label Layer 1: Dark Text (Visible on empty track) */}
            {label && (
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center z-10",
                    "text-[10px] font-semibold text-gray-600 dark:text-gray-300 leading-none",
                    labelClassName
                )}>
                    {label}
                </div>
            )}

            {/* Label Layer 2: White Text (Visible on filled track) - Clipped */}
            {label && (
                <div
                    className={cn(
                        "absolute inset-0 flex items-center justify-center z-20",
                        "text-[10px] font-semibold text-white drop-shadow-sm leading-none",
                        labelClassName
                    )}
                    style={{
                        clipPath: `inset(0 ${100 - percentage}% 0 0)`,
                        transition: 'clip-path 0.5s ease-out' // Match the width transition
                    }}
                >
                    {label}
                </div>
            )}
        </div>
    );
};
