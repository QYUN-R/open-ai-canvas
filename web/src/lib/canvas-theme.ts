export type CanvasColorTheme = "light" | "dark";
export type CanvasBackgroundMode = "dots" | "lines" | "blank";

export const canvasThemes = {
    light: {
        canvas: {
            background: "#ffffff",
            dot: "rgba(15,23,42,.14)",
            line: "rgba(15,23,42,.065)",
            selectionFill: "rgba(79,110,232,.10)",
        },
        node: {
            label: "#4b5563",
            fill: "#ffffff",
            panel: "#ffffff",
            stroke: "#e2e4e8",
            activeStroke: "#111827",
            placeholder: "#9ca3af",
            text: "#111827",
            muted: "#6b7280",
            faint: "#9ca3af",
        },
        frame: {
            fill: "rgba(17,24,39,.025)",
            stroke: "rgba(17,24,39,.18)",
            activeFill: "rgba(79,110,232,.05)",
            activeStroke: "#4f6ee8",
            preview: "rgba(255,255,255,.82)",
        },
        toolbar: {
            panel: "rgba(255,255,255,.94)",
            border: "rgba(17,24,39,.10)",
            item: "#4b5563",
            itemHover: "rgba(17,24,39,.06)",
            activeBg: "rgba(17,24,39,.10)",
            activeText: "#111827",
        },
        spatial: {
            surface: "rgba(255,255,255,.72)",
            elevated: "rgba(255,255,255,.94)",
            dropzone: "rgba(248,250,252,.78)",
            glow: "rgba(79,110,232,.18)",
            glowStrong: "rgba(79,110,232,.52)",
            shadow: "rgba(15,23,42,.18)",
        },
        accent: {
            primary: "#4f6ee8",
            primarySoft: "rgba(79,110,232,.14)",
            danger: "#f87171",
        },
    },
    dark: {
        canvas: {
            background: "#0b0d10",
            dot: "rgba(232,237,245,.14)",
            line: "rgba(232,237,245,.055)",
            selectionFill: "rgba(91,110,225,.16)",
        },
        node: {
            label: "#9aa3b2",
            fill: "#15181d",
            panel: "#181b21",
            stroke: "rgba(232,237,245,.105)",
            activeStroke: "#f3f7fb",
            placeholder: "#6f7886",
            text: "#f3f5f7",
            muted: "#a7b0bd",
            faint: "#68717d",
        },
        frame: {
            fill: "rgba(255,255,255,.025)",
            stroke: "rgba(255,255,255,.18)",
            activeFill: "rgba(91,110,225,.08)",
            activeStroke: "#8290f0",
            preview: "rgba(24,24,24,.86)",
        },
        toolbar: {
            panel: "rgba(18,21,26,.94)",
            border: "rgba(232,237,245,.105)",
            item: "#d4dae3",
            itemHover: "rgba(232,237,245,.075)",
            activeBg: "rgba(232,237,245,.115)",
            activeText: "#ffffff",
        },
        spatial: {
            surface: "rgba(21,24,29,.74)",
            elevated: "rgba(16,18,23,.96)",
            dropzone: "rgba(11,13,16,.82)",
            glow: "rgba(124,144,255,.16)",
            glowStrong: "rgba(124,144,255,.46)",
            shadow: "rgba(0,0,0,.42)",
        },
        accent: {
            primary: "#91a3ff",
            primarySoft: "rgba(124,144,255,.17)",
            danger: "#fb7185",
        },
    },
} as const;

export type CanvasTheme = (typeof canvasThemes)[CanvasColorTheme];
