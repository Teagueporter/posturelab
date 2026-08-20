import type { Landmark } from "@/lib/pose/types";

export type Point = Pick<Landmark, "x" | "y">;

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function distance2D(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function lineAngleDegrees(a: Point, b: Point): number {
  return radiansToDegrees(Math.atan2(b.y - a.y, b.x - a.x));
}

export function angleFromHorizontal(a: Point, b: Point): number {
  return normalizeSignedAngle(lineAngleDegrees(a, b));
}

export function angleFromVertical(a: Point, b: Point): number {
  return radiansToDegrees(Math.atan2(b.x - a.x, b.y - a.y));
}

export function angleBetweenThreePoints(a: Point, vertex: Point, c: Point): number {
  const ab = { x: a.x - vertex.x, y: a.y - vertex.y };
  const cb = { x: c.x - vertex.x, y: c.y - vertex.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (mag === 0) return 0;
  return radiansToDegrees(Math.acos(Math.min(1, Math.max(-1, dot / mag))));
}

export function normalizedHorizontalOffset(a: Point, b: Point, normalizationDistance: number): number {
  if (normalizationDistance === 0) return 0;
  return ((a.x - b.x) / normalizationDistance) * 100;
}

function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function normalizeSignedAngle(angle: number): number {
  let normalized = angle;
  while (normalized > 90) normalized -= 180;
  while (normalized < -90) normalized += 180;
  return normalized;
}
