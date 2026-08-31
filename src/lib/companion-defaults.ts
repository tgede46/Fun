import type { CompanionPosition } from "@/lib/settings";

const BUBBLE_SIZE = 44;
const VIEWPORT_MARGIN = 16;

export function defaultCompanionPosition(
  companion: "chat" | "pomo",
): CompanionPosition {
  if (typeof window === "undefined") {
    return { x: 100, y: 100 };
  }

  if (companion === "chat") {
    return {
      x: window.innerWidth - BUBBLE_SIZE - VIEWPORT_MARGIN,
      y: Math.round(window.innerHeight * 0.4),
    };
  }

  // Souffle : à gauche, mi-hauteur — jamais centré.
  return {
    x: VIEWPORT_MARGIN,
    y: Math.round(window.innerHeight * 0.45),
  };
}

export function clampCompanionPosition(
  x: number,
  y: number,
  bubbleSize = BUBBLE_SIZE,
): CompanionPosition {
  if (typeof window === "undefined") {
    return { x, y };
  }

  const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - bubbleSize - VIEWPORT_MARGIN);
  const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - bubbleSize - VIEWPORT_MARGIN);

  return {
    x: Math.min(Math.max(VIEWPORT_MARGIN, x), maxX),
    y: Math.min(Math.max(VIEWPORT_MARGIN, y), maxY),
  };
}

export const COMPANION_BUBBLE_SIZE = BUBBLE_SIZE;
