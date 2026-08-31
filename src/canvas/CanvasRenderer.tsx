import type { FunObject, Camera } from "./types";
import { GRID_SIZE } from "./types";
import { FreehandRenderer } from "./renderers/FreehandRenderer";
import { ShapeRenderer } from "./renderers/ShapeRenderer";
import { TextRenderer } from "./renderers/TextRenderer";

interface CanvasRendererProps {
  objects: FunObject[];
  selectedIds: Set<string>;
  camera: Camera;
  grid: boolean;
  onTextDoubleClick?: (id: string) => void;
}

function GridPattern({ camera }: { camera: Camera }) {
  const step = GRID_SIZE * camera.zoom;
  if (step < 4) return null;

  const offsetX = camera.x % step;
  const offsetY = camera.y % step;

  return (
    <g pointerEvents="none">
      <defs>
        <pattern
          id="fun-grid"
          width={step}
          height={step}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <circle cx={step / 2} cy={step / 2} r={1} fill="var(--fun-border)" opacity={0.5} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#fun-grid)" />
    </g>
  );
}

function ResizeHandles({
  obj,
  camera,
}: {
  obj: FunObject;
  camera: Camera;
}) {
  if (obj.type === "freehand" || obj.locked) return null;

  const handleSize = 8 / camera.zoom;
  const handles = [
    { cursor: "nw-resize", x: obj.x, y: obj.y },
    { cursor: "n-resize", x: obj.x + obj.width / 2, y: obj.y },
    { cursor: "ne-resize", x: obj.x + obj.width, y: obj.y },
    { cursor: "e-resize", x: obj.x + obj.width, y: obj.y + obj.height / 2 },
    { cursor: "se-resize", x: obj.x + obj.width, y: obj.y + obj.height },
    { cursor: "s-resize", x: obj.x + obj.width / 2, y: obj.y + obj.height },
    { cursor: "sw-resize", x: obj.x, y: obj.y + obj.height },
    { cursor: "w-resize", x: obj.x, y: obj.y + obj.height / 2 },
  ];

  return (
    <g pointerEvents="none">
      {handles.map((h) => (
        <rect
          key={h.cursor}
          x={h.x - handleSize / 2}
          y={h.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="white"
          stroke="var(--fun-accent)"
          strokeWidth={1.5 / camera.zoom}
          rx={2 / camera.zoom}
        />
      ))}
    </g>
  );
}

export function CanvasRenderer({
  objects,
  selectedIds,
  camera,
  grid,
  onTextDoubleClick,
}: CanvasRendererProps) {
  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <>
      {grid && <GridPattern camera={camera} />}
      <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
        {sorted.map((obj) => {
          const selected = selectedIds.has(obj.id);
          switch (obj.type) {
            case "freehand":
              return <FreehandRenderer key={obj.id} obj={obj} selected={selected} />;
            case "rect":
            case "ellipse":
            case "diamond":
              return <ShapeRenderer key={obj.id} obj={obj} selected={selected} />;
            case "text":
              return (
                <TextRenderer
                  key={obj.id}
                  obj={obj}
                  selected={selected}
                  onDoubleClick={onTextDoubleClick}
                />
              );
            default:
              return null;
          }
        })}
        {selectedIds.size === 1 && (
          <>
            {sorted
              .filter((o) => selectedIds.has(o.id))
              .map((o) => <ResizeHandles key={`handles-${o.id}`} obj={o} camera={camera} />)}
          </>
        )}
      </g>
    </>
  );
}
