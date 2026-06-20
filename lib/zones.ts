// Datag — start zones for Tagers (corner triangles) and Lighter zones (edge strips).
//
// Coordinate system: (0,0) = top-left of arena, +x right, +y down.
//
// Team A: top-left corner (Tager start) + Lighter strip on the LEFT edge.
// Team B: bottom-right corner (Tager start) + Lighter strip on the RIGHT edge.

import { ARENA, ZONE } from "./constants";
import { pointInTriangle, type AABB } from "./geometry";
import type { Team, Vec2 } from "@/types/game";

export interface TagerZone {
  team: Team;
  vertices: [Vec2, Vec2, Vec2]; // right-triangle: right angle vertex first
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

export interface LighterZone {
  team: Team;
  rect: AABB;
  spawn: Vec2;
}

// Lighter A strip is on the LEFT edge, centered vertically.
// Lighter B strip is on the RIGHT edge, centered vertically.
export const LighterZones: Record<Team, LighterZone> = {
  A: {
    team: "A",
    rect: {
      x: -ZONE.LIGHTER_THICKNESS - 8,
      y: (ARENA.SIZE - ZONE.LIGHTER_LENGTH) / 2,
      w: ZONE.LIGHTER_THICKNESS,
      h: ZONE.LIGHTER_LENGTH,
    },
    spawn: {
      x: -ZONE.LIGHTER_THICKNESS / 2 - 8,
      y: ARENA.SIZE / 2,
    },
  },
  B: {
    team: "B",
    rect: {
      x: ARENA.SIZE + 8,
      y: (ARENA.SIZE - ZONE.LIGHTER_LENGTH) / 2,
      w: ZONE.LIGHTER_THICKNESS,
      h: ZONE.LIGHTER_LENGTH,
    },
    spawn: {
      x: ARENA.SIZE + ZONE.LIGHTER_THICKNESS / 2 + 8,
      y: ARENA.SIZE / 2,
    },
  },
};

export function isInTagerZone(team: Team, p: Vec2): boolean {
  const z = TagerZones[team];
  return pointInTriangle(p, z.vertices[0], z.vertices[1], z.vertices[2]);
}
