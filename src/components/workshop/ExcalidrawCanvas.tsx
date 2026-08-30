"use client";

import dynamic from "next/dynamic";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import {
  saveDiagram,
  parseExcalidrawContent,
  type ExcalidrawInitialDataState,
} from "@/lib/diagram";
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
    const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
    const pendingSceneRef = useRef<string | null>(null);
    const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(false);

    const pushScene = useCallback((data: ExcalidrawInitialDataState) => {
      if (!apiRef.current || !mountedRef.current) {
        return;
      }

      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current);
      }

      // Différer après le mount Excalidraw (évite setState sur App non monté).
      pushTimerRef.current = setTimeout(() => {
        pushTimerRef.current = null;
        const api = apiRef.current;
        if (!api || !mountedRef.current) {
          return;
        }

        skipSaveRef.current = true;
        try {
          api.updateScene({
            elements: data.elements ?? [],
            captureUpdate: "NEVER",
          });
          if ((data.elements?.length ?? 0) > 0) {
            api.scrollToContent(undefined, { fitToContent: true });
          }
        } catch {
          // Scène invalide — laisser le canvas tel quel.
        }

        window.setTimeout(() => {
          skipSaveRef.current = false;
        }, 200);
      }, 0);
    }, []);

    const pushSceneJson = useCallback(
      (json: string) => {
        void (async () => {
          try {
            pushScene(await parseExcalidrawContent(json));
          } catch {
            onSaveError?.("Le diagramme généré est illisible.");
          }
        })();
      },
      [onSaveError, pushScene],
    );

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        if (pushTimerRef.current) {
          clearTimeout(pushTimerRef.current);
          pushTimerRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      skipSaveRef.current = true;
      pendingSaveRef.current = null;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // initialData charge déjà la scène au mount ; pushScene seulement pour mises à jour IA.
      if (apiRef.current && mountedRef.current) {
        pushScene(initialData);
      }

      const readyTimer = window.setTimeout(() => {
        skipSaveRef.current = false;
      }, 300);

      return () => {
        clearTimeout(readyTimer);
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }, [diagramPath, initialData, pushScene]);

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

    const handleExcalidrawApi = useCallback((api: ExcalidrawImperativeAPI) => {
      apiRef.current = api;

      // Ne pas appeler updateScene ici : App n'est pas encore monté.
      // Appliquer une scène en attente après le prochain tick.
      if (pendingSceneRef.current) {
        const pending = pendingSceneRef.current;
        pendingSceneRef.current = null;
        window.setTimeout(() => {
          if (mountedRef.current) {
            pushSceneJson(pending);
          }
        }, 50);
      }
    }, [pushSceneJson]);

    useImperativeHandle(
      ref,
      () => ({
        applyScene(json: string) {
          if (apiRef.current && mountedRef.current) {
            pushSceneJson(json);
          } else {
            pendingSceneRef.current = json;
          }
        },
      }),
      [pushSceneJson],
    );

    return (
      <div className="flex-1 relative min-h-0">
        <Excalidraw
          key={diagramPath}
          excalidrawAPI={handleExcalidrawApi}
          initialData={initialData}
          theme={theme}
          langCode="fr-FR"
          onChange={handleChange}
        />
      </div>
    );
  },
);
