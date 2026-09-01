"use client";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import type { FunScene, FunObject, Mesh3DObject } from "./types";
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
}

function excalidrawElementsToFunObjects(
  elements: readonly ExcalidrawBaseElement[],
): FunObject[] {
  const result: FunObject[] = [];

  for (const el of elements) {
    if (el.isDeleted) continue;

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

  const excalidrawElements = non3DObjects.map((obj) => {
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
      return {
        ...base,
        type: "freedraw" as const,
        points: obj.points.map((p) => [p.x, p.y] as [number, number]),
      };
    }

    if (obj.type === "text") {
      return {
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
      };
    }

    if (obj.type === "arrow") {
      return {
        ...base,
        type: "arrow" as const,
        points: obj.points.map((p) => [p.x, p.y] as [number, number]),
        startBinding: null,
        endBinding: null,
        startArrowhead: null,
        endArrowhead: "triangle",
      };
    }

    if (obj.type === "image") {
      return {
        ...base,
        type: "image" as const,
        src: obj.src,
        fileId: null,
        crop: null,
      };
    }

    const typeMap: Record<string, string> = {
      rect: "rectangle",
      ellipse: "ellipse",
      diamond: "diamond",
    };

    return {
      ...base,
      type: (typeMap[obj.type] ?? obj.type) as
        | "rectangle"
        | "ellipse"
        | "diamond",
    };
  });

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
