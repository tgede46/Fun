import type { ArrowObject } from "../types";

interface ArrowRendererProps {
  obj: ArrowObject;
  selected?: boolean;
}

export function ArrowRenderer({ obj, selected }: ArrowRendererProps) {
  const [start, end] = obj.points;
  if (!start || !end) return null;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 1) return null;

  const angle = Math.atan2(dy, dx);
  const headLength = Math.min(20, length * 0.3);

  const head1X = end.x - headLength * Math.cos(angle - Math.PI / 6);
  const head1Y = end.y - headLength * Math.sin(angle - Math.PI / 6);
  const head2X = end.x - headLength * Math.cos(angle + Math.PI / 6);
  const head2Y = end.y - headLength * Math.sin(angle + Math.PI / 6);

  const headPath = `M ${head1X} ${head1Y} L ${end.x} ${end.y} L ${head2X} ${head2Y}`;

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
      />
      <path
        d={headPath}
        fill="none"
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {selected && (
        <>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
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