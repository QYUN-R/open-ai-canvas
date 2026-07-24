import { ArrowRight, CircleDot, Clapperboard, Film, FolderOpen, Image as ImageIcon, MessageSquareText, MoreVertical, Plus, Search, Settings2, SlidersHorizontal, Sparkles, Type, WandSparkles } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { App } from "antd";

import { createCanvasProjectWithRemoteSync } from "@/services/user-data-sync";
import { useCanvasStore, type CanvasProject } from "@/stores/canvas/use-canvas-store";
import { useUserStore } from "@/stores/use-user-store";
import { createCanvasFilmWorkflowSeed } from "@/lib/canvas/canvas-film-workflow-seed";

export default function IndexPage() {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const hydrated = useCanvasStore((state) => state.hydrated);
    const projects = useCanvasStore((state) => state.projects);
    const user = useUserStore((state) => state.user);
    const [filmPrompt, setFilmPrompt] = useState("");
    const recentProjects = useMemo(() => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4), [projects]);

    const createAndEnter = (seedPrompt?: string) => {
        if (!hydrated) return;
        const prompt = seedPrompt?.trim() || "";
        const seedId = prompt ? createCanvasFilmWorkflowSeed(prompt) : "";
        const seedQuery = seedId ? `?template=film&seed=${encodeURIComponent(seedId)}` : "";
        if (!user) {
            const next = seedId ? `/canvas?mode=new&template=film&seed=${encodeURIComponent(seedId)}` : "/canvas?mode=new";
            navigate(`/login?next=${encodeURIComponent(next)}`);
            return;
        }
        void createCanvasProjectWithRemoteSync(projectTitle(prompt, projects.length + 1)).then(({ id, syncError }) => {
            if (syncError) message.warning(syncError instanceof Error ? `画布已在本地创建，云端同步失败：${syncError.message}` : "画布已在本地创建，云端同步失败");
            navigate(`/canvas/${id}${seedQuery}`);
        });
    };

    const startFilmProject = (event: FormEvent) => {
        event.preventDefault();
        const prompt = filmPrompt.trim();
        if (!prompt) {
            message.info("先写一句故事想法");
            return;
        }
        createAndEnter(prompt);
    };

    const enterCanvas = () => {
        const target = "/canvas?mode=new";
        navigate(user ? target : `/login?next=${encodeURIComponent(target)}`);
    };

    return (
        <main className="app-user-content app-workspace-canvas h-full overflow-y-auto text-foreground">
            <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-5 pb-8 pt-7 sm:px-8 lg:px-10">
                <section className="flex min-h-[calc(100dvh-9rem)] flex-col border-b border-[var(--workspace-border)] pb-8 pt-7">
                    <div className="mx-auto max-w-[760px] text-center">
                        <h1 className="text-[2.35rem] font-semibold leading-[1.04] tracking-normal text-stone-950 dark:text-white sm:text-[3.15rem] lg:text-[3.55rem]">创作，只需要一张画布</h1>
                        <p className="mx-auto mt-4 max-w-[520px] text-sm leading-7 text-stone-600 dark:text-stone-400 sm:text-[15px]">脚本、分镜、镜头生成，集中在同一个工作台。</p>
                        <form
                            className="mx-auto mt-6 flex max-w-[650px] flex-col gap-2 rounded-lg border border-[var(--workspace-border-strong)] bg-[var(--workspace-surface)] p-2 text-left shadow-[0_18px_70px_rgba(15,23,42,.10)] backdrop-blur-2xl sm:flex-row"
                            onSubmit={startFilmProject}
                        >
                            <input
                                value={filmPrompt}
                                onChange={(event) => setFilmPrompt(event.target.value)}
                                className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-foreground outline-none placeholder:text-stone-400"
                                placeholder="写下一个故事想法"
                            />
                            <button
                                type="submit"
                                disabled={!hydrated}
                                className="app-home-primary-action inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <WandSparkles className="size-4" />
                                生成画布
                            </button>
                        </form>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                            <button
                                type="button"
                                disabled={!hydrated}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--workspace-border-strong)] bg-[var(--workspace-surface)] px-3 text-xs font-semibold text-foreground backdrop-blur-xl transition hover:bg-[var(--workspace-surface-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                                onClick={() => createAndEnter()}
                            >
                                <Plus className="size-3.5" />
                                空白画布
                            </button>
                            <button
                                type="button"
                                disabled={!hydrated}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-transparent px-3 text-xs font-semibold text-stone-600 transition hover:bg-[var(--workspace-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-300"
                                onClick={enterCanvas}
                            >
                                进入画布
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                    </div>

                    <HomeCanvasPreview />
                </section>

                <section className="grid gap-5 py-6 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-start">
                    <div>
                        <h2 className="text-lg font-semibold">最近项目</h2>
                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hydrated ? `${projects.length} 个项目` : "正在载入"}</p>
                    </div>

                    <div className="min-w-0 overflow-hidden rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-surface)] backdrop-blur-xl">
                        {recentProjects.length ? (
                            <div className="divide-y divide-[var(--workspace-border)]">
                                {recentProjects.map((project) => (
                                    <RecentProjectRow key={project.id} project={project} onOpen={() => navigate(`/canvas/${project.id}`)} />
                                ))}
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={!hydrated}
                                className="flex min-h-20 w-full items-center justify-between gap-4 px-5 text-left transition hover:bg-[var(--workspace-surface-strong)] disabled:opacity-50"
                                onClick={() => createAndEnter()}
                            >
                                <span className="flex min-w-0 items-center gap-3">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-surface-strong)] text-stone-500">
                                        <Plus className="size-4" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold">新建项目</span>
                                        <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">从影视工作流或空白画布开始</span>
                                    </span>
                                </span>
                                <ArrowRight className="size-4 shrink-0 text-stone-400" />
                            </button>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

function HomeCanvasPreview() {
    return (
        <section
            className="home-cinematic-stage relative mx-auto mt-8 aspect-[16/9] min-h-[330px] w-full max-w-[1080px] overflow-hidden rounded-lg border border-[var(--workspace-border-strong)] bg-black shadow-[0_34px_120px_rgba(15,23,42,.14)] dark:shadow-[0_42px_150px_rgba(0,0,0,.46)]"
            aria-label="画布预览"
        >
            <img src="/short-drama-styles/suspense-noir.jpg" alt="" className="home-stage-backdrop absolute inset-0 size-full object-cover opacity-45" loading="eager" decoding="async" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,.12),transparent_38%),linear-gradient(180deg,rgba(0,0,0,.16),rgba(0,0,0,.74))]" />

            <div className="home-canvas-window absolute inset-x-[5%] bottom-7 top-8 overflow-hidden rounded-lg border border-white/10 bg-black/90 shadow-[0_26px_90px_rgba(0,0,0,.55)] backdrop-blur-xl sm:inset-x-[9%] sm:bottom-9 sm:top-10">
                <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle,rgba(255,255,255,.13)_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="home-canvas-drift absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:64px_64px]" />

                <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-md border border-white/10 bg-white/[.06] px-2.5 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur-xl">
                    <Film className="size-3.5" />
                    Film Canvas
                </div>

                <div className="absolute right-4 top-4 z-20 flex items-center gap-3 text-white/45">
                    <Search className="size-3.5" />
                    <SlidersHorizontal className="size-3.5" />
                    <Settings2 className="size-3.5" />
                </div>

                <div className="absolute left-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-white/10 bg-white/[.06] p-1.5 text-white/55 shadow-2xl backdrop-blur-xl sm:flex">
                    {[Plus, Sparkles, Type, Clapperboard, WandSparkles].map((Icon, index) => (
                        <span key={index} className="grid size-8 place-items-center rounded-full transition first:bg-white first:text-black">
                            <Icon className="size-3.5" />
                        </span>
                    ))}
                </div>

                <svg className="absolute inset-0 z-[1] h-full w-full text-white/24" viewBox="0 0 1020 560" preserveAspectRatio="none" aria-hidden>
                    <path className="home-flow-path home-flow-path-a" d="M214 282 C382 282 390 226 520 226" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path className="home-flow-path home-flow-path-b" d="M600 256 C712 256 704 350 820 350" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path className="home-flow-path home-flow-path-c" d="M372 420 C500 420 514 330 628 330" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>

                <MediaNode className="home-float-a left-[9%] top-[38%] w-[176px] sm:w-[206px]" label="Reference" img="/short-drama-styles/period-live-action.jpg" />
                <MediaNode className="home-float-b left-[54%] top-[19%] w-[230px] sm:w-[286px]" label="Image Generation" img="/short-drama-styles/fantasy-3d.jpg" large />
                <MediaNode className="home-float-c bottom-[7%] left-[34%] w-[250px] sm:w-[314px]" label="Video Generation" img="/short-drama-styles/real-life.jpg" wide />

                <div className="home-float-d absolute right-[1.5%] top-[55%] z-20 hidden w-[208px] rounded-lg border border-white/10 bg-white/[.07] p-3 text-left shadow-2xl backdrop-blur-2xl lg:block">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-white/45">
                        <MessageSquareText className="size-3" />
                        Prompt
                    </div>
                    <p className="text-sm font-medium leading-6 text-white/78">雨夜城市，低机位追逐，霓虹反射在湿地面。</p>
                </div>

                <div className="absolute bottom-4 right-4 z-30 grid size-10 place-items-center rounded-full border border-white/10 bg-white/[.08] text-white/70 shadow-2xl backdrop-blur-xl">
                    <CircleDot className="size-5" />
                </div>
            </div>
        </section>
    );
}

function MediaNode({ className, img, label, large, wide }: { className: string; img: string; label: string; large?: boolean; wide?: boolean }) {
    return (
        <div className={`absolute z-20 ${className}`}>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-white/48">
                <ImageIcon className="size-3" />
                {label}
            </div>
            <div className={`overflow-hidden rounded-lg border border-white/10 bg-white/[.04] shadow-[0_26px_80px_rgba(0,0,0,.42)] ${large ? "aspect-[16/9]" : wide ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
                <img src={img} alt="" className="home-node-image size-full object-cover" loading="eager" decoding="async" />
            </div>
        </div>
    );
}

function RecentProjectRow({ onOpen, project }: { onOpen: () => void; project: CanvasProject }) {
    return (
        <button type="button" className="group grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 text-left transition hover:bg-[var(--workspace-surface-strong)]" onClick={onOpen}>
            <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-surface-strong)] text-stone-500">
                    <FolderOpen className="size-4" />
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{project.title}</span>
                    <span className="mt-1 block truncate text-xs text-stone-500 dark:text-stone-400">更新于 {formatProjectTime(project.updatedAt)}</span>
                </span>
            </span>
            <MoreVertical className="size-4 text-stone-400 opacity-70 transition group-hover:opacity-100" />
        </button>
    );
}

function formatProjectTime(value: string) {
    return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function projectTitle(prompt: string, index: number) {
    if (!prompt) return `影视项目 ${index}`;
    const shortPrompt = Array.from(prompt.replace(/\s+/g, " ").trim()).slice(0, 12).join("");
    return `影视项目 · ${shortPrompt}`;
}
