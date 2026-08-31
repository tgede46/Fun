import { useCallback, useRef, useState } from "react";
import type { FunScene } from "../types";

interface HistoryEntry {
  scene: FunScene;
}

const MAX_HISTORY = 100;

export function useHistory(initial: FunScene) {
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const currentRef = useRef<FunScene>(initial);

  const push = useCallback((scene: FunScene) => {
    currentRef.current = scene;
    setPast((prev) => {
      const next = [...prev, { scene }];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setFuture([]);
  }, []);

  const undo = useCallback((): FunScene | null => {
    if (past.length === 0) return null;
    const entry = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [...prev, { scene: currentRef.current }]);
    currentRef.current = entry.scene;
    return entry.scene;
  }, [past]);

  const redo = useCallback((): FunScene | null => {
    if (future.length === 0) return null;
    const entry = future[future.length - 1];
    setFuture((prev) => prev.slice(0, -1));
    setPast((prev) => [...prev, { scene: currentRef.current }]);
    currentRef.current = entry.scene;
    return entry.scene;
  }, [future]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return { push, undo, redo, canUndo, canRedo };
}
