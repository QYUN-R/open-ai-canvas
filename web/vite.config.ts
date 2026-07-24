import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const webDir = dirname(fileURLToPath(import.meta.url));
const appVersion = readFileSync(resolve(webDir, "../VERSION"), "utf8").trim();
const appChangelog = readFileSync(resolve(webDir, "../CHANGELOG.md"), "utf8");
const selfHostedMode = ["1", "true", "yes", "on"].includes(String(process.env.SELF_HOSTED_MODE ?? process.env.VITE_SELF_HOSTED_MODE ?? "").toLowerCase());
const backendProxyTarget = process.env.CANVAS_BACKEND_PROXY_TARGET || "http://127.0.0.1:8080";

export default defineConfig({
    plugins: [react()],
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
        __APP_CHANGELOG__: JSON.stringify(appChangelog),
        __SELF_HOSTED_MODE__: JSON.stringify(selfHostedMode),
    },
    server: {
        proxy: {
            "/api": {
                target: backendProxyTarget,
                changeOrigin: true,
            },
            "/oauth/linuxdo/callback": {
                target: backendProxyTarget,
                changeOrigin: true,
            },
        },
    },
    resolve: {
        alias: {
            "@": resolve(webDir, "src"),
        },
    },
});
