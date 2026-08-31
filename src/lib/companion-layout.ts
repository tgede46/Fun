import type { CompanionPosition } from "@/lib/settings";
import { COMPANION_BUBBLE_SIZE } from "@/lib/companion-defaults";

export { COMPANION_BUBBLE_SIZE };

const VIEWPORT_MARGIN = 16;
const MODE_RAIL_WIDTH = 56;
const TOOLBAR_HEIGHT = 48;
const TAB_BAR_HEIGHT = 52;
const LAYERS_PANEL_WIDTH = 224; // w-56 + left-3
const INSPECTOR_PANEL_WIDTH = 256; // w-64 + right-3
const PANEL_GAP = 12;

export type CompanionLayoutOptions = {
  focusMode: boolean;
};

function chromeBounds(options: CompanionLayoutOptions) {
  if (typeof window === "undefined") {
    return { minX: VIEWPORT_MARGIN, maxX: 800, minY: VIEWPORT_MARGIN, maxY: 600 };
  }

  let minX = MODE_RAIL_WIDTH + VIEWPORT_MARGIN;
  let maxX = window.innerWidth - VIEWPORT_MARGIN;
  const minY = TOOLBAR_HEIGHT + TAB_BAR_HEIGHT + VIEWPORT_MARGIN;
  const maxY = window.innerHeight > 0
    ? window.innerHeight - COMPANION_BUBBLE_SIZE - VIEWPORT_MARGIN
    : 600;

  if (!options.focusMode) {
    minX = MODE_RAIL_WIDTH + LAYERS_PANEL_WIDTH + PANEL_GAP;
    maxX = window.innerWidth - INSPECTOR_PANEL_WIDTH - PANEL_GAP;
  }

  return { minX, maxX, minY, maxY };
}

export function defaultCompanionPosition(
  companion: "chat" | "pomo",
  options: CompanionLayoutOptions,
): CompanionPosition {
  if (typeof window === "undefined") {
    return { x: 100, y: 100 };
  }

  const { minX, maxX, minY, maxY } = chromeBounds(options);
  const y = Math.round(minY + (maxY - minY) * 0.35);

  if (companion === "chat") {
    return {
      x: maxX - COMPANION_BUBBLE_SIZE,
      y,
    };
  }

  return {
    x: minX,
    y,
  };
}

export function clampCompanionPosition(
  x: number,
  y: number,
  bubbleWidth: number,
  options: CompanionLayoutOptions,
): CompanionPosition {
  if (typeof window === "undefined") {
    return { x, y };
  }

  const { minX, maxX, minY, maxY } = chromeBounds(options);
  const safeMaxX = Math.max(minX, maxX - bubbleWidth);

  return {
    x: Math.min(Math.max(minX, x), safeMaxX),
    y: Math.min(Math.max(minY, y), maxY),
  };
}
