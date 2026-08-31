const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export const KEYS = {
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  ARROW_UP: "ArrowUp",
  BACKSPACE: "Backspace",
  ALT: "Alt",
  CTRL_OR_CMD: isMac ? "metaKey" : "ctrlKey",
  DELETE: "Delete",
  ENTER: "Enter",
  ESCAPE: "Escape",
  SPACE: " ",
  TAB: "Tab",

  A: "a",
  C: "c",
  D: "d",
  F: "f",
  I: "i",
  O: "o",
  P: "p",
  R: "r",
  T: "t",
  V: "v",
  Y: "y",
  Z: "z",

  0: "0",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
} as const;

export const CODES = {
  EQUAL: "Equal",
  MINUS: "Minus",
  NUM_ADD: "NumpadAdd",
  NUM_SUBTRACT: "NumpadSubtract",
  ONE: "Digit1",
  TWO: "Digit2",
  THREE: "Digit3",
  FOUR: "Digit4",
  FIVE: "Digit5",
  SIX: "Digit6",
  SEVEN: "Digit7",
  EIGHT: "Digit8",
  NINE: "Digit9",
  ZERO: "Digit0",
} as const;

export function matchKey(event: KeyboardEvent | React.KeyboardEvent, key: string): boolean {
  return key === event.key.toLowerCase();
}

export function isInputLike(element: Element | null): boolean {
  if (!element) return false;
  const tag = element.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (element as HTMLElement).isContentEditable === true
  );
}
