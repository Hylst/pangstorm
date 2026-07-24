import { GameState, Player } from './types';
import {
  LOGICAL_WIDTH, FLOOR_Y, CEILING_Y,
  BALL_RADII, BALL_SPEEDS, BALL_COLORS, MAX_LIVES,
  PLAYER_HEIGHT, PLAYER_Y_OFFSET,
  TINY_RADIUS,
} from './constants';
import { getDifficulty } from './levels';

let _uid = 1;
export function uid() { return _uid++; }

function randomBallColor(tier: number, idx: number): { color: string; glowColor: string } {
  const palette = BALL_COLORS[tier] ?? BALL_COLORS[1];
  const c = palette[idx % palette.length];
  return { color: c, glowColor: c };
}

export function makeBall(
  x: number, y: number,
  vx: number, vy: number,
  tier: number,
  colorIdx: number,
  homing = false,
): import('./types').Ball {
  const { color, glowColor } = randomBallColor(tier, colorIdx);
  return {
    id: uid(),
    x, y, vx, vy,
    radius: tier === 0 ? TINY_RADIUS : BALL_RADII[tier],
    tier,
    color,
    glowColor,
    flash: 0,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 4,
    homing,
    trail: [],
  };
}

export function makeLevelBalls(level: number, playerX: number): import('./types').Ball[] {
  const diff = getDifficulty(level);
  const balls: import('./types').Ball[] = [];
  const count = diff.ballCount;

  for (let i = 0; i < count; i++) {
    const tier = 3;
    const spd = (BALL_SPEEDS[tier] * diff.speedMultiplier) + diff.extraHSpeed;
    const x = LOGICAL_WIDTH * (0.15 + 0.7 * ((i + 0.5) / count));
    const y = CEILING_Y + BALL_RADII[tier] + 30;

    let vx = (i % 2 === 0 ? 1 : -1) * spd;
    if (Math.random() < diff.homingChance) {
      vx = playerX < x ? -Math.abs(vx) : Math.abs(vx);
    }

    balls.push(makeBall(x, y, vx, 0, tier, i, Math.random() < diff.homingChance));
  }
  return balls;
}

export function makeInitialPlayer(): Player {
  return {
    x: LOGICAL_WIDTH / 2,
    y: FLOOR_Y - PLAYER_HEIGHT / 2 - PLAYER_Y_OFFSET,
    lives: MAX_LIVES,
    invincible: 0,
    squash: 1,
    charge: 0,
  };
}

export function makeInitialState(): GameState {
  _uid = 1;
  return {
    phase: 'title',
    score: 0,
    level: 1,
    difficulty: getDifficulty(1),
    combo: 0,
    comboTimer: 0,
    comboDisplay: 0,
    player: makeInitialPlayer(),
    balls: [],
    hooks: [],
    powerUps: [],
    effects: {
      multishotTimer: 0,
      slowMoTimer: 0,
      shieldTimer: 0,
      scoreBoostTimer: 0,
    },
    nextId: 1,
    flashParticles: [],
    levelTimer: 0,
    titleTimer: 0,
    shake: { intensity: 0, duration: 0, elapsed: 0 },
    floaters: [],
    ballSpawnPulse: 0,
    streak: 0,
    onboardingStep: 0,
    onboardingTimer: 0,
    totalPopped: 0,
    bestScore: 0,
    maxLevelReached: 1,
    levelIntro: 0,
    milestones: [],
    levelHits: 0,
    scoreMilestone: 0,
    ambient: [],
  };
}
