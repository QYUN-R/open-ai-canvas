import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { App } from "antd";

import { createShortDramaPipeline, deriveShortDramaProgress, persistShortDramaGuideDismissed, readShortDramaGuideDismissed, storyInputNodeWithMode, type CanvasShortDramaStepId } from "@/lib/canvas/canvas-short-drama";
import type { CanvasConnection, CanvasNodeData, Position } from "@/types/canvas";

type UseCanvasShortDramaOptions = {
    nodes: CanvasNodeData[];
    connections: CanvasConnection[];
    nodesRef: { current: CanvasNodeData[] };
    connectionsRef: { current: CanvasConnection[] };
    selectedNodeIdsRef: { current: Set<string> };
    getCanvasCenter: () => Position;
    setNodes: Dispatch<SetStateAction<CanvasNodeData[]>>;
    setConnections: Dispatch<SetStateAction<CanvasConnection[]>>;
    setSelectedNodeIds: Dispatch<SetStateAction<Set<string>>>;
    setSelectedConnectionId: Dispatch<SetStateAction<string | null>>;
    setStylePickerOpen: Dispatch<SetStateAction<boolean>>;
    setDocumentEditorNodeId: Dispatch<SetStateAction<string | null>>;
    fitCanvasSelection: () => boolean;
    focusCanvasNode: (nodeId: string) => void;
    openTextEditor: (node: CanvasNodeData) => void;
};

export function useCanvasShortDrama({
    nodes,
    connections,
    nodesRef,
    connectionsRef,
    selectedNodeIdsRef,
    getCanvasCenter,
    setNodes,
    setConnections,
    setSelectedNodeIds,
    setSelectedConnectionId,
    setStylePickerOpen,
    setDocumentEditorNodeId,
    fitCanvasSelection,
    focusCanvasNode,
    openTextEditor,
}: UseCanvasShortDramaOptions) {
    const { message } = App.useApp();
    const dismissedRef = useRef(readShortDramaGuideDismissed());
    const [guideCollapsed, setGuideCollapsed] = useState(dismissedRef.current);
    const progress = useMemo(() => deriveShortDramaProgress(nodes, connections), [connections, nodes]);

    const selectNodes = useCallback(
        (ids: string[]) => {
            const selection = new Set(ids);
            selectedNodeIdsRef.current = selection;
            setSelectedNodeIds(selection);
            setSelectedConnectionId(null);
        },
        [selectedNodeIdsRef, setSelectedConnectionId, setSelectedNodeIds],
    );

    const createPipelineFromPrompt = useCallback(
        (prompt?: string) => {
            if (nodesRef.current.length) {
                message.info("当前画布已有内容，请在新画布创建影视工作流");
                return false;
            }
            const pipeline = createShortDramaPipeline(getCanvasCenter(), { expanded: true, seedPrompt: prompt });
            nodesRef.current = pipeline.nodes;
            connectionsRef.current = pipeline.connections;
            setNodes(pipeline.nodes);
            setConnections(pipeline.connections);
            selectNodes(pipeline.nodes.map((node) => node.id));
            if (!dismissedRef.current) setGuideCollapsed(false);
            queueMicrotask(() => {
                fitCanvasSelection();
                if (!prompt?.trim()) setStylePickerOpen(true);
            });
            message.success(prompt?.trim() ? "已根据创意生成影视工作流" : "影视工作流已创建");
            return true;
        },
        [connectionsRef, fitCanvasSelection, getCanvasCenter, message, nodesRef, selectNodes, setConnections, setNodes, setStylePickerOpen],
    );

    const createPipeline = useCallback(() => {
        createPipelineFromPrompt();
    }, [createPipelineFromPrompt]);

    const setStoryInputMode = useCallback(
        (nodeId: string, mode: "novel" | "brief") => {
            const current = nodesRef.current.find((node) => node.id === nodeId);
            if (!current || current.metadata?.workflowKind !== "story_input") return;
            const updated = storyInputNodeWithMode(current, mode);
            nodesRef.current = nodesRef.current.map((node) => (node.id === nodeId ? updated : node));
            setNodes(nodesRef.current);
            selectNodes([nodeId]);
            queueMicrotask(() => {
                if (mode === "novel") setDocumentEditorNodeId(nodeId);
                else openTextEditor(updated);
            });
        },
        [nodesRef, openTextEditor, selectNodes, setDocumentEditorNodeId, setNodes],
    );

    const openStoryInput = useCallback(
        (nodeId?: string) => {
            const storyNode =
                (nodeId ? nodesRef.current.find((node) => node.id === nodeId) : undefined) || nodesRef.current.find((node) => node.metadata?.workflowKind === "story_input") || nodesRef.current.find((node) => node.metadata?.workflowKind === "script");
            if (!storyNode) return;
            focusCanvasNode(storyNode.id);
            queueMicrotask(() => openTextEditor(storyNode));
        },
        [focusCanvasNode, nodesRef, openTextEditor],
    );

    const activateStep = useCallback(
        (stepId: CanvasShortDramaStepId) => {
            const step = progress.steps.find((item) => item.id === stepId);
            if (stepId === "style") {
                if (step?.nodeId) focusCanvasNode(step.nodeId);
                setStylePickerOpen(true);
                return;
            }
            if (stepId === "story") {
                openStoryInput(step?.nodeId);
                return;
            }
            if (step?.nodeId) focusCanvasNode(step.nodeId);
        },
        [focusCanvasNode, openStoryInput, progress.steps, setStylePickerOpen],
    );

    const skipGuide = useCallback(() => {
        dismissedRef.current = true;
        persistShortDramaGuideDismissed();
        setGuideCollapsed(true);
    }, []);

    useEffect(() => {
        const dismissed = readShortDramaGuideDismissed();
        dismissedRef.current = dismissed;
        setGuideCollapsed(dismissed);
    }, []);

    useEffect(() => {
        if (!progress.completed) return;
        dismissedRef.current = true;
        persistShortDramaGuideDismissed();
        setGuideCollapsed(true);
    }, [progress.completed]);

    return {
        activateStep,
        createPipeline,
        createPipelineFromPrompt,
        guideCollapsed,
        openStoryInput,
        progress,
        setGuideCollapsed,
        setStoryInputMode,
        skipGuide,
    };
}
