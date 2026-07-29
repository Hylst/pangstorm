import { GameState, Player, Platform, DEFAULT_OPTIONS, GameOptions } from './types';
import {
  LOGICAL_WIDTH, FLOOR_Y, CEILING_Y,
  BALL_RADII, BALL_SPEEDS, BALL_COLORS, MAX_LIVES,
  PLAYER_HEIGHT, PLAYER_Y_OFFSET,
  TINY_RADIUS,
} from './constants';
import { getDifficulty } from './levels';

let _uid = 1;
export function uid() { return _uid++; }

const PLATFORM_COLORS = ['#ff6b35', '#ffdd00', '#39ff14', '#a259ff', '#00e5ff'];

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
  remainingHits = 1,
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
    remainingHits,
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

    balls.push(makeBall(x, y, vx, 0, tier, i, Math.random() < diff.homingChance, diff.ballHealth));
  }
  return balls;
}

export function makePlatforms(level: number): Platform[] {
  const diff = getDifficulty(level);
  const count = diff.platformCount;
  if (count <= 0) return [];

  const platforms: Platform[] = [];
  const playableHeight = FLOOR_Y - CEILING_Y - 60;

  for (let i = 0; i < count; i++) {
    const w = 60 + Math.floor(Math.random() * 80); // 60-140px
    const h = 10 + Math.floor(Math.random() * 6);   // 10-15px
    const x = 20 + Math.random() * (LOGICAL_WIDTH - w - 40);
    // répartir les plateformes sur la hauteur, éviter le centre du joueur
    const yOffset = 0.2 + (i / Math.max(count, 1)) * 0.5;
    const y = CEILING_Y + 50 + playableHeight * yOffset;

    const hp = 1 + Math.floor(Math.random() * diff.platformHp);
    const colorIdx = i % PLATFORM_COLORS.length;

    platforms.push({
      id: uid(),
      x, y, w, h,
      hp,
      maxHp: hp,
      color: PLATFORM_COLORS[colorIdx],
      glowColor: PLATFORM_COLORS[colorIdx],
      flash: 0,
      broken: false,
    });
  }
  return platforms;
}

export function makeInitialPlayer(): Player {
  return {
    x: LOGICAL_WIDTH / 2,
    y: FLOOR_Y - PLAYER_HEIGHT / 2 - PLAYER_Y_OFFSET,
    lives: 3,
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
      magnetTimer: 0,
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
    ballsPending: [],
    spawnTimer: 0,
    levelStars: [],
    prevPhase: 'title',
    platforms: [],
    levelBestScores: [],
    hooksFired: 0,
    hooksHit: 0,
    levelElapsed: 0,
    levelMaxCombo: 0,
    confirmDialog: null,
    optionsCursor: 0,
    pauseCursor: 0,
  };
}
