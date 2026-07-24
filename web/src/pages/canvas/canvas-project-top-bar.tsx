import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { Bot, Clapperboard, Coins, Gauge, Home, Images, ListChecks, LoaderCircle, Menu, Plus, Redo2, Search, Share2, Trash2, Undo2, Upload, Workflow } from "lucide-react";
import { Button, Dropdown, Modal } from "antd";

import { UserStatusActions } from "@/components/layout/user-status-actions";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { canvasThemes } from "@/lib/canvas-theme";
import { showCreditUi } from "@/lib/self-hosted-mode";
import { useThemeStore } from "@/stores/use-theme-store";
import { useUserStore } from "@/stores/use-user-store";
import type { CanvasMediaPerformanceMode, CanvasWorkspaceMode } from "@/types/canvas";

type CanvasTopBarProps = {
    title: string;
    workspaceMode: CanvasWorkspaceMode;
    onWorkspaceModeChange: (mode: CanvasWorkspaceMode) => void;
    onOpenStoryboard: () => void;
    titleDraft: string;
    isTitleEditing: boolean;
    onTitleDraftChange: (value: string) => void;
    onStartTitleEditing: () => void;
    onFinishTitleEditing: () => void;
    onCancelTitleEditing: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onCreateProject: () => void;
    onDeleteProject: () => void;
    onImportImage: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onShare: () => void;
    agentOpen: boolean;
    compactAgentStatus?: { connected: boolean; enabled: boolean; activity: string };
    onToggleAgent: () => void;
    shortcutRequestNonce: number;
    mediaPerformanceMode: CanvasMediaPerformanceMode;
    onMediaPerformanceModeChange: (mode: CanvasMediaPerformanceMode) => void;
    onOpenSearch: () => void;
};

export function CanvasTopBar({
    title,
    workspaceMode,
    onWorkspaceModeChange,
    onOpenStoryboard,
    titleDraft,
    isTitleEditing,
    onTitleDraftChange,
    onStartTitleEditing,
    onFinishTitleEditing,
    onCancelTitleEditing,
    canUndo,
    canRedo,
    onCreateProject,
    onDeleteProject,
    onImportImage,
    onUndo,
    onRedo,
    onShare,
    agentOpen,
    compactAgentStatus,
    onToggleAgent,
    shortcutRequestNonce,
    mediaPerformanceMode,
    onMediaPerformanceModeChange,
    onOpenSearch,
}: CanvasTopBarProps) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const user = useUserStore((state) => state.user);
    const { availableMicrocredits, refreshing } = useWalletBalance(user?.id, showCreditUi);
    const titleRef = useRef<HTMLDivElement>(null);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);

    useEffect(() => {
        if (shortcutRequestNonce > 0) setShortcutsOpen(true);
    }, [shortcutRequestNonce]);

    useEffect(() => {
        if (!isTitleEditing) return;
        const close = (event: PointerEvent) => {
            if (!titleRef.current?.contains(event.target as Node)) onFinishTitleEditing();
        };
        document.addEventListener("pointerdown", close, true);
        return () => document.removeEventListener("pointerdown", close, true);
    }, [isTitleEditing, onFinishTitleEditing]);

    return (
        <>
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex h-16 items-center justify-between px-4">
                <div className="pointer-events-auto flex min-w-0 items-center gap-3">
                    <Dropdown
                        trigger={["click"]}
                        menu={{
                            items: [
                                { key: "home", icon: <Home className="size-4" />, label: <Link to="/">主页</Link> },
                                { key: "projects", icon: <Images className="size-4" />, label: <Link to="/canvas">我的画布</Link> },
                                { key: "tasks", icon: <ListChecks className="size-4" />, label: <Link to="/tasks">任务中心</Link> },
                                { type: "divider" },
                                { key: "new", icon: <Plus className="size-4" />, label: "新建画布", onClick: onCreateProject },
                                { key: "delete", danger: true, icon: <Trash2 className="size-4" />, label: "删除当前画布", onClick: onDeleteProject },
                                { type: "divider" },
                                { key: "import", icon: <Upload className="size-4" />, label: "导入素材", onClick: onImportImage },
                                { key: "search", icon: <Search className="size-4" />, label: <MenuLabel text="搜索节点" shortcut="⌘ K" />, onClick: onOpenSearch },
                                {
                                    key: "performance",
                                    icon: <Gauge className="size-4" />,
                                    label: "媒体性能",
                                    children: [
                                        { key: "performance-auto", label: "自动性能", onClick: () => onMediaPerformanceModeChange("auto") },
                                        { key: "performance-quality", label: "画质优先", onClick: () => onMediaPerformanceModeChange("quality") },
                                        { key: "performance-fast", label: "性能优先", onClick: () => onMediaPerformanceModeChange("performance") },
                                    ],
                                },
                                { type: "divider" },
                                { key: "undo", disabled: !canUndo, icon: <Undo2 className="size-4" />, label: <MenuLabel text="撤销" shortcut="⌘ Z" />, onClick: onUndo },
                                { key: "redo", disabled: !canRedo, icon: <Redo2 className="size-4" />, label: <MenuLabel text="重做" shortcut="⌘ ⇧ Z / ⌘ Y" />, onClick: onRedo },
                            ],
                        }}
                    >
                        <button type="button" className="grid size-9 place-items-center rounded-md border transition hover:brightness-110" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text }} aria-label="打开画布菜单">
                            <Menu className="size-5" />
                        </button>
                    </Dropdown>

                    <div ref={titleRef} className="flex min-w-0 items-center gap-2 rounded-md border px-3 py-1.5" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border }}>
                        <span className="grid size-6 shrink-0 place-items-center rounded" style={{ background: theme.accent.primarySoft, color: theme.accent.primary }}><Workflow className="size-3.5" /></span>
                        {isTitleEditing ? (
                            <input
                                autoFocus
                                value={titleDraft}
                                onChange={(event) => onTitleDraftChange(event.target.value)}
                                onBlur={onFinishTitleEditing}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") onFinishTitleEditing();
                                    if (event.key === "Escape") onCancelTitleEditing();
                                }}
                                className="max-w-[280px] bg-transparent p-0 text-left text-sm font-semibold tracking-normal outline-none"
                                style={{ color: theme.node.text }}
                            />
                        ) : (
                            <button type="button" className="max-w-[280px] truncate border-b border-dashed border-transparent text-left text-sm font-semibold tracking-normal transition hover:border-current" onDoubleClick={onStartTitleEditing} title="双击修改画布名称">
                                {title}
                            </button>
                        )}
                    </div>
                </div>

                <CanvasWorkspaceModeSwitch mode={workspaceMode} onChange={onWorkspaceModeChange} onOpenStoryboard={onOpenStoryboard} />

                <div className="pointer-events-auto flex items-center gap-1.5">
                    <Button type="text" className="!hidden !h-9 !w-9 !min-w-9 !rounded-md !p-0 lg:!inline-flex" style={{ color: theme.node.text }} icon={<Search className="size-4" />} onClick={onOpenSearch} aria-label="搜索画布节点" title="搜索画布节点" />
                    {compactAgentStatus ? <CompactAgentStatus status={compactAgentStatus} onClick={onToggleAgent} /> : null}
                    {showCreditUi && user ? (
                        <Link
                            to="/wallet"
                            className="inline-flex h-9 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium tabular-nums transition hover:brightness-110"
                            style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text }}
                            title="查看积分明细"
                        >
                            {refreshing && availableMicrocredits === null ? <LoaderCircle className="size-3.5 animate-spin opacity-60" /> : <Coins className="size-3.5" />}
                            <span>{availableMicrocredits === null ? "--" : (availableMicrocredits / 1_000_000).toLocaleString("zh-CN", { maximumFractionDigits: 3 })}</span>
                        </Link>
                    ) : null}
                    <Button type="text" className="!h-9 !rounded-md !px-3 !text-xs !font-medium" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text }} icon={<Share2 className="size-4" />} onClick={onShare}>
                        分享
                    </Button>
                    <Link className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition hover:brightness-110" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text }} to="/tasks">
                        <ListChecks className="size-4" />任务
                    </Link>
                    <Button
                        type="text"
                        className="!h-9 !rounded-md !px-3 !text-xs !font-medium"
                        style={{ background: agentOpen ? theme.accent.primarySoft : theme.toolbar.panel, color: agentOpen ? theme.accent.primary : theme.node.text, borderColor: agentOpen ? `${theme.accent.primary}66` : theme.toolbar.border }}
                        icon={<Bot className="size-4" />}
                        onClick={onToggleAgent}
                    >
                        Agent
                    </Button>
                    <UserStatusActions variant="canvas" onOpenShortcuts={() => setShortcutsOpen(true)} />
                </div>
            </div>
            <Modal title="快捷键" open={shortcutsOpen} onCancel={() => setShortcutsOpen(false)} footer={null} centered>
                <div className="space-y-2 border-t pt-4 text-sm" style={{ borderColor: theme.node.stroke }}>
                    <Shortcut keys={["空白处左键拖动", "空格 + 左键 / 中键"]} value="平移视图" />
                    <Shortcut keys={["滚轮"]} value="缩放画布" />
                    <Shortcut keys={["缩放滑杆"]} value="精确调整缩放" />
                    <Shortcut keys={["Shift / Ctrl / Cmd + 左键拖动"]} value="框选多个节点" />
                    <Shortcut keys={["Shift / Ctrl / Cmd", "点击"]} value="追加选择节点" />
                    <Shortcut keys={["Alt", "点击 / 框选"]} value="移除选择节点" />
                    <Shortcut keys={["Ctrl / Cmd", "1 / 2 / 3"]} value="100% / 适应全部 / 适应选择" />
                    <Shortcut keys={["Ctrl / Cmd", "K"]} value="搜索并定位节点" />
                    <Shortcut keys={["Ctrl / Cmd", "C / V"]} value="复制 / 粘贴节点，或粘贴剪切板文本/图片" />
                    <Shortcut keys={["Ctrl / Cmd", "S"]} value="保存画布布局和位置" />
                    <Shortcut keys={["Ctrl / Cmd", "Z"]} value="撤销" />
                    <Shortcut keys={["Ctrl / Cmd", "Shift", "Z"]} value="重做" />
                    <Shortcut keys={["Delete / Backspace"]} value="删除选中" />
                    <Shortcut keys={["Esc"]} value="取消选择并关闭浮层" />
                    <Shortcut keys={["拖入图片/视频/音频"]} value="上传到画布" />
                </div>
            </Modal>
        </>
    );
}

function CanvasWorkspaceModeSwitch({ mode, onChange, onOpenStoryboard }: { mode: CanvasWorkspaceMode; onChange: (mode: CanvasWorkspaceMode) => void; onOpenStoryboard: () => void }) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const activeStyle = { background: theme.accent.primarySoft, borderColor: `${theme.accent.primary}66`, color: theme.accent.primary };
    const idleStyle = { background: "transparent", borderColor: "transparent", color: theme.node.muted };
    return (
        <div className="pointer-events-auto absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-1 rounded-md border p-1 backdrop-blur-2xl" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, boxShadow: `0 16px 44px ${theme.spatial.shadow}` }}>
            <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-semibold" style={mode === "professional" ? activeStyle : idleStyle} onClick={() => onChange("professional")}>
                <Workflow className="size-3.5" />工作流
            </button>
            <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded border px-3 text-xs font-semibold" style={idleStyle} onClick={onOpenStoryboard}>
                <Clapperboard className="size-3.5" />故事板
            </button>
        </div>
    );
}

function MenuLabel({ text, shortcut }: { text: string; shortcut: string }) {
    return (
        <span className="flex min-w-36 items-center justify-between gap-8">
            <span>{text}</span>
            <span className="text-xs opacity-45">{shortcut}</span>
        </span>
    );
}

function CompactAgentStatus({ status, onClick }: { status: { connected: boolean; enabled: boolean; activity: string }; onClick: () => void }) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const label = status.connected ? "已连接到本地 Codex" : status.enabled ? status.activity || "连接中" : "正在连接本地 Codex";
    const dotColor = status.connected ? "#22c55e" : status.enabled ? "#f59e0b" : theme.node.muted;
    return (
        <button type="button" className="flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition hover:brightness-110" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text }} onClick={onClick} title="打开本地 Codex 面板">
            <span className="size-2 rounded-full" style={{ background: dotColor }} />
            <span className="max-w-[180px] truncate">{label}</span>
        </button>
    );
}

function Shortcut({ keys, value }: { keys: string[]; value: string }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-6 rounded-lg px-1 py-1.5">
            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                {keys.map((key, index) => (
                    <span key={`${key}-${index}`} className="flex items-center gap-1.5">
                        {index ? <span className="text-xs opacity-35">+</span> : null}
                        <kbd className="min-w-9 rounded-md border px-2.5 py-1.5 text-center text-xs font-medium leading-none shadow-[inset_0_-1px_0_rgba(0,0,0,.08),0_1px_2px_rgba(0,0,0,.06)]" style={{ borderColor: "rgba(120,113,108,.28)", background: "linear-gradient(#fff, rgba(245,245,244,.92))", color: "rgb(68,64,60)" }}>
                            {key}
                        </kbd>
                    </span>
                ))}
            </span>
            <span className="text-right text-sm opacity-55">{value}</span>
        </div>
    );
}
