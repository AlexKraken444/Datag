// Datag — game-wide constants. Shared by server (authoritative) and client (render).

export const ARENA = {
  SIZE: 1000,            // square arena side
  WALL: 16,              // border thickness (visual)
} as const;

export const TICK = {
  HZ: 60,                // server simulation rate
  DT: 1 / 60,            // delta-time in seconds
  BROADCAST_HZ: 30,      // network broadcast rate
} as const;

export const TAGER = {
  RADIUS: 18,
  SPEED: 220,            // px/sec
  SPRINT_MULT: 1.65,
  SPRINT_STAMINA_MAX: 100,
  SPRINT_DRAIN: 35,      // per sec
  SPRINT_REGEN: 25,      // per sec
} as const;

export const LIGHTER = {
  RADIUS: 14,
  SPEED: 180,
  ZONE_THICKNESS: 90,    // along the outer edge
  ZONE_LENGTH: 360,      // along the edge
  BRIGHTNESS_MIN: 0.4,
  BRIGHTNESS_MAX: 1.6,
  BRIGHTNESS_STEP: 0.6,  // per sec while LMB/RMB held
} as const;

export const SHADOW = {
  CONE_ANGLE: Math.PI / 4,            // 45° full cone
  MAX_LENGTH: 520,                    // hard cap on shadow length
  MIN_LENGTH: 24,
  // shadow length = base * brightness * (1 + distance / DIST_SCALE)
  DIST_SCALE: 600,
  BASE_LENGTH: 80,
} as const;

export const ROUND = {
  COUNTDOWN_SEC: 3,
  MAX_DURATION_SEC: 60,  // safety: auto-draw round after 60s
  POST_ROUND_DELAY_MS: 1500,
  DRAW_WINDOW_MS: 100,   // simultaneous-hit window
} as const;

export const MATCH = {
  SCORE_TO_WIN: 12,
  HIT_REGULAR: 1,
  HIT_BONUS: 2,          // hit while opponent in their start zone
} as const;

// Starting positions are corner triangles. Triangle leg length:
export const ZONE = {
  TAGER_LEG: 220,        // right-triangle leg
  LIGHTER_THICKNESS: LIGHTER.ZONE_THICKNESS,
  LIGHTER_LENGTH: LIGHTER.ZONE_LENGTH,
} as const;

export const TEAM = {
  A: "A",
  B: "B",
} as const;

export const ROLE = {
  TAGER: "TAGER",
  LIGHTER: "LIGHTER",
} as const;

export const COLORS = {
  TEAM_A: "#ff4757",
  TEAM_B: "#3aa6ff",
  SHADOW: "#000000",
  LIGHT: "#fff7c2",
  ARENA_BG: "#0d1118",
  ARENA_GRID: "#1a2230",
} as const;
