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
import type { CompanionPosition, TimerDisplayStyle } from "@/lib/settings";

const DRAG_THRESHOLD_PX = 5;
const PROGRESS_SIZE = 56;
const STROKE_WIDTH = 3;
const PILL_WIDTH = 118;

type FloatingCompanionProps = {
  id: string;
  icon: string;
  position: CompanionPosition;
  ariaLabel: string;
  onPositionChange: (position: CompanionPosition) => void;
  onBubbleClick?: () => void;
  /** Affiché à côté de l'icône / au centre selon le style. */
  liveLabel?: string;
  /** Progression 0-1 pour l'anneau / barre (pomodoro). */
  progress?: number;
  /** Style du compteur pendant un run (défaut ring_time). */
  timerStyle?: TimerDisplayStyle;
  badge?: boolean;
  pulsing?: boolean;
  layoutOptions: CompanionLayoutOptions;
};

function ProgressRing({
  progress,
  size = PROGRESS_SIZE,
}: {
  progress: number;
  size?: number;
}) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg
      className="absolute inset-0"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        className="text-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        strokeLinecap="round"
        className="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function FloatingCompanion({
  id,
  icon,
  position,
  ariaLabel,
  onPositionChange,
  onBubbleClick,
  liveLabel,
  progress,
  timerStyle = "ring_time",
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

  const running = progress !== undefined && progress >= 0 && Boolean(liveLabel);
  const style: TimerDisplayStyle = running ? timerStyle : "ring_tomato";

  const width =
    style === "pill" && running
      ? PILL_WIDTH
      : running || style === "ring_tomato"
        ? PROGRESS_SIZE
        : liveLabel
          ? COMPANION_BUBBLE_SIZE + 72
          : COMPANION_BUBBLE_SIZE;

  const height =
    style === "pill" && running ? COMPANION_BUBBLE_SIZE : running || style === "ring_tomato"
      ? PROGRESS_SIZE
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

  const pointerHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };

  const pulseClass = pulsing ? "animate-pulse ring-2 ring-primary/40" : "";

  return (
    <div
      className="fixed z-50 touch-none select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width,
        height,
      }}
      data-companion={id}
    >
      {style === "pill" && running ? (
        <button
          type="button"
          className={`relative flex h-full w-full flex-col items-stretch justify-center gap-1 rounded-full border border-border bg-card px-3 shadow-lg transition-colors hover:bg-accent/50 ${pulseClass}`}
          aria-label={ariaLabel}
          {...pointerHandlers}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-base" aria-hidden>
              {icon}
            </span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {liveLabel}
            </span>
          </span>
          <span className="mx-1 h-1 overflow-hidden rounded-full bg-border">
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
              style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
            />
          </span>
          {badge ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary"
              aria-hidden
            />
          ) : null}
        </button>
      ) : style === "ring_time" && running ? (
        <button
          type="button"
          className={`relative flex h-full w-full items-center justify-center rounded-full bg-card shadow-lg transition-colors hover:bg-accent/50 ${pulseClass}`}
          aria-label={ariaLabel}
          {...pointerHandlers}
        >
          <ProgressRing progress={progress ?? 0} />
          <span className="relative z-10 font-mono text-[11px] font-medium tabular-nums text-foreground">
            {liveLabel}
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
          className={`relative flex h-full w-full items-center justify-center rounded-full bg-card shadow-lg transition-colors hover:bg-accent/50 ${
            running ? "" : "border border-border"
          } ${pulseClass}`}
          aria-label={ariaLabel}
          {...pointerHandlers}
        >
          {running ? <ProgressRing progress={progress ?? 0} /> : null}
          <span className="relative z-10 text-lg" aria-hidden>
            {icon}
          </span>
          {running && liveLabel ? (
            <span className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border bg-card px-1.5 py-0.5 font-mono text-[9px] tabular-nums text-foreground shadow-sm">
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
