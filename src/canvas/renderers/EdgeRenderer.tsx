import type { EdgeObject } from "../types";

interface EdgeRendererProps {
  edge: EdgeObject;
  objectsById: Map<string, { x: number; y: number; width: number; height: number }>;
}

export function EdgeRenderer({ edge, objectsById }: EdgeRendererProps) {
  const fromObj = objectsById.get(edge.fromId);
  const toObj = objectsById.get(edge.toId);
  if (!fromObj || !toObj) return null;

  // Calcul des centroïdes
  const fromX = fromObj.x + fromObj.width / 2;
  const fromY = fromObj.y + fromObj.height / 2;
  const toX = toObj.x + toObj.width / 2;
  const toY = toObj.y + toObj.height / 2;

  // Chemin de la ligne (simple droite pour MVP)
  const points: { x: number; y: number }[] = edge.points ?? [];
  const pathData = points.length >= 2
    ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : `M ${fromX} ${fromY} L ${toX} ${toY}`;

  const strokeDasharray = edge.kind === "dependency" || edge.kind === "notes-link" ? "4,4" : undefined;

  return (
    <g opacity={edge.opacity}>
      {/* Ligne principale */}
      <path
        d={pathData}
        fill="none"
        stroke={edge.stroke}
        strokeWidth={edge.strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        data-object-id={edge.id}
      />

      {/* Étiquettes de début/fin selon le type de relation */}
      {(edge.kind === "inheritance" || edge.kind === "implementation" || edge.kind === "aggregation" || edge.kind === "composition") && (
        <PolygonArrow
          fromX={fromX}
          fromY={fromY}
          toX={toX}
          toY={toY}
          fill={edge.stroke}
          strokeWidth={edge.strokeWidth}
        />
      )}

      {/* Label si présent */}
      {edge.label && (
        <text
          x={(fromX + toX) / 2}
          y={(fromY + toY) / 2 - 6}
          fill={edge.stroke}
          fontSize={12}
          textAnchor="middle"
          dominantBaseline="middle"
          pointerEvents="none"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

// Polygone de flèche directionnée (début vers fin)
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
