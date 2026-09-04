"use client";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import type { FunScene, FunObject, Mesh3DObject, UmlClassObject, UmlPackageObject, UmlNoteObject } from "./types";
import type {
  ExcalidrawInitialDataState,
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

const ExcalidrawWrapper = async () => {
  const mod = await import("@excalidraw/excalidraw");
  return mod.Excalidraw;
};

interface ExcalidrawCanvasProps {
  initialScene?: FunScene;
  onSceneChange?: (scene: FunScene) => void;
  focusMode?: boolean;
  layersOpen?: boolean;
  onLayersOpenChange?: (open: boolean) => void;
}

interface ExcalidrawBaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  locked: boolean;
  type: string;
  isDeleted?: boolean;
  points?: number[][];
  text?: string;
  fontSize?: number;
  src?: string;
  groupIds?: string[];
}

function excalidrawElementsToFunObjects(
  elements: readonly ExcalidrawBaseElement[],
): FunObject[] {
  const result: FunObject[] = [];
  const processedIds = new Set<string>();
  const groupedByGroupId = new Map<string, ExcalidrawBaseElement[]>();

  for (const el of elements) {
    if (el.isDeleted) continue;
    if (el.groupIds && el.groupIds.length > 0) {
      const gid = el.groupIds[0];
      if (!groupedByGroupId.has(gid)) groupedByGroupId.set(gid, []);
      groupedByGroupId.get(gid)!.push(el);
    }
  }

  for (const [gid, groupElements] of groupedByGroupId) {
    if (processedIds.has(gid)) continue;
    processedIds.add(gid);

    const headerEl = groupElements.find((e) => e.id.endsWith("-header"));
    const attrsEl = groupElements.find((e) => e.id.endsWith("-attrs"));
    const methodsEl = groupElements.find((e) => e.id.endsWith("-methods"));
    const labelEl = groupElements.find((e) => e.id.endsWith("-label"));
    const textEl = groupElements.find((e) => e.id.endsWith("-text"));
    const mainRect = groupElements.find(
      (e) => e.type === "rectangle" && !e.id.includes("-"),
    );

    if (headerEl && mainRect) {
      const attrs = attrsEl?.text
        ? attrsEl.text.split("\n").filter((t) => t.trim())
        : [];
      const methods = methodsEl?.text
        ? methodsEl.text.split("\n").filter((t) => t.trim())
        : [];
      const headerText = headerEl.text ?? "";
      const newlineIdx = headerText.indexOf("\n");
      let stereotype: string | undefined;
      let className: string;
      if (headerText.startsWith("«") && newlineIdx > 0) {
        const firstLine = headerText.substring(0, newlineIdx);
        const match = firstLine.match(/^«(\w+)»$/);
        stereotype = match?.[1];
        className = headerText.substring(newlineIdx + 1);
      } else {
        className = headerText;
      }

      const obj: UmlClassObject = {
        id: gid,
        type: "uml-class",
        x: mainRect.x,
        y: mainRect.y,
        width: mainRect.width,
        height: mainRect.height,
        fill: mainRect.backgroundColor ?? "transparent",
        stroke: mainRect.strokeColor ?? "#1e1e1e",
        strokeWidth: mainRect.strokeWidth ?? 2,
        opacity: (mainRect.opacity ?? 100) / 100,
        locked: mainRect.locked ?? false,
        zIndex: 0,
        className,
        stereotype,
        attributes: attrs,
        methods,
        compartmentDivider: 0,
      };
      result.push(obj);
      continue;
    }

    if (labelEl && groupElements.some((e) => e.id.endsWith("-tab"))) {
      const labelText = labelEl.text ?? "";
      const stereotypeMatch = labelText.match(/^«(\w+)»\s*(.+)$/);
      const stereotype = stereotypeMatch?.[1];
      const packageName = stereotypeMatch?.[2] ?? labelText;

      const obj: UmlPackageObject = {
        id: gid,
        type: "uml-package",
        x: mainRect?.x ?? 0,
        y: mainRect?.y ?? 0,
        width: mainRect?.width ?? 120,
        height: mainRect?.height ?? 80,
        fill: mainRect?.backgroundColor ?? "transparent",
        stroke: mainRect?.strokeColor ?? "#1e1e1e",
        strokeWidth: mainRect?.strokeWidth ?? 2,
        opacity: (mainRect?.opacity ?? 100) / 100,
        locked: mainRect?.locked ?? false,
        zIndex: 0,
        packageName,
        stereotype,
      };
      result.push(obj);
      continue;
    }

    if (textEl && mainRect) {
      const obj: UmlNoteObject = {
        id: gid,
        type: "uml-note",
        x: mainRect.x,
        y: mainRect.y,
        width: mainRect.width,
        height: mainRect.height,
        fill: mainRect.backgroundColor ?? "transparent",
        stroke: mainRect.strokeColor ?? "#1e1e1e",
        strokeWidth: mainRect.strokeWidth ?? 2,
        opacity: (mainRect.opacity ?? 100) / 100,
        locked: mainRect.locked ?? false,
        zIndex: 0,
        text: textEl.text ?? "",
      };
      result.push(obj);
      continue;
    }
  }

  for (const el of elements) {
    if (el.isDeleted) continue;
    if (processedIds.has(el.id)) continue;
    if (el.groupIds && el.groupIds.length > 0) continue;

    const base = {
      id: el.id,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      fill: el.backgroundColor ?? "transparent",
      stroke: el.strokeColor ?? "#1a1a1a",
      strokeWidth: el.strokeWidth ?? 2,
      opacity: (el.opacity ?? 100) / 100,
      locked: el.locked ?? false,
      zIndex: 0,
    };

    switch (el.type) {
      case "rectangle":
        result.push({ ...base, type: "rect", borderRadius: 0 });
        break;
      case "ellipse":
        result.push({ ...base, type: "ellipse" });
        break;
      case "diamond":
        result.push({ ...base, type: "diamond" });
        break;
      case "text":
        result.push({
          ...base,
          type: "text",
          text: el.text ?? "",
          fontSize: el.fontSize ?? 20,
        });
        break;
      case "freedraw":
        result.push({
          ...base,
          type: "freehand",
          points: (el.points ?? []).map((p: number[]) => ({
            x: p[0],
            y: p[1],
          })),
        });
        break;
      case "arrow":
        result.push({
          ...base,
          type: "arrow",
          points: (el.points ?? []).map((p: number[]) => ({
            x: p[0],
            y: p[1],
          })),
          arrowHead: "triangle",
        });
        break;
      case "line":
        result.push({
          ...base,
          type: "freehand",
          points: (el.points ?? []).map((p: number[]) => ({
            x: p[0],
            y: p[1],
          })),
        });
        break;
      case "image":
        result.push({
          ...base,
          type: "image",
          src: el.src ?? "",
          naturalWidth: el.width,
          naturalHeight: el.height,
        });
        break;
    }
  }

  return result;
}

function funSceneToExcalidrawData(
  scene: FunScene,
): ExcalidrawInitialDataState {
  const mesh3DObjects = scene.objects.filter(
    (obj): obj is Mesh3DObject => obj.type === "mesh3d",
  );
  void mesh3DObjects;

  const non3DObjects = scene.objects.filter((obj) => obj.type !== "mesh3d");

  if (non3DObjects.length === 0) {
    return { elements: [], appState: {}, files: {} };
  }

  const excalidrawElements: unknown[] = [];

  for (const obj of non3DObjects) {
    const base = {
      id: obj.id,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      strokeColor: obj.stroke,
      backgroundColor: obj.fill,
      strokeWidth: obj.strokeWidth,
      opacity: obj.opacity * 100,
      locked: obj.locked,
    };

    if (obj.type === "freehand") {
      excalidrawElements.push({
        ...base,
        type: "freedraw" as const,
        points: obj.points.map((p) => [p.x, p.y] as [number, number]),
      });
      continue;
    }

    if (obj.type === "text") {
      excalidrawElements.push({
        ...base,
        type: "text" as const,
        text: obj.text,
        fontSize: obj.fontSize,
        textAlign: "left" as const,
        verticalAlign: "top" as const,
        fontFamily: 1,
        lineHeight: 1.25,
        containerId: null,
        originalText: obj.text,
        autoResize: true,
      });
      continue;
    }

    if (obj.type === "arrow") {
      excalidrawElements.push({
        ...base,
        type: "arrow" as const,
        points: obj.points.map((p) => [p.x, p.y] as [number, number]),
        startBinding: null,
        endBinding: null,
        startArrowhead: null,
        endArrowhead: "triangle",
      });
      continue;
    }

    if (obj.type === "image") {
      excalidrawElements.push({
        ...base,
        type: "image" as const,
        src: obj.src,
        fileId: null,
        crop: null,
      });
      continue;
    }

    if (obj.type === "uml-class") {
      const headerH = 32;
      const attrH = Math.max(obj.attributes.length * 22 + 8, 24);
      const methodH = Math.max(obj.methods.length * 22 + 8, 24);
      const totalH = headerH + attrH + methodH;

      excalidrawElements.push({
        ...base,
        height: totalH,
        type: "rectangle" as const,
        borderRadius: 0,
        groupIds: [obj.id],
      });

      excalidrawElements.push({
        id: `${obj.id}-header`,
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: headerH,
        type: "text" as const,
        text: obj.stereotype ? `«${obj.stereotype}»\n${obj.className}` : obj.className,
        fontSize: 16,
        fontFamily: 1,
        textAlign: "center" as const,
        verticalAlign: "middle" as const,
        strokeColor: obj.stroke,
        backgroundColor: "transparent",
        strokeWidth: 0,
        opacity: 100,
        locked: false,
        containerId: null,
        originalText: obj.stereotype ? `«${obj.stereotype}»\n${obj.className}` : obj.className,
        autoResize: true,
        groupIds: [obj.id],
      });

      excalidrawElements.push({
        id: `${obj.id}-div1`,
        x: obj.x,
        y: obj.y + headerH,
        width: obj.width,
        height: 0,
        type: "line" as const,
        points: [[0, 0], [obj.width, 0]] as [number, number][],
        strokeColor: obj.stroke,
        backgroundColor: "transparent",
        strokeWidth: obj.strokeWidth,
        opacity: 100,
        locked: false,
        groupIds: [obj.id],
      });

      const attrText = obj.attributes.join("\n") || " ";
      excalidrawElements.push({
        id: `${obj.id}-attrs`,
        x: obj.x + 8,
        y: obj.y + headerH + 4,
        width: obj.width - 16,
        height: attrH - 8,
        type: "text" as const,
        text: attrText,
        fontSize: 14,
        fontFamily: 1,
        textAlign: "left" as const,
        verticalAlign: "top" as const,
        strokeColor: obj.stroke,
        backgroundColor: "transparent",
        strokeWidth: 0,
        opacity: 100,
        locked: false,
        containerId: null,
        originalText: attrText,
        autoResize: true,
        groupIds: [obj.id],
      });

      excalidrawElements.push({
        id: `${obj.id}-div2`,
        x: obj.x,
        y: obj.y + headerH + attrH,
        width: obj.width,
        height: 0,
        type: "line" as const,
        points: [[0, 0], [obj.width, 0]] as [number, number][],
        strokeColor: obj.stroke,
        backgroundColor: "transparent",
        strokeWidth: obj.strokeWidth,
        opacity: 100,
        locked: false,
        groupIds: [obj.id],
      });

      const methodText = obj.methods.join("\n") || " ";
      excalidrawElements.push({
        id: `${obj.id}-methods`,
        x: obj.x + 8,
        y: obj.y + headerH + attrH + 4,
        width: obj.width - 16,
        height: methodH - 8,
        type: "text" as const,
        text: methodText,
        fontSize: 14,
        fontFamily: 1,
        textAlign: "left" as const,
        verticalAlign: "top" as const,
        strokeColor: obj.stroke,
        backgroundColor: "transparent",
        strokeWidth: 0,
        opacity: 100,
        locked: false,
        containerId: null,
        originalText: methodText,
        autoResize: true,
        groupIds: [obj.id],
      });
      continue;
    }

    if (obj.type === "uml-package") {
      const tabW = Math.max(obj.packageName.length * 9 + 24, 100);

      excalidrawElements.push({
        ...base,
        type: "rectangle" as const,
        borderRadius: 0,
        groupIds: [obj.id],
      });

      excalidrawElements.push({
        id: `${obj.id}-tab`,
        x: obj.x,
        y: obj.y,
        width: tabW,
        height: 28,
        type: "rectangle" as const,
        borderRadius: 0,
        strokeColor: obj.stroke,
        backgroundColor: obj.fill === "transparent" ? "#f8f9fa" : obj.fill,
        strokeWidth: obj.strokeWidth,
        opacity: 100,
        locked: false,
        groupIds: [obj.id],
      });

      const label = obj.stereotype ? `«${obj.stereotype}» ${obj.packageName}` : obj.packageName;
      excalidrawElements.push({
        id: `${obj.id}-label`,
        x: obj.x + 8,
        y: obj.y + 4,
        width: tabW - 16,
        height: 20,
        type: "text" as const,
        text: label,
        fontSize: 14,
        fontFamily: 1,
        textAlign: "left" as const,
        verticalAlign: "top" as const,
        strokeColor: obj.stroke,
        backgroundColor: "transparent",
        strokeWidth: 0,
        opacity: 100,
        locked: false,
        containerId: null,
        originalText: label,
        autoResize: true,
        groupIds: [obj.id],
      });
      continue;
    }

    if (obj.type === "uml-note") {
      excalidrawElements.push({
        ...base,
        type: "rectangle" as const,
        borderRadius: 0,
        groupIds: [obj.id],
      });

      const foldX = obj.width - 16;
      const foldY = 16;
      excalidrawElements.push({
        id: `${obj.id}-fold`,
        x: obj.x + foldX,
        y: obj.y,
        width: 16,
        height: foldY,
        type: "line" as const,
        points: [[0, 0], [-foldX, foldY]] as [number, number][],
        strokeColor: obj.stroke,
        backgroundColor: "transparent",
        strokeWidth: obj.strokeWidth,
        opacity: 100,
        locked: false,
        groupIds: [obj.id],
      });

      const noteText = obj.text || " ";
      excalidrawElements.push({
        id: `${obj.id}-text`,
        x: obj.x + 8,
        y: obj.y + 8,
        width: obj.width - 16,
        height: obj.height - 16,
        type: "text" as const,
        text: noteText,
        fontSize: 14,
        fontFamily: 1,
        textAlign: "left" as const,
        verticalAlign: "top" as const,
        strokeColor: obj.stroke,
        backgroundColor: "transparent",
        strokeWidth: 0,
        opacity: 100,
        locked: false,
        containerId: null,
        originalText: noteText,
        autoResize: true,
        groupIds: [obj.id],
      });
      continue;
    }

    const typeMap: Record<string, string> = {
      rect: "rectangle",
      ellipse: "ellipse",
      diamond: "diamond",
    };

    excalidrawElements.push({
      ...base,
      type: (typeMap[obj.type] ?? obj.type) as
        | "rectangle"
        | "ellipse"
        | "diamond",
    });
  }

  return {
    elements: excalidrawElements as any[],
    appState: {
      viewBackgroundColor: "#ffffff",
    },
    files: {},
  };
}

export function ExcalidrawCanvas({
  initialScene,
  onSceneChange,
  focusMode = false,
}: ExcalidrawCanvasProps) {
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<
    typeof import("@excalidraw/excalidraw").Excalidraw | null
  >(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const mesh3DRef = useRef<Mesh3DObject[]>([]);

  useEffect(() => {
    ExcalidrawWrapper().then(setExcalidrawComponent);
  }, []);

  useEffect(() => {
    if (initialScene) {
      mesh3DRef.current = initialScene.objects.filter(
        (obj): obj is Mesh3DObject => obj.type === "mesh3d",
      );
    } else {
      mesh3DRef.current = [];
    }
  }, [initialScene]);

  const initialData = useMemo(() => {
    if (!initialScene) {
      return { elements: [], appState: {}, files: {} };
    }
    return funSceneToExcalidrawData(initialScene);
  }, [initialScene]);

  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    (elements: readonly any[], appState: AppState, files: BinaryFiles) => {
      if (!onSceneChange) return;

      const funObjects = excalidrawElementsToFunObjects(elements);
      const allObjects: FunObject[] = [...funObjects, ...mesh3DRef.current];

      const scene: FunScene = {
        id: initialScene?.id ?? crypto.randomUUID(),
        objects: allObjects,
        camera: {
          x: appState.scrollX ?? 0,
          y: appState.scrollY ?? 0,
          zoom: appState.zoom?.value ?? 1,
        },
        grid: true,
        version: 1,
      };

      onSceneChange(scene);
    },
    [onSceneChange, initialScene?.id],
  );

  const handleExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    excalidrawAPIRef.current = api;
  }, []);

  if (!ExcalidrawComponent) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Chargement du canvas...
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <ExcalidrawComponent
        initialData={initialData}
        onChange={handleChange}
        excalidrawAPI={handleExcalidrawAPI}
        viewModeEnabled={focusMode}
        gridModeEnabled={true}
        theme="light"
        name="Fun Canvas"
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: false,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: false,
            saveAsImage: true,
          },
        }}
      />
    </div>
  );
}
