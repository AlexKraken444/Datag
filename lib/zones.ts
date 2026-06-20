// Datag — start zones for Tagers (corner triangles) and the shared Lighter
// perimeter ring around the arena.
//
// Coordinate system: (0,0) = top-left of arena, +x right, +y down.
//
// Tager start zones: triangles in the two opposite corners (A=top-left, B=bottom-right).
// Lighter zone: rectangular *ring* of width LIGHTER.ZONE_THICKNESS wrapping the
// arena on all four sides. Both Lighters can travel anywhere along the ring.

import { ARENA, LIGHTER, ZONE } from "./constants";
import { clamp, pointInTriangle } from "./geometry";
import type { Team, Vec2 } from "@/types/game";

// ---------- Tagers ----------

export interface TagerZone {
  team: Team;
  vertices: [Vec2, Vec2, Vec2]; // right-triangle: right-angle vertex first
  spawn: Vec2;
}

export const TagerZones: Record<Team, TagerZone> = {
  A: {
    team: "A",
    vertices: [
      { x: 0, y: 0 },
      { x: ZONE.TAGER_LEG, y: 0 },
      { x: 0, y: ZONE.TAGER_LEG },
    ],
    spawn: { x: ZONE.TAGER_LEG * 0.35, y: ZONE.TAGER_LEG * 0.35 },
  },
  B: {
    team: "B",
    vertices: [
      { x: ARENA.SIZE, y: ARENA.SIZE },
      { x: ARENA.SIZE - ZONE.TAGER_LEG, y: ARENA.SIZE },
      { x: ARENA.SIZE, y: ARENA.SIZE - ZONE.TAGER_LEG },
    ],
    spawn: {
      x: ARENA.SIZE - ZONE.TAGER_LEG * 0.35,
      y: ARENA.SIZE - ZONE.TAGER_LEG * 0.35,
    },
  },
};

export function isInTagerZone(team: Team, p: Vec2): boolean {
  const z = TagerZones[team];
  return pointInTriangle(p, z.vertices[0], z.vertices[1], z.vertices[2]);
}

// ---------- Lighter perimeter ring ----------

/** Outer extent (negative for left/top, positive for right/bottom). */
export const LIGHTER_RING = {
  thickness: LIGHTER.ZONE_THICKNESS,
  outerMin: -LIGHTER.ZONE_THICKNESS, // negative side outer edge
  outerMax: ARENA.SIZE + LIGHTER.ZONE_THICKNESS,
} as const;

/**
 * Apply a movement step to a Lighter position, clamping to the perimeter
 * ring. Each axis is integrated independently so the lighter slides cleanly
 * along edges and around corners (like a 2D platformer wall slide).
 */
export function stepPerimeter(prev: Vec2, dx: number, dy: number): Vec2 {
  const A = ARENA.SIZE;

  // ---- X axis ----
  let nx = clamp(prev.x + dx, LIGHTER_RING.outerMin, LIGHTER_RING.outerMax);
  // would entering the arena horizontally? only blocked if y is also inside
  if (nx > 0 && nx < A && prev.y > 0 && prev.y < A) {
    // push back to the side we came from
    nx = prev.x <= 0 ? 0 : A;
  }

  // ---- Y axis ----
  let ny = clamp(prev.y + dy, LIGHTER_RING.outerMin, LIGHTER_RING.outerMax);
  if (nx > 0 && nx < A && ny > 0 && ny < A) {
    ny = prev.y <= 0 ? 0 : A;
  }

  return { x: nx, y: ny };
}

/** Where each team's Lighter spawns at the start of a round. */
export const LighterSpawn: Record<Team, Vec2> = {
  // Team A starts near the top-left corner of the ring, just left of the arena
  A: { x: -LIGHTER.ZONE_THICKNESS / 2, y: ARENA.SIZE * 0.25 },
  // Team B starts near the bottom-right corner
  B: { x: ARENA.SIZE + LIGHTER.ZONE_THICKNESS / 2, y: ARENA.SIZE * 0.75 },
};
