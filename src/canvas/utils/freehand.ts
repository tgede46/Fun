/** Ramer-Douglas-Peucker simplification. */
function simplifyRDP(points: { x: number; y: number }[], epsilon: number): { x: number; y: number }[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDist(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyRDP(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyRDP(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [first, last];
}

function perpendicularDist(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq));
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  return Math.hypot(point.x - projX, point.y - projY);
}

/** Generate SVG path d attribute from freehand points. */
export function freehandToPathD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;

  if (rest.length === 1) {
    d += ` L ${rest[0].x} ${rest[0].y}`;
    return d;
  }

  for (let i = 0; i < rest.length - 1; i++) {
    const current = rest[i];
    const next = rest[i + 1];
    const cpx = current.x;
    const cpy = current.y;
    const ex = (current.x + next.x) / 2;
    const ey = (current.y + next.y) / 2;
    d += ` Q ${cpx} ${cpy} ${ex} ${ey}`;
  }

  const last = rest[rest.length - 1];
  d += ` L ${last.x} ${last.y}`;

  return d;
}

/** Smooth and simplify a freehand path. */
export function smoothFreehand(
  points: { x: number; y: number }[],
  simplifyEpsilon = 2,
): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  return simplifyRDP(points, simplifyEpsilon);
}

/** Compute bounding box of freehand points. */
export function freehandBounds(points: { x: number; y: number }[]) {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
