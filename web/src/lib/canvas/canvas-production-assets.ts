import { nanoid } from "nanoid";

import { FRAME_HEADER_HEIGHT } from "@/lib/canvas/canvas-frame";
import { createCanvasNode } from "@/lib/canvas/canvas-project-domain";
import { CanvasNodeType, type CanvasConnection, type CanvasNodeData, type Position } from "@/types/canvas";

export type CanvasProductionAssetKind = "character" | "scene" | "panorama";

type ProductionAssetTemplate = {
    frameTitle: string;
    settingTitle: string;
    imageTitle: string;
    configTitle: string;
    settingContent: string;
    imagePrompt: string;
    configPrompt: string;
    workflowTitle: string;
    workflowDescription: string;
    frameWidth: number;
    frameHeight: number;
};

export function createProductionAssetPack(kind: CanvasProductionAssetKind, center: Position) {
    const template = productionAssetTemplates[kind];
    const frame = createCanvasNode(CanvasNodeType.Frame, center, {
        workflowKind: kind === "character" ? "character" : "scene",
        workflowTitle: template.workflowTitle,
        workflowDescription: template.workflowDescription,
        frame: { collapsed: false, expandedWidth: template.frameWidth, expandedHeight: template.frameHeight },
    });
    frame.title = template.frameTitle;
    frame.position = { x: center.x - template.frameWidth / 2, y: center.y - template.frameHeight / 2 };
    frame.width = template.frameWidth;
    frame.height = template.frameHeight;

    const settingNode = createCanvasNode(CanvasNodeType.Text, { x: frame.position.x + 220, y: frame.position.y + FRAME_HEADER_HEIGHT + 150 }, {
        content: template.settingContent,
        status: "idle",
        workflowKind: kind === "character" ? "character" : "scene",
        workflowTitle: template.settingTitle,
        workflowDescription: "可被分镜、图片和视频节点引用",
        fontSize: 13,
        assetTags: productionAssetTags(kind),
    });
    settingNode.title = template.settingTitle;
    settingNode.parentId = frame.id;
    settingNode.width = 380;
    settingNode.height = 260;

    const imageNode = createCanvasNode(CanvasNodeType.Image, { x: frame.position.x + 650, y: frame.position.y + FRAME_HEADER_HEIGHT + 160 }, {
        content: "",
        prompt: template.imagePrompt,
        composerContent: template.imagePrompt,
        status: "idle",
        workflowKind: kind === "character" ? "character" : "scene",
        workflowTitle: template.imageTitle,
        workflowDescription: kind === "panorama" ? "720 全景参考图" : "资产参考图",
        generationMode: "image",
        assetTags: productionAssetTags(kind),
    });
    imageNode.title = template.imageTitle;
    imageNode.parentId = frame.id;
    imageNode.width = kind === "character" ? 320 : 380;
    imageNode.height = kind === "character" ? 360 : 220;

    const configNode = createCanvasNode(CanvasNodeType.Config, { x: frame.position.x + 650, y: frame.position.y + FRAME_HEADER_HEIGHT + 445 }, {
        content: "",
        prompt: template.configPrompt,
        composerContent: template.configPrompt,
        status: "idle",
        workflowKind: kind === "character" ? "character" : "scene",
        workflowTitle: template.configTitle,
        workflowDescription: kind === "panorama" ? "输出 720 / 360 全景资产" : "锁定资产一致性",
        generationMode: "image",
        assetTags: productionAssetTags(kind),
    });
    configNode.title = template.configTitle;
    configNode.parentId = frame.id;
    configNode.width = 380;
    configNode.height = 220;

    const nodes: CanvasNodeData[] = [settingNode, imageNode, configNode, frame];
    const connections: CanvasConnection[] = [
        { id: nanoid(), fromNodeId: settingNode.id, toNodeId: imageNode.id },
        { id: nanoid(), fromNodeId: settingNode.id, toNodeId: configNode.id },
        { id: nanoid(), fromNodeId: imageNode.id, toNodeId: configNode.id },
    ];

    return { nodes, connections, frameId: frame.id };
}

function productionAssetTags(kind: CanvasProductionAssetKind) {
    if (kind === "character") return ["角色资产", "一致性", "参考图"];
    if (kind === "panorama") return ["场景资产", "720全景", "导演台"];
    return ["场景资产", "空间设定", "参考图"];
}

const productionAssetTemplates: Record<CanvasProductionAssetKind, ProductionAssetTemplate> = {
    character: {
        frameTitle: "角色资产 · 新角色",
        settingTitle: "角色设定卡",
        imageTitle: "角色三视图 · 待生成",
        configTitle: "角色一致性配置",
        workflowTitle: "角色资产",
        workflowDescription: "姓名、外观、服装、道具和多视角参考",
        frameWidth: 920,
        frameHeight: 650,
        settingContent: [
            "角色名：",
            "身份 / 关系：",
            "年龄与气质：",
            "稳定外貌：脸型、五官、发型、肤色",
            "固定服装：版型、材质、颜色、纹样",
            "体态与身高：",
            "固定道具：",
            "一致性约束：所有镜头保持同一服装版本、同一发型、同一体型。",
        ].join("\n"),
        imagePrompt: "单张角色三视图参考图，同一角色同一服装版本，依次展示正面全身、严格左侧面全身、严格背面全身，干净中性背景，电影工业设定稿，细节稳定。",
        configPrompt: "基于角色设定卡生成角色多视角参考图。必须锁定脸型、发型、服装、道具和体态，不加入剧情动作，不改变画风。",
    },
    scene: {
        frameTitle: "场景资产 · 新场景",
        settingTitle: "场景设定卡",
        imageTitle: "场景参考图 · 待生成",
        configTitle: "场景生成配置",
        workflowTitle: "场景资产",
        workflowDescription: "空间、时间、光线、锚点和可复用场景参考",
        frameWidth: 980,
        frameHeight: 620,
        settingContent: [
            "场景名：",
            "空间类型：室内 / 街道 / 车内 / 幻境 / 未来城市",
            "时间：白天 / 黄昏 / 夜晚",
            "天气与光线：",
            "主要锚点：入口、窗、桌、路灯、招牌、远景",
            "色彩与材质：",
            "镜头可用区域：",
            "一致性约束：同一场景的空间关系、光源方向和标志物保持稳定。",
        ].join("\n"),
        imagePrompt: "电影感场景设定图，展示完整空间关系和关键锚点，真实镜头质感，低对比高层次光影，适合后续分镜和视频生成。",
        configPrompt: "基于场景设定卡生成可复用场景参考图。保持空间锚点、光源方向、色彩和材质稳定，避免出现主角特写。",
    },
    panorama: {
        frameTitle: "720 全景场景 · 新场景",
        settingTitle: "720 全景设定卡",
        imageTitle: "全景参考图 · 待生成",
        configTitle: "720 全景生成配置",
        workflowTitle: "720 全景",
        workflowDescription: "360 / 720 场景资产与导演台空间参考",
        frameWidth: 1040,
        frameHeight: 640,
        settingContent: [
            "全景场景名：",
            "中心位置：角色 / 摄像机所在空间中心",
            "前方锚点：",
            "左侧锚点：",
            "右侧锚点：",
            "后方锚点：",
            "天空 / 顶部：",
            "地面 / 底部：",
            "一致性约束：所有方向光照、透视和空间结构连续，可作为导演台预演参考。",
        ].join("\n"),
        imagePrompt: "equirectangular 360 panorama, seamless 720 scene, cinematic environment design, continuous spatial layout, stable lighting direction, no close-up characters, high detail, usable for virtual camera previsualization",
        configPrompt: "生成 360 / 720 全景场景图，用于导演台和镜头预演。必须保证左右边缘可无缝衔接、空间锚点清晰、光照方向连续。",
    },
};
