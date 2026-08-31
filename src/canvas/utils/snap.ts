import type { FunObject } from "../types";

const SNAP_THRESHOLD = 5;

export interface SnapResult {
  x: number | null;
  y: number | null;
  snapLineX?: number;
  snapLineY?: number;
}

export function snapObject(
  obj: FunObject,
  objects: FunObject[],
  camera: { zoom: number },
): SnapResult {
  const threshold = SNAP_THRESHOLD / camera.zoom;
  let snapX: number | null = null;
  let snapY: number | null = null;
  let snapLineX: number | undefined;
  let snapLineY: number | undefined;

  const objCenterX = obj.x + obj.width / 2;
  const objCenterY = obj.y + obj.height / 2;
  const objRight = obj.x + obj.width;
  const objBottom = obj.y + obj.height;

  for (const other of objects) {
    if (other.id === obj.id) continue;

    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;
    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.height;

    if (Math.abs(obj.x - other.x) < threshold) {
      snapX = other.x;
      snapLineX = other.x;
    } else if (Math.abs(objRight - otherRight) < threshold) {
      snapX = otherRight - obj.width;
      snapLineX = otherRight;
    } else if (Math.abs(objCenterX - otherCenterX) < threshold) {
      snapX = otherCenterX - obj.width / 2;
      snapLineX = otherCenterX;
    }

    if (Math.abs(obj.y - other.y) < threshold) {
      snapY = other.y;
      snapLineY = other.y;
    } else if (Math.abs(objBottom - otherBottom) < threshold) {
      snapY = otherBottom - obj.height;
      snapLineY = otherBottom;
    } else if (Math.abs(objCenterY - otherCenterY) < threshold) {
      snapY = otherCenterY - obj.height / 2;
      snapLineY = otherCenterY;
    }
  }

  return { x: snapX, y: snapY, snapLineX, snapLineY };
}

export function getAlignmentGuides(
  obj: FunObject,
  objects: FunObject[],
  camera: { zoom: number },
): { x: number[]; y: number[] } {
  const threshold = SNAP_THRESHOLD / camera.zoom;
  const guidesX: number[] = [];
  const guidesY: number[] = [];

  const objCenterX = obj.x + obj.width / 2;
  const objCenterY = obj.y + obj.height / 2;
  const objRight = obj.x + obj.width;
  const objBottom = obj.y + obj.height;

  for (const other of objects) {
    if (other.id === obj.id) continue;

    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;
    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.height;

    if (Math.abs(obj.x - other.x) < threshold) guidesX.push(other.x);
    if (Math.abs(objRight - otherRight) < threshold) guidesX.push(otherRight);
    if (Math.abs(objCenterX - otherCenterX) < threshold) guidesX.push(otherCenterX);

    if (Math.abs(obj.y - other.y) < threshold) guidesY.push(other.y);
    if (Math.abs(objBottom - otherBottom) < threshold) guidesY.push(otherBottom);
    if (Math.abs(objCenterY - otherCenterY) < threshold) guidesY.push(otherCenterY);
  }

  return { x: guidesX, y: guidesY };
}