export type {
  FunScene,
  Camera,
  FunObject,
  FreehandPath,
  ShapeRect,
  ShapeEllipse,
  ShapeDiamond,
  TextObject,
  ToolType,
  BBox,
  ResizeHandle,
  BaseObject,
} from "./types";

export {
  DEFAULT_FILL,
  DEFAULT_STROKE,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_FONT_SIZE,
  MIN_ZOOM,
  MAX_ZOOM,
  GRID_SIZE,
} from "./types";

export { FunCanvas } from "./FunCanvas";
export { serializeSceneToJSON, parseSceneFromJSON, createEmptyScene } from "./utils/serialization";
