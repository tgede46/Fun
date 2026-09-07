"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  clampCompanionPosition,
  COMPANION_BUBBLE_SIZE,
} from "@/lib/companion-layout";
import type { CompanionLayoutOptions } from "@/lib/companion-layout";
import type { CompanionPosition } from "@/lib/settings";

const DRAG_THRESHOLD_PX = 5;
const PROGRESS_SIZE = 52;
const STROKE_WIDTH = 3;
const RADIUS = (PROGRESS_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type FloatingCompanionProps = {
  id: string;
  icon: string;
  position: CompanionPosition;
  ariaLabel: string;
  onPositionChange: (position: CompanionPosition) => void;
  onBubbleClick?: () => void;
  /** Affiché à côté de l'icône (ex. chrono en cours). */
  liveLabel?: string;
  /** Progression 0-1 pour l'anneau circulaire (pomodoro). */
  progress?: number;
  badge?: boolean;
  pulsing?: boolean;
  layoutOptions: CompanionLayoutOptions;
};

export function FloatingCompanion({
  id,
  icon,
  position,
  ariaLabel,
  onPositionChange,
  onBubbleClick,
  liveLabel,
  progress,
  badge = false,
  pulsing = false,
  layoutOptions,
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

  const hasProgressRing = progress !== undefined && progress > 0;
  const width = hasProgressRing
    ? PROGRESS_SIZE
    : liveLabel
      ? COMPANION_BUBBLE_SIZE + 72
      : COMPANION_BUBBLE_SIZE;
  const prevLayout = useRef({
    focusMode: layoutOptions.focusMode,
    layersOpen: layoutOptions.layersOpen ?? false,
  });

  useLayoutEffect(() => {
    const prev = prevLayout.current;
    const layersOpen = layoutOptions.layersOpen ?? false;
    if (prev.focusMode === layoutOptions.focusMode && prev.layersOpen === layersOpen) {
      return;
    }
    prevLayout.current = { focusMode: layoutOptions.focusMode, layersOpen };
    const next = clampCompanionPosition(position.x, position.y, width, layoutOptions);
    if (next.x !== position.x || next.y !== position.y) {
      onPositionChange(next);
    }
  }, [
    layoutOptions,
    layoutOptions.focusMode,
    layoutOptions.layersOpen,
    onPositionChange,
    position,
    width,
  ]);

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
          layoutOptions,
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
        layoutOptions,
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
        height: hasProgressRing ? PROGRESS_SIZE : COMPANION_BUBBLE_SIZE,
      }}
      data-companion={id}
    >
      {hasProgressRing ? (
        <button
          type="button"
          className={`relative flex h-full w-full items-center justify-center rounded-full bg-card shadow-lg transition-colors hover:bg-accent/50 ${
            pulsing ? "animate-pulse ring-2 ring-primary/40" : ""
          }`}
          aria-label={ariaLabel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <svg
            className="absolute inset-0"
            width={PROGRESS_SIZE}
            height={PROGRESS_SIZE}
            viewBox={`0 0 ${PROGRESS_SIZE} ${PROGRESS_SIZE}`}
          >
            <circle
              cx={PROGRESS_SIZE / 2}
              cy={PROGRESS_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH}
              className="text-border"
            />
            <circle
              cx={PROGRESS_SIZE / 2}
              cy={PROGRESS_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              strokeLinecap="round"
              className="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
              transform={`rotate(-90 ${PROGRESS_SIZE / 2} ${PROGRESS_SIZE / 2})`}
            />
          </svg>
          <span className="relative z-10 text-lg" aria-hidden>
            {icon}
          </span>
          {badge ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary"
              aria-hidden
            />
          ) : null}
        </button>
      ) : (
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
      )}
    </div>
  );
}
