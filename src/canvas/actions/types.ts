import type { FunObject, FunScene } from "../types";

export type ActionName =
  | "selectTool"
  | "undo"
  | "redo"
  | "copy"
  | "paste"
  | "duplicate"
  | "delete"
  | "selectAll"
  | "zoomIn"
  | "zoomOut"
  | "zoomToFit"
  | "resetZoom";

export type ActionSource = "ui" | "keyboard" | "contextMenu";

export interface ActionResult {
  elements?: FunObject[];
  appState?: Partial<{
    activeTool: string;
    selectedIds: Set<string>;
  }>;
  captureUpdate?: boolean;
}

export interface Action {
  name: ActionName;
  label: string;
  icon?: string;
  perform: (context: ActionContext) => ActionResult | void;
  keyTest?: (event: KeyboardEvent | React.KeyboardEvent, context: ActionContext) => boolean;
  predicate?: (context: ActionContext) => boolean;
  priority?: number;
}

export interface ActionContext {
  elements: FunObject[];
  selectedIds: Set<string>;
  scene: FunScene;
  activeTool: string;
  canUndo: boolean;
  canRedo: boolean;
  canPaste: boolean;
  zoom: number;
}
