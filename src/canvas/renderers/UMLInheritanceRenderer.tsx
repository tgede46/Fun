import type { UMLInheritanceObject } from "../types";

export function UMLInheritanceRenderer({ obj, selected }: { obj: UMLInheritanceObject; selected?: boolean }) {
  const [start, end] = obj.points;
  if (!start || !end) return null;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  const angle = Math.atan2(dy, dx);
  const headSize = Math.min(15, len * 0.4);

  // Triangle vide (hollow triangle)
  const p1x = end.x;
  const p1y = end.y;
  const p2x = end.x - headSize * Math.cos(angle - Math.PI / 6);
  const p2y = end.y - headSize * Math.sin(angle - Math.PI / 6);
  const p3x = end.x - headSize * Math.cos(angle + Math.PI / 6);
  const p3y = end.y - headSize * Math.sin(angle + Math.PI / 6);

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      <line
        x1={start.x}
        y1={start.y}
        x2={p2x}
        y2={p2y}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth}
        strokeLinecap="round"
        opacity={obj.opacity}
      />
      <line
        x1={start.x}
        y1={start.y}
        x2={p3x}
        y2={p3y}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth}
        strokeLinecap="round"
        opacity={obj.opacity}
      />

      <polygon
        points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`}
        fill="none"
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
            x2={p1x}
            y2={p1y}
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
