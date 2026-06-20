// Datag — shadow polygon computation.
//
// Model: each Tager occludes light coming from its team's Lighter. We project a
// quad starting at the Tager's silhouette edges (tangent points on the circle
// from the light source) and extending outward to a length that scales with:
//   - light->tager distance
//   - lighter brightness
//   - aim alignment (how directly the cone is pointed at the tager)
//
// The polygon returned is a CCW quad in world coordinates.

import { SHADOW, TAGER } from "./constants";
import { clamp, dist, mul, norm, perp, sub, add } from "./geometry";
import type { ShadowPoly, Team, Vec2 } from "@/types/game";

export interface ShadowInputs {
  team: Team;
  lightPos: Vec2;
  lightAim: Vec2;     // world-coord point the cone is centered on
  brightness: number; // multiplier, see LIGHTER constants
  tagerPos: Vec2;
}

export function computeShadow(inp: ShadowInputs): ShadowPoly {
  const r = TAGER.RADIUS;
  const dir = sub(inp.tagerPos, inp.lightPos);
  const d = Math.hypot(dir.x, dir.y);
  const n = d > 1e-3 ? { x: dir.x / d, y: dir.y / d } : { x: 1, y: 0 };

  // tangent offset = perpendicular vector to the light->tager direction,
  // scaled by the tager radius (parallel-light approximation).
  const t = perp(n);
  const left = add(inp.tagerPos, mul(t, r));
  const right = add(inp.tagerPos, mul(t, -r));

  // length grows with distance and brightness; capped.
  const aimDir = norm(sub(inp.lightAim, inp.lightPos));
  const align = clamp(aimDir.x * n.x + aimDir.y * n.y, 0, 1); // 0..1

  let length =
    SHADOW.BASE_LENGTH * inp.brightness * (1 + d / SHADOW.DIST_SCALE);
  length *= 0.4 + 0.6 * align; // weak shadow when not aiming at the tager
  length = clamp(length, SHADOW.MIN_LENGTH, SHADOW.MAX_LENGTH);

  const farLeft = add(left, mul(n, length));
  const farRight = add(right, mul(n, length));

  // CCW: left -> farLeft -> farRight -> right
  return {
    team: inp.team,
    points: [left, farLeft, farRight, right],
  };
}

// Convenience: distance between two points (used by hit detection).
export const tagerInShadow = (p: Vec2, poly: ShadowPoly): boolean => {
  // delegate to pointInPolygon (we keep this thin alias so callers read well)
  return _pip(p, poly.points);
};

// inlined PIP to avoid a circular import
function _pip(p: Vec2, poly: Vec2[]): boolean {
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

// re-export dist so callers don't import geometry just for distance
export { dist };
