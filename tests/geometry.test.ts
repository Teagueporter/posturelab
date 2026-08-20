import { describe, expect, it } from "vitest";
import { angleBetweenThreePoints, angleFromVertical, distance2D, midpoint, normalizedHorizontalOffset } from "@/lib/geometry/geometry";

describe("geometry", () => {
  it("computes midpoint and distance", () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 2, y: 2 })).toEqual({ x: 1, y: 1 });
    expect(distance2D({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("handles image-space vertical angles", () => {
    expect(angleFromVertical({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(0);
    expect(angleFromVertical({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(45);
  });

  it("normalizes horizontal offset", () => {
    expect(normalizedHorizontalOffset({ x: 0.6, y: 0 }, { x: 0.5, y: 0 }, 0.5)).toBeCloseTo(20);
  });

  it("calculates three point angle", () => {
    expect(angleBetweenThreePoints({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(90);
  });
});
