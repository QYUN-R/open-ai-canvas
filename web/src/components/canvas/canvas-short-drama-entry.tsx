import { useState, type CSSProperties, type FormEvent } from "react";
import { Dropdown } from "antd";
import { AlignLeft, Bot, BookOpen, Check, ChevronDown, ChevronRight, ChevronUp, Clapperboard, FileText, MoreHorizontal, Palette, Pencil, Sparkles, Type, Upload, WandSparkles, X } from "lucide-react";

import { canvasThemes } from "@/lib/canvas-theme";
import type { CanvasShortDramaProgress, CanvasShortDramaStepId } from "@/lib/canvas/canvas-short-drama";
import { useThemeStore } from "@/stores/use-theme-store";
import type { CanvasNodeData } from "@/types/canvas";

export function CanvasShortDramaEmptyState({
    onCreatePipeline,
    onCreateFromPrompt,
    onOpenAgent,
    onUpload,
    onAddText,
    onAddNovel,
    onAddScript,
}: {
    onCreatePipeline: () => void;
    onCreateFromPrompt: (prompt: string) => void;
    onOpenAgent: () => void;
    onUpload: () => void;
    onAddText: () => void;
    onAddNovel: () => void;
    onAddScript: () => void;
}) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const focusStyle = { "--tw-ring-color": theme.accent.primary } as CSSProperties;
    const [prompt, setPrompt] = useState("");
    const submitPrompt = (event: FormEvent) => {
        event.preventDefault();
        const value = prompt.trim();
        if (value) onCreateFromPrompt(value);
        else onCreatePipeline();
    };

    return (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center px-4 pb-20 pt-24">
            <div
                className="pointer-events-auto w-full max-w-[720px] overflow-hidden rounded-lg border shadow-2xl backdrop-blur-2xl"
                data-canvas-no-zoom
                style={{ background: theme.spatial.elevated, borderColor: theme.toolbar.border, color: theme.node.text }}
            >
                <div className="relative p-4 sm:p-5">
                    <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent.primary}, transparent)` }} />
                    <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: theme.node.muted }}>
                            <span className="grid size-8 place-items-center rounded-md" style={{ background: theme.accent.primarySoft, color: theme.accent.primary }}>
                                <Clapperboard className="size-4" />
                            </span>
                            Film Canvas
                        </span>
                        <button
                            type="button"
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold outline-none transition hover:brightness-110 focus-visible:ring-2"
                            style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text, ...focusStyle }}
                            onClick={onOpenAgent}
                        >
                            <Bot className="size-3.5" />
                            Agent
                        </button>
                    </div>

                    <h2 className="mt-4 text-xl font-semibold tracking-normal sm:text-2xl">创作，只需要一张画布</h2>

                    <form className="mt-4 flex flex-col gap-2 rounded-lg border p-2 sm:flex-row" style={{ background: theme.spatial.surface, borderColor: theme.toolbar.border }} onSubmit={submitPrompt}>
                        <input
                            value={prompt}
                            onChange={(event) => setPrompt(event.target.value)}
                            className="min-h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-current placeholder:opacity-35"
                            style={{ color: theme.node.text }}
                            placeholder="输入一个故事想法"
                        />
                        <button
                            type="submit"
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold outline-none transition hover:brightness-110 focus-visible:ring-2"
                            style={{ background: theme.node.text, color: theme.node.panel, ...focusStyle }}
                        >
                            <WandSparkles className="size-4" />
                            生成工作流
                        </button>
                    </form>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition hover:bg-black/5 focus-visible:ring-2 dark:hover:bg-white/10"
                            style={{ color: theme.node.text, ...focusStyle }}
                            onClick={onCreatePipeline}
                        >
                            <Sparkles className="size-3.5" />
                            空白工作流
                        </button>
                        <button
                            type="button"
                            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition hover:bg-black/5 focus-visible:ring-2 dark:hover:bg-white/10"
                            style={{ color: theme.node.text, ...focusStyle }}
                            onClick={onUpload}
                        >
                            <Upload className="size-3.5" />
                            导入素材
                        </button>
                        <Dropdown
                            trigger={["click"]}
                            menu={{
                                items: [
                                    { key: "text", icon: <Type className="size-4" />, label: "新建文本", onClick: onAddText },
                                    { key: "novel", icon: <FileText className="size-4" />, label: "新建小说", onClick: onAddNovel },
                                    { key: "storyboard", icon: <Clapperboard className="size-4" />, label: "新建空白分镜", onClick: onAddScript },
                                ],
                            }}
                        >
                            <button
                                type="button"
                                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition hover:bg-black/5 focus-visible:ring-2 dark:hover:bg-white/10"
                                style={{ color: theme.node.muted, ...focusStyle }}
                            >
                                <MoreHorizontal className="size-4" />
                                更多
                                <ChevronDown className="size-3" />
                            </button>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CanvasShortDramaGuide({ progress, collapsed, onToggle, onSkip, onStepClick }: { progress: CanvasShortDramaProgress; collapsed: boolean; onToggle: () => void; onSkip: () => void; onStepClick: (stepId: CanvasShortDramaStepId) => void }) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    if (!progress.active) return null;
    if (collapsed) {
        return (
            <button
                type="button"
                data-canvas-no-zoom
                className="absolute left-[calc(50%+64px)] top-2 z-[48] inline-flex h-8 max-w-[calc(50vw-76px)] min-w-0 items-center gap-2 rounded-lg border px-3 text-xs font-medium shadow-sm backdrop-blur outline-none focus-visible:ring-2"
                style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text, "--tw-ring-color": theme.accent.primary } as CSSProperties}
                onClick={onToggle}
            >
                <Clapperboard className="size-3.5 shrink-0" />
                <span className="truncate">短剧流程 {progress.completedCount}/5</span>
                <ChevronDown className="size-3 shrink-0" />
            </button>
        );
    }
    return (
        <div
            data-canvas-no-zoom
            className="absolute left-1/2 top-[68px] z-[48] flex max-w-[calc(100%_-_24px)] -translate-x-1/2 items-center gap-1 rounded-lg border p-1 shadow-sm backdrop-blur"
            style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text }}
        >
            <div className="hide-scrollbar flex max-w-[min(760px,calc(100vw-150px))] items-center overflow-x-auto">
                {progress.steps.map((step, index) => (
                    <span key={step.id} className="flex shrink-0 items-center">
                        {index ? <ChevronRight className="mx-0.5 size-3 opacity-25" /> : null}
                        <button
                            type="button"
                            aria-current={step.status === "current" ? "step" : undefined}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-2 text-xs font-medium outline-none transition hover:bg-black/5 focus-visible:ring-1 focus-visible:ring-inset dark:hover:bg-white/10"
                            style={
                                {
                                    background: step.status === "current" ? theme.accent.primarySoft : "transparent",
                                    borderColor: step.status === "current" ? `${theme.accent.primary}40` : "transparent",
                                    color: step.status === "current" ? theme.accent.primary : step.status === "completed" ? theme.node.text : theme.node.muted,
                                    "--tw-ring-color": theme.accent.primary,
                                } as CSSProperties
                            }
                            onClick={() => onStepClick(step.id)}
                        >
                            <span
                                className="grid size-4 place-items-center rounded-full border text-[9px]"
                                style={{
                                    borderColor: step.status === "current" ? theme.accent.primary : theme.node.stroke,
                                    background: step.status === "completed" ? theme.accent.primary : "transparent",
                                    color: step.status === "completed" ? "#fff" : "currentColor",
                                }}
                            >
                                {step.status === "completed" ? <Check className="size-2.5" /> : index + 1}
                            </span>
                            {step.label}
                        </button>
                    </span>
                ))}
            </div>
            <span className="mx-1 h-4 w-px shrink-0" style={{ background: theme.toolbar.border }} />
            {!progress.completed ? (
                <button
                    type="button"
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] outline-none transition hover:bg-black/5 focus-visible:ring-2 dark:hover:bg-white/10"
                    style={{ color: theme.node.muted, "--tw-ring-color": theme.accent.primary } as CSSProperties}
                    onClick={onSkip}
                >
                    <X className="size-3" />
                    跳过导引
                </button>
            ) : null}
            <button
                type="button"
                className="grid size-8 shrink-0 place-items-center rounded-md outline-none transition hover:bg-black/5 focus-visible:ring-2 dark:hover:bg-white/10"
                style={{ color: theme.node.muted, "--tw-ring-color": theme.accent.primary } as CSSProperties}
                onClick={onToggle}
                aria-label="折叠短剧流程"
            >
                <ChevronUp className="size-3.5" />
            </button>
        </div>
    );
}

export function CanvasStylePlaceholderNodeContent({ onChoose }: { onChoose: () => void }) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    return (
        <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center" style={{ color: theme.node.text }}>
            <span className="grid size-10 place-items-center rounded-md" style={{ background: `${theme.accent.primary}16`, color: theme.accent.primary }}>
                <Palette className="size-5" />
            </span>
            <div className="mt-3 text-sm font-semibold">项目画风</div>
            <div className="mt-1 text-xs" style={{ color: theme.node.muted }}>
                待选择
            </div>
            <button
                type="button"
                className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium outline-none transition hover:brightness-105 focus-visible:ring-2"
                style={{ background: theme.toolbar.panel, borderColor: theme.node.stroke, "--tw-ring-color": theme.accent.primary } as CSSProperties}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    onChoose();
                }}
            >
                <Sparkles className="size-3.5" />
                选择画风
            </button>
        </div>
    );
}

export function CanvasStoryInputNodeContent({ node, onModeChange, onEdit }: { node: CanvasNodeData; onModeChange: (mode: "novel" | "brief") => void; onEdit: () => void }) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const mode = node.metadata?.storyInputMode || "novel";
    const content = (node.metadata?.document?.plainText || node.metadata?.content || "").replace(/\s+/g, " ").trim();
    return (
        <div className="flex h-full w-full flex-col overflow-hidden p-4" style={{ color: theme.node.text }}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-md" style={{ background: theme.toolbar.itemHover, color: theme.node.muted }}>
                        {mode === "novel" ? <BookOpen className="size-4" /> : <AlignLeft className="size-4" />}
                    </span>
                    <span className="truncate text-sm font-semibold">故事输入</span>
                </div>
                <div className="inline-flex shrink-0 rounded-md border p-0.5" style={{ borderColor: theme.node.stroke, background: theme.node.fill }}>
                    {(["brief", "novel"] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            className="h-6 rounded px-2 text-[10px] font-medium outline-none transition focus-visible:ring-2"
                            style={{ background: mode === value ? theme.toolbar.panel : "transparent", color: mode === value ? theme.node.text : theme.node.muted, "--tw-ring-color": theme.accent.primary } as CSSProperties}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                                event.stopPropagation();
                                onModeChange(value);
                            }}
                        >
                            {value === "brief" ? "梗概" : "小说"}
                        </button>
                    ))}
                </div>
            </div>
            <div className="mt-4 min-h-0 flex-1 overflow-hidden border-t pt-3 text-xs leading-6" style={{ borderColor: theme.node.stroke, color: content ? theme.node.muted : theme.node.placeholder }}>
                {content || (mode === "novel" ? "导入小说或开始写作…" : "写下题材、角色、冲突和结局方向…")}
            </div>
            <button
                type="button"
                className="mt-3 inline-flex h-8 w-fit items-center gap-1.5 rounded-md px-2 text-xs font-medium outline-none transition hover:bg-black/5 focus-visible:ring-2 dark:hover:bg-white/10"
                style={{ color: theme.node.text, "--tw-ring-color": theme.accent.primary } as CSSProperties}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    onEdit();
                }}
            >
                <Pencil className="size-3.5" />
                编辑故事
            </button>
        </div>
    );
}
