"use client";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import type { FunScene, FunObject, EdgeObject } from "./types";
import type {
  ExcalidrawInitialDataState,
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { funSceneToExcalidrawData } from "./adapters/excalidraw";

const ExcalidrawWrapper = async () => {
  const mod = await import("@excalidraw/excalidraw");
  return mod.Excalidraw;
};

interface ExcalidrawCanvasProps {
  initialScene?: FunScene;
  onSceneChange?: (scene: FunScene) => void;
  focusMode?: boolean;
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

export function ExcalidrawCanvas({
  initialScene,
  onSceneChange,
  focusMode = false,
}: ExcalidrawCanvasProps) {
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<
    typeof import("@excalidraw/excalidraw").Excalidraw | null
  >(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const edgesRef = useRef<EdgeObject[]>(initialScene?.edges ?? []);
  const sceneIdRef = useRef(initialScene?.id ?? crypto.randomUUID());
  const skipNextChangeRef = useRef(true);

  useEffect(() => {
    void ExcalidrawWrapper().then(setExcalidrawComponent);
  }, []);

  useEffect(() => {
    edgesRef.current = initialScene?.edges ?? [];
    if (initialScene?.id) sceneIdRef.current = initialScene.id;
    skipNextChangeRef.current = true;
  }, [initialScene]);

  const initialData = useMemo((): ExcalidrawInitialDataState => {
    if (!initialScene) {
      return {
        elements: [],
        appState: { viewBackgroundColor: "#ffffff" },
        files: {},
      };
    }
    const data = funSceneToExcalidrawData(initialScene);
    return {
      ...data,
      appState: {
        ...(data.appState ?? {}),
        viewBackgroundColor: "#ffffff",
      },
    };
  }, [initialScene]);

  const handleChange = useCallback(
    // Excalidraw types évoluent — on mappe vers FunObject sans coller au type Ordered*
    (elements: readonly unknown[], appState: AppState, _files: BinaryFiles) => {
      if (!onSceneChange) return;
      if (skipNextChangeRef.current) {
        skipNextChangeRef.current = false;
        return;
      }

      const funObjects = excalidrawElementsToFunObjects(
        elements as readonly ExcalidrawBaseElement[],
      );
      const scene: FunScene = {
        id: sceneIdRef.current,
        objects: funObjects,
        edges: edgesRef.current,
        camera: {
          x: appState.scrollX ?? 0,
          y: appState.scrollY ?? 0,
          zoom: appState.zoom?.value ?? 1,
        },
        grid: true,
        version: 1,
        metadata: { sourceFormat: "excalidraw" },
      };

      onSceneChange(scene);
    },
    [onSceneChange],
  );

  const handleExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    excalidrawAPIRef.current = api;
  }, []);

  if (!ExcalidrawComponent) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Chargement d’Excalidraw…
      </div>
    );
  }

  return (
    <div className="excalidraw-fun-host h-full w-full [&_.excalidraw]:h-full [&_.excalidraw]:w-full">
      <ExcalidrawComponent
        initialData={initialData}
        onChange={handleChange}
        excalidrawAPI={handleExcalidrawAPI}
        viewModeEnabled={focusMode}
        gridModeEnabled
        langCode="fr-FR"
        theme="light"
        name="Fun Sketch"
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: { saveFileToDisk: true },
            loadScene: true,
            saveToActiveFile: false,
            toggleTheme: false,
            saveAsImage: true,
          },
        }}
      />
    </div>
  );
}
