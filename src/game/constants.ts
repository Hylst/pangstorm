// ─── Game Constants ───────────────────────────────────────────────────────────

export const LOGICAL_WIDTH  = 800;
export const LOGICAL_HEIGHT = 600;

export const PLAYER_SPEED   = 320;          // px/s
export const PLAYER_WIDTH   = 54;
export const PLAYER_HEIGHT  = 30;
export const PLAYER_Y_OFFSET = 14;          // distance from bottom edge

export const GRAVITY         = 420;         // px/s²
export const BALL_BOUNCE_DAMP = 1.0;        // elastic (no energy loss on walls)

// Ball sizes per tier (radius in logical px)
export const BALL_RADII: Record<number, number> = {
  3: 46,
  2: 28,
  1: 16,
};

// Ball base speed per tier
export const BALL_SPEEDS: Record<number, number> = {
  3: 110,
  2: 150,
  1: 190,
};

// Ball colours per tier
export const BALL_COLORS: Record<number, string[]> = {
  3: ['#ff3a6e', '#ff6b00', '#ffdd00'],
  2: ['#00e5ff', '#a259ff', '#39ff14'],
  1: ['#ff3a6e', '#00e5ff', '#ffdd00'],
};

export const HOOK_SPEED     = 1100;         // px/s upward
export const HOOK_WIDTH     = 3;

export const MAX_LIVES      = 3;
export const COMBO_WINDOW   = 2.5;          // seconds

export const FLOOR_Y        = LOGICAL_HEIGHT - 40;  // visual floor line
export const CEILING_Y      = 50;                    // top boundary

// Scoring
export const BASE_SCORE: Record<number, number> = { 3: 100, 2: 250, 1: 600 };

// Difficulty: extra tiny tier
export const TINY_RADIUS = 9;
export const TINY_SPEED  = 240;
