import { motion, useReducedMotion } from "motion/react";
import { ConfigProvider, Tabs } from "antd";
import { ArrowLeft, CircleDot, Film, Play, WandSparkles } from "lucide-react";
import { type CSSProperties } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

import { CometCard } from "@/components/ui/aceternity/comet-card";
import { SpotlightSurface } from "@/components/ui/aceternity/spotlight-surface";
import { aceternityMotion } from "@/lib/aceternity-motion";
import { getAntThemeConfig } from "@/lib/app-theme";

const AUTH_TABS = [
    { key: "login", label: "登录" },
    { key: "register", label: "注册" },
];

const authCopy = {
    login: {
        eyebrow: "WELCOME BACK",
        title: "进入创作现场",
        description: "继续编辑你的画布、素材与生成任务。",
    },
    register: {
        eyebrow: "CREATE ACCOUNT",
        title: "建立你的创作空间",
        description: "一个账号管理画布、素材、技能和模型偏好。",
    },
} as const;

export function LinuxDOIcon() {
    return (
        <span
            aria-hidden
            className="size-5 shrink-0 rounded-full"
            style={{
                background: "linear-gradient(to bottom, #1d1d1f 0 33.333%, #efefef 33.333% 66.666%, #feb005 66.666% 100%)",
                boxShadow: "0 0 0 1px rgba(255,255,255,.14)",
            }}
        />
    );
}

export function AuthScene() {
    const location = useLocation();
    const navigate = useNavigate();
    const reducedMotion = useReducedMotion();
    const activeTab = location.pathname === "/register" ? "register" : "login";
    const copy = activeTab === "register" ? authCopy.register : authCopy.login;

    return (
        <main className="h-dvh min-h-0 overflow-y-auto bg-[#08090c] text-white lg:overflow-hidden">
            <div className="grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1.32fr)_minmax(520px,1fr)]">
                <section className="relative min-h-[250px] overflow-hidden sm:min-h-[320px] lg:min-h-0" aria-label="无限画布品牌影片">
                    <AuthCinematicStage />
                    <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[clamp(120px,14vw,240px)] bg-[linear-gradient(90deg,transparent_0%,rgba(11,12,16,.68)_58%,#0b0c10_100%)] lg:block" />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-5 sm:p-7 lg:p-9">
                        <Link to="/" className="inline-flex items-center gap-2.5 text-sm font-semibold text-white drop-shadow-sm transition-opacity hover:opacity-80">
                            <span className="size-7 bg-current" style={{ mask: "url(/logo.svg) center / contain no-repeat", WebkitMask: "url(/logo.svg) center / contain no-repeat" }} />
                            无限画布
                        </Link>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/25 px-3 py-1.5 text-[11px] text-white/76 backdrop-blur-xl">
                            <Play className="size-3 fill-current" />
                            创作正在发生
                        </span>
                    </div>
                    <motion.div
                        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: aceternityMotion.duration.panel, ease: aceternityMotion.easing.enter }}
                        className="absolute inset-x-0 bottom-0 max-w-2xl p-5 sm:p-7 lg:p-10"
                    >
                        <p className="text-xs font-semibold tracking-[0.18em] text-white/58">CINEMATIC CANVAS</p>
                        <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">灵感，有了空间。</h1>
                    </motion.div>
                </section>

                <section className="relative flex min-h-[620px] items-start justify-center overflow-y-auto bg-[#0b0c10] px-4 pb-8 pt-20 sm:px-8 lg:min-h-0 lg:px-10 lg:pb-10 lg:pt-20">
                    <Link to="/" className="absolute right-5 top-5 z-20 inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs text-white/58 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white lg:right-8 lg:top-8">
                        <ArrowLeft className="size-3.5" />
                        返回首页
                    </Link>

                    <motion.div
                        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout={!reducedMotion}
                        transition={{ duration: aceternityMotion.duration.panel, ease: aceternityMotion.easing.enter }}
                        className="my-auto w-full max-w-[460px]"
                    >
                        <ConfigProvider theme={getAntThemeConfig(true)}>
                            <SpotlightSurface spotlightColor="rgba(103,232,249,.16)" spotlightRadius={300} className="flex h-auto rounded-[26px]">
                                <CometCard
                                    rotateDepth={1.8}
                                    translateDepth={1.5}
                                    glare={!reducedMotion}
                                    containerClassName="h-auto"
                                    className="auth-card-dark h-auto overflow-hidden rounded-[26px] border border-white/12 bg-[#111216]/88 shadow-[0_40px_120px_rgba(0,0,0,.48)] backdrop-blur-2xl"
                                >
                                    <section aria-label={copy.title} className="flex min-h-[620px] flex-col sm:min-h-[640px]">
                                        <header className="px-6 pb-5 pt-6 sm:px-8 sm:pt-7">
                                            <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300/80">{copy.eyebrow}</p>
                                            <h2 className="mt-2 text-3xl font-semibold">{copy.title}</h2>
                                            <p className="mt-2 text-sm leading-6 text-white/45">{copy.description}</p>
                                        </header>
                                        <div className="border-b border-white/[0.08] px-6 sm:px-8">
                                            <Tabs
                                                className="auth-card-tabs"
                                                activeKey={activeTab}
                                                items={AUTH_TABS}
                                                onChange={(key) => navigate({ pathname: key === "register" ? "/register" : "/login", search: location.search })}
                                            />
                                        </div>
                                        <div key={location.pathname} className="flex-1 px-6 py-6 sm:px-8 sm:py-7">
                                            <Outlet />
                                        </div>
                                    </section>
                                </CometCard>
                            </SpotlightSurface>
                        </ConfigProvider>
                    </motion.div>
                </section>
            </div>
        </main>
    );
}

function AuthCinematicStage() {
    const frames = [
        { image: "/short-drama-styles/real-life.jpg", code: "01" },
        { image: "/short-drama-styles/period-live-action.jpg", code: "02" },
        { image: "/short-drama-styles/ink-narrative.jpg", code: "03" },
    ];

    return (
        <div className="auth-cinematic-stage absolute inset-0 overflow-hidden bg-black" aria-hidden>
            <img src="/short-drama-styles/suspense-noir.jpg" alt="" className="auth-stage-backdrop absolute inset-0 size-full object-cover opacity-68" loading="eager" decoding="async" />
            <div className="absolute inset-0 bg-[linear-gradient(112deg,rgba(255,255,255,.09)_0%,transparent_28%),linear-gradient(180deg,rgba(2,3,8,.18),rgba(2,3,8,.88))]" />

            <div className="auth-cinema-frame absolute rounded-xl border border-white/12 bg-black/28 shadow-[0_36px_140px_rgba(0,0,0,.68)] backdrop-blur-[2px]">
                <div className="auth-stage-drift absolute inset-0 opacity-28 [background-image:linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:86px_86px]" />
                <div className="auth-frame-perf auth-frame-perf-left" />
                <div className="auth-frame-perf auth-frame-perf-right" />

                <div className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-md border border-white/12 bg-black/34 px-3 py-2 text-[11px] font-medium text-white/72 backdrop-blur-xl">
                    <Film className="size-3.5" />
                    CINEMA MODE
                </div>
                <div className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-md border border-white/12 bg-black/34 px-3 py-2 text-[11px] font-medium text-white/70 backdrop-blur-xl">
                    <CircleDot className="size-3.5 text-red-300" />
                    REC 24FPS
                </div>

                <div className="auth-frame-hero absolute bottom-[9%] left-[7%] top-[23%] z-10 w-[52%] overflow-hidden rounded-lg border border-white/10 bg-black/30 shadow-[0_28px_90px_rgba(0,0,0,.48)]">
                    <img src="/short-drama-styles/suspense-noir.jpg" alt="" className="auth-card-image size-full object-cover" loading="eager" decoding="async" />
                </div>

                <div className="auth-shot-stack absolute right-[7%] top-[23%] z-20 flex w-[clamp(132px,14vw,188px)] flex-col gap-3">
                    {frames.map((frame, index) => (
                        <AuthMediaCard key={frame.code} image={frame.image} code={frame.code} style={{ animationDelay: `${index * 0.28}s` }} />
                    ))}
                </div>

                <div className="auth-director-note absolute bottom-5 left-5 z-20 hidden max-w-[260px] rounded-lg border border-white/10 bg-black/34 p-3 shadow-2xl backdrop-blur-2xl 2xl:block">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-white/42">
                        <WandSparkles className="size-3" />
                        提示词
                    </div>
                    <p className="text-sm font-medium leading-6 text-white/78">雨夜城市，低机位追逐，霓虹反射在湿地面。</p>
                </div>

                <div className="auth-frame-playhead absolute bottom-5 left-[38%] right-[18%] z-20 h-px bg-white/20" />
            </div>
        </div>
    );
}

function AuthMediaCard({ image, code, style }: { image: string; code: string; style?: CSSProperties }) {
    return (
        <div className="auth-shot-card overflow-hidden rounded-md border border-white/10 bg-white/[.055] p-1.5 shadow-[0_24px_72px_rgba(0,0,0,.42)] backdrop-blur-xl" style={style}>
            <div className="relative aspect-[16/9] overflow-hidden rounded-[5px]">
                <img src={image} alt="" className="auth-card-image size-full object-cover" loading="eager" decoding="async" />
                <span className="absolute left-2 top-2 rounded-sm bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold text-white/64">{code}</span>
            </div>
        </div>
    );
}
