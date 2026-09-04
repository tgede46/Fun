import type { UMLAssociationObject } from "../types";

export function UMLAssociationRenderer({ obj, selected }: { obj: UMLAssociationObject; selected?: boolean }) {
  const [start, end] = obj.points;
  if (!start || !end) return null;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  const angle = Math.atan2(dy, dx);
  const headSize = Math.min(12, len * 0.3);
  const head1x = end.x - headSize * Math.cos(angle - Math.PI / 6);
  const head1y = end.y - headSize * Math.sin(angle - Math.PI / 6);
  const head2x = end.x - headSize * Math.cos(angle + Math.PI / 6);
  const head2y = end.y - headSize * Math.sin(angle + Math.PI / 6);

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth}
        strokeLinecap="round"
        opacity={obj.opacity}
      />
      <path
        d={`M ${head1x} ${head1y} L ${end.x} ${end.y} L ${head2x} ${head2y}`}
        fill="none"
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={obj.opacity}
      />
      <circle cx={start.x} cy={start.y} r={3} fill={obj.stroke} stroke="none" opacity={obj.opacity} />

      {selected && (
        <>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="var(--fun-accent)"
            strokeWidth={obj.strokeWidth + 4}
            opacity={0.3}
            strokeLinecap="round"
            pointerEvents="none"
          />
          <circle cx={start.x} cy={start.y} r={5} fill="white" stroke="var(--fun-accent)" strokeWidth={2} />
          <circle cx={end.x} cy={end.y} r={5} fill="white" stroke="var(--fun-accent)" strokeWidth={2} />
          <path
            d={`M ${head1x} ${head1y} L ${end.x} ${end.y} L ${head2x} ${head2y}`}
            fill="none"
            stroke="var(--fun-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.5}
            pointerEvents="none"
          />
        </>
      )}
    </g>
  );
}
