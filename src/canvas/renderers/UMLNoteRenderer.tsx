import type { UMLNoteObject } from "../types";

export function UMLNoteRenderer({ obj, selected }: { obj: UMLNoteObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;
  const fontSize = obj.fontSize ?? 14;
  const foldWidth = 12;
  const foldHeight = 8;
  const textWidth = obj.width - foldWidth - inset - 4;
  const textHeight = obj.height - foldHeight - inset - 4;
  const lines = Math.ceil(textHeight / (fontSize + 4));

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      {/* Corps de la note (rectangle avec coin plié) */}
      <rect
        x={obj.x + inset + foldWidth}
        y={obj.y + inset}
        width={textWidth}
        height={textHeight}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Coin plié en haut à gauche */}
      <path
        d={`M ${obj.x + inset} ${obj.y + inset + foldHeight} 
             L ${obj.x + inset} ${obj.y + inset} 
             L ${obj.x + inset + foldWidth} ${obj.y + inset} 
             L ${obj.x + inset + foldWidth} ${obj.y + inset + foldHeight}`}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Ligne de pliure */}
      <line
        x1={obj.x + inset + foldWidth}
        y1={obj.y + inset}
        x2={obj.x + inset + foldWidth}
        y2={obj.y + inset + foldHeight}
        stroke={obj.stroke}
        strokeWidth={strokeWidth * 0.5}
        opacity={0.5}
      />

      {/* Texte (multi-lignes) */}
      {obj.text?.split("\n").slice(0, lines).map((line, i) => (
        <text
          key={`line-${i}`}
          x={obj.x + inset + foldWidth + 4}
          y={obj.y + inset + 16 + i * (fontSize + 4)}
          fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
          fontSize={fontSize - 2}
          fontFamily="monospace"
          pointerEvents="none"
        >
          {line.length > 40 ? line.slice(0, 40) + "…" : line}
        </text>
      ))}

      {selected && (
        <rect
          x={obj.x - 2}
          y={obj.y - 2}
          width={obj.width + 4}
          height={obj.height + 4}
          fill="none"
          stroke="var(--fun-accent)"
          strokeWidth={2}
          strokeDasharray="6 3"
          pointerEvents="none"
        />
      )}
    </g>
  );
}
