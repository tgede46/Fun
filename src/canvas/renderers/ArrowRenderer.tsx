import { useState } from "react";
import type { ArrowObject } from "../types";

interface ArrowRendererProps {
  obj: ArrowObject;
  selected?: boolean;
}

export function ArrowRenderer({ obj, selected }: ArrowRendererProps) {
  const [hovered, setHovered] = useState(false);
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

  const strokeColor = selected ? "var(--fun-accent)" : hovered ? "var(--fun-primary)" : obj.stroke;
  const strokeW = hovered && !selected ? obj.strokeWidth + 1 : obj.strokeWidth;

  return (
    <g
      opacity={obj.opacity}
      data-object-id={obj.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        filter: selected ? "drop-shadow(0 0 2px var(--fun-accent))" : hovered ? "drop-shadow(0 0 1px var(--fun-primary))" : undefined,
        transition: "filter 0.15s ease-out",
      }}
    >
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeLinecap="round"
        style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
      />
      <path
        d={headPath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
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