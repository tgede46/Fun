"use client";

import {
  useCallback,
  useEffect,
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
  title?: string;
  subtitle?: string;
  expanded?: boolean;
  children?: ReactNode;
  badge?: boolean;
  pulsing?: boolean;
};

export function FloatingCompanion({
  id,
  icon,
  position,
  ariaLabel,
  onPositionChange,
  onBubbleClick,
  title,
  subtitle,
  expanded = false,
  children,
  badge = false,
  pulsing = false,
}: FloatingCompanionProps) {
  const [pos, setPos] = useState(position);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    setPos(position);
  }, [position.x, position.y]);

  const finishDrag = useCallback(
    (next: CompanionPosition, moved: boolean) => {
      dragState.current = null;
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
      setPos(
        clampCompanionPosition(
          drag.originX + deltaX,
          drag.originY + deltaY,
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
      );
      setPos(finalPos);
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
    setPos(position);
  };

  return (
    <div
      className="fixed z-50 touch-none select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: COMPANION_BUBBLE_SIZE,
        height: COMPANION_BUBBLE_SIZE,
      }}
      data-companion={id}
    >
      <button
        type="button"
        className={`relative flex h-full w-full items-center justify-center rounded-full border border-border bg-card text-lg shadow-lg transition-colors hover:bg-accent/50 ${
          pulsing ? "animate-pulse ring-2 ring-primary/40" : ""
        }`}
        aria-label={ariaLabel}
        aria-expanded={expanded}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <span aria-hidden>{icon}</span>
        {badge ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary"
            aria-hidden
          />
        ) : null}
      </button>

      {title || subtitle ? (
        <div className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-card/90 px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm">
          {title ? <span className="font-medium text-foreground">{title}</span> : null}
          {title && subtitle ? " · " : null}
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
      ) : null}

      {expanded && children ? (
        <div
          className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2"
          role="presentation"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
