import { Player, GameState } from './types';
import { uid } from './initialState';
import { LOGICAL_WIDTH, FLOOR_Y, CEILING_Y, PLAYER_WIDTH } from './constants';
import { playSfx } from './sounds';

export type PowerUpType = 'multishot' | 'slowmo' | 'shield' | 'extralife' | 'scoreboost';

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
};

const POWERUP_SYMBOLS: Record<PowerUpType, string> = {
  multishot: '⇈',
  slowmo: '◷',
  shield: '◈',
  extralife: '♥',
  scoreboost: '★',
};

export function getPowerUpColor(type: PowerUpType) { return POWERUP_COLORS[type]; }
export function getPowerUpSymbol(type: PowerUpType) { return POWERUP_SYMBOLS[type]; }

export function spawnPowerUp(x: number, y: number, forceType?: PowerUpType): PowerUp {
  let type: PowerUpType;
  if (forceType) {
    type = forceType;
  } else {
  
    if (Math.random() < 0.08) {
      type = 'extralife';
    } else {
      const types: PowerUpType[] = ['multishot', 'slowmo', 'shield', 'scoreboost'];
      type = types[Math.floor(Math.random() * types.length)];
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
    state.powerUps.push(spawnPowerUp(x, y));
  }
}

export interface ActiveEffects {
  multishotTimer: number;
  slowMoTimer: number;
  shieldTimer: number;
  scoreBoostTimer: number;
}

export function updatePowerUps(state: GameState, dt: number, effects: ActiveEffects) {
  // Update effect timers
  if (effects.multishotTimer > 0) effects.multishotTimer -= dt;
  if (effects.slowMoTimer > 0) effects.slowMoTimer -= dt;
  if (effects.shieldTimer > 0) effects.shieldTimer -= dt;
  if (effects.scoreBoostTimer > 0) effects.scoreBoostTimer -= dt;

  for (const p of state.powerUps) {
    p.vy += 200 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.pulse += dt * 4;


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
  switch (type) {
    case 'multishot':
      effects.multishotTimer = 8.0;
      state.floaters.push({ id: uid(), x: state.player.x, y: state.player.y - 40, text: 'MULTI-TIR !', color: '#ffdd00', life: 1.5, maxLife: 1.5, scale: 1 });
      break;
    case 'slowmo':
      effects.slowMoTimer = 6.0;
      state.floaters.push({ id: uid(), x: state.player.x, y: state.player.y - 40, text: 'RALENTI !', color: '#00e5ff', life: 1.5, maxLife: 1.5, scale: 1 });
      break;
    case 'shield':
      effects.shieldTimer = 10.0;
      state.floaters.push({ id: uid(), x: state.player.x, y: state.player.y - 40, text: 'BOUCLIER !', color: '#39ff14', life: 1.5, maxLife: 1.5, scale: 1 });
      break;
    case 'extralife':
      state.player.lives = Math.min(state.player.lives + 1, 5);
      playSfx('uplife');
      state.floaters.push({ id: uid(), x: state.player.x, y: state.player.y - 40, text: '+1 VIE !', color: '#ff3a6e', life: 1.5, maxLife: 1.5, scale: 1 });
      break;
    case 'scoreboost':
      effects.scoreBoostTimer = 10.0;
      state.floaters.push({ id: uid(), x: state.player.x, y: state.player.y - 40, text: 'SCORE x2 !', color: '#a259ff', life: 1.5, maxLife: 1.5, scale: 1 });
      break;
  }
}
