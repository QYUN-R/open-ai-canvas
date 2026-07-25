import { App, Button, ColorPicker, Input, InputNumber, Select, Slider, Switch } from "antd";
import { Box, BoxSelect, Camera, Circle, Clapperboard, Cuboid, FileUp, Focus, Image as ImageIcon, LampDesk, Lightbulb, Move3D, Pause, Play, Plus, Redo2, Rotate3D, Save, Scaling, Trash2, Undo2, UserRound, Video, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { nanoid } from "nanoid";

import { DirectorViewport, type DirectorViewportHandle } from "@/components/canvas/director/director-viewport";
import { canvasThemes } from "@/lib/canvas-theme";
import { compileDirectorPrompt } from "@/lib/canvas/director/director-prompt-compiler";
import { createDirectorCamera, createDirectorEnvironment, createDirectorLight, createDirectorModel, createDirectorObject, touchDirectorScene, upsertDirectorKeyframe } from "@/lib/canvas/director/director-scene";
import { uploadMediaFile } from "@/services/file-storage";
import { uploadImage } from "@/services/image-storage";
import { useAssetStore, type ImageAsset, type ModelAsset } from "@/stores/use-asset-store";
import { useDirectorWorkbenchStore } from "@/stores/canvas/use-director-workbench-store";
import { useThemeStore } from "@/stores/use-theme-store";
import type { CanvasNodeData } from "@/types/canvas";
import type { DirectorCamera, DirectorCameraMove, DirectorLight, DirectorObject, DirectorScene, DirectorSceneOutput, DirectorShot, DirectorShotSize, DirectorTransform, DirectorVec3 } from "@/types/director";

export function CanvasDirectorWorkbench({ open, scene, imageNodes, onClose, onChange, onApply }: { open: boolean; scene: DirectorScene | null; imageNodes: CanvasNodeData[]; onClose: () => void; onChange: (scene: DirectorScene) => void; onApply: (output: DirectorSceneOutput) => Promise<void> }) {
    const { message } = App.useApp();
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const viewportRef = useRef<DirectorViewportHandle>(null);
    const modelInputRef = useRef<HTMLInputElement>(null);
    const sceneImageInputRef = useRef<HTMLInputElement>(null);
    const [draft, setDraft] = useState<DirectorScene | null>(null);
    const [history, setHistory] = useState<DirectorScene[]>([]);
    const [future, setFuture] = useState<DirectorScene[]>([]);
    const [saving, setSaving] = useState(false);
    const selectedObjectId = useDirectorWorkbenchStore((state) => state.selectedObjectId);
    const selectedLightId = useDirectorWorkbenchStore((state) => state.selectedLightId);
    const transformMode = useDirectorWorkbenchStore((state) => state.transformMode);
    const renderMode = useDirectorWorkbenchStore((state) => state.renderMode);
    const playhead = useDirectorWorkbenchStore((state) => state.playhead);
    const playing = useDirectorWorkbenchStore((state) => state.playing);
    const setSelectedObjectId = useDirectorWorkbenchStore((state) => state.setSelectedObjectId);
    const setSelectedLightId = useDirectorWorkbenchStore((state) => state.setSelectedLightId);
    const setTransformMode = useDirectorWorkbenchStore((state) => state.setTransformMode);
    const setRenderMode = useDirectorWorkbenchStore((state) => state.setRenderMode);
    const setPlayhead = useDirectorWorkbenchStore((state) => state.setPlayhead);
    const setPlaying = useDirectorWorkbenchStore((state) => state.setPlaying);
    const resetWorkbench = useDirectorWorkbenchStore((state) => state.reset);
    const assets = useAssetStore((state) => state.assets);
    const addAsset = useAssetStore((state) => state.addAsset);
    const modelAssets = useMemo(() => assets.filter((asset): asset is ModelAsset => asset.kind === "model"), [assets]);
    const imageAssets = useMemo(() => assets.filter((asset): asset is ImageAsset => asset.kind === "image"), [assets]);
    const sceneSpaceEntries = useMemo(() => createSceneSpaceEntries(imageNodes, imageAssets), [imageAssets, imageNodes]);

    useEffect(() => {
        if (!open || !scene) return;
        setDraft(structuredClone(scene));
        setHistory([]);
        setFuture([]);
        resetWorkbench();
    }, [open, resetWorkbench, scene]);

    const activeShot = draft?.shots?.find((item) => item.id === draft.activeShotId) || draft?.shots?.[0] || null;
    const activeCamera = draft?.cameras?.find((item) => item.id === activeShot?.cameraId) || draft?.cameras?.[0] || null;
    const activeEnvironment = draft?.objects?.find((item) => item.kind === "environment") || null;
    const selectedObject = draft?.objects?.find((item) => item.id === selectedObjectId && item.kind !== "environment") || null;
    const selectedLight = draft?.lights?.find((item) => item.id === selectedLightId) || null;

    useEffect(() => {
        if (!playing || !activeShot) return;
        let frame = 0;
        let last = performance.now();
        const tick = (now: number) => {
            const delta = (now - last) / 1000;
            last = now;
            const next = useDirectorWorkbenchStore.getState().playhead + delta;
            setPlayhead(next >= activeShot.duration ? 0 : next);
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [activeShot, playing, setPlayhead]);

    const commit = useCallback((updater: (current: DirectorScene) => DirectorScene) => {
        setDraft((current) => {
            if (!current) return current;
            const next = touchDirectorScene(updater(current));
            setHistory((items) => [...items.slice(-49), structuredClone(current)]);
            setFuture([]);
            return next;
        });
    }, []);

    const replaceWithoutHistory = useCallback((updater: (current: DirectorScene) => DirectorScene) => setDraft((current) => (current ? touchDirectorScene(updater(current)) : current)), []);

    const undo = () => {
        const previous = history.at(-1);
        if (!previous || !draft) return;
        setHistory((items) => items.slice(0, -1));
        setFuture((items) => [structuredClone(draft), ...items].slice(0, 50));
        setDraft(previous);
    };
    const redo = () => {
        const next = future[0];
        if (!next || !draft) return;
        setFuture((items) => items.slice(1));
        setHistory((items) => [...items, structuredClone(draft)].slice(-50));
        setDraft(next);
    };

    const activateShot = (shotId: string) => {
        commit((current) => ({ ...current, activeShotId: shotId }));
        setSelectedObjectId(null);
        setSelectedLightId(null);
        setPlayhead(0);
    };

    const updateObject = (id: string, patch: Partial<DirectorObject>) => commit((current) => ({ ...current, objects: current.objects.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));
    const updateLight = (id: string, patch: Partial<DirectorLight>) => commit((current) => ({ ...current, lights: current.lights.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));
    const updateShot = (id: string, patch: Partial<DirectorShot>) => commit((current) => ({ ...current, shots: current.shots.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));

    const addPrimitive = (primitive: DirectorObject["primitive"], name: string) => {
        const object = createDirectorObject(primitive, name);
        commit((current) => ({ ...current, objects: [...current.objects, object] }));
        setSelectedObjectId(object.id);
    };

    const addModelAsset = (asset: ModelAsset) => {
        const object = createDirectorModel({ name: asset.title, assetId: asset.id, storageKey: asset.data.storageKey, url: asset.data.url, mimeType: asset.data.mimeType });
        commit((current) => ({ ...current, objects: [...current.objects, object] }));
        setSelectedObjectId(object.id);
    };

    const uploadModel = async (file?: File) => {
        if (!file || !/\.(glb|gltf)$/i.test(file.name)) return;
        const uploaded = await uploadMediaFile(file, "model");
        const assetId = addAsset({ kind: "model", title: file.name.replace(/\.(glb|gltf)$/i, ""), coverUrl: "", tags: ["3D模型"], source: "导演台", data: { url: uploaded.url, storageKey: uploaded.storageKey, bytes: uploaded.bytes, mimeType: uploaded.mimeType, fileName: file.name }, metadata: { source: "director" } });
        const asset = useAssetStore.getState().assets.find((item): item is ModelAsset => item.id === assetId && item.kind === "model");
        if (asset) addModelAsset(asset);
        message.success("3D 模型已加入场景和素材库");
    };

    const addSceneSpace = (input: { title: string; url: string; storageKey?: string; sourceNodeId?: string }) => {
        const object = createDirectorEnvironment(`空间场景 · ${input.title}`, input.url, input.storageKey, input.sourceNodeId);
        const activeCameraId = activeShot?.cameraId;
        commit((current) => ({
            ...current,
            objects: [...current.objects.filter((item) => !isSceneSpaceObject(item)), object],
            background: "#070a10",
            environmentIntensity: Math.max(current.environmentIntensity, 0.9),
            gridVisible: false,
            cameras: current.cameras.map((camera) => camera.id === activeCameraId ? { ...camera, transform: directorTemplateTransform([0, 1.8, 5.4]), target: [0, 1.28, -2.6], focalLength: 35, fov: focalLengthToFov(35), focusDistance: 5.5 } : camera),
        }));
        setSelectedObjectId(null);
        setSelectedLightId(null);
        message.success("空间场景已导入导演台");
    };

    const addSceneSpaceFromNode = (node: CanvasNodeData) => {
        if (!node.metadata?.content) return;
        addSceneSpace({ title: node.title, url: node.metadata.content, storageKey: node.metadata.storageKey, sourceNodeId: node.id });
    };

    const addSceneSpaceFromAsset = (asset: ImageAsset) => addSceneSpace({ title: asset.title, url: asset.data.dataUrl, storageKey: asset.data.storageKey });

    const uploadSceneSpace = async (file?: File) => {
        if (!file || !file.type.startsWith("image/")) return;
        const image = await uploadImage(file);
        const title = file.name.replace(/\.[^.]+$/, "");
        addAsset({ kind: "image", title, coverUrl: image.url, tags: ["空间场景", "场景图"], source: "导演台", data: { dataUrl: image.url, storageKey: image.storageKey, width: image.width, height: image.height, bytes: image.bytes, mimeType: image.mimeType }, metadata: { source: "director-scene-space" } });
        addSceneSpace({ title, url: image.url, storageKey: image.storageKey });
    };

    const addCamera = () => {
        const camera = createDirectorCamera(`摄影机 ${draft?.cameras.length ? draft.cameras.length + 1 : 1}`);
        commit((current) => ({ ...current, cameras: [...current.cameras, camera], shots: activeShot ? current.shots.map((item) => item.id === activeShot.id ? { ...item, cameraId: camera.id } : item) : current.shots }));
        setSelectedObjectId(null);
        setSelectedLightId(null);
    };

    const addLight = () => {
        const light = createDirectorLight("point", `灯光 ${draft?.lights.length ? draft.lights.length + 1 : 1}`, [2, 3, 2], 1.5);
        commit((current) => ({ ...current, lights: [...current.lights, light] }));
        setSelectedLightId(light.id);
    };

    const addShot = () => {
        if (!activeCamera) return;
        const shot: DirectorShot = { id: nanoid(), name: `镜头 ${(draft?.shots.length || 0) + 1}`, cameraId: activeCamera.id, duration: 5, shotSize: "medium", cameraMove: "static", prompt: "" };
        commit((current) => ({ ...current, shots: [...current.shots, shot], activeShotId: shot.id }));
        setPlayhead(0);
    };

    const addObjectKeyframe = () => {
        if (!selectedObject) return;
        updateObject(selectedObject.id, { keyframes: upsertDirectorKeyframe(selectedObject.keyframes, playhead, selectedObject.transform) });
    };

    const addCameraKeyframe = () => {
        if (!activeCamera) return;
        commit((current) => ({ ...current, cameras: current.cameras.map((item) => item.id === activeCamera.id ? { ...item, keyframes: upsertDirectorKeyframe(item.keyframes, playhead, item.transform) } : item) }));
    };

    const applyCameraMove = () => {
        if (!activeCamera || !activeShot) return;
        const keyframes = createCameraMoveKeyframes(activeCamera.transform, activeShot.cameraMove, activeShot.duration);
        commit((current) => ({ ...current, cameras: current.cameras.map((item) => item.id === activeCamera.id ? { ...item, keyframes } : item) }));
        message.success("已生成相机运动关键帧");
    };

    const alignCameraToView = () => {
        if (!activeCamera) return;
        const transform = viewportRef.current?.readCameraTransform();
        if (!transform) return;
        commit((current) => ({ ...current, cameras: current.cameras.map((item) => item.id === activeCamera.id ? { ...item, transform } : item) }));
        message.success("摄影机已对齐当前视图");
    };

    const applyShotTemplate = (template: DirectorShotTemplate) => {
        if (!activeCamera || !activeShot) return;
        const transform = cloneTransform(template.transform);
        const duration = template.duration ?? activeShot.duration;
        const focalLength = template.focalLength;
        const keyframes = createCameraMoveKeyframes(transform, template.cameraMove, duration);
        commit((current) => ({
            ...current,
            shots: current.shots.map((item) => item.id === activeShot.id ? { ...item, shotSize: template.shotSize, cameraMove: template.cameraMove, duration, prompt: item.prompt.trim() ? item.prompt : template.prompt } : item),
            cameras: current.cameras.map((item) => item.id === activeCamera.id ? { ...item, transform, target: template.target, focalLength, fov: focalLengthToFov(focalLength), focusDistance: template.focusDistance, keyframes } : item),
        }));
        setSelectedObjectId(null);
        setSelectedLightId(null);
        setPlayhead(0);
        message.success(`已应用镜头模板：${template.label}`);
    };

    const applyToCanvas = async () => {
        if (!draft || !activeShot || !viewportRef.current) return;
        setSaving(true);
        try {
            const beauty = await viewportRef.current.capture("beauty");
            const depth = await viewportRef.current.capture("depth");
            const normal = await viewportRef.current.capture("normal");
            const prompt = compileDirectorPrompt(draft, activeShot);
            const next = touchDirectorScene(draft);
            setDraft(next);
            onChange(next);
            await onApply({ scene: next, shot: activeShot, prompt, beauty, depth, normal });
            message.success("镜头已回写画布");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "导演台输出失败");
        } finally {
            setSaving(false);
        }
    };

    if (!open || !draft || !activeShot) return null;

    return (
        <div data-canvas-no-zoom className="fixed inset-0 z-[500] flex min-h-0 flex-col overflow-hidden" style={{ background: theme.canvas.background, color: theme.node.text }}>
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border }}>
                <IconButton label="关闭导演台" onClick={onClose}><X className="size-4" /></IconButton>
                <Input variant="borderless" value={draft.title} className="max-w-56 font-medium" onChange={(event) => replaceWithoutHistory((current) => ({ ...current, title: event.target.value }))} />
                <span className="h-5 w-px" style={{ background: theme.toolbar.border }} />
                <IconButton label="撤销" disabled={!history.length} onClick={undo}><Undo2 className="size-4" /></IconButton>
                <IconButton label="重做" disabled={!future.length} onClick={redo}><Redo2 className="size-4" /></IconButton>
                <span className="h-5 w-px" style={{ background: theme.toolbar.border }} />
                <ToolButton label="移动" active={transformMode === "translate"} onClick={() => setTransformMode("translate")}><Move3D className="size-4" /></ToolButton>
                <ToolButton label="旋转" active={transformMode === "rotate"} onClick={() => setTransformMode("rotate")}><Rotate3D className="size-4" /></ToolButton>
                <ToolButton label="缩放" active={transformMode === "scale"} onClick={() => setTransformMode("scale")}><Scaling className="size-4" /></ToolButton>
                <div className="ml-auto flex items-center gap-1">
                    <Select size="small" value={renderMode} className="w-24" options={[{ label: "预览", value: "beauty" }, { label: "深度", value: "depth" }, { label: "法线", value: "normal" }]} onChange={setRenderMode} />
                    <Button size="small" type="primary" icon={<Save className="size-3.5" />} loading={saving} onClick={() => void applyToCanvas()}>应用到镜头</Button>
                </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-[252px_minmax(0,1fr)_320px] max-lg:grid-cols-[200px_minmax(0,1fr)]">
                <aside className="thin-scrollbar min-h-0 overflow-y-auto border-r" style={{ background: theme.node.panel, borderColor: theme.toolbar.border }}>
                    <PanelTitle title="镜头列表" action={<IconButton label="新增镜头" onClick={addShot}><Plus className="size-3.5" /></IconButton>} />
                    <div className="space-y-1 px-2 pb-3">
                        {draft.shots.map((shot, index) => (
                            <ShotListRow key={shot.id} active={draft.activeShotId === shot.id} shot={shot} index={index} cameraName={draft.cameras.find((camera) => camera.id === shot.cameraId)?.name || "无摄影机"} onClick={() => activateShot(shot.id)} />
                        ))}
                    </div>
                    {activeEnvironment ? <><PanelTitle title="当前空间" /><div className="px-2 pb-2"><SceneRow icon={<Clapperboard />} label={activeEnvironment.name.replace(/^空间场景 · /, "")} onClick={() => { setSelectedObjectId(null); setSelectedLightId(null); }} /></div></> : null}
                    <PanelTitle title="场景对象" action={<IconButton label="添加立方体" onClick={() => addPrimitive("box", "立方体")}><Plus className="size-3.5" /></IconButton>} />
                    <div className="px-2 pb-2">
                        {draft.objects.filter((object) => object.kind !== "environment").map((object) => <SceneRow key={object.id} active={selectedObjectId === object.id} icon={object.primitive === "character" ? <UserRound /> : object.kind === "model" ? <BoxSelect /> : object.kind === "billboard" ? <ImageIcon /> : <Cuboid />} label={object.name} onClick={() => setSelectedObjectId(object.id)} />)}
                    </div>
                    <PanelTitle title="摄影机" action={<IconButton label="添加摄影机" onClick={addCamera}><Plus className="size-3.5" /></IconButton>} />
                    <div className="px-2 pb-2">{draft.cameras.map((camera) => <SceneRow key={camera.id} active={activeShot.cameraId === camera.id && !selectedObjectId && !selectedLightId} icon={<Camera />} label={camera.name} onClick={() => { setSelectedObjectId(null); setSelectedLightId(null); updateShot(activeShot.id, { cameraId: camera.id }); }} />)}</div>
                    <PanelTitle title="灯光" action={<IconButton label="添加灯光" onClick={addLight}><Plus className="size-3.5" /></IconButton>} />
                    <div className="px-2 pb-2">{draft.lights.map((light) => <SceneRow key={light.id} active={selectedLightId === light.id} icon={<Lightbulb />} label={light.name} onClick={() => setSelectedLightId(light.id)} />)}</div>
                    <PanelTitle title="快速添加" />
                    <div className="grid grid-cols-2 gap-1.5 px-2 pb-3">
                        <QuickAdd label="演员" icon={<UserRound />} onClick={() => addPrimitive("character", "演员")} />
                        <QuickAdd label="立方体" icon={<Box />} onClick={() => addPrimitive("box", "立方体")} />
                        <QuickAdd label="球体" icon={<Circle />} onClick={() => addPrimitive("sphere", "球体")} />
                        <QuickAdd label="圆柱" icon={<Cuboid />} onClick={() => addPrimitive("cylinder", "圆柱")} />
                        <QuickAdd label="上传模型" icon={<FileUp />} onClick={() => modelInputRef.current?.click()} />
                        <QuickAdd label="添加灯光" icon={<LampDesk />} onClick={addLight} />
                        <QuickAdd label="导入空间图" icon={<ImageIcon />} onClick={() => sceneImageInputRef.current?.click()} />
                    </div>
                    {sceneSpaceEntries.length ? <><PanelTitle title="空间场景" action={<IconButton label="上传空间图" onClick={() => sceneImageInputRef.current?.click()}><FileUp className="size-3.5" /></IconButton>} /><div className="px-2 pb-3">{sceneSpaceEntries.map((entry) => <SceneRow key={entry.id} icon={<ImageIcon />} label={entry.title} onClick={() => entry.kind === "node" ? addSceneSpaceFromNode(entry.node) : addSceneSpaceFromAsset(entry.asset)} />)}</div></> : null}
                    {modelAssets.length ? <><PanelTitle title="3D 素材" /><div className="px-2 pb-3">{modelAssets.map((asset) => <SceneRow key={asset.id} icon={<BoxSelect />} label={asset.title} onClick={() => addModelAsset(asset)} />)}</div></> : null}
                    <input ref={modelInputRef} type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" className="hidden" onChange={(event) => { void uploadModel(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                    <input ref={sceneImageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { void uploadSceneSpace(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                </aside>

                <main className="relative min-h-0 overflow-hidden bg-neutral-900">
                    <DirectorViewport ref={viewportRef} scene={draft} selectedObjectId={selectedObjectId} transformMode={transformMode} renderMode={renderMode} playhead={playhead} onSelectObject={setSelectedObjectId} onObjectTransform={(id, transform) => updateObject(id, { transform })} />
                    <div className="absolute left-3 right-3 top-3 flex flex-wrap items-center gap-2">
                        <div className="pointer-events-none flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-black/45 px-2.5 py-1.5 text-[11px] font-medium text-white/76 shadow-xl backdrop-blur-md">
                            <Clapperboard className="size-3.5 shrink-0" />
                            <span className="truncate">{activeShot.name}</span>
                            <span className="text-white/35">/</span>
                            <span className="truncate">{activeCamera?.name || "无摄影机"}</span>
                            <span className="text-white/35">/</span>
                            <span>{activeShot.duration}s</span>
                        </div>
                        <div className="ml-auto flex items-center gap-1 rounded-md border border-white/10 bg-black/45 p-1 shadow-xl backdrop-blur-md">
                            <Button size="small" type="text" icon={<Camera className="size-3.5" />} className="text-white/80 hover:!text-white" onClick={alignCameraToView}>对齐视角</Button>
                            <Button size="small" type="text" icon={<Video className="size-3.5" />} className="text-white/80 hover:!text-white" onClick={applyCameraMove}>生成轨迹</Button>
                            <Button size="small" type="text" icon={<Focus className="size-3.5" />} className="text-white/80 hover:!text-white" onClick={addCameraKeyframe}>相机关键帧</Button>
                        </div>
                    </div>
                </main>

                <aside className="thin-scrollbar min-h-0 overflow-y-auto border-l max-lg:hidden" style={{ background: theme.node.panel, borderColor: theme.toolbar.border }}>
                    {selectedObject ? <ObjectInspector object={selectedObject} playhead={playhead} onUpdate={(patch) => updateObject(selectedObject.id, patch)} onAddKeyframe={addObjectKeyframe} onDelete={() => { commit((current) => ({ ...current, objects: current.objects.filter((item) => item.id !== selectedObject.id) })); setSelectedObjectId(null); }} /> : selectedLight ? <LightInspector light={selectedLight} onUpdate={(patch) => updateLight(selectedLight.id, patch)} onDelete={() => { commit((current) => ({ ...current, lights: current.lights.filter((item) => item.id !== selectedLight.id) })); setSelectedLightId(null); }} /> : <ShotInspector shot={activeShot} camera={activeCamera} cameras={draft.cameras} onUpdateShot={(patch) => updateShot(activeShot.id, patch)} onUpdateCamera={(patch) => activeCamera && commit((current) => ({ ...current, cameras: current.cameras.map((item) => item.id === activeCamera.id ? { ...item, ...patch } : item) }))} onAddCameraKeyframe={addCameraKeyframe} onApplyCameraMove={applyCameraMove} onAlignCameraToView={alignCameraToView} onApplyShotTemplate={applyShotTemplate} />}
                </aside>
            </div>

            <footer className="shrink-0 border-t px-3 py-2" style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border }}>
                <div className="flex items-center gap-2">
                    <IconButton label={playing ? "暂停" : "播放"} onClick={() => setPlaying(!playing)}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</IconButton>
                    <span className="w-12 text-right text-[11px] tabular-nums">{playhead.toFixed(1)}s</span>
                    <Slider className="min-w-0 flex-1" min={0} max={activeShot.duration} step={0.05} value={playhead} onChange={setPlayhead} />
                    <Button size="small" type="text" icon={<Focus className="size-3.5" />} onClick={selectedObject ? addObjectKeyframe : addCameraKeyframe}>记录关键帧</Button>
                </div>
                <div className="mt-1.5 flex gap-1 overflow-x-auto">
                    {draft.shots.map((shot, index) => <button key={shot.id} type="button" className="h-8 min-w-28 shrink-0 border-l-2 px-2 text-left text-[11px] transition" style={{ borderColor: draft.activeShotId === shot.id ? theme.node.activeStroke : theme.toolbar.border, background: draft.activeShotId === shot.id ? theme.toolbar.itemHover : "transparent" }} onClick={() => activateShot(shot.id)}><span className="block truncate">{index + 1}. {shot.name}</span><span className="block opacity-45">{shot.duration}s · {cameraMoveLabelMap[shot.cameraMove]}</span></button>)}
                    <button type="button" className="grid h-8 w-9 shrink-0 place-items-center" title="新增镜头" onClick={addShot}><Plus className="size-4" /></button>
                </div>
            </footer>
        </div>
    );
}

function ObjectInspector({ object, playhead, onUpdate, onAddKeyframe, onDelete }: { object: DirectorObject; playhead: number; onUpdate: (patch: Partial<DirectorObject>) => void; onAddKeyframe: () => void; onDelete: () => void }) {
    return <Inspector title={object.name} onTitleChange={(name) => onUpdate({ name })} onDelete={onDelete}><TransformFields transform={object.transform} onChange={(transform) => onUpdate({ transform })} /><Field label="颜色"><ColorPicker value={object.color} onChange={(_, color) => onUpdate({ color })} /></Field>{object.primitive === "character" ? <Field label="姿势"><Select className="w-full" value={object.pose} options={poseOptions} onChange={(pose) => onUpdate({ pose })} /></Field> : null}<Field label="可见"><Switch checked={object.visible} onChange={(visible) => onUpdate({ visible })} /></Field><Field label="投射阴影"><Switch checked={object.castShadow} onChange={(castShadow) => onUpdate({ castShadow })} /></Field><Button block icon={<Focus className="size-3.5" />} onClick={onAddKeyframe}>在 {playhead.toFixed(1)}s 记录关键帧</Button><div className="text-[10px] opacity-50">已记录 {object.keyframes.length} 个关键帧</div></Inspector>;
}

function LightInspector({ light, onUpdate, onDelete }: { light: DirectorLight; onUpdate: (patch: Partial<DirectorLight>) => void; onDelete: () => void }) {
    return <Inspector title={light.name} onTitleChange={(name) => onUpdate({ name })} onDelete={onDelete}><Field label="类型"><Select className="w-full" value={light.type} options={[{ label: "方向光", value: "directional" }, { label: "点光源", value: "point" }, { label: "聚光灯", value: "spot" }, { label: "环境光", value: "ambient" }]} onChange={(type) => onUpdate({ type })} /></Field><Vec3Field label="位置" value={light.transform.position} onChange={(position) => onUpdate({ transform: { ...light.transform, position } })} /><Field label="颜色"><ColorPicker value={light.color} onChange={(_, color) => onUpdate({ color })} /></Field><Field label="强度"><InputNumber className="w-full" min={0} max={20} step={0.1} value={light.intensity} onChange={(value) => onUpdate({ intensity: value || 0 })} /></Field><Field label="投射阴影"><Switch checked={light.castShadow} onChange={(castShadow) => onUpdate({ castShadow })} /></Field></Inspector>;
}

function ShotInspector({ shot, camera, cameras, onUpdateShot, onUpdateCamera, onAddCameraKeyframe, onApplyCameraMove, onAlignCameraToView, onApplyShotTemplate }: { shot: DirectorShot; camera: DirectorCamera | null; cameras: DirectorScene["cameras"]; onUpdateShot: (patch: Partial<DirectorShot>) => void; onUpdateCamera: (patch: Partial<DirectorCamera>) => void; onAddCameraKeyframe: () => void; onApplyCameraMove: () => void; onAlignCameraToView: () => void; onApplyShotTemplate: (template: DirectorShotTemplate) => void }) {
    return <Inspector title={shot.name} onTitleChange={(name) => onUpdateShot({ name })}><ShotTemplatePanel onApply={onApplyShotTemplate} /><Field label="摄影机"><Select className="w-full" value={shot.cameraId} options={cameras.map((item) => ({ label: item.name, value: item.id }))} onChange={(cameraId) => onUpdateShot({ cameraId })} /></Field><div className="grid grid-cols-2 gap-2"><Field label="景别"><Select className="w-full" value={shot.shotSize} options={shotSizeOptions} onChange={(shotSize: DirectorShotSize) => onUpdateShot({ shotSize })} /></Field><Field label="运镜"><Select className="w-full" value={shot.cameraMove} options={cameraMoveOptions} onChange={(cameraMove: DirectorCameraMove) => onUpdateShot({ cameraMove })} /></Field></div><Field label="时长"><InputNumber className="w-full" min={0.5} max={60} step={0.5} value={shot.duration} addonAfter="秒" onChange={(value) => onUpdateShot({ duration: value || 5 })} /></Field><Field label="镜头意图"><Input.TextArea autoSize={{ minRows: 3, maxRows: 7 }} value={shot.prompt} placeholder="人物表演、动作、叙事目标…" onChange={(event) => onUpdateShot({ prompt: event.target.value })} /></Field>{camera ? <><FocalPresetRow value={camera.focalLength} onChange={(focalLength) => onUpdateCamera({ focalLength, fov: focalLengthToFov(focalLength) })} /><Vec3Field label="摄影机位置" value={camera.transform.position} onChange={(position) => onUpdateCamera({ transform: { ...camera.transform, position } })} /><Vec3Field label="焦点" value={camera.target} onChange={(target) => onUpdateCamera({ target })} /><Field label="焦距"><InputNumber className="w-full" min={12} max={200} value={camera.focalLength} addonAfter="mm" onChange={(focalLength) => onUpdateCamera({ focalLength: focalLength || 35, fov: focalLengthToFov(focalLength || 35) })} /></Field><div className="grid grid-cols-2 gap-2"><Field label="光圈"><InputNumber className="w-full" min={0.7} max={32} step={0.1} value={camera.aperture} addonBefore="f/" onChange={(aperture) => onUpdateCamera({ aperture: aperture || 2.8 })} /></Field><Field label="焦点距离"><InputNumber className="w-full" min={0.1} max={200} step={0.1} value={camera.focusDistance} addonAfter="m" onChange={(focusDistance) => onUpdateCamera({ focusDistance: focusDistance || 5 })} /></Field></div><Button block icon={<Camera className="size-3.5" />} onClick={onAlignCameraToView}>摄影机对齐当前视图</Button><Button block icon={<Video className="size-3.5" />} onClick={onApplyCameraMove}>按运镜生成轨迹</Button><Button block icon={<Focus className="size-3.5" />} onClick={onAddCameraKeyframe}>记录摄影机关键帧</Button></> : null}</Inspector>;
}

function Inspector({ title, children, onTitleChange, onDelete }: { title: string; children: ReactNode; onTitleChange: (value: string) => void; onDelete?: () => void }) {
    return <div className="space-y-3 p-3"><div className="flex items-center gap-2"><Input variant="borderless" value={title} className="min-w-0 flex-1 px-0 font-medium" onChange={(event) => onTitleChange(event.target.value)} />{onDelete ? <IconButton label="删除" onClick={onDelete}><Trash2 className="size-4" /></IconButton> : null}</div>{children}</div>;
}

function TransformFields({ transform, onChange }: { transform: DirectorTransform; onChange: (transform: DirectorTransform) => void }) {
    return <><Vec3Field label="位置" value={transform.position} onChange={(position) => onChange({ ...transform, position })} /><Vec3Field label="旋转" value={transform.rotation} step={0.05} onChange={(rotation) => onChange({ ...transform, rotation })} /><Vec3Field label="缩放" value={transform.scale} step={0.1} onChange={(scale) => onChange({ ...transform, scale })} /></>;
}

function Vec3Field({ label, value, step = 0.1, onChange }: { label: string; value: DirectorVec3; step?: number; onChange: (value: DirectorVec3) => void }) {
    return <Field label={label}><div className="grid grid-cols-3 gap-1">{value.map((item, index) => <InputNumber key={index} className="w-full" size="small" step={step} value={Number(item.toFixed(2))} onChange={(next) => onChange(value.map((entry, itemIndex) => itemIndex === index ? next || 0 : entry) as DirectorVec3)} />)}</div></Field>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1 block text-[11px] opacity-55">{label}</span>{children}</label>; }
function PanelTitle({ title, action }: { title: string; action?: ReactNode }) { return <div className="flex h-9 items-center px-3 text-[10px] font-semibold uppercase opacity-55"><span className="flex-1">{title}</span>{action}</div>; }
function SceneRow({ active, icon, label, onClick }: { active?: boolean; icon: ReactElement; label: string; onClick: () => void }) { return <button type="button" className={`flex h-8 w-full items-center gap-2 px-2 text-left text-xs transition ${active ? "bg-black/10 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5"}`} onClick={onClick}><span className="[&>svg]:size-3.5">{icon}</span><span className="truncate">{label}</span></button>; }
function QuickAdd({ label, icon, onClick }: { label: string; icon: ReactElement; onClick: () => void }) { return <button type="button" className="flex h-8 items-center gap-1.5 border px-2 text-[10px] transition hover:bg-black/5 dark:hover:bg-white/5" onClick={onClick}><span className="[&>svg]:size-3.5">{icon}</span><span className="truncate">{label}</span></button>; }
function IconButton({ label, disabled, children, onClick }: { label: string; disabled?: boolean; children: ReactNode; onClick: () => void }) { return <button type="button" aria-label={label} title={label} disabled={disabled} className="grid size-8 shrink-0 place-items-center rounded-md transition hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/10" onClick={onClick}>{children}</button>; }
function ToolButton({ label, active, children, onClick }: { label: string; active: boolean; children: ReactNode; onClick: () => void }) { return <button type="button" aria-label={label} title={label} className={`grid size-8 place-items-center rounded-md transition ${active ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-black/5 dark:hover:bg-white/10"}`} onClick={onClick}>{children}</button>; }

function ShotListRow({ active, shot, index, cameraName, onClick }: { active: boolean; shot: DirectorShot; index: number; cameraName: string; onClick: () => void }) {
    return <button type="button" className={`w-full border px-2.5 py-2 text-left transition ${active ? "border-white/20 bg-white/10" : "border-transparent hover:bg-black/5 dark:hover:bg-white/5"}`} onClick={onClick}><div className="flex items-center gap-2 text-xs font-semibold"><span className="w-6 text-[10px] opacity-45">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate">{shot.name}</span><span className="text-[10px] opacity-55">{shot.duration}s</span></div><div className="mt-1 flex items-center gap-1.5 text-[10px] opacity-55"><Camera className="size-3" /><span className="min-w-0 truncate">{cameraName}</span><span>/</span><span>{shotSizeLabelMap[shot.shotSize]}</span><span>/</span><span>{cameraMoveLabelMap[shot.cameraMove]}</span></div></button>;
}

function ShotTemplatePanel({ onApply }: { onApply: (template: DirectorShotTemplate) => void }) {
    return <div className="space-y-2 rounded-md border border-black/10 p-2 dark:border-white/10"><div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-70"><Clapperboard className="size-3.5" />镜头模板</div><div className="grid grid-cols-2 gap-1.5">{directorShotTemplates.map((template) => <button key={template.id} type="button" className="h-8 truncate rounded-md border border-black/10 px-2 text-left text-[11px] transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/8" title={`${shotSizeLabelMap[template.shotSize]} · ${cameraMoveLabelMap[template.cameraMove]} · ${template.focalLength}mm`} onClick={() => onApply(template)}>{template.label}</button>)}</div></div>;
}

function FocalPresetRow({ value, onChange }: { value: number; onChange: (value: number) => void }) {
    return <Field label="焦段预设"><div className="grid grid-cols-4 gap-1">{focalLengthPresets.map((item) => <button key={item} type="button" className={`h-7 rounded-md border px-1 text-[10px] transition ${Math.abs(value - item) < 0.1 ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/8"}`} onClick={() => onChange(item)}>{item}mm</button>)}</div></Field>;
}

const poseOptions = [{ label: "自然", value: "neutral" }, { label: "站立", value: "stand" }, { label: "行走", value: "walk" }, { label: "奔跑", value: "run" }, { label: "坐姿", value: "sit" }, { label: "动作", value: "action" }];
const shotSizeOptions = [{ label: "大远景", value: "extreme_wide" }, { label: "远景", value: "wide" }, { label: "全身景", value: "full" }, { label: "中景", value: "medium" }, { label: "近景", value: "close_up" }, { label: "大特写", value: "extreme_close_up" }];
const cameraMoveOptions = [{ label: "固定", value: "static" }, { label: "推进", value: "push_in" }, { label: "拉远", value: "pull_out" }, { label: "左摇", value: "pan_left" }, { label: "右摇", value: "pan_right" }, { label: "上摇", value: "tilt_up" }, { label: "下摇", value: "tilt_down" }, { label: "左环绕", value: "orbit_left" }, { label: "右环绕", value: "orbit_right" }, { label: "手持", value: "handheld" }];
const shotSizeLabelMap = Object.fromEntries(shotSizeOptions.map((item) => [item.value, item.label])) as Record<DirectorShotSize, string>;
const cameraMoveLabelMap = Object.fromEntries(cameraMoveOptions.map((item) => [item.value, item.label])) as Record<DirectorCameraMove, string>;
const focalLengthPresets = [16, 24, 35, 50, 85, 135];

type DirectorShotTemplate = {
    id: string;
    label: string;
    shotSize: DirectorShotSize;
    cameraMove: DirectorCameraMove;
    focalLength: number;
    focusDistance: number;
    duration: number;
    transform: DirectorTransform;
    target: DirectorVec3;
    prompt: string;
};

type SceneSpaceEntry = { id: string; kind: "node"; title: string; node: CanvasNodeData } | { id: string; kind: "asset"; title: string; asset: ImageAsset };

function createSceneSpaceEntries(imageNodes: CanvasNodeData[], imageAssets: ImageAsset[]): SceneSpaceEntry[] {
    const entries: SceneSpaceEntry[] = [];
    const seen = new Set<string>();
    const pushEntry = (key: string, entry: SceneSpaceEntry) => {
        if (seen.has(key)) return;
        seen.add(key);
        entries.push(entry);
    };
    imageNodes.slice(0, 12).forEach((node) => {
        const sourceKey = node.metadata?.storageKey || node.metadata?.content || node.id;
        pushEntry(node.title.trim().toLowerCase() || String(sourceKey), { id: `node:${node.id}`, kind: "node", title: node.title, node });
    });
    imageAssets.slice(0, 12).forEach((asset) => {
        const sourceKey = asset.data.storageKey || asset.data.dataUrl || asset.id;
        pushEntry(asset.title.trim().toLowerCase() || String(sourceKey), { id: `asset:${asset.id}`, kind: "asset", title: asset.title, asset });
    });
    return entries.slice(0, 16);
}

const directorShotTemplates: DirectorShotTemplate[] = [
    { id: "front_medium", label: "正面中景", shotSize: "medium", cameraMove: "static", focalLength: 50, focusDistance: 4, duration: 4, transform: directorTemplateTransform([0, 1.55, 4.2]), target: [0, 1.2, 0], prompt: "正面中景，人物表演清晰，机位稳定。" },
    { id: "two_shot", label: "双人对话", shotSize: "full", cameraMove: "static", focalLength: 35, focusDistance: 5, duration: 5, transform: directorTemplateTransform([0, 1.7, 5.4]), target: [0, 1.15, 0], prompt: "双人对话构图，保持空间关系和视线方向。" },
    { id: "over_shoulder", label: "过肩镜头", shotSize: "medium", cameraMove: "static", focalLength: 50, focusDistance: 3.2, duration: 4, transform: directorTemplateTransform([-1.35, 1.55, 3.15]), target: [0.35, 1.25, 0], prompt: "过肩镜头，前景肩部虚化，焦点落在对话对象。" },
    { id: "reverse_angle", label: "正反打", shotSize: "close_up", cameraMove: "static", focalLength: 85, focusDistance: 2.2, duration: 3, transform: directorTemplateTransform([1.25, 1.5, 2.35]), target: [-0.2, 1.35, 0], prompt: "反应近景，承接上一镜头视线关系。" },
    { id: "reaction_close", label: "反应特写", shotSize: "close_up", cameraMove: "static", focalLength: 85, focusDistance: 2, duration: 3, transform: directorTemplateTransform([0.55, 1.48, 2.05]), target: [0, 1.42, 0], prompt: "人物反应特写，表情和眼神是画面重点。" },
    { id: "low_hero", label: "低机位", shotSize: "full", cameraMove: "static", focalLength: 28, focusDistance: 4, duration: 4, transform: directorTemplateTransform([0, 0.72, 3.8]), target: [0, 1.65, 0], prompt: "低机位英雄镜头，人物更有压迫感和力量感。" },
    { id: "high_angle", label: "高机位", shotSize: "wide", cameraMove: "static", focalLength: 35, focusDistance: 6, duration: 4, transform: directorTemplateTransform([0, 3.8, 4.2]), target: [0, 0.9, 0], prompt: "高机位俯拍，强调空间布局和人物位置。" },
    { id: "push_in", label: "缓慢推镜", shotSize: "medium", cameraMove: "push_in", focalLength: 50, focusDistance: 4, duration: 5, transform: directorTemplateTransform([0, 1.5, 4.8]), target: [0, 1.25, 0], prompt: "缓慢推近人物，逐步加强情绪。" },
    { id: "pull_out", label: "拉远揭示", shotSize: "wide", cameraMove: "pull_out", focalLength: 35, focusDistance: 6, duration: 5, transform: directorTemplateTransform([0, 1.5, 3.6]), target: [0, 1.1, 0], prompt: "镜头拉远，逐步揭示人物所处空间。" },
    { id: "orbit_left", label: "左环绕", shotSize: "medium", cameraMove: "orbit_left", focalLength: 35, focusDistance: 5, duration: 5, transform: directorTemplateTransform([2.9, 1.55, 4.1]), target: [0, 1.2, 0], prompt: "围绕人物左向环绕，制造空间感和戏剧张力。" },
    { id: "handheld", label: "手持跟拍", shotSize: "medium", cameraMove: "handheld", focalLength: 35, focusDistance: 3.5, duration: 4, transform: directorTemplateTransform([0.25, 1.45, 3.2]), target: [0, 1.25, 0], prompt: "轻微手持感，贴近人物行动。" },
];

function cameraMoveTransform(transform: DirectorTransform, move: DirectorCameraMove): DirectorTransform {
    const [x, y, z] = transform.position;
    const offsets: Record<DirectorCameraMove, DirectorVec3> = { static: [0, 0, 0], push_in: [0, 0, -2], pull_out: [0, 0, 2], pan_left: [-2, 0, 0], pan_right: [2, 0, 0], tilt_up: [0, 1.5, 0], tilt_down: [0, -1.2, 0], orbit_left: [-2.5, 0, -1.5], orbit_right: [2.5, 0, -1.5], handheld: [0.18, 0.08, -0.15] };
    const offset = offsets[move];
    return { ...transform, position: [x + offset[0], y + offset[1], z + offset[2]] };
}

function directorTemplateTransform(position: DirectorVec3): DirectorTransform {
    return { position, rotation: [0, 0, 0], scale: [1, 1, 1] };
}

function cloneTransform(transform: DirectorTransform): DirectorTransform {
    return { position: [...transform.position], rotation: [...transform.rotation], scale: [...transform.scale] };
}

function createCameraMoveKeyframes(transform: DirectorTransform, move: DirectorCameraMove, duration: number) {
    const start = cloneTransform(transform);
    const end = cameraMoveTransform(start, move);
    return [{ id: nanoid(), time: 0, transform: start }, { id: nanoid(), time: duration, transform: end }];
}

function isSceneSpaceObject(object: DirectorObject) {
    return object.kind === "environment" || (object.kind === "billboard" && object.name.startsWith("场景图 ·"));
}

function focalLengthToFov(focalLength: number) { return (2 * Math.atan(36 / (2 * focalLength)) * 180) / Math.PI; }
