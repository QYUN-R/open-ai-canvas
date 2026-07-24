import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

import { aceternityMotion } from "@/lib/aceternity-motion";
import { canvasThemes } from "@/lib/canvas-theme";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/use-theme-store";

export type CanvasCreateCommand = {
    id: string;
    label: string;
    icon: ReactNode;
    badge?: string;
    description?: string;
    disabled?: boolean;
    onClick: () => void;
};

export function CanvasCreateCommandGrid({ commands, variant = "node" }: { commands: CanvasCreateCommand[]; variant?: "node" | "resource" }) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const reducedMotion = useReducedMotion();
    return (
        <div className={cn("grid gap-1.5", variant === "node" ? "grid-cols-2" : "grid-cols-2")}>
            {commands.map((command) => (
                <motion.button
                    key={command.id}
                    type="button"
                    disabled={command.disabled}
                    whileHover={reducedMotion || command.disabled ? undefined : { y: -1, scale: 1.01 }}
                    whileTap={reducedMotion || command.disabled ? undefined : { scale: 0.98 }}
                    transition={aceternityMotion.spring.dock}
                    className={cn(
                        "group relative min-w-0 border border-black/10 bg-white/70 text-left outline-none transition-colors hover:border-black/20 hover:bg-black/5 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-42 dark:border-white/10 dark:bg-white/[.04] dark:hover:border-white/20 dark:hover:bg-white/8",
                        variant === "node" ? "flex h-14 items-center gap-2 rounded-[10px] px-2.5" : "flex h-10 items-center gap-2 rounded-[9px] px-2.5",
                    )}
                    style={{ color: theme.node.text, "--tw-ring-color": theme.node.muted } as CSSProperties}
                    title={command.description || command.label}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={command.onClick}
                >
                    <span className="grid size-7 shrink-0 place-items-center rounded-md opacity-75 transition-opacity group-hover:opacity-100 [&_svg]:size-3.5" style={{ background: theme.toolbar.itemHover }}>{command.icon}</span>
                    <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-[11px] font-semibold leading-none">{command.label}</span>
                            {command.badge ? <span className="shrink-0 rounded border px-1 py-0.5 text-[7px] font-bold leading-none" style={{ background: theme.toolbar.activeBg, borderColor: theme.toolbar.border, color: theme.node.muted }}>{command.badge}</span> : null}
                        </span>
                        {command.description ? <span className="mt-1 block truncate text-[9px] leading-none" style={{ color: theme.node.muted }}>{command.description}</span> : null}
                    </span>
                </motion.button>
            ))}
        </div>
    );
}
