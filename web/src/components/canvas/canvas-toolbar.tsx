import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Segmented, Switch } from "antd";
import {
    Box,
    Camera,
    CircleDot,
    Clapperboard,
    Eraser,
    FileText,
    Film,
    FolderOpen,
    GitBranch,
    Grid2x2,
    Hand,
    History,
    Image as ImageIcon,
    Info,
    Layers3,
    Map,
    Mic2,
    Moon,
    Music2,
    Palette,
    PanelTop,
    Plus,
    Redo2,
    Square,
    StickyNote,
    Sun,
    Trash2,
    Type,
    Undo2,
    UploadCloud,
    UserRound,
    Video,
    WandSparkles,
    Workflow,
    X,
} from "lucide-react";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { SpotlightSurface } from "@/components/ui/aceternity/spotlight-surface";
import { CanvasCreateCommandGrid, type CanvasCreateCommand } from "@/components/canvas/canvas-create-command-grid";
import { aceternityMotion } from "@/lib/aceternity-motion";
import { canvasThemes, type CanvasBackgroundMode, type CanvasColorTheme, type CanvasTheme } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";
import type { CanvasWorkspaceMode } from "@/types/canvas";

export function CanvasToolbar({
    selectedCount,
    workspaceMode,
    canUndo,
    canRedo,
    backgroundMode,
    showImageInfo,
    onAddImage,
    onAddVideo,
    onAddAudio,
    onAddText,
    onAddNovel,
    onCreatePipeline,
    onChooseStyle,
    onAddScript,
    onAddFrame,
    onAddConfig,
    onOpenDirector,
    onUndo,
    onRedo,
    onUpload,
    onDelete,
    onClear,
    onDeselect,
    onBackgroundModeChange,
    onShowImageInfoChange,
    onOpenMyAssets,
}: {
    selectedCount: number;
    workspaceMode: CanvasWorkspaceMode;
    canUndo: boolean;
    canRedo: boolean;
    backgroundMode: CanvasBackgroundMode;
    showImageInfo: boolean;
    onAddImage: () => void;
    onAddVideo: () => void;
    onAddAudio: () => void;
    onAddText: () => void;
    onAddNovel: () => void;
    onCreatePipeline: () => void;
    onChooseStyle: () => void;
    onAddScript: () => void;
    onAddFrame: () => void;
    onAddConfig: () => void;
    onOpenDirector: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onUpload: () => void;
    onDelete: () => void;
    onClear: () => void;
    onDeselect: () => void;
    onBackgroundModeChange: (mode: CanvasBackgroundMode) => void;
    onShowImageInfoChange: (show: boolean) => void;
    onOpenMyAssets: () => void;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const colorTheme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const theme = canvasThemes[colorTheme];
    const [addOpen, setAddOpen] = useState(false);
    const [appearanceOpen, setAppearanceOpen] = useState(false);

    const runAddAction = (action: () => void) => {
        action();
        setAddOpen(false);
    };

    useEffect(() => {
        if (!addOpen && !appearanceOpen) return;
        const closeFloatingPanels = (event: PointerEvent) => {
            const target = event.target instanceof Node ? event.target : null;
            if (target && rootRef.current?.contains(target)) return;
            setAddOpen(false);
            setAppearanceOpen(false);
        };
        document.addEventListener("pointerdown", closeFloatingPanels, true);
        return () => document.removeEventListener("pointerdown", closeFloatingPanels, true);
    }, [addOpen, appearanceOpen]);

    return (
        <div ref={rootRef} data-canvas-no-zoom className="pointer-events-none absolute bottom-4 left-4 top-[76px] z-50 flex items-start gap-2">
            <div
                className="pointer-events-auto flex w-14 flex-col items-center gap-1 rounded-lg border p-2 backdrop-blur-2xl"
                style={{ background: theme.spatial.elevated, borderColor: theme.toolbar.border, boxShadow: `0 22px 64px ${theme.spatial.shadow}` }}
            >
                <RailButton active={!selectedCount} icon={selectedCount ? <X /> : <Hand />} label={selectedCount ? `取消选择 ${selectedCount}` : "移动与选择"} theme={theme} onClick={onDeselect} />
                <RailSeparator theme={theme} />
                <RailButton
                    active={addOpen}
                    primary
                    icon={<Plus />}
                    label="添加节点"
                    theme={theme}
                    onClick={() => {
                        setAppearanceOpen(false);
                        setAddOpen((value) => !value);
                    }}
                />
                <RailButton icon={<UploadCloud />} label="上传" theme={theme} onClick={() => runAddAction(onUpload)} />
                <RailButton icon={<FolderOpen />} label="素材库" theme={theme} onClick={() => runAddAction(onOpenMyAssets)} />
                <RailButton
                    active={appearanceOpen}
                    icon={<Palette />}
                    label="画布外观"
                    theme={theme}
                    onClick={() => {
                        setAddOpen(false);
                        setAppearanceOpen((value) => !value);
                    }}
                />
                <RailSeparator theme={theme} />
                <RailButton icon={<Undo2 />} label="撤销" theme={theme} disabled={!canUndo} onClick={onUndo} />
                <RailButton icon={<Redo2 />} label="重做" theme={theme} disabled={!canRedo} onClick={onRedo} />
                {selectedCount ? <RailButton danger icon={<Trash2 />} label="删除选中" theme={theme} onClick={onDelete} /> : null}
                <div className="mt-auto" />
                <RailButton danger icon={<Eraser />} label="清空画布" theme={theme} onClick={onClear} />
            </div>

            <AnimatePresence>
                {addOpen ? (
                    <AddNodeMenu
                        theme={theme}
                        workspaceMode={workspaceMode}
                        onAddText={() => runAddAction(onAddText)}
                        onAddNovel={() => runAddAction(onAddNovel)}
                        onCreatePipeline={() => runAddAction(onCreatePipeline)}
                        onChooseStyle={() => runAddAction(onChooseStyle)}
                        onAddScript={() => runAddAction(onAddScript)}
                        onAddFrame={() => runAddAction(onAddFrame)}
                        onAddImage={() => runAddAction(onAddImage)}
                        onAddVideo={() => runAddAction(onAddVideo)}
                        onAddAudio={() => runAddAction(onAddAudio)}
                        onAddConfig={() => runAddAction(onAddConfig)}
                        onOpenDirector={() => runAddAction(onOpenDirector)}
                        onUpload={() => runAddAction(onUpload)}
                        onOpenAssets={() => runAddAction(onOpenMyAssets)}
                    />
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {appearanceOpen ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: aceternityMotion.duration.instant }} className="pointer-events-auto w-[244px]">
                        <SpotlightSurface
                            spotlightColor={theme.toolbar.itemHover}
                            initial={{ x: -6, scale: 0.98 }}
                            animate={{ x: 0, scale: 1 }}
                            exit={{ x: -4, scale: 0.98 }}
                            transition={{ duration: aceternityMotion.duration.instant, ease: aceternityMotion.easing.enter }}
                            className="aceternity-floating-panel overflow-hidden rounded-lg border p-2.5 backdrop-blur-2xl"
                            style={{ background: theme.spatial.elevated, borderColor: theme.toolbar.border, color: theme.toolbar.item, boxShadow: `0 24px 64px ${theme.spatial.shadow}` }}
                            onWheel={(event) => event.stopPropagation()}
                        >
                            <PanelHeading icon={<Palette className="size-4" />} title="画布外观" subtitle="网格、主题和媒体信息" theme={theme} />
                            <div className="mt-3 text-[9px] font-semibold uppercase opacity-45">主题模式</div>
                            <div className="mt-1 grid grid-cols-2 gap-1 rounded-md border p-1" style={{ background: theme.spatial.surface, borderColor: theme.toolbar.border }}>
                                <CanvasThemeButton colorTheme={colorTheme} targetTheme="light" onThemeChange={setTheme}>
                                    <Sun className="size-3.5" />
                                    浅色
                                </CanvasThemeButton>
                                <CanvasThemeButton colorTheme={colorTheme} targetTheme="dark" onThemeChange={setTheme}>
                                    <Moon className="size-3.5" />
                                    深色
                                </CanvasThemeButton>
                            </div>
                            <div className="mt-3 text-[9px] font-semibold uppercase opacity-45">空间网格</div>
                            <Segmented
                                className="mt-1 w-full !rounded-md !p-0.5 [&_.ant-segmented-group]:!flex [&_.ant-segmented-item]:!min-h-7 [&_.ant-segmented-item]:!flex-1 [&_.ant-segmented-item-label]:!min-h-7 [&_.ant-segmented-item-label]:!text-[10px] [&_.ant-segmented-item-label]:!leading-7"
                                value={backgroundMode}
                                onChange={(value) => onBackgroundModeChange(value as CanvasBackgroundMode)}
                                options={[
                                    {
                                        value: "dots",
                                        label: (
                                            <span className="inline-flex items-center gap-1.5">
                                                <CircleDot className="size-3.5" />点
                                            </span>
                                        ),
                                    },
                                    {
                                        value: "lines",
                                        label: (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Grid2x2 className="size-3.5" />线
                                            </span>
                                        ),
                                    },
                                    {
                                        value: "blank",
                                        label: (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Square className="size-3.5" />
                                                空白
                                            </span>
                                        ),
                                    },
                                ]}
                            />
                            <div className="mt-2.5 flex items-center justify-between gap-2 rounded-md border px-2.5 py-2" style={{ background: theme.spatial.surface, borderColor: theme.toolbar.border }}>
                                <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-semibold">
                                    <Info className="size-3" />
                                    图片信息
                                </span>
                                <Switch size="small" checked={showImageInfo} onChange={onShowImageInfoChange} />
                            </div>
                        </SpotlightSurface>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function AddNodeMenu({
    theme,
    workspaceMode,
    onAddText,
    onAddNovel,
    onCreatePipeline,
    onChooseStyle,
    onAddScript,
    onAddFrame,
    onAddImage,
    onAddVideo,
    onAddAudio,
    onAddConfig,
    onOpenDirector,
    onUpload,
    onOpenAssets,
}: {
    theme: CanvasTheme;
    workspaceMode: CanvasWorkspaceMode;
    onAddText: () => void;
    onAddNovel: () => void;
    onCreatePipeline: () => void;
    onChooseStyle: () => void;
    onAddScript: () => void;
    onAddFrame: () => void;
    onAddImage: () => void;
    onAddVideo: () => void;
    onAddAudio: () => void;
    onAddConfig: () => void;
    onOpenDirector: () => void;
    onUpload: () => void;
    onOpenAssets: () => void;
}) {
    const comingSoon = (phase: string) => ({ disabled: true, badge: phase, description: "将在后续阶段接入", onClick: () => undefined });
    const baseCommands: CanvasCreateCommand[] = [
        { id: "text", label: "文本", description: "提示词 / 备注 / 台词", icon: <Type />, onClick: onAddText },
        { id: "image", label: "图片", description: "文生图 / 图生图", icon: <ImageIcon />, onClick: onAddImage },
        { id: "video", label: "视频", description: "首帧 / 首尾帧视频", icon: <Video />, onClick: onAddVideo },
        { id: "audio", label: "音频", description: "TTS / BGM / 音效", icon: <Music2 />, onClick: onAddAudio },
    ];
    const filmCommands: CanvasCreateCommand[] = [
        { id: "film-workflow", label: "影视工作流", description: "故事到成片", icon: <Workflow />, badge: "入口", onClick: onCreatePipeline },
        { id: "script", label: "剧本", description: "剧本到分镜", icon: <Clapperboard />, badge: "核心", onClick: onAddScript },
        { id: "novel", label: "小说", description: "长文本拆解", icon: <FileText />, onClick: onAddNovel },
        { id: "style", label: "画风", description: "项目视觉规范", icon: <Palette />, onClick: onChooseStyle },
        { id: "director", label: "导演台", description: "3D 机位与镜头", icon: <Layers3 />, badge: "3D", onClick: onOpenDirector },
        { id: "character", label: "角色", icon: <UserRound />, ...comingSoon("P3") },
        { id: "scene", label: "场景", icon: <Map />, ...comingSoon("P3") },
        { id: "shot-group", label: "分镜组", icon: <Film />, disabled: true, badge: "已支持", description: "选择图片后用多选工具创建", onClick: () => undefined },
        { id: "shot-learn", label: "镜头学习", icon: <Camera />, ...comingSoon("P7") },
        { id: "panorama", label: "720 全景", icon: <Box />, ...comingSoon("P4") },
        { id: "composer", label: "视频合成", icon: <Film />, ...comingSoon("P6") },
        { id: "audio-tools", label: "音频处理", icon: <Mic2 />, ...comingSoon("P6") },
    ];
    const resourceCommands: CanvasCreateCommand[] = [
        { id: "upload", label: "上传", description: "图片 / 视频 / 音频", icon: <UploadCloud />, onClick: onUpload },
        { id: "assets", label: "素材库", description: "复用历史素材", icon: <FolderOpen />, onClick: onOpenAssets },
        { id: "history", label: "历史生成", icon: <History />, ...comingSoon("P2") },
    ];
    const toolCommands: CanvasCreateCommand[] = [
        { id: "config", label: "配置", description: "局部覆盖模型参数", icon: <WandSparkles />, onClick: onAddConfig },
        { id: "frame", label: "节点组", description: "整理画布区域", icon: <PanelTop />, onClick: onAddFrame },
        { id: "reroute", label: "Reroute", icon: <GitBranch />, ...comingSoon("P2") },
        { id: "note", label: "备注", description: "创建文本备注", icon: <StickyNote />, onClick: onAddText },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: aceternityMotion.duration.instant }} className="pointer-events-auto w-[360px] max-w-[calc(100vw-96px)]">
            <SpotlightSurface
                spotlightColor={theme.toolbar.itemHover}
                initial={{ x: -8, scale: 0.98 }}
                animate={{ x: 0, scale: 1 }}
                exit={{ x: -5, scale: 0.98 }}
                transition={{ duration: aceternityMotion.duration.instant, ease: aceternityMotion.easing.enter }}
                className="aceternity-floating-panel thin-scrollbar max-h-[calc(100vh-180px)] overflow-y-auto rounded-lg border p-2.5 backdrop-blur-2xl"
                style={{ background: theme.spatial.elevated, borderColor: theme.toolbar.border, color: theme.node.text, boxShadow: `0 24px 64px ${theme.spatial.shadow}` }}
                onWheel={(event) => event.stopPropagation()}
            >
                <PanelHeading icon={<Plus className="size-4" />} title="添加节点" subtitle={workspaceMode === "professional" ? "完整影视工作台" : "完整模式已默认开启"} theme={theme} />
                <MenuSection title="基础" />
                <CanvasCreateCommandGrid commands={baseCommands} />
                <MenuSection title="影视" />
                <CanvasCreateCommandGrid commands={filmCommands} />
                <MenuSection title="资源" />
                <CanvasCreateCommandGrid commands={resourceCommands} variant="resource" />
                <MenuSection title="工具" />
                <CanvasCreateCommandGrid commands={toolCommands} variant="resource" />
            </SpotlightSurface>
        </motion.div>
    );
}

function RailButton({ active, danger, disabled, icon, label, primary, theme, onClick }: { active?: boolean; danger?: boolean; disabled?: boolean; icon: ReactNode; label: string; primary?: boolean; theme: CanvasTheme; onClick: () => void }) {
    const color = danger ? theme.accent.danger : active || primary ? theme.accent.primary : theme.node.text;
    return (
        <button
            type="button"
            className="group relative grid size-10 place-items-center rounded-md border outline-none transition hover:brightness-110 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-35"
            style={{ background: active || primary ? theme.accent.primarySoft : theme.toolbar.panel, borderColor: active || primary ? `${theme.accent.primary}66` : theme.toolbar.border, color, "--tw-ring-color": theme.accent.primary } as CSSProperties}
            disabled={disabled}
            onClick={onClick}
            aria-label={label}
            title={label}
        >
            <span className="[&_svg]:size-4">{icon}</span>
            <span
                className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 z-[140] hidden -translate-y-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-medium shadow-xl backdrop-blur-xl group-hover:block"
                style={{ background: theme.spatial.elevated, borderColor: theme.toolbar.border, color: theme.node.text }}
            >
                {label}
            </span>
        </button>
    );
}

function RailSeparator({ theme }: { theme: CanvasTheme }) {
    return <span className="my-1 h-px w-7" style={{ background: theme.toolbar.border }} />;
}

function PanelHeading({ icon, title, subtitle, theme }: { icon: ReactNode; title: string; subtitle: string; theme: CanvasTheme }) {
    return (
        <div className="flex items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-md border opacity-75 [&_svg]:size-3.5" style={{ background: theme.spatial.surface, borderColor: theme.toolbar.border }}>
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block text-xs font-semibold">{title}</span>
                <span className="mt-0.5 block text-[9px]" style={{ color: theme.node.muted }}>
                    {subtitle}
                </span>
            </span>
        </div>
    );
}

function MenuSection({ title }: { title: string }) {
    return <div className="mb-1 mt-3 px-1 text-[9px] font-semibold uppercase opacity-42">{title}</div>;
}

function CanvasThemeButton({ colorTheme, targetTheme, onThemeChange, children }: { colorTheme: CanvasColorTheme; targetTheme: CanvasColorTheme; onThemeChange: (theme: CanvasColorTheme) => void; children: ReactNode }) {
    const theme = canvasThemes[colorTheme];
    const active = colorTheme === targetTheme;
    return (
        <AnimatedThemeToggler
            theme={colorTheme}
            targetTheme={targetTheme}
            onThemeChange={onThemeChange}
            className="inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors"
            style={active ? { background: theme.node.text, color: theme.node.panel } : { color: theme.toolbar.item }}
            aria-label={`切换到${targetTheme === "dark" ? "深色" : "浅色"}主题`}
            title={`切换到${targetTheme === "dark" ? "深色" : "浅色"}主题`}
        >
            {children}
        </AnimatedThemeToggler>
    );
}
