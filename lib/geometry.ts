// Datak — light-weight 2D geometry helpers.

import type { Vec2 } from "@/types/game";

export const v = (x: number, y: number): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;
export const len = (a: Vec2) => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);
export const norm = (a: Vec2): Vec2 => {
  const L = len(a);
  return L > 1e-6 ? { x: a.x / L, y: a.y / L } : { x: 0, y: 0 };
};
export const perp = (a: Vec2): Vec2 => ({ x: -a.y, y: a.x });
export const rot = (a: Vec2, ang: number): Vec2 => {
  const c = Math.cos(ang),
    s = Math.sin(ang);
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
};
export const clamp = (n: number, lo: number, hi: number) =>
  n < lo ? lo : n > hi ? hi : n;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// --- AABB ---
export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const aabbContains = (a: AABB, p: Vec2) =>
  p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h;
export const clampToAABB = (p: Vec2, a: AABB): Vec2 => ({
  x: clamp(p.x, a.x, a.x + a.w),
  y: clamp(p.y, a.y, a.y + a.h),
});

// --- Point in polygon (ray casting). Works for convex/concave. ---
export function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    const intersect =
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y + 1e-12) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

// --- Point in right-triangle (corner zone) ---
// Triangle vertices given as [p0, p1, p2] — barycentric test.
export function pointInTriangle(p: Vec2, a: Vec2, b: Vec2, c: Vec2): boolean {
  const v0 = sub(c, a),
    v1 = sub(b, a),
    v2 = sub(p, a);
  const d00 = dot(v0, v0),
    d01 = dot(v0, v1),
    d02 = dot(v0, v2),
    d11 = dot(v1, v1),
    d12 = dot(v1, v2);
  const denom = d00 * d11 - d01 * d01;
  if (Math.abs(denom) < 1e-9) return false;
  const u = (d11 * d02 - d01 * d12) / denom;
  const vv = (d00 * d12 - d01 * d02) / denom;
  return u >= 0 && vv >= 0 && u + vv <= 1;
}
