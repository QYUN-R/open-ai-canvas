import { nanoid } from "nanoid";

const FILM_WORKFLOW_SEED_STORAGE_KEY = "canvas-film-workflow-seeds-v1";
const MAX_SEED_PROMPT_LENGTH = 1200;

export type CanvasFilmWorkflowSeed = {
    id: string;
    prompt: string;
    createdAt: string;
};

type SeedStore = Record<string, CanvasFilmWorkflowSeed>;

export function createCanvasFilmWorkflowSeed(prompt: string) {
    const normalized = normalizeSeedPrompt(prompt);
    const id = nanoid();
    if (typeof window === "undefined") return id;
    const store = readSeedStore();
    store[id] = { id, prompt: normalized, createdAt: new Date().toISOString() };
    window.sessionStorage.setItem(FILM_WORKFLOW_SEED_STORAGE_KEY, JSON.stringify(store));
    return id;
}

export function consumeCanvasFilmWorkflowSeed(id?: string | null) {
    if (!id || typeof window === "undefined") return null;
    const store = readSeedStore();
    const seed = store[id] || null;
    if (seed) {
        delete store[id];
        window.sessionStorage.setItem(FILM_WORKFLOW_SEED_STORAGE_KEY, JSON.stringify(store));
    }
    return seed;
}

function normalizeSeedPrompt(prompt: string) {
    return prompt.replace(/\s+/g, " ").trim().slice(0, MAX_SEED_PROMPT_LENGTH);
}

function readSeedStore(): SeedStore {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.sessionStorage.getItem(FILM_WORKFLOW_SEED_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as SeedStore) : {};
    } catch (error) {
        console.warn("读取影视画布入口失败，已使用空入口", error);
        return {};
    }
}
