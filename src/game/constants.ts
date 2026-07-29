// --- constants de ouf ---

export const LOGICAL_WIDTH  = 800;
export const LOGICAL_HEIGHT = 600;

export const PLAYER_SPEED   = 320;
export const PLAYER_WIDTH   = 54;
export const PLAYER_HEIGHT  = 30;
export const PLAYER_Y_OFFSET = 14;

export const GRAVITY         = 420;

export const BALL_RADII: Record<number, number> = {
  3: 46,
  2: 28,
  1: 16,
};

export const BALL_SPEEDS: Record<number, number> = {
  3: 110,
  2: 150,
  1: 190,
};

export const BALL_COLORS: Record<number, string[]> = {
  3: ['#ff3a6e', '#ff6b00', '#ffdd00'],
  2: ['#00e5ff', '#a259ff', '#39ff14'],
  1: ['#ff3a6e', '#00e5ff', '#ffdd00'],
};

export const HOOK_SPEED     = 1100;
export const HOOK_WIDTH     = 3;

export const MAX_LIVES      = 3;
export const COMBO_WINDOW   = 2.5;

export const FLOOR_Y        = LOGICAL_HEIGHT - 40;
export const CEILING_Y      = 50;

export const BASE_SCORE: Record<number, number> = { 3: 100, 2: 250, 1: 600, 0: 1200 }; // 0 = tiny, les plus relous

export const TINY_RADIUS = 9;
export const TINY_SPEED  = 240;
