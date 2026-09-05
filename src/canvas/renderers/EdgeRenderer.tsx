import { useState, useRef, useEffect, useCallback } from "react";
import type { EdgeObject } from "../types";

interface EdgeRendererProps {
  edge: EdgeObject;
  objectsById: Map<string, { x: number; y: number; width: number; height: number }>;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onLabelChange?: (id: string, label: string) => void;
  onEndpointDrag?: (edgeId: string, endpoint: "from" | "to", newTargetId: string) => void;
}

export function EdgeRenderer({ edge, objectsById, selected, onSelect, onLabelChange, onEndpointDrag }: EdgeRendererProps) {
  const fromObj = objectsById.get(edge.fromId);
  const toObj = objectsById.get(edge.toId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(edge.label ?? "");
  const [dragging, setDragging] = useState<"from" | "to" | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const svg = (e.target as SVGElement).ownerSVGElement;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursor = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    setDragPos({ x: cursor.x, y: cursor.y });
  }, [dragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging || !dragPos) {
      setDragging(null);
      setDragPos(null);
      return;
    }

    // Trouver l'objet sous le curseur
    const svg = (e.target as SVGElement).ownerSVGElement;
    if (svg) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const cursor = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      for (const [id, obj] of objectsById) {
        const targetId = dragging === "from" ? edge.toId : edge.fromId;
        if (id === targetId) continue;
        if (
          cursor.x >= obj.x && cursor.x <= obj.x + obj.width &&
          cursor.y >= obj.y && cursor.y <= obj.y + obj.height
        ) {
          onEndpointDrag?.(edge.id, dragging, id);
          break;
        }
      }
    }

    setDragging(null);
    setDragPos(null);
  }, [dragging, dragPos, objectsById, edge.id, edge.fromId, edge.toId, onEndpointDrag]);

  if (!fromObj || !toObj) return null;

  const fromX = fromObj.x + fromObj.width / 2;
  const fromY = fromObj.y + fromObj.height / 2;
  const toX = toObj.x + toObj.width / 2;
  const toY = toObj.y + toObj.height / 2;

  const points: { x: number; y: number }[] = edge.points ?? [];
  const pathData = points.length >= 2
    ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : `M ${fromX} ${fromY} L ${toX} ${toY}`;

  const strokeDasharray = edge.kind === "dependency" || edge.kind === "notes-link" ? "4,4" : undefined;
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(edge.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(edge.label ?? "");
    setEditing(true);
  };

  const commitLabel = () => {
    setEditing(false);
    onLabelChange?.(edge.id, draft.trim());
  };

  const activeFrom = dragging === "from" && dragPos ? dragPos : { x: fromX, y: fromY };
  const activeTo = dragging === "to" && dragPos ? dragPos : { x: toX, y: toY };

  const activePathData = dragging
    ? `M ${activeFrom.x} ${activeFrom.y} L ${activeTo.x} ${activeTo.y}`
    : pathData;

  return (
    <g
      opacity={edge.opacity}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ cursor: onSelect ? "pointer" : undefined }}
    >
      {/* Zone de clic invisible */}
      <path d={pathData} fill="none" stroke="transparent" strokeWidth={16} strokeLinecap="round" />

      {/* Ligne principale (ou preview pendant drag) */}
      <path
        d={activePathData}
        fill="none"
        stroke={selected || dragging ? "#4f8ff7" : edge.stroke}
        strokeWidth={selected || dragging ? edge.strokeWidth + 1 : edge.strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        data-object-id={edge.id}
      />

      {/* Flèche */}
      {!dragging && (edge.kind === "inheritance" || edge.kind === "implementation" || edge.kind === "aggregation" || edge.kind === "composition") && (
        <PolygonArrow
          fromX={fromX} fromY={fromY} toX={toX} toY={toY}
          fill={selected ? "#4f8ff7" : edge.stroke}
          strokeWidth={edge.strokeWidth}
        />
      )}

      {/* Label éditable */}
      {editing ? (
        <foreignObject x={midX - 50} y={midY - 14} width={100} height={28}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitLabel();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full h-full text-xs text-center bg-white border border-[#4f8ff7] rounded px-1 outline-none shadow-sm"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        </foreignObject>
      ) : edge.label ? (
        <text x={midX} y={midY - 6} fill={selected ? "#4f8ff7" : edge.stroke} fontSize={12} textAnchor="middle" dominantBaseline="middle" pointerEvents="none">
          {edge.label}
        </text>
      ) : null}

      {/* Handles de sélection + endpoints draggable */}
      {selected && !dragging && (
        <>
          <circle
            cx={fromX} cy={fromY} r={5}
            fill="#4f8ff7" stroke="white" strokeWidth={1.5}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setDragging("from");
            }}
          />
          <circle
            cx={toX} cy={toY} r={5}
            fill="#4f8ff7" stroke="white" strokeWidth={1.5}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setDragging("to");
            }}
          />
        </>
      )}
    </g>
  );
}

function PolygonArrow({ fromX, fromY, toX, toY, fill, strokeWidth }: {
  fromX: number; fromY: number; toX: number; toY: number; fill: string; strokeWidth: number;
}) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  const angle = Math.atan2(dy, dx);
  const headLength = Math.min(12, len * 0.3);
  const headAngle = Math.PI / 6;

  return (
    <polygon
      points={`${toX},${toY} ${toX - headLength * Math.cos(angle - headAngle)},${toY - headLength * Math.sin(angle - headAngle)} ${toX - headLength * Math.cos(angle + headAngle)},${toY - headLength * Math.sin(angle + headAngle)}`}
      fill={fill} stroke={fill} strokeWidth={strokeWidth} strokeLinejoin="round"
    />
  );
}
