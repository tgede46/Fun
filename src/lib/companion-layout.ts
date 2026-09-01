import type { CompanionPosition } from "@/lib/settings";
import { COMPANION_BUBBLE_SIZE } from "@/lib/companion-defaults";

export { COMPANION_BUBBLE_SIZE };

const VIEWPORT_MARGIN = 8;
const MODE_RAIL_WIDTH = 56;
const TOOLBAR_HEIGHT = 48;
const TAB_BAR_HEIGHT = 52;
const LAYERS_PANEL_WIDTH = 224;
const INSPECTOR_PANEL_WIDTH = 256;
const PANEL_GAP = 8;
/** Hauteur approx. des panneaux flottants en haut du canvas. */
const PANEL_TOP_ZONE = 240;

export type CompanionLayoutOptions = {
  focusMode: boolean;
  layersOpen?: boolean;
};

function chromeBounds(options: CompanionLayoutOptions, y?: number) {
  if (typeof window === "undefined") {
    return { minX: VIEWPORT_MARGIN, maxX: 800, minY: VIEWPORT_MARGIN, maxY: 600 };
  }

  let minX = MODE_RAIL_WIDTH + VIEWPORT_MARGIN;
  let maxX = window.innerWidth - VIEWPORT_MARGIN;
  const minY = TOOLBAR_HEIGHT + TAB_BAR_HEIGHT + VIEWPORT_MARGIN;
  const maxY = window.innerHeight > 0
    ? window.innerHeight - COMPANION_BUBBLE_SIZE - VIEWPORT_MARGIN
    : 600;

  const inTopChrome = y === undefined || y < PANEL_TOP_ZONE;

  if (!options.focusMode && inTopChrome) {
    maxX = window.innerWidth - INSPECTOR_PANEL_WIDTH - PANEL_GAP;
  }

  if (options.layersOpen && inTopChrome) {
    minX = Math.max(minX, MODE_RAIL_WIDTH + LAYERS_PANEL_WIDTH + PANEL_GAP);
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

  const { minY, maxY } = chromeBounds(options);
  const y = Math.round(minY + (maxY - minY) * 0.55);
  const { minX, maxX } = chromeBounds(options, y);

  if (companion === "chat") {
    return {
      x: maxX - COMPANION_BUBBLE_SIZE,
      y,
    };
  }

  return {
    x: minX,
    y: Math.round(minY + (maxY - minY) * 0.25),
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

  const clampedY = chromeBounds(options).minY;
  const maxY = chromeBounds(options).maxY;
  const safeY = Math.min(Math.max(clampedY, y), maxY);
  const { minX, maxX } = chromeBounds(options, safeY);
  const safeMaxX = Math.max(minX, maxX - bubbleWidth);

  return {
    x: Math.min(Math.max(minX, x), safeMaxX),
    y: safeY,
  };
}
