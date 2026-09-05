import { useCallback, useState } from "react";
import type { Camera, FunObject, EdgeObject } from "../types";
import { DEFAULT_STROKE, DEFAULT_STROKE_WIDTH } from "../types";
import { pointInObject } from "../utils/geometry";

export type EdgeKind = EdgeObject["kind"];

interface UseEdgeToolProps {
  camera?: Camera;
  objects: FunObject[];
  onAddEdge: (edge: EdgeObject) => void;
  activeColor?: string;
}

export function useEdgeTool({ objects, onAddEdge, activeColor = DEFAULT_STROKE }: UseEdgeToolProps) {
  const [phase, setPhase] = useState<"idle" | "source-selected">("idle");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [sourceObj, setSourceObj] = useState<FunObject | null>(null);
  const [previewEnd, setPreviewEnd] = useState<{ x: number; y: number } | null>(null);
  const [edgeKind, setEdgeKind] = useState<EdgeKind>("association");

  const findObjectAt = useCallback(
    (wx: number, wy: number): FunObject | undefined => {
      return [...objects].reverse().find((obj) => {
        if (obj.locked) return false;
        return pointInObject(wx, wy, obj);
      });
    },
    [objects],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (e.button !== 0) return;
      const world = screenToWorld(e.clientX, e.clientY);
      const hit = findObjectAt(world.x, world.y);

      if (!hit) return;

      if (phase === "idle") {
        setSourceId(hit.id);
        setSourceObj(hit);
        setPhase("source-selected");
      } else if (phase === "source-selected" && hit.id !== sourceId) {
        const fromObj = sourceObj;
        if (!fromObj) return;

        const fromX = fromObj.x + fromObj.width / 2;
        const fromY = fromObj.y + fromObj.height / 2;
        const toX = hit.x + hit.width / 2;
        const toY = hit.y + hit.height / 2;

        onAddEdge({
          id: crypto.randomUUID(),
          type: "edge",
          x: Math.min(fromX, toX),
          y: Math.min(fromY, toY),
          width: Math.abs(toX - fromX),
          height: Math.abs(toY - fromY),
          fill: "transparent",
          stroke: activeColor,
          strokeWidth: DEFAULT_STROKE_WIDTH,
          opacity: 1,
          locked: false,
          zIndex: 0,
          fromId: fromObj.id,
          toId: hit.id,
          kind: edgeKind,
        });

        setSourceId(null);
        setSourceObj(null);
        setPreviewEnd(null);
        setPhase("idle");
      }
    },
    [phase, sourceId, sourceObj, findObjectAt, onAddEdge, activeColor, edgeKind],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (phase !== "source-selected") return;
      setPreviewEnd(screenToWorld(e.clientX, e.clientY));
    },
    [phase],
  );

  const handlePointerUp = useCallback(() => {
    // rien — on crée l'edge au 2e clic
  }, []);

  const cycleEdgeKind = useCallback(() => {
    const kinds: EdgeKind[] = ["association", "inheritance", "implementation", "aggregation", "composition", "dependency", "notes-link"];
    const idx = kinds.indexOf(edgeKind);
    setEdgeKind(kinds[(idx + 1) % kinds.length]);
  }, [edgeKind]);

  const cancel = useCallback(() => {
    setSourceId(null);
    setSourceObj(null);
    setPreviewEnd(null);
    setPhase("idle");
  }, []);

  return {
    phase,
    sourceId,
    edgeKind,
    previewEnd,
    sourceObj,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cycleEdgeKind,
    cancel,
  };
}
