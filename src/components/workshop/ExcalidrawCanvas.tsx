"use client";

import dynamic from "next/dynamic";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { ExcalidrawProps } from "@excalidraw/excalidraw/types";
import { saveDiagram, type ExcalidrawInitialDataState } from "@/lib/diagram";
import { formatInvokeError } from "@/lib/invoke-error";
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
      <p className="text-lg font-semibold text-foreground">Chargement du canvas…</p>
    ),
  },
);

type ExcalidrawChangeHandler = NonNullable<ExcalidrawProps["onChange"]>;

export type ExcalidrawCanvasHandle = {
  applyScene: (json: string) => void;
};

type ExcalidrawCanvasProps = {
  projectPath: string;
  diagramPath: string;
  theme: FunTheme;
  initialData: ExcalidrawInitialDataState;
  onSaveError?: (message: string | null) => void;
  onSaved?: (content: string) => void;
};

export const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasHandle, ExcalidrawCanvasProps>(
  function ExcalidrawCanvas(
    { projectPath, diagramPath, theme, initialData, onSaveError, onSaved },
    ref,
  ) {
    const skipSaveRef = useRef(true);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSaveRef = useRef<{
      projectPath: string;
      diagramPath: string;
      content: string;
    } | null>(null);
    const sceneUpdateRef = useRef<string | null>(null);
    const sceneKeyRef = useRef(0);

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
        onSaveError?.(null);
        onSaved?.(pending.content);
      } catch (err) {
        onSaveError?.(
          formatInvokeError(err, "Impossible de sauvegarder le diagramme."),
        );
      }
    }, [onSaveError, onSaved]);

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

    useImperativeHandle(
      ref,
      () => ({
        applyScene(json: string) {
          sceneUpdateRef.current = json;
          sceneKeyRef.current += 1;
        },
      }),
      [],
    );

    const resolvedInitialData = sceneUpdateRef.current
      ? (() => {
          try {
            const parsed = JSON.parse(sceneUpdateRef.current) as ExcalidrawInitialDataState;
            return parsed;
          } catch {
            return initialData;
          }
        })()
      : initialData;

    return (
      <div className="flex-1 relative">
        <Excalidraw
          key={`${diagramPath}-${theme}-${sceneKeyRef.current}`}
          initialData={resolvedInitialData}
          theme={theme}
          onChange={handleChange}
        />
      </div>
    );
  },
);
