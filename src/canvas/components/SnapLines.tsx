import type { Camera } from "../types";

interface SnapLinesProps {
  xLines: number[];
  yLines: number[];
  camera: Camera;
}

export function SnapLines({ xLines, yLines, camera }: SnapLinesProps) {
  return (
    <g pointerEvents="none">
      {xLines.map((x, i) => (
        <line
          key={`x-${i}`}
          x1={x}
          y1={-10000}
          x2={x}
          y2={10000}
          stroke="var(--fun-accent)"
          strokeWidth={1 / camera.zoom}
          strokeDasharray={`${4 / camera.zoom} ${4 / camera.zoom}`}
          opacity={0.5}
        />
      ))}
      {yLines.map((y, i) => (
        <line
          key={`y-${i}`}
          x1={-10000}
          y1={y}
          x2={10000}
          y2={y}
          stroke="var(--fun-accent)"
          strokeWidth={1 / camera.zoom}
          strokeDasharray={`${4 / camera.zoom} ${4 / camera.zoom}`}
          opacity={0.5}
        />
      ))}
    </g>
  );
}