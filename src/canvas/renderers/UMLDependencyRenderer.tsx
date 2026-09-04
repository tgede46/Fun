import type { UMLDependencyObject } from "../types";

export function UMLDependencyRenderer({ obj, selected }: { obj: UMLDependencyObject; selected?: boolean }) {
  const [start, end] = obj.points;
  if (!start || !end) return null;

  const strokeWidth = obj.strokeWidth;
  const stroke = obj.stroke;
  const opacity = obj.opacity;
  const dash = "6 4";

  return (
    <g opacity={opacity} data-object-id={obj.id}>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dash}
        opacity={opacity}
      />

      {/* Flèche pointillée (petit triangle) */}
      <path
        d={`M ${end.x} ${end.y} L ${end.x - 8} ${end.y - 4} L ${end.x - 8} ${end.y + 4} Z`}
        fill={stroke}
        stroke="none"
        opacity={opacity}
      />

      <circle cx={start.x} cy={start.y} r={3} fill={stroke} stroke="none" opacity={opacity} />

      {selected && (
        <>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="var(--fun-accent)"
            strokeWidth={strokeWidth + 6}
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
