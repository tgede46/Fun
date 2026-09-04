import type { UMLNotesLinkObject } from "../types";

export function UMLNotesLinkRenderer({ obj, selected }: { obj: UMLNotesLinkObject; selected?: boolean }) {
  const [start, end] = obj.points;
  if (!start || !end) return null;

  const strokeWidth = obj.strokeWidth;
  const stroke = obj.stroke;
  const opacity = obj.opacity;
  const dash = "3 3";

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

      <circle cx={start.x} cy={start.y} r={2} fill={stroke} stroke="none" opacity={opacity} />
      <circle cx={end.x} cy={end.y} r={2} fill={stroke} stroke="none" opacity={opacity} />

      {selected && (
        <>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="var(--fun-accent)"
            strokeWidth={strokeWidth + 4}
            opacity={0.3}
            strokeLinecap="round"
            pointerEvents="none"
          />
          <circle cx={start.x} cy={start.y} r={4} fill="white" stroke="var(--fun-accent)" strokeWidth={1.5} />
          <circle cx={end.x} cy={end.y} r={4} fill="white" stroke="var(--fun-accent)" strokeWidth={1.5} />
        </>
      )}
    </g>
  );
}
