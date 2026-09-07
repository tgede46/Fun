import { useState } from "react";
import type { FunObject } from "../types";

interface ShapeRendererProps {
  obj: FunObject & { type: "rect" | "ellipse" | "diamond" };
  selected?: boolean;
}

export function ShapeRenderer({ obj, selected }: ShapeRendererProps) {
  const [hovered, setHovered] = useState(false);
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;

  const hoverScale = hovered && !selected ? 1.01 : 1;
  const selectGlow = selected ? 2 : hovered ? 1 : 0;

  if (obj.type === "rect") {
    return (
      <g
        opacity={obj.opacity}
        data-object-id={obj.id}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          transition: "transform 0.15s ease-out, filter 0.15s ease-out",
          transform: `scale(${hoverScale})`,
          transformOrigin: `${obj.x + obj.width / 2}px ${obj.y + obj.height / 2}px`,
          filter: selectGlow > 0 ? `drop-shadow(0 0 ${selectGlow}px var(--fun-accent))` : undefined,
        }}
      >
        <rect
          x={obj.x + inset}
          y={obj.y + inset}
          width={Math.max(0, obj.width - strokeWidth)}
          height={Math.max(0, obj.height - strokeWidth)}
          rx={obj.borderRadius}
          ry={obj.borderRadius}
          fill={obj.fill}
          stroke={selected ? "var(--fun-accent)" : obj.stroke}
          strokeWidth={selected ? strokeWidth + 1 : strokeWidth}
          style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
        />
        {selected && (
          <rect
            x={obj.x - 2}
            y={obj.y - 2}
            width={obj.width + 4}
            height={obj.height + 4}
            rx={obj.borderRadius + 2}
            ry={obj.borderRadius + 2}
            fill="none"
            stroke="var(--fun-accent)"
            strokeWidth={2}
            strokeDasharray="6 3"
            pointerEvents="none"
            className="animate-[dash_0.4s_linear_infinite]"
          />
        )}
      </g>
    );
  }

  if (obj.type === "ellipse") {
    return (
      <g
        opacity={obj.opacity}
        data-object-id={obj.id}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          transition: "transform 0.15s ease-out, filter 0.15s ease-out",
          transform: `scale(${hoverScale})`,
          transformOrigin: `${obj.x + obj.width / 2}px ${obj.y + obj.height / 2}px`,
          filter: selectGlow > 0 ? `drop-shadow(0 0 ${selectGlow}px var(--fun-accent))` : undefined,
        }}
      >
        <ellipse
          cx={obj.x + obj.width / 2}
          cy={obj.y + obj.height / 2}
          rx={Math.max(0, obj.width / 2 - inset)}
          ry={Math.max(0, obj.height / 2 - inset)}
          fill={obj.fill}
          stroke={selected ? "var(--fun-accent)" : obj.stroke}
          strokeWidth={selected ? strokeWidth + 1 : strokeWidth}
          style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
        />
        {selected && (
          <ellipse
            cx={obj.x + obj.width / 2}
            cy={obj.y + obj.height / 2}
            rx={obj.width / 2 + 2}
            ry={obj.height / 2 + 2}
            fill="none"
            stroke="var(--fun-accent)"
            strokeWidth={2}
            strokeDasharray="6 3"
            pointerEvents="none"
            className="animate-[dash_0.4s_linear_infinite]"
          />
        )}
      </g>
    );
  }

  // diamond
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  const hw = obj.width / 2 - inset;
  const hh = obj.height / 2 - inset;
  const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;

  return (
    <g
      opacity={obj.opacity}
      data-object-id={obj.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transition: "transform 0.15s ease-out, filter 0.15s ease-out",
        transform: `scale(${hoverScale})`,
        transformOrigin: `${cx}px ${cy}px`,
        filter: selectGlow > 0 ? `drop-shadow(0 0 ${selectGlow}px var(--fun-accent))` : undefined,
      }}
    >
      <polygon
        points={points}
        fill={obj.fill}
        stroke={selected ? "var(--fun-accent)" : obj.stroke}
        strokeWidth={selected ? strokeWidth + 1 : strokeWidth}
        style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
      />
      {selected && (
        <polygon
          points={`${cx},${cy - hh - 3} ${cx + hw + 3},${cy} ${cx},${cy + hh + 3} ${cx - hw - 3},${cy}`}
          fill="none"
          stroke="var(--fun-accent)"
          strokeWidth={2}
          strokeDasharray="6 3"
          pointerEvents="none"
          className="animate-[dash_0.4s_linear_infinite]"
        />
      )}
    </g>
  );
}
