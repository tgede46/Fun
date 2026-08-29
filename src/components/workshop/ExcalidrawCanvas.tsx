"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import type { ExcalidrawProps } from "@excalidraw/excalidraw/types";
import { saveDiagram, type ExcalidrawInitialDataState } from "@/lib/diagram";
import type { FunTheme } from "@/lib/theme";

import "@excalidraw/excalidraw/index.css";

const SAVE_DEBOUNCE_MS = 800;

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <p className="workshop-canvas__label">Chargement du canvas…</p>
    ),
  },
);

type ExcalidrawChangeHandler = NonNullable<ExcalidrawProps["onChange"]>;

type ExcalidrawCanvasProps = {
  projectPath: string;
  diagramPath: string;
  theme: FunTheme;
  initialData: ExcalidrawInitialDataState;
  onSaveError?: (message: string) => void;
};

export function ExcalidrawCanvas({
  projectPath,
  diagramPath,
  theme,
  initialData,
  onSaveError,
}: ExcalidrawCanvasProps) {
  const skipSaveRef = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{
    projectPath: string;
    diagramPath: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    skipSaveRef.current = true;
    pendingSaveRef.current = null;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const readyTimer = setTimeout(() => {
      skipSaveRef.current = false;
    }, 100);

    return () => {
      clearTimeout(readyTimer);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [diagramPath, initialData]);

  const flushSave = useCallback(async () => {
    const pending = pendingSaveRef.current;
    if (!pending) {
      return;
    }

    pendingSaveRef.current = null;
    try {
      await saveDiagram(
        pending.projectPath,
        pending.diagramPath,
        pending.content,
      );
    } catch {
      onSaveError?.("Impossible de sauvegarder le diagramme.");
    }
  }, [onSaveError]);

  useEffect(() => {
    return () => {
      void flushSave();
    };
  }, [flushSave]);

  const handleChange = useCallback<ExcalidrawChangeHandler>(
    (elements, appState, files) => {
      if (skipSaveRef.current) {
        return;
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        void (async () => {
          const { serializeAsJSON } = await import("@excalidraw/excalidraw");
          pendingSaveRef.current = {
            projectPath,
            diagramPath,
            content: serializeAsJSON(elements, appState, files, "local"),
          };
          await flushSave();
        })();
      }, SAVE_DEBOUNCE_MS);
    },
    [diagramPath, flushSave, projectPath],
  );

  return (
    <div className="workshop-canvas__embed">
      <Excalidraw
        key={`${diagramPath}-${theme}`}
        initialData={initialData}
        theme={theme}
        onChange={handleChange}
      />
    </div>
  );
}
