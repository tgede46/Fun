import type { Action } from "./types";
import { KEYS, matchKey } from "./keys";

export const toolActions: Action[] = [
  {
    name: "selectTool",
    label: "Sélection",
    icon: "↗",
    priority: 0,
    perform: () => ({
      appState: { activeTool: "select" },
    }),
    keyTest: (event) => matchKey(event, KEYS.V) && !event[KEYS.CTRL_OR_CMD],
  },
  {
    name: "selectTool",
    label: "Crayon",
    icon: "✎",
    priority: 0,
    perform: () => ({
      appState: { activeTool: "freehand" },
    }),
    keyTest: (event) => matchKey(event, KEYS.P) && !event[KEYS.CTRL_OR_CMD],
  },
  {
    name: "selectTool",
    label: "Rectangle",
    icon: "□",
    priority: 0,
    perform: () => ({
      appState: { activeTool: "rect" },
    }),
    keyTest: (event) => matchKey(event, KEYS.R) && !event[KEYS.CTRL_OR_CMD],
  },
  {
    name: "selectTool",
    label: "Ellipse",
    icon: "○",
    priority: 0,
    perform: () => ({
      appState: { activeTool: "ellipse" },
    }),
    keyTest: (event) => matchKey(event, KEYS.O) && !event[KEYS.CTRL_OR_CMD],
  },
  {
    name: "selectTool",
    label: "Losange",
    icon: "◇",
    priority: 0,
    perform: () => ({
      appState: { activeTool: "diamond" },
    }),
    keyTest: (event) => matchKey(event, KEYS.D) && !event[KEYS.CTRL_OR_CMD],
  },
  {
    name: "selectTool",
    label: "Texte",
    icon: "T",
    priority: 0,
    perform: () => ({
      appState: { activeTool: "text" },
    }),
    keyTest: (event) => matchKey(event, KEYS.T) && !event[KEYS.CTRL_OR_CMD],
  },
  {
    name: "selectTool",
    label: "Flèche",
    icon: "→",
    priority: 0,
    perform: () => ({
      appState: { activeTool: "arrow" },
    }),
    keyTest: (event) => matchKey(event, KEYS.A) && !event[KEYS.CTRL_OR_CMD],
  },
  {
    name: "selectTool",
    label: "Image",
    icon: "🖼",
    priority: 0,
    perform: () => ({
      appState: { activeTool: "image" },
    }),
    keyTest: (event) => matchKey(event, KEYS.I) && !event[KEYS.CTRL_OR_CMD],
  },
];
