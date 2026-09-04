"use client";

import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import type { FunObject, FunScene, ResizeHandle } from "./types";
import { DEFAULT_STROKE } from "./types";
import { useScene } from "./hooks/useScene";
import { useTool } from "./hooks/useTool";
import { useSelection } from "./hooks/useSelection";
import { useHistory } from "./hooks/useHistory";
import { useZoomPan } from "./hooks/useZoomPan";
import { useFreehandTool } from "./tools/FreehandTool";
import { useShapeTool } from "./tools/ShapeTool";
import { useArrowTool } from "./tools/ArrowTool";
import { useSelectionTool } from "./tools/SelectionTool";
import { useTextTool } from "./tools/TextTool";
import { useImageTool } from "./tools/ImageTool";
import { useClipboard } from "./hooks/useClipboard";
import { CanvasRenderer } from "./CanvasRenderer";
import { Inspector } from "./components/Inspector";
import { LayersPanel } from "./components/LayersPanel";
import { objectBBox } from "./utils/geometry";
import { ActionManager } from "./actions/manager";
import { toolActions } from "./actions/toolActions";
import { editActions } from "./actions/editActions";
import { viewActions } from "./actions/viewActions";
import type { ActionContext } from "./actions/types";

interface FunCanvasProps {
  initialScene?: FunScene;
  onSceneChange?: (scene: FunScene) => void;
  focusMode?: boolean;
  layersOpen?: boolean;
  onLayersOpenChange?: (open: boolean) => void;
}

interface ContextMenu {
  x: number;
  y: number;
}

const actionManager = new ActionManager();
actionManager.registerAll([...toolActions, ...editActions, ...viewActions]);

export function FunCanvas({
  initialScene,
  onSceneChange,
  focusMode = false,
  layersOpen = false,
  onLayersOpenChange,
}: FunCanvasProps) {
  const { scene, objects, addObject, updateObject, deleteObjects, setSceneDirect } = useScene(initialScene);
  const { tool, selectTool } = useTool();
  const { selectedIds, selectedCount, select, selectOnly, selectInRect, clearSelection } = useSelection();
  const { push, undo, redo, canUndo, canRedo } = useHistory(scene);
  const { camera, zoom, panStart, panMove, panEnd, screenToWorld, zoomToFit, centerView } = useZoomPan();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeColor] = useState(DEFAULT_STROKE);
  const [gridEnabled] = useState(true);
  const [snapLines, setSnapLines] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  const setLayersOpen = useCallback(
    (open: boolean) => {
      onLayersOpenChange?.(open);
    },
    [onLayersOpenChange],
  );

  const handleAddObject = useCallback((obj: FunObject) => {
    addObject(obj);
    push({ ...scene, objects: [...scene.objects, obj] });
  }, [addObject, push, scene]);

  const handleUpdateObject = useCallback((id: string, patch: Partial<FunObject>) => {
    updateObject(id, patch);
  }, [updateObject]);

  useEffect(() => {
    onSceneChange?.(scene);
  }, [onSceneChange, scene]);

  useEffect(() => {
    if (focusMode && layersOpen) {
      setLayersOpen(false);
    }
  }, [focusMode, layersOpen, setLayersOpen]);

  const freehandTool = useFreehandTool({ camera, onAdd: handleAddObject, activeColor });
  const rectTool = useShapeTool({ camera, onAdd: handleAddObject, kind: "rect", activeColor });
  const ellipseTool = useShapeTool({ camera, onAdd: handleAddObject, kind: "ellipse", activeColor });
  const diamondTool = useShapeTool({ camera, onAdd: handleAddObject, kind: "diamond", activeColor });
  const arrowTool = useArrowTool({ camera, onAdd: handleAddObject, activeColor });
  const selectionTool = useSelectionTool({
    camera,
    objects,
    selectedIds,
    onSelect: select,
    onSelectOnly: selectOnly,
    selectInRect,
    clearSelection,
    onUpdate: handleUpdateObject,
    onSnapLines: setSnapLines,
  });
  const textTool = useTextTool({ onAdd: handleAddObject, activeColor });
  const imageTool = useImageTool({ onAdd: handleAddObject });
  const clipboard = useClipboard();

  const actionContext: ActionContext = useMemo(() => ({
    elements: objects,
    selectedIds,
    scene,
    activeTool: tool,
    canUndo,
    canRedo,
    canPaste: clipboard.canPaste,
    zoom: camera.zoom,
  }), [objects, selectedIds, scene, tool, canUndo, canRedo, clipboard.canPaste, camera.zoom]);

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
      if (contextMenu) {
        setContextMenu(null);
        return;
      }

      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        panStart(e.clientX, e.clientY);
        return;
      }

      if (e.button === 2) return;

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
      } else if (tool === "arrow") {
        arrowTool.handlePointerDown(e, screenToWorld);
      }
    },
    [tool, screenToWorld, panStart, selectionTool, freehandTool, rectTool, ellipseTool, diamondTool, textTool, arrowTool, hitResizeHandle, contextMenu],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.buttons === 4 || (e.buttons === 1 && e.ctrlKey)) {
        panMove(e.clientX, e.clientY);
        return;
      }

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
      } else if (tool === "arrow") {
        arrowTool.handlePointerMove(e, screenToWorld);
      }
    },
    [tool, screenToWorld, panMove, selectionTool, freehandTool, rectTool, ellipseTool, diamondTool, arrowTool],
  );

  const handlePointerUp = useCallback(
    () => {
      panEnd();
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
      } else if (tool === "arrow") {
        arrowTool.handlePointerUp();
      }
    },
    [tool, panEnd, selectionTool, freehandTool, rectTool, ellipseTool, diamondTool, arrowTool],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      zoom(e.deltaY, e.clientX, e.clientY);
    },
    [zoom],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const executeAction = useCallback((actionName: string, source: "keyboard" | "contextMenu" = "keyboard") => {
    const action = actionManager.getAction(actionName as any);
    if (!action) return;

    const result = actionManager.executeAction(action, actionContext, source);
    if (!result) return;

    if (result.appState?.activeTool) {
      selectTool(result.appState.activeTool as any);
    }

    if (actionName === "undo") {
      const prev = undo();
      if (prev) setSceneDirect(prev);
    }
    if (actionName === "redo") {
      const next = redo();
      if (next) setSceneDirect(next);
    }
    if (actionName === "copy") {
      const selectedObjs = objects.filter((o) => selectedIds.has(o.id));
      clipboard.copy(selectedObjs);
    }
    if (actionName === "paste") {
      const newObjs = clipboard.paste();
      newObjs.forEach((obj) => {
        addObject(obj);
        push({ ...scene, objects: [...scene.objects, obj] });
      });
      clearSelection();
      newObjs.forEach((obj) => select(obj.id, true));
    }
    if (actionName === "duplicate") {
      const selectedObjs = objects.filter((o) => selectedIds.has(o.id));
      const newObjs = clipboard.duplicate(selectedObjs);
      newObjs.forEach((obj) => {
        addObject(obj);
        push({ ...scene, objects: [...scene.objects, obj] });
      });
      clearSelection();
      newObjs.forEach((obj) => select(obj.id, true));
    }
    if (actionName === "delete") {
      deleteObjects([...selectedIds]);
      clearSelection();
    }
    if (actionName === "selectAll") {
      objects.forEach((obj) => select(obj.id, true));
    }
    if (actionName === "zoomToFit") {
      const svg = svgRef.current;
      if (svg) zoomToFit(objects, svg.clientWidth, svg.clientHeight);
    }
    if (actionName === "zoomIn") {
      zoom(-100, window.innerWidth / 2, window.innerHeight / 2);
    }
    if (actionName === "zoomOut") {
      zoom(100, window.innerWidth / 2, window.innerHeight / 2);
    }
    if (actionName === "resetZoom") {
      zoom(0, window.innerWidth / 2, window.innerHeight / 2);
    }
  }, [actionContext, selectTool, undo, redo, setSceneDirect, objects, selectedIds, clipboard, addObject, push, scene, clearSelection, select, deleteObjects, zoomToFit, zoom]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        clearSelection();
        selectTool("select");
        setContextMenu(null);
        return;
      }

      actionManager.handleKeyDown(e, actionContext, (action) => {
        executeAction(action.name, "keyboard");
      });
    },
    [actionContext, clearSelection, selectTool, executeAction],
  );

  const handleCopy = useCallback(() => {
    executeAction("copy", "contextMenu");
    setContextMenu(null);
  }, [executeAction]);

  const handlePaste = useCallback(() => {
    executeAction("paste", "contextMenu");
    setContextMenu(null);
  }, [executeAction]);

  const handleDuplicate = useCallback(() => {
    executeAction("duplicate", "contextMenu");
    setContextMenu(null);
  }, [executeAction]);

  const handleDelete = useCallback(() => {
    executeAction("delete", "contextMenu");
    setContextMenu(null);
  }, [executeAction]);

  const handleSelectAll = useCallback(() => {
    executeAction("selectAll", "contextMenu");
    setContextMenu(null);
  }, [executeAction]);

  const handleZoomToFit = useCallback(() => {
    executeAction("zoomToFit", "contextMenu");
    setContextMenu(null);
  }, [executeAction]);

  const zoomPercent = Math.round(camera.zoom * 100);

  return (
    <div
      className="flex-1 relative min-h-0 overflow-hidden outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: tool === "select" ? "default" : "crosshair" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onDrop={imageTool.handleDrop}
        onDragOver={imageTool.handleDragOver}
      >
        <CanvasRenderer
          objects={objects}
          selectedIds={selectedIds}
          camera={camera}
          grid={gridEnabled}
          snapLines={snapLines}
        />
      </svg>

      {/* Toolbar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-card border border-border rounded-xl p-1.5 shadow-lg">
        <ToolButton tool="select" label="Sélection" icon="↗" active={tool === "select"} onClick={() => selectTool("select")} shortcut="V" />
        <div className="w-px h-5 bg-border mx-0.5" />
        <ToolButton tool="freehand" label="Crayon" icon="✎" active={tool === "freehand"} onClick={() => selectTool("freehand")} shortcut="P" />
        <ToolButton tool="rect" label="Rectangle" icon="□" active={tool === "rect"} onClick={() => selectTool("rect")} shortcut="R" />
        <ToolButton tool="ellipse" label="Ellipse" icon="○" active={tool === "ellipse"} onClick={() => selectTool("ellipse")} shortcut="O" />
        <ToolButton tool="diamond" label="Losange" icon="◇" active={tool === "diamond"} onClick={() => selectTool("diamond")} shortcut="D" />
        <div className="w-px h-5 bg-border mx-0.5" />
        <ToolButton tool="text" label="Texte" icon="T" active={tool === "text"} onClick={() => selectTool("text")} shortcut="T" />
        <ToolButton tool="arrow" label="Flèche" icon="→" active={tool === "arrow"} onClick={() => selectTool("arrow")} shortcut="A" />
        <ToolButton tool="image" label="Image" icon="🖼" active={tool === "image"} onClick={imageTool.handleFileInput} shortcut="I" />
      </div>

      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-sm pointer-events-auto">
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Annuler (Ctrl+Z)"
            disabled={!canUndo}
            onClick={() => executeAction("undo")}
          >
            ↶
          </button>
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Rétablir (Ctrl+Y)"
            disabled={!canRedo}
            onClick={() => executeAction("redo")}
          >
            ↷
          </button>
        </div>

        {/* Zoom + Layers */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {!focusMode ? (
            <button
              type="button"
              className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${
                layersOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
              title="Calques"
              onClick={() => setLayersOpen(!layersOpen)}
            >
              ☰
            </button>
          ) : null}
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-sm">
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center rounded text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              title="Zoom arrière"
              onClick={() => executeAction("zoomOut")}
            >
              −
            </button>
            <span className="text-xs text-muted-foreground w-10 text-center font-mono" title="Ctrl+molette pour zoomer">
              {zoomPercent}%
            </span>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center rounded text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              title="Zoom avant"
              onClick={() => executeAction("zoomIn")}
            >
              +
            </button>
            <div className="w-px h-5 bg-border" />
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center rounded text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              title="Ajuster à la vue (Ctrl+Shift+F)"
              onClick={() => executeAction("zoomToFit")}
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {!focusMode ? (
        <>
          <Inspector
            selectedObjects={objects.filter((o) => selectedIds.has(o.id))}
            onUpdate={handleUpdateObject}
          />
          {layersOpen ? (
            <LayersPanel
              objects={objects}
              selectedIds={selectedIds}
              onSelect={select}
              onUpdate={handleUpdateObject}
              onDelete={deleteObjects}
              onClose={() => setLayersOpen(false)}
            />
          ) : null}
        </>
      ) : (
        <div className="absolute right-3 top-3 rounded-lg border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
          Mode focus — calques et propriétés masqués
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenuComponent
          x={contextMenu.x}
          y={contextMenu.y}
          hasSelection={selectedCount > 0}
          canPaste={clipboard.canPaste}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onSelectAll={handleSelectAll}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Status bar */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-muted-foreground bg-card/80 border border-border rounded-lg px-2 py-1 shadow-sm pointer-events-none">
        {selectedCount > 0 ? (
          <span>{selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}</span>
        ) : (
          <span>{objects.length} objet{objects.length > 1 ? "s" : ""}</span>
        )}
        <span className="text-border">|</span>
        <span>{tool === "select" ? "V" : tool === "freehand" ? "P" : tool === "rect" ? "R" : tool === "ellipse" ? "O" : tool === "diamond" ? "D" : tool === "text" ? "T" : tool === "arrow" ? "A" : "I"}</span>
      </div>
    </div>
  );
}

function ToolButton({
  tool,
  label,
  icon,
  active,
  onClick,
  shortcut,
}: {
  tool: string;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  shortcut: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className={`w-9 h-9 flex items-center justify-center rounded-lg text-base transition-all ${
          active
            ? "bg-primary text-primary-foreground shadow-sm scale-105"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:scale-105"
        }`}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {icon}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap z-50 pointer-events-none">
          {label} <span className="opacity-60">({shortcut})</span>
        </div>
      )}
    </div>
  );
}

function ContextMenuComponent({
  x,
  y,
  hasSelection,
  canPaste,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onSelectAll,
  onClose,
}: {
  x: number;
  y: number;
  hasSelection: boolean;
  canPaste: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newX = x + rect.width > window.innerWidth ? x - rect.width : x;
      const newY = y + rect.height > window.innerHeight ? y - rect.height : y;
      setAdjustedPos({ x: newX, y: newY });
    }
  }, [x, y]);

  useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-card border border-border rounded-lg shadow-xl py-1 z-50 min-w-[180px]"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <ContextMenuItem label="Copier" shortcut="Ctrl+C" onClick={onCopy} disabled={!hasSelection} />
      <ContextMenuItem label="Coller" shortcut="Ctrl+V" onClick={onPaste} disabled={!canPaste} />
      <ContextMenuItem label="Dupliquer" shortcut="Ctrl+D" onClick={onDuplicate} disabled={!hasSelection} />
      <div className="h-px bg-border my-1" />
      <ContextMenuItem label="Supprimer" shortcut="Suppr" onClick={onDelete} disabled={!hasSelection} />
      <div className="h-px bg-border my-1" />
      <ContextMenuItem label="Tout sélectionner" shortcut="Ctrl+A" onClick={onSelectAll} />
    </div>
  );
}

function ContextMenuItem({
  label,
  shortcut,
  onClick,
  disabled = false,
}: {
  label: string;
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`w-full px-3 py-1.5 text-left text-sm flex items-center justify-between ${
        disabled
          ? "text-muted-foreground/50 cursor-not-allowed"
          : "text-foreground hover:bg-accent/50 cursor-pointer"
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="text-xs text-muted-foreground ml-4">{shortcut}</span>
    </button>
  );
}
