import type { Action } from "./types";
import { KEYS, CODES, matchKey } from "./keys";

export const viewActions: Action[] = [
  {
    name: "zoomIn",
    label: "Zoom avant",
    icon: "+",
    priority: 5,
    perform: () => {},
    keyTest: (event) =>
      (event.code === CODES.EQUAL && (event[KEYS.CTRL_OR_CMD] || event.metaKey)) ||
      (event.code === CODES.NUM_ADD && (event[KEYS.CTRL_OR_CMD] || event.metaKey)),
  },
  {
    name: "zoomOut",
    label: "Zoom arrière",
    icon: "−",
    priority: 5,
    perform: () => {},
    keyTest: (event) =>
      (event.code === CODES.MINUS && (event[KEYS.CTRL_OR_CMD] || event.metaKey)) ||
      (event.code === CODES.NUM_SUBTRACT && (event[KEYS.CTRL_OR_CMD] || event.metaKey)),
  },
  {
    name: "resetZoom",
    label: "Zoom 100%",
    icon: "100%",
    priority: 5,
    perform: () => {},
    keyTest: (event) => event[KEYS.CTRL_OR_CMD] && matchKey(event, KEYS.Z) && event.key === "0",
  },
  {
    name: "zoomToFit",
    label: "Ajuster à la vue",
    icon: "⊞",
    priority: 10,
    perform: () => {},
    keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.shiftKey && matchKey(event, KEYS.F),
  },
];
