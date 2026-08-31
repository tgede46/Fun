"use client";

import {
  useCallback,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  clampCompanionPosition,
  COMPANION_BUBBLE_SIZE,
} from "@/lib/companion-defaults";
import type { CompanionPosition } from "@/lib/settings";

const DRAG_THRESHOLD_PX = 5;

type FloatingCompanionProps = {
  id: string;
  icon: string;
  position: CompanionPosition;
  ariaLabel: string;
  onPositionChange: (position: CompanionPosition) => void;
  onBubbleClick?: () => void;
  /** Affiché à côté de l’icône (ex. chrono en cours). */
  liveLabel?: string;
  badge?: boolean;
  pulsing?: boolean;
  children?: ReactNode;
};

export function FloatingCompanion({
  id,
  icon,
  position,
  ariaLabel,
  onPositionChange,
  onBubbleClick,
  liveLabel,
  badge = false,
  pulsing = false,
}: FloatingCompanionProps) {
  const [dragPos, setDragPos] = useState<CompanionPosition | null>(null);
  const pos = dragPos ?? position;
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const width = liveLabel ? COMPANION_BUBBLE_SIZE + 72 : COMPANION_BUBBLE_SIZE;

  const finishDrag = useCallback(
    (next: CompanionPosition, moved: boolean) => {
      dragState.current = null;
      setDragPos(null);
      if (moved) {
        onPositionChange(next);
      } else {
        onBubbleClick?.();
      }
    },
    [onBubbleClick, onPositionChange],
  );

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (
      !drag.moved &&
      Math.abs(deltaX) + Math.abs(deltaY) >= DRAG_THRESHOLD_PX
    ) {
      drag.moved = true;
    }

    if (drag.moved) {
      setDragPos(
        clampCompanionPosition(
          drag.originX + deltaX,
          drag.originY + deltaY,
          width,
        ),
      );
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);

    let finalPos = pos;
    if (drag.moved) {
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      finalPos = clampCompanionPosition(
        drag.originX + deltaX,
        drag.originY + deltaY,
        width,
      );
    }

    finishDrag(finalPos, drag.moved);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    dragState.current = null;
    setDragPos(null);
  };

  return (
    <div
      className="fixed z-50 touch-none select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width,
        height: COMPANION_BUBBLE_SIZE,
      }}
      data-companion={id}
    >
      <button
        type="button"
        className={`relative flex h-full w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-2 text-lg shadow-lg transition-colors hover:bg-accent/50 ${
          pulsing ? "animate-pulse ring-2 ring-primary/40" : ""
        }`}
        aria-label={ariaLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <span aria-hidden>{icon}</span>
        {liveLabel ? (
          <span className="font-mono text-xs tabular-nums text-foreground">
            {liveLabel}
          </span>
        ) : null}
        {badge ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary"
            aria-hidden
          />
        ) : null}
      </button>
    </div>
  );
}
