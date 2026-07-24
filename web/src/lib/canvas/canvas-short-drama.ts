import { nanoid } from "nanoid";

import { createDocumentChapter } from "@/lib/canvas/canvas-document";
import { cinematicStoryboardColumns, createCanvasNode, createStoryboardRow } from "@/lib/canvas/canvas-project-domain";
import { scopedLocalStorage } from "@/lib/user-scope";
import { CanvasNodeType, type CanvasConnection, type CanvasNodeData, type Position } from "@/types/canvas";

const SHORT_DRAMA_GUIDE_STORAGE_KEY = "canvas-short-drama-guide-v1";

export type CanvasShortDramaStepId = "style" | "story" | "storyboard" | "video" | "final";
export type CanvasShortDramaStepStatus = "pending" | "current" | "completed";
export type CanvasShortDramaStep = {
    id: CanvasShortDramaStepId;
    label: string;
    status: CanvasShortDramaStepStatus;
    nodeId?: string;
};

export type CanvasShortDramaProgress = {
    active: boolean;
    completed: boolean;
    completedCount: number;
    steps: CanvasShortDramaStep[];
};

export type CreateShortDramaPipelineOptions = {
    expanded?: boolean;
    seedPrompt?: string;
};

export function createShortDramaPipeline(center: Position, options: CreateShortDramaPipelineOptions = {}) {
    const seedPrompt = normalizeSeedPrompt(options.seedPrompt || "");
    const expanded = Boolean(options.expanded);

    const styleNode = createCanvasNode(
        CanvasNodeType.Text,
        { x: center.x - 760, y: center.y - 170 },
        {
            content: seedPrompt ? seededStylePrompt(seedPrompt) : "",
            status: seedPrompt ? "success" : "idle",
            workflowKind: "styleboard",
            workflowTitle: "项目画风",
            workflowDescription: seedPrompt ? "已按创意生成，可继续替换" : "待选择",
            fontSize: 14,
        },
    );
    styleNode.title = seedPrompt ? "项目画风 · 初稿" : "项目画风 · 待选择";
    styleNode.width = 360;
    styleNode.height = 220;

    const storyNode = createCanvasNode(
        CanvasNodeType.Text,
        { x: center.x - 760, y: center.y + 170 },
        {
            content: seedPrompt,
            status: seedPrompt ? "success" : "idle",
            workflowKind: "story_input",
            workflowTitle: "故事输入",
            workflowDescription: seedPrompt ? "一句话创意" : "小说或梗概",
            storyInputMode: seedPrompt ? "brief" : "novel",
            fontSize: 14,
        },
    );
    storyNode.title = seedPrompt ? "故事输入 · 创意" : "故事输入 · 小说";
    storyNode.width = 420;
    storyNode.height = 260;

    const scriptNode = createCanvasNode(
        CanvasNodeType.Script,
        { x: center.x + 180, y: center.y },
        {
            status: seedPrompt ? "success" : "idle",
            workflowKind: "storyboard",
            workflowTitle: "分镜脚本",
            storyboard: {
                rows: seedPrompt ? createSeedStoryboardRows(seedPrompt) : [],
                visibleColumns: seedPrompt ? cinematicStoryboardColumns(["shotNumber", "durationSeconds", "plotDescription", "dialogue"]) : ["shotNumber", "durationSeconds", "plotDescription", "dialogue"],
                referenceNodeIds: [],
            },
        },
    );
    scriptNode.title = seedPrompt ? "分镜脚本 · 初稿" : "分镜脚本 · 待生成";
    scriptNode.height = seedPrompt ? 480 : scriptNode.height;

    const connections: CanvasConnection[] = [
        { id: nanoid(), fromNodeId: styleNode.id, toNodeId: scriptNode.id, toHandleId: "storyboard:context" },
        { id: nanoid(), fromNodeId: storyNode.id, toNodeId: scriptNode.id, toHandleId: "storyboard:context" },
    ];
    const nodes: CanvasNodeData[] = [styleNode, storyNode, scriptNode];

    if (expanded) {
        const referenceNode = createCanvasNode(
            CanvasNodeType.Text,
            { x: center.x - 250, y: center.y + 400 },
            {
                content: "上传角色、场景、海报或样片，作为整条分镜的参考素材。",
                status: "idle",
                workflowKind: "reference_set",
                workflowTitle: "参考素材",
                workflowDescription: "角色 / 场景 / 样片",
                fontSize: 14,
            },
        );
        referenceNode.title = "参考素材";
        referenceNode.width = 360;
        referenceNode.height = 180;

        const imageConfigNode = createCanvasNode(
            CanvasNodeType.Config,
            { x: center.x + 760, y: center.y - 150 },
            {
                content: "",
                status: "idle",
                workflowKind: "image_generation",
                workflowTitle: "分镜图生成",
                workflowDescription: "由分镜生成关键帧",
                generationMode: "image",
                prompt: "基于分镜脚本、项目画风和参考素材，为每个镜头生成可用于视频的关键帧。",
                composerContent: "基于分镜脚本、项目画风和参考素材，为每个镜头生成可用于视频的关键帧。",
            },
        );
        imageConfigNode.title = "分镜图生成";
        imageConfigNode.width = 360;
        imageConfigNode.height = 300;

        const videoConfigNode = createCanvasNode(
            CanvasNodeType.Config,
            { x: center.x + 760, y: center.y + 210 },
            {
                content: "",
                status: "idle",
                workflowKind: "video_generation",
                workflowTitle: "镜头视频生成",
                workflowDescription: "由关键帧生成镜头视频",
                generationMode: "video",
                videoEditOperation: "image_to_video",
                seconds: "5",
                prompt: "基于分镜图和镜头运动描述生成视频，保持角色、场景和画风连续。",
                composerContent: "基于分镜图和镜头运动描述生成视频，保持角色、场景和画风连续。",
            },
        );
        videoConfigNode.title = "镜头视频生成";
        videoConfigNode.width = 360;
        videoConfigNode.height = 300;

        const finalNode = createCanvasNode(
            CanvasNodeType.Video,
            { x: center.x + 1220, y: center.y + 30 },
            {
                content: "",
                status: "idle",
                workflowKind: "final",
                workflowTitle: "成片输出",
                workflowDescription: "合并镜头视频",
                generationMode: "video",
                videoEditOperation: "concat",
                prompt: "合并已完成的镜头视频，输出完整短片。",
                composerContent: "合并已完成的镜头视频，输出完整短片。",
            },
        );
        finalNode.title = "成片输出";

        nodes.push(referenceNode, imageConfigNode, videoConfigNode, finalNode);
        connections.push(
            { id: nanoid(), fromNodeId: referenceNode.id, toNodeId: scriptNode.id, toHandleId: "storyboard:context" },
            { id: nanoid(), fromNodeId: scriptNode.id, toNodeId: imageConfigNode.id },
            { id: nanoid(), fromNodeId: styleNode.id, toNodeId: imageConfigNode.id },
            { id: nanoid(), fromNodeId: referenceNode.id, toNodeId: imageConfigNode.id },
            { id: nanoid(), fromNodeId: imageConfigNode.id, toNodeId: videoConfigNode.id },
            { id: nanoid(), fromNodeId: videoConfigNode.id, toNodeId: finalNode.id },
        );
    }

    return { nodes, connections, styleNodeId: styleNode.id, storyNodeId: storyNode.id, scriptNodeId: scriptNode.id };
}

export function deriveShortDramaProgress(nodes: CanvasNodeData[], connections: CanvasConnection[]): CanvasShortDramaProgress {
    const storyInputNode = nodes.find((node) => node.metadata?.workflowKind === "story_input");
    const storyboardScripts = nodes.filter((node) => node.type === CanvasNodeType.Script && (node.metadata?.workflowKind === "storyboard" || Boolean(storyInputNode)));
    const agentScriptNode = nodes.find((node) => node.type === CanvasNodeType.Text && node.metadata?.workflowKind === "script");
    const shotNodes = nodes.filter((node) => node.metadata?.workflowKind === "shot");
    const finalNodes = nodes.filter((node) => node.metadata?.workflowKind === "final");
    const hasManualPipeline = Boolean(storyInputNode || storyboardScripts.some((node) => node.metadata?.workflowKind === "storyboard"));
    const hasAgentPipeline = Boolean(agentScriptNode && shotNodes.length && finalNodes.length);
    const active = hasManualPipeline || hasAgentPipeline;
    const scriptIds = new Set(storyboardScripts.map((node) => node.id));
    const isConnectedToStoryboard = (nodeId: string) => connections.some((connection) => connection.fromNodeId === nodeId && scriptIds.has(connection.toNodeId));
    const styleNode = nodes.find((node) => node.metadata?.workflowKind === "styleboard");
    const linkedNovelNode = nodes.find((node) => node.type === CanvasNodeType.Text && node.metadata?.document?.kind === "novel" && isConnectedToStoryboard(node.id));
    const storyNode = storyInputNode || linkedNovelNode || agentScriptNode;
    const scriptNode = storyboardScripts.find((node) => meaningfulStoryboardRows(node).length > 0) || storyboardScripts[0];
    const meaningfulRows = scriptNode ? meaningfulStoryboardRows(scriptNode) : [];
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const successfulVideoNodeIds = new Set(nodes.filter(isSuccessfulVideoNode).map((node) => node.id));
    const completedShotVideos = nodes.filter(
        (node) => isSuccessfulVideoNode(node) && (node.metadata?.workflowKind === "shot" || connections.some((connection) => shotNodes.some((shot) => shot.id === connection.fromNodeId) && connection.toNodeId === node.id)),
    );
    const finalNode = finalNodes.find((node) => node.metadata?.status === "success" && Boolean(node.metadata.content));

    const storyText = (storyNode?.metadata?.document?.plainText || storyNode?.metadata?.content || "").trim();
    // 手工流水线要求输入真实连到分镜脚本；Agent 协议的风格板和剧本没有这条连线，按领域节点本身判断。
    const styleDone = Boolean((styleNode?.metadata?.content || styleNode?.metadata?.prompt || "").trim() && (hasAgentPipeline || !scriptNode || isConnectedToStoryboard(styleNode!.id)));
    const storyDone = Boolean(storyText && storyNode && (storyNode === agentScriptNode || !scriptNode || isConnectedToStoryboard(storyNode.id)));
    const storyboardDone = meaningfulRows.length > 0 || shotNodes.length > 0;
    const rowsWithVideo = meaningfulRows.filter((row) => row.videoNodeId && nodeById.get(row.videoNodeId)?.type === CanvasNodeType.Video);
    const videoDone =
        meaningfulRows.length > 0
            ? rowsWithVideo.length === meaningfulRows.length &&
              rowsWithVideo.every((row) => {
                  const videoNode = nodeById.get(row.videoNodeId!);
                  return videoNode?.metadata?.status === "success" && Boolean(videoNode.metadata.content);
              })
            : shotNodes.length > 0 && shotNodes.every((shot) => connections.some((connection) => connection.fromNodeId === shot.id && successfulVideoNodeIds.has(connection.toNodeId)));
    const done = [styleDone, storyDone, storyboardDone, videoDone, Boolean(finalNode)];
    const firstIncomplete = done.findIndex((value) => !value);
    const firstShotNode = shotNodes[0];
    const definitions: Array<{ id: CanvasShortDramaStepId; label: string; nodeId?: string }> = [
        { id: "style", label: "选择画风", nodeId: styleNode?.id },
        { id: "story", label: "输入故事", nodeId: storyNode?.id },
        { id: "storyboard", label: "生成分镜", nodeId: scriptNode?.id || firstShotNode?.id },
        { id: "video", label: "生成视频", nodeId: scriptNode?.id || firstShotNode?.id || completedShotVideos[0]?.id },
        { id: "final", label: "合并成片", nodeId: finalNode?.id || finalNodes[0]?.id || completedShotVideos[0]?.id },
    ];
    const steps = definitions.map((step, index): CanvasShortDramaStep => ({
        ...step,
        status: done[index] ? "completed" : index === firstIncomplete ? "current" : "pending",
    }));
    return {
        active,
        completed: done.every(Boolean),
        completedCount: done.filter(Boolean).length,
        steps,
    };
}

export function storyInputNodeWithMode(node: CanvasNodeData, mode: "novel" | "brief") {
    const content = (node.metadata?.document?.plainText || node.metadata?.content || "").trim();
    if (mode === "brief") {
        const metadata = { ...node.metadata, content, storyInputMode: mode, status: content ? ("success" as const) : ("idle" as const) };
        delete metadata.document;
        return { ...node, title: "故事输入 · 梗概", metadata };
    }
    const chapter = createDocumentChapter("第 1 章", content, 0);
    return {
        ...node,
        title: "故事输入 · 小说",
        metadata: {
            ...node.metadata,
            content,
            storyInputMode: mode,
            status: content ? ("success" as const) : ("idle" as const),
            document: {
                kind: "novel" as const,
                format: "tiptap-json" as const,
                json: chapter.json,
                plainText: content,
                characterCount: Array.from(content).length,
                chapters: [chapter],
                activeChapterId: chapter.id,
                updatedAt: new Date().toISOString(),
            },
        },
    };
}

export function readShortDramaGuideDismissed() {
    try {
        return scopedLocalStorage.getItem(SHORT_DRAMA_GUIDE_STORAGE_KEY) === "dismissed";
    } catch (error) {
        console.warn("读取短剧导引状态失败", error);
        return false;
    }
}

export function persistShortDramaGuideDismissed() {
    try {
        scopedLocalStorage.setItem(SHORT_DRAMA_GUIDE_STORAGE_KEY, "dismissed");
    } catch (error) {
        console.warn("保存短剧导引状态失败", error);
    }
}

function meaningfulStoryboardRows(node: CanvasNodeData) {
    return (node.metadata?.storyboard?.rows || []).filter((row) => Boolean((row.plotDescription || row.imageGenerationPrompt || row.videoMotionPrompt).trim()));
}

function isSuccessfulVideoNode(node: CanvasNodeData) {
    return node.type === CanvasNodeType.Video && node.metadata?.status === "success" && Boolean(node.metadata.content);
}

function normalizeSeedPrompt(prompt: string) {
    return prompt.replace(/\s+/g, " ").trim().slice(0, 1200);
}

function seededStylePrompt(seedPrompt: string) {
    return `电影级视觉风格：围绕「${seedPrompt}」建立统一色调、主角造型、场景质感和镜头语言。优先保持角色一致、空间连续、光影克制。`;
}

function createSeedStoryboardRows(seedPrompt: string) {
    return [
        createStoryboardRow(1, {
            durationSeconds: 5,
            plotDescription: `${seedPrompt}。建立主角、环境和核心情绪。`,
            shotSize: "远景 / 中景",
            camera: "缓慢推进",
            motion: "角色进入画面，环境细节逐步显现",
            lightingAndAtmosphere: "电影感自然光，氛围克制",
            imageGenerationPrompt: `电影感关键帧，${seedPrompt}，建立场景与主角，构图清晰，统一画风`,
            videoMotionPrompt: `缓慢推进镜头，建立环境和主角状态，节奏克制`,
        }),
        createStoryboardRow(2, {
            durationSeconds: 5,
            plotDescription: "冲突或目标被明确，人物关系开始发生变化。",
            shotSize: "中近景",
            camera: "跟拍 / 轻微环绕",
            motion: "人物动作带出冲突，画面保持连续",
            lightingAndAtmosphere: "对比增强，情绪升温",
            imageGenerationPrompt: `电影感关键帧，${seedPrompt}，冲突升级，人物关系明确，保持角色一致`,
            videoMotionPrompt: `跟拍人物动作，制造紧张感，动作自然连续`,
        }),
        createStoryboardRow(3, {
            durationSeconds: 6,
            plotDescription: "给出反转、选择或情绪落点，为后续成片留下钩子。",
            shotSize: "特写 / 近景",
            camera: "定格后轻推",
            motion: "情绪停顿，关键信息被看见",
            lightingAndAtmosphere: "重点光落在人物或关键物件上",
            imageGenerationPrompt: `电影感关键帧，${seedPrompt}，情绪落点，特写构图，高级质感`,
            videoMotionPrompt: `轻推镜头聚焦关键表情或物件，结尾保留悬念`,
        }),
    ];
}
