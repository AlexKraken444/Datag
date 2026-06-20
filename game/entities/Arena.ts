"use client";

import { Graphics } from "pixi.js";
import { ARENA, COLORS, LIGHTER, ZONE } from "@/lib/constants";
import { TagerZones } from "@/lib/zones";

/** Draws static background: arena grid, walls, start triangles, and the Lighter perimeter ring. */
export function drawArena(g: Graphics) {
  g.clear();
  const T = LIGHTER.ZONE_THICKNESS;

  // ---- Lighter perimeter ring (drawn first so the arena sits "inside" it) ----
  // outer rect with arena cut out
  g.rect(-T, -T, ARENA.SIZE + 2 * T, ARENA.SIZE + 2 * T)
    .fill({ color: 0x0c1118 })
    .stroke({ color: 0x1a2230, width: 1, alpha: 0.7 });
  // accent stripes near the two team-start corners
  g.rect(-T, -T, T + 80, T)
    .fill({ color: 0xff4757, alpha: 0.1 });
  g.rect(-T, -T, T, 80 + T)
    .fill({ color: 0xff4757, alpha: 0.1 });
  g.rect(ARENA.SIZE - 80, ARENA.SIZE, 80 + T, T)
    .fill({ color: 0x3aa6ff, alpha: 0.1 });
  g.rect(ARENA.SIZE, ARENA.SIZE - 80, T, 80 + T)
    .fill({ color: 0x3aa6ff, alpha: 0.1 });

  // ---- arena interior ----
  g.rect(0, 0, ARENA.SIZE, ARENA.SIZE)
    .fill({ color: COLORS.ARENA_BG })
    .stroke({ color: 0x223044, width: 2 });

  // grid
  const step = 50;
  for (let x = step; x < ARENA.SIZE; x += step) {
    g.moveTo(x, 0).lineTo(x, ARENA.SIZE).stroke({
      color: COLORS.ARENA_GRID,
      width: 1,
      alpha: 0.55,
    });
  }
  for (let y = step; y < ARENA.SIZE; y += step) {
    g.moveTo(0, y).lineTo(ARENA.SIZE, y).stroke({
      color: COLORS.ARENA_GRID,
      width: 1,
      alpha: 0.55,
    });
  }

  // tager start zones (triangles)
  const za = TagerZones.A;
  const zb = TagerZones.B;
  g.poly(za.vertices.map((p) => [p.x, p.y]).flat() as number[])
    .fill({ color: 0xff4757, alpha: 0.1 })
    .stroke({ color: 0xff4757, width: 1.5, alpha: 0.55 });
  g.poly(zb.vertices.map((p) => [p.x, p.y]).flat() as number[])
    .fill({ color: 0x3aa6ff, alpha: 0.1 })
    .stroke({ color: 0x3aa6ff, width: 1.5, alpha: 0.55 });
}

export const arenaBounds = { x: 0, y: 0, w: ARENA.SIZE, h: ARENA.SIZE };
export const tagerLeg = ZONE.TAGER_LEG;
