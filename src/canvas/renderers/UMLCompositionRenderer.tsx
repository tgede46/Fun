import type { UMLAggregationObject } from "../types";

export function UMLAggregationRenderer({ obj, selected }: { obj: UMLAggregationObject; selected?: boolean }) {
  const [start, end] = obj.points;
  if (!start || !end) return null;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  const angle = Math.atan2(dy, dx);
  const headSize = Math.min(15, len * 0.4);

  // Diamant vide (hollow diamond)
  const p1 = { x: end.x, y: end.y };
  const ds = headSize * 0.5;
  const d1 = { x: p1.x - ds * Math.cos(angle - Math.PI / 2), y: p1.y - ds * Math.sin(angle - Math.PI / 2) };
  const d2 = { x: p1.x, y: p1.y };
  const d3 = { x: p1.x - ds * Math.cos(angle + Math.PI / 2), y: p1.y - ds * Math.sin(angle + Math.PI / 2) };

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      <line
        x1={start.x}
        y1={start.y}
        x2={p1.x}
        y2={p1.y}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth}
        strokeLinecap="round"
        opacity={obj.opacity}
      />
      <polygon
        points={`${d1.x},${d1.y} ${d2.x},${d2.y} ${d3.x},${d3.y}`}
        fill="white"
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth}
        strokeLinejoin="round"
        opacity={obj.opacity}
      />

      <circle cx={start.x} cy={start.y} r={3} fill={obj.stroke} stroke="none" opacity={obj.opacity} />

      {selected && (
        <>
          <line
            x1={start.x}
            y1={start.y}
            x2={p1.x}
            y2={p1.y}
            stroke="var(--fun-accent)"
            strokeWidth={obj.strokeWidth + 6}
            opacity={0.3}
            strokeLinecap="round"
            pointerEvents="none"
          />
          <circle cx={start.x} cy={start.y} r={5} fill="white" stroke="var(--fun-accent)" strokeWidth={2} />
          <circle cx={end.x} cy={end.y} r={5} fill="white" stroke="var(--fun-accent)" strokeWidth={2} />
        </>
      )}
    </g>
  );
}
