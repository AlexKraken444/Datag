"use client";

import { Graphics } from "pixi.js";
import { ARENA, COLORS, ZONE } from "@/lib/constants";
import { LighterZones, TagerZones } from "@/lib/zones";

/** Draws static background: grid, walls, start zones, lighter zones. */
export function drawArena(g: Graphics) {
  g.clear();

  // outer arena rect
  g.rect(0, 0, ARENA.SIZE, ARENA.SIZE)
    .fill({ color: COLORS.ARENA_BG })
    .stroke({ color: 0x223044, width: 2 });

  // grid
  const step = 50;
  for (let x = step; x < ARENA.SIZE; x += step) {
    g.moveTo(x, 0).lineTo(x, ARENA.SIZE).stroke({ color: COLORS.ARENA_GRID, width: 1, alpha: 0.55 });
  }
  for (let y = step; y < ARENA.SIZE; y += step) {
    g.moveTo(0, y).lineTo(ARENA.SIZE, y).stroke({ color: COLORS.ARENA_GRID, width: 1, alpha: 0.55 });
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

  // lighter zones (outside arena rect)
  const la = LighterZones.A.rect;
  const lb = LighterZones.B.rect;
  g.rect(la.x, la.y, la.w, la.h)
    .fill({ color: 0xff4757, alpha: 0.08 })
    .stroke({ color: 0xff4757, width: 1, alpha: 0.6 });
  g.rect(lb.x, lb.y, lb.w, lb.h)
    .fill({ color: 0x3aa6ff, alpha: 0.08 })
    .stroke({ color: 0x3aa6ff, width: 1, alpha: 0.6 });
}

export const arenaBounds = { x: 0, y: 0, w: ARENA.SIZE, h: ARENA.SIZE };
export const lighterAOffset = LighterZones.A.rect;
export const lighterBOffset = LighterZones.B.rect;
export const tagerLeg = ZONE.TAGER_LEG;
