import type { EdgeObject } from "../types";
import { pointNearEdge } from "../utils/geometry";

interface EdgeRendererProps {
  edge: EdgeObject;
  objectsById: Map<string, { x: number; y: number; width: number; height: number }>;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function EdgeRenderer({ edge, objectsById, selected, onSelect }: EdgeRendererProps) {
  const fromObj = objectsById.get(edge.fromId);
  const toObj = objectsById.get(edge.toId);
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(edge.id);
  };

  return (
    <g opacity={edge.opacity} onClick={handleClick} style={{ cursor: onSelect ? "pointer" : undefined }}>
      {/* Zone de clic invisible (plus large) */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        strokeLinecap="round"
      />

      {/* Ligne principale */}
      <path
        d={pathData}
        fill="none"
        stroke={selected ? "#4f8ff7" : edge.stroke}
        strokeWidth={selected ? edge.strokeWidth + 1 : edge.strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        data-object-id={edge.id}
      />

      {/* Flèche directionnelle */}
      {(edge.kind === "inheritance" || edge.kind === "implementation" || edge.kind === "aggregation" || edge.kind === "composition") && (
        <PolygonArrow
          fromX={fromX}
          fromY={fromY}
          toX={toX}
          toY={toY}
          fill={selected ? "#4f8ff7" : edge.stroke}
          strokeWidth={edge.strokeWidth}
        />
      )}

      {/* Label */}
      {edge.label && (
        <text
          x={(fromX + toX) / 2}
          y={(fromY + toY) / 2 - 6}
          fill={selected ? "#4f8ff7" : edge.stroke}
          fontSize={12}
          textAnchor="middle"
          dominantBaseline="middle"
          pointerEvents="none"
        >
          {edge.label}
        </text>
      )}

      {/* Indicateur de sélection : petits cercles aux extrémités */}
      {selected && (
        <>
          <circle cx={fromX} cy={fromY} r={4} fill="#4f8ff7" stroke="white" strokeWidth={1.5} />
          <circle cx={toX} cy={toY} r={4} fill="#4f8ff7" stroke="white" strokeWidth={1.5} />
        </>
      )}
    </g>
  );
}

function PolygonArrow({
  fromX,
  fromY,
  toX,
  toY,
  fill,
  strokeWidth,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fill: string;
  strokeWidth: number;
}) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  const angle = Math.atan2(dy, dx);
  const headLength = Math.min(12, len * 0.3);
  const headAngle = Math.PI / 6;

  const tipX = toX;
  const tipY = toY;
  const leftX = tipX - headLength * Math.cos(angle - headAngle);
  const leftY = tipY - headLength * Math.sin(angle - headAngle);
  const rightX = tipX - headLength * Math.cos(angle + headAngle);
  const rightY = tipY - headLength * Math.sin(angle + headAngle);

  return (
    <polygon
      points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
      fill={fill}
      stroke={fill}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  );
}
