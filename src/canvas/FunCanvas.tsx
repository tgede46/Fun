"use client";

import { useCallback, useRef, useState } from "react";
import type { FunObject, FunScene, ResizeHandle } from "./types";
import { DEFAULT_STROKE } from "./types";
import { useScene } from "./hooks/useScene";
import { useTool } from "./hooks/useTool";
import { useSelection } from "./hooks/useSelection";
import { useHistory } from "./hooks/useHistory";
import { useZoomPan } from "./hooks/useZoomPan";
import { useFreehandTool } from "./tools/FreehandTool";
import { useShapeTool } from "./tools/ShapeTool";
import { useSelectionTool } from "./tools/SelectionTool";
import { useTextTool } from "./tools/TextTool";
import { CanvasRenderer } from "./CanvasRenderer";
import { objectBBox } from "./utils/geometry";

interface FunCanvasProps {
  initialScene?: FunScene;
  onSceneChange?: (scene: FunScene) => void;
}

export function FunCanvas({ initialScene }: FunCanvasProps) {
  const { scene, objects, addObject, updateObject, deleteObjects, setSceneDirect } = useScene(initialScene);
  const { tool, selectTool } = useTool();
  const { selectedIds, selectedCount, select, selectOnly, selectInRect, clearSelection } = useSelection();
  const { push, undo, redo } = useHistory(scene);
  const { camera, zoom, panStart, screenToWorld } = useZoomPan();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeColor] = useState(DEFAULT_STROKE);
  const [gridEnabled] = useState(true);

  const handleAddObject = useCallback((obj: FunObject) => {
    addObject(obj);
    push({ ...scene, objects: [...scene.objects, obj] });
  }, [addObject, push, scene]);

  const handleUpdateObject = useCallback((id: string, patch: Partial<FunObject>) => {
    updateObject(id, patch);
  }, [updateObject]);

  const freehandTool = useFreehandTool({ camera, onAdd: handleAddObject, activeColor });
  const rectTool = useShapeTool({ camera, onAdd: handleAddObject, kind: "rect", activeColor });
  const ellipseTool = useShapeTool({ camera, onAdd: handleAddObject, kind: "ellipse", activeColor });
  const diamondTool = useShapeTool({ camera, onAdd: handleAddObject, kind: "diamond", activeColor });
  const selectionTool = useSelectionTool({
    camera,
    objects,
    selectedIds,
    onSelect: select,
    onSelectOnly: selectOnly,
    selectInRect,
    clearSelection,
    onUpdate: handleUpdateObject,
  });
  const textTool = useTextTool({ onAdd: handleAddObject, activeColor });

  const hitResizeHandle = useCallback(
    (clientX: number, clientY: number): ResizeHandle | null => {
      if (selectedIds.size !== 1) return null;
      const selectedObj = objects.find((o) => selectedIds.has(o.id));
      if (!selectedObj || selectedObj.type === "freehand") return null;

      const world = screenToWorld(clientX, clientY);
      const bbox = objectBBox(selectedObj);
      const threshold = 8 / camera.zoom;

      const handles: { id: ResizeHandle; x: number; y: number }[] = [
        { id: "nw", x: bbox.x, y: bbox.y },
        { id: "n", x: bbox.x + bbox.width / 2, y: bbox.y },
        { id: "ne", x: bbox.x + bbox.width, y: bbox.y },
        { id: "e", x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 },
        { id: "se", x: bbox.x + bbox.width, y: bbox.y + bbox.height },
        { id: "s", x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height },
        { id: "sw", x: bbox.x, y: bbox.y + bbox.height },
        { id: "w", x: bbox.x, y: bbox.y + bbox.height / 2 },
      ];

      for (const h of handles) {
        if (Math.abs(world.x - h.x) < threshold && Math.abs(world.y - h.y) < threshold) {
          return h.id;
        }
      }
      return null;
    },
    [objects, selectedIds, screenToWorld, camera.zoom],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        panStart(e.clientX, e.clientY);
        return;
      }

      if (tool === "select") {
        selectionTool.handlePointerDown(e, screenToWorld, hitResizeHandle);
      } else if (tool === "freehand") {
        freehandTool.handlePointerDown(e, screenToWorld);
      } else if (tool === "rect") {
        rectTool.handlePointerDown(e, screenToWorld);
      } else if (tool === "ellipse") {
        ellipseTool.handlePointerDown(e, screenToWorld);
      } else if (tool === "diamond") {
        diamondTool.handlePointerDown(e, screenToWorld);
      } else if (tool === "text") {
        textTool.handlePointerDown(e, screenToWorld);
      }
    },
    [tool, screenToWorld, panStart, selectionTool, freehandTool, rectTool, ellipseTool, diamondTool, textTool, hitResizeHandle],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (tool === "select") {
        selectionTool.handlePointerMove(e, screenToWorld);
      } else if (tool === "freehand") {
        freehandTool.handlePointerMove(e, screenToWorld);
      } else if (tool === "rect") {
        rectTool.handlePointerMove(e, screenToWorld);
      } else if (tool === "ellipse") {
        ellipseTool.handlePointerMove(e, screenToWorld);
      } else if (tool === "diamond") {
        diamondTool.handlePointerMove(e, screenToWorld);
      }
    },
    [tool, screenToWorld, selectionTool, freehandTool, rectTool, ellipseTool, diamondTool],
  );

  const handlePointerUp = useCallback(
    () => {
      if (tool === "select") {
        selectionTool.handlePointerUp();
      } else if (tool === "freehand") {
        freehandTool.handlePointerUp();
      } else if (tool === "rect") {
        rectTool.handlePointerUp();
      } else if (tool === "ellipse") {
        ellipseTool.handlePointerUp();
      } else if (tool === "diamond") {
        diamondTool.handlePointerUp();
      }
    },
    [tool, selectionTool, freehandTool, rectTool, ellipseTool, diamondTool],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      zoom(e.deltaY, e.clientX, e.clientY);
    },
    [zoom],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedCount > 0) {
          deleteObjects([...selectedIds]);
          clearSelection();
        }
      }
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        const prev = undo();
        if (prev) setSceneDirect(prev);
      }
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        const next = redo();
        if (next) setSceneDirect(next);
      }
      if (e.key === "Escape") {
        clearSelection();
        selectTool("select");
      }
    },
    [selectedIds, selectedCount, deleteObjects, clearSelection, undo, redo, setSceneDirect, selectTool],
  );

  return (
    <div
      className="flex-1 relative min-h-0 overflow-hidden outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: tool === "select" ? "default" : "crosshair" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <CanvasRenderer
          objects={objects}
          selectedIds={selectedIds}
          camera={camera}
          grid={gridEnabled}
        />
      </svg>
      <div className="absolute bottom-3 left-3 flex gap-1 bg-card border border-border rounded-lg p-1 shadow-sm">
        <ToolButton tool="select" label="Slection" active={tool === "select"} onClick={() => selectTool("select")} shortcut="V" />
        <ToolButton tool="freehand" label="Crayon" active={tool === "freehand"} onClick={() => selectTool("freehand")} shortcut="P" />
        <ToolButton tool="rect" label="Rectangle" active={tool === "rect"} onClick={() => selectTool("rect")} shortcut="R" />
        <ToolButton tool="ellipse" label="Ellipse" active={tool === "ellipse"} onClick={() => selectTool("ellipse")} shortcut="O" />
        <ToolButton tool="diamond" label="Losange" active={tool === "diamond"} onClick={() => selectTool("diamond")} shortcut="D" />
        <ToolButton tool="text" label="Texte" active={tool === "text"} onClick={() => selectTool("text")} shortcut="T" />
      </div>
    </div>
  );
}

function ToolButton({
  tool,
  label,
  active,
  onClick,
  shortcut,
}: {
  tool: string;
  label: string;
  active: boolean;
  onClick: () => void;
  shortcut: string;
}) {
  return (
    <button
      type="button"
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      }`}
      title={`${label} (${shortcut})`}
      onClick={onClick}
    >
      {tool === "select" && "↗"}
      {tool === "freehand" && "✎"}
      {tool === "rect" && "□"}
      {tool === "ellipse" && "○"}
      {tool === "diamond" && "◇"}
      {tool === "text" && "T"}
    </button>
  );
}
