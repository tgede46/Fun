"use client";

import { useCallback, useState } from "react";

type TransformMode = "translate" | "rotate" | "scale";

interface TransformToolProps {
  onModeChange?: (mode: TransformMode) => void;
}

export function useTransformTool({ onModeChange }: TransformToolProps = {}) {
  const [mode, setMode] = useState<TransformMode>("translate");

  const setTranslateMode = useCallback(() => {
    setMode("translate");
    onModeChange?.("translate");
  }, [onModeChange]);

  const setRotateMode = useCallback(() => {
    setMode("rotate");
    onModeChange?.("rotate");
  }, [onModeChange]);

  const setScaleMode = useCallback(() => {
    setMode("scale");
    onModeChange?.("scale");
  }, [onModeChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "g":
          e.preventDefault();
          setTranslateMode();
          break;
        case "r":
          e.preventDefault();
          setRotateMode();
          break;
        case "s":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setScaleMode();
          }
          break;
      }
    },
    [setTranslateMode, setRotateMode, setScaleMode],
  );

  return {
    mode,
    setTranslateMode,
    setRotateMode,
    setScaleMode,
    handleKeyDown,
  };
}

export function TransformToolbar({ mode, onModeChange }: { mode: TransformMode; onModeChange: (mode: TransformMode) => void }) {
  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-sm">
      <button
        type="button"
        className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
          mode === "translate"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        }`}
        title="Déplacer (G)"
        onClick={() => onModeChange("translate")}
      >
        ↕
      </button>
      <button
        type="button"
        className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
          mode === "rotate"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        }`}
        title="Rotation (R)"
        onClick={() => onModeChange("rotate")}
      >
        ↻
      </button>
      <button
        type="button"
        className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
          mode === "scale"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        }`}
        title="Échelle (S)"
        onClick={() => onModeChange("scale")}
      >
        ⤢
      </button>
    </div>
  );
}