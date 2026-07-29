// power-ups : apprennent à connaître le joueur progressivement
import { Player, GameState } from './types';
import { uid } from './initialState';
import { LOGICAL_WIDTH, FLOOR_Y, CEILING_Y, PLAYER_WIDTH } from './constants';
import { playSfx } from './sounds';
import { spawnParticles, spawnRing } from './particles';

export type PowerUpType = 'multishot' | 'slowmo' | 'shield' | 'extralife' | 'scoreboost' | 'magnet' | 'bomb';

export interface PowerUp {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: PowerUpType;
  radius: number;
  life: number;
  maxLife: number;
  pulse: number;
}

const POWERUP_COLORS: Record<PowerUpType, string> = {
  multishot: '#ffdd00',
  slowmo: '#00e5ff',
  shield: '#39ff14',
  extralife: '#ff3a6e',
  scoreboost: '#a259ff',
  magnet: '#ff88cc',
  bomb: '#ff4400',
};

const POWERUP_SYMBOLS: Record<PowerUpType, string> = {
  multishot: '⇈',
  slowmo: '◷',
  shield: '◈',
  extralife: '♥',
  scoreboost: '★',
  magnet: '🧲',
  bomb: '💥',
};

export function getPowerUpColor(type: PowerUpType) { return POWERUP_COLORS[type]; }
export function getPowerUpSymbol(type: PowerUpType) { return POWERUP_SYMBOLS[type]; }

const ALL_TYPES: PowerUpType[] = ['multishot', 'slowmo', 'shield', 'scoreboost'];
const LEVEL_TYPES: PowerUpType[] = ['multishot', 'slowmo', 'shield', 'scoreboost', 'extralife', 'magnet', 'bomb'];

export function spawnPowerUp(x: number, y: number, forceType?: PowerUpType, level = 1): PowerUp {
  let type: PowerUpType;
  if (forceType) {
    type = forceType;
  } else {
    // pool disponible selon le niveau
    const pool = level >= 6 ? LEVEL_TYPES : level >= 3 ? [...ALL_TYPES, 'extralife'] : ALL_TYPES;
    if (Math.random() < 0.08 && level >= 3) {
      type = 'extralife';
    } else {
      type = pool[Math.floor(Math.random() * pool.length)];
    }
  }
  return {
    id: uid(),
    x, y,
    vx: (Math.random() - 0.5) * 80,
    vy: -40 - Math.random() * 60,
    type,
    radius: 16,
    life: 8.0,
    maxLife: 8.0,
    pulse: 0,
  };
}

export function maybeSpawnPowerUp(state: GameState, x: number, y: number) {
  const chance = state.difficulty.powerUpChance ?? 0.15;
  if (Math.random() < chance) {
    state.powerUps.push(spawnPowerUp(x, y, undefined, state.level));
  }
}

export interface ActiveEffects {
  multishotTimer: number;
  slowMoTimer: number;
  shieldTimer: number;
  scoreBoostTimer: number;
  magnetTimer: number;
}

export function updatePowerUps(state: GameState, dt: number, effects: ActiveEffects) {
  if (effects.multishotTimer > 0) effects.multishotTimer -= dt;
  if (effects.slowMoTimer > 0) effects.slowMoTimer -= dt;
  if (effects.shieldTimer > 0) effects.shieldTimer -= dt;
  if (effects.scoreBoostTimer > 0) effects.scoreBoostTimer -= dt;
  if (effects.magnetTimer > 0) effects.magnetTimer -= dt;

  for (const p of state.powerUps) {
    p.vy += 200 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.pulse += dt * 4;

    // magnet : attire les bonus vers le joueur
    if (effects.magnetTimer > 0) {
      const dx = state.player.x - p.x;
      const dy = state.player.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        const pull = 180 * dt;
        p.x += (dx / dist) * pull;
        p.y += (dy / dist) * pull;
      }
    }

    if (p.x < p.radius) { p.x = p.radius; p.vx = Math.abs(p.vx); }
    if (p.x > LOGICAL_WIDTH - p.radius) { p.x = LOGICAL_WIDTH - p.radius; p.vx = -Math.abs(p.vx); }
    if (p.y + p.radius > FLOOR_Y) { p.y = FLOOR_Y - p.radius; p.vy = -Math.abs(p.vy) * 0.6; }
    if (p.y - p.radius < CEILING_Y) { p.y = CEILING_Y + p.radius; p.vy = Math.abs(p.vy); }
  }

  state.powerUps = state.powerUps.filter(p => p.life > 0);
}

export function checkPowerUpCollection(state: GameState, player: Player, effects: ActiveEffects): boolean {
  let collected = false;
  const keep: PowerUp[] = [];

  for (const p of state.powerUps) {
    const dx = p.x - player.x;
    const dy = p.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < p.radius + PLAYER_WIDTH * 0.45) {
      applyPowerUp(state, p.type, effects);
      collected = true;
    } else {
      keep.push(p);
    }
  }

  state.powerUps = keep;
  return collected;
}

function applyPowerUp(state: GameState, type: PowerUpType, effects: ActiveEffects) {
  playSfx('powerup');
  const px = state.player.x;
  const py = state.player.y - 40;
  const floater = (text: string, color: string) => {
    state.floaters.push({ id: uid(), x: px, y: py, text, color, life: 1.5, maxLife: 1.5, scale: 1 });
  };

  switch (type) {
    case 'multishot':
      effects.multishotTimer = 8.0;
      floater('MULTI-TIR !', '#ffdd00');
      break;
    case 'slowmo':
      effects.slowMoTimer = 6.0;
      floater('RALENTI !', '#00e5ff');
      break;
    case 'shield':
      effects.shieldTimer = 10.0;
      floater('BOUCLIER !', '#39ff14');
      break;
    case 'extralife':
      state.player.lives = Math.min(state.player.lives + 1, 5);
      playSfx('uplife');
      floater('+1 VIE !', '#ff3a6e');
      break;
    case 'scoreboost':
      effects.scoreBoostTimer = 10.0;
      floater('SCORE x2 !', '#a259ff');
      break;
    case 'magnet':
      effects.magnetTimer = 8.0;
      floater('AIMANT !', '#ff88cc');
      break;
    case 'bomb':
      // détruit toutes les balles à l'écran
      for (const b of state.balls) {
        spawnParticles(state.flashParticles, b.x, b.y, b.glowColor, 12);
        spawnRing(state.flashParticles, b.x, b.y, '#ffffff', 10, 100);
      }
      state.balls = [];
      state.ballsPending = [];
      floater('BOMBE !', '#ff4400');
      triggerShake(state, 12, 0.6);
      playSfx('bomb');
      break;
  }
}

function triggerShake(state: GameState, intensity: number, duration: number) {
  state.shake = { intensity, duration, elapsed: 0 };
}
