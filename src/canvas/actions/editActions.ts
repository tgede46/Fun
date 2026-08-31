import type { Action } from "./types";
import { KEYS, matchKey } from "./keys";

export const editActions: Action[] = [
  {
    name: "undo",
    label: "Annuler",
    icon: "↶",
    priority: 10,
    perform: () => {},
    keyTest: (event) => event[KEYS.CTRL_OR_CMD] && matchKey(event, KEYS.Z) && !event.shiftKey,
    predicate: (ctx) => ctx.canUndo,
  },
  {
    name: "redo",
    label: "Rétablir",
    icon: "↷",
    priority: 10,
    perform: () => {},
    keyTest: (event) => event[KEYS.CTRL_OR_CMD] && matchKey(event, KEYS.Z) && event.shiftKey,
    predicate: (ctx) => ctx.canRedo,
  },
  {
    name: "copy",
    label: "Copier",
    priority: 10,
    perform: () => {},
    keyTest: (event) => event[KEYS.CTRL_OR_CMD] && matchKey(event, KEYS.C),
    predicate: (ctx) => ctx.selectedIds.size > 0,
  },
  {
    name: "paste",
    label: "Coller",
    priority: 10,
    perform: () => {},
    keyTest: (event) => event[KEYS.CTRL_OR_CMD] && matchKey(event, KEYS.V) && !event.shiftKey,
    predicate: (ctx) => ctx.canPaste,
  },
  {
    name: "duplicate",
    label: "Dupliquer",
    priority: 10,
    perform: () => {},
    keyTest: (event) => event[KEYS.CTRL_OR_CMD] && matchKey(event, KEYS.D),
    predicate: (ctx) => ctx.selectedIds.size > 0,
  },
  {
    name: "delete",
    label: "Supprimer",
    priority: 5,
    perform: () => {},
    keyTest: (event) => event.key === KEYS.DELETE || event.key === KEYS.BACKSPACE,
    predicate: (ctx) => ctx.selectedIds.size > 0,
  },
  {
    name: "selectAll",
    label: "Tout sélectionner",
    priority: 10,
    perform: () => {},
    keyTest: (event) => event[KEYS.CTRL_OR_CMD] && matchKey(event, KEYS.A),
  },
];
