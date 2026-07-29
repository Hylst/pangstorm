import { GameState, Ball, InputState, GameOptions, ONBOARDING_STEPS } from './types';
import {
  LOGICAL_WIDTH, LOGICAL_HEIGHT, FLOOR_Y, CEILING_Y,
  GRAVITY, BALL_RADII, BALL_SPEEDS,
  PLAYER_SPEED, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_Y_OFFSET,
  HOOK_SPEED, HOOK_WIDTH,
  COMBO_WINDOW,
  BASE_SCORE, MAX_LIVES,
  TINY_RADIUS, TINY_SPEED,
} from './constants';
import { makeBall, makeLevelBalls, makeInitialPlayer, uid, makePlatforms } from './initialState';
import { spawnParticles, spawnRing } from './particles';
import { playSfx, playMusicForLevel } from './sounds';
import { getDifficulty } from './levels';
import { updatePowerUps, checkPowerUpCollection, maybeSpawnPowerUp, maybeDropFromPlatform } from './powerups';
import { getTheme } from './themes';

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function addFloater(state: GameState, x: number, y: number, text: string, color: string) {
  state.floaters.push({ id: uid(), x, y, text, color, life: 1.2, maxLife: 1.2, scale: 1 });
}

function addMilestone(state: GameState, title: string, subtitle: string, color: string) {
  state.milestones.push({ id: uid(), title, subtitle, life: 2.4, maxLife: 2.4, color });
  if (state.milestones.length > 3) state.milestones.shift();
  playSfx('milestone');
}

function triggerShake(state: GameState, intensity: number, duration: number) {
  state.shake = { intensity, duration, elapsed: 0 };
}

export function calcStars(s: GameState): number {
  // base : dégâts subis (0 hits = 3, 1 = 2, 2+ = 1)
  let stars = s.levelHits === 0 ? 3 : s.levelHits === 1 ? 2 : 1;

  // précision : hooksHit / hooksFired
  if (s.hooksFired > 0) {
    const acc = s.hooksHit / s.hooksFired;
    if (acc >= 0.9)      stars += 1;
    else if (acc >= 0.7) stars += 0.5;
    else if (acc >= 0.5) stars += 0.25;
  }

  // vitesse : temps écoulé / nb balles
  const totalBalls = s.difficulty.ballCount;
  if (totalBalls > 0 && s.levelElapsed > 0) {
    const secPerBall = s.levelElapsed / totalBalls;
    if (secPerBall <= 3)      stars += 1;
    else if (secPerBall <= 5) stars += 0.5;
    else if (secPerBall <= 8) stars += 0.25;
  }

  // combo max
  if (s.levelMaxCombo >= 15)      stars += 0.5;
  else if (s.levelMaxCombo >= 8)  stars += 0.25;

  return Math.max(1, Math.min(5, Math.round(stars)));
}

function saveLevelBest(state: GameState) {
  const existing = state.levelBestScores.findIndex(ls => ls.level === state.level);
  if (existing >= 0) {
    if (state.score > state.levelBestScores[existing].score) {
      state.levelBestScores[existing].score = state.score;
    }
  } else {
    state.levelBestScores.push({ level: state.level, score: state.score });
  }
}

function startLevel(state: GameState, level: number) {
  const diff = getDifficulty(level);
  state.level = level;
  state.difficulty = diff;
  const allBalls = makeLevelBalls(level, state.player.x);
  state.hooks = [];
  state.powerUps = [];
  state.ballSpawnPulse = 1;
  state.levelIntro = 2.6;
  state.levelHits = 0;
  state.effects = { multishotTimer: 0, slowMoTimer: 0, shieldTimer: 0, scoreBoostTimer: 0, magnetTimer: 0 };
  state.player.lives = Math.min(diff.maxLives, MAX_LIVES);
  state.platforms = makePlatforms(level);
  state.hooksFired = 0;
  state.hooksHit = 0;
  state.levelElapsed = 0;
  state.levelMaxCombo = 0;

  if (diff.spawnDelay > 0) {
    state.ballsPending = allBalls;
    state.balls = state.ballsPending.splice(0, Math.min(2, state.ballsPending.length));
    state.spawnTimer = 0;
  } else {
    state.balls = allBalls;
    state.ballsPending = [];
  }
  playMusicForLevel(level);
}

function updateAmbient(state: GameState, dt: number, hue: string) {
  if (state.ambient.length < 26 && Math.random() < 0.08) {
    state.ambient.push({
      id: uid(),
      x: Math.random() * LOGICAL_WIDTH,
      y: CEILING_Y + Math.random() * (FLOOR_Y - CEILING_Y),
      vx: (Math.random() - 0.5) * 18,
      vy: -8 - Math.random() * 18,
      r: 1 + Math.random() * 2.5,
      hue,
      alpha: 0.2 + Math.random() * 0.4,
    });
  }
  for (const a of state.ambient) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.y < CEILING_Y - 10 || a.x < -10 || a.x > LOGICAL_WIDTH + 10) {
      a.y = FLOOR_Y + 10;
      a.x = Math.random() * LOGICAL_WIDTH;
    }
  }
}

export { startLevel };
export function update(state: GameState, dt: number, input: InputState, options?: GameOptions): GameState {
  dt = Math.min(dt, 0.05);
  const s = state;
  const effects = s.effects;

  // pause
  if (input.pause && (s.phase === 'playing' || s.phase === 'paused')) {
    if (s.phase === 'playing') { s.prevPhase = s.phase; s.phase = 'paused'; s.pauseCursor = 0; }
    else { if (!s.confirmDialog) s.phase = s.prevPhase as any; }
    input.pause = false;
  }
  if (s.phase === 'paused') { updateAmbient(s, dt, getTheme(s.level).floorGlow); return s; }

  // info overlay (toggle with I)
  if (input.info) {
    if (s.phase === 'info') { s.phase = s.prevPhase; }
    else { s.prevPhase = s.phase; s.phase = 'info'; }
    input.info = false;
  }
  if (s.phase === 'info') { return s; }

  // options overlay (toggle with O or from pause menu)
  if (input.options) {
    if (s.phase === 'options') { s.phase = s.prevPhase; }
    else { s.prevPhase = s.phase; s.phase = 'options'; s.optionsCursor = 0; }
    input.options = false;
  }
  if (s.phase === 'options') {
    // navigation curseur + toggle gérés dans useGame.ts (accès à optionsRef)
    return s;
  }

  // level select
  if (s.phase === 'levelselect') {
    if (input.left)  s.level = Math.max(1, s.level - 1);
    if (input.right) s.level = Math.min(s.maxLevelReached, s.level + 1);
    if (input.fire) { s.phase = 'playing'; s.player = makeInitialPlayer(); startLevel(s, s.level); playSfx('start'); }
    if (input.enter) { s.phase = 'title'; input.enter = false; }
    return s;
  }

  const timeScale = effects.slowMoTimer > 0 ? 0.55 : 1.0;
  const effectiveDt = dt * timeScale;

  if (s.phase === 'title') {
    s.titleTimer += dt;
    updateAmbient(s, dt, '#4488ff');
    if (input.enter && s.maxLevelReached > 1) { s.phase = 'levelselect'; input.enter = false; }
    if (input.fire) {
      s.player = makeInitialPlayer();
      if (localStorage.getItem('pang_genesis_played')) { s.phase = 'playing'; startLevel(s, 1); }
      else { localStorage.setItem('pang_genesis_played', '1'); s.phase = 'onboarding'; s.onboardingStep = 0; s.onboardingTimer = 0; }
      playSfx('start');
    }
    return s;
  }

  if (s.phase === 'onboarding') {
    s.onboardingTimer += dt;
    updateAmbient(s, dt, '#4488ff');
    const step = ONBOARDING_STEPS[s.onboardingStep];
    if (!step) { s.phase = 'playing'; startLevel(s, 1); return s; }
    let advance = false;
    if (s.onboardingTimer > 2.5) advance = true;
    if (step.action === 'move' && (input.left || input.right)) advance = true;
    if (step.action === 'shoot' && input.fire) advance = true;
    if (input.fire && step.action === 'wait' && s.onboardingTimer > 0.8) advance = true;
    if (advance) {
      s.onboardingStep += 1; s.onboardingTimer = 0;
      if (s.onboardingStep >= ONBOARDING_STEPS.length) { s.phase = 'playing'; startLevel(s, 1); }
    }
    return s;
  }

  if (s.phase === 'levelup') {
    s.levelTimer -= dt;
    for (const p of s.flashParticles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.life -= dt; }
    s.flashParticles = s.flashParticles.filter(p => p.life > 0);
    for (const f of s.floaters) { f.y -= 40 * dt; f.life -= dt; f.scale = 1 + (1 - f.life / f.maxLife) * 0.3; }
    s.floaters = s.floaters.filter(f => f.life > 0);
    if (s.levelTimer <= 0) {
      const stars = calcStars(s);
      const existing = s.levelStars.findIndex(ls => ls.level === s.level);
      if (existing >= 0) { if (stars > s.levelStars[existing].stars) { s.levelStars[existing].stars = stars; s.levelStars[existing].score = s.score; } }
      else { s.levelStars.push({ level: s.level, stars, score: s.score }); }
      saveLevelBest(s);
      startLevel(s, s.level + 1);
      s.phase = 'playing';
    }
    return s;
  }

  if (s.phase === 'gameover') {
    if (input.fire) {
      const stars = calcStars(s);
      const existing = s.levelStars.findIndex(ls => ls.level === s.level);
      if (existing >= 0) { if (stars > s.levelStars[existing].stars) { s.levelStars[existing].stars = stars; s.levelStars[existing].score = s.score; } }
      else { s.levelStars.push({ level: s.level, stars, score: s.score }); }
      saveLevelBest(s);
      s.bestScore = Math.max(s.bestScore, s.score);
      s.phase = 'title';
      s.score = 0; s.level = 1; s.combo = 0; s.comboTimer = 0; s.comboDisplay = 0;
      s.streak = 0; s.balls = []; s.hooks = []; s.powerUps = []; s.flashParticles = []; s.floaters = [];
      s.milestones = []; s.shake = { intensity: 0, duration: 0, elapsed: 0 };
      s.effects = { multishotTimer: 0, slowMoTimer: 0, shieldTimer: 0, scoreBoostTimer: 0, magnetTimer: 0 };
      s.player = makeInitialPlayer(); s.difficulty = getDifficulty(1);
      s.scoreMilestone = 0; s.totalPopped = 0; s.ballsPending = []; s.spawnTimer = 0; s.platforms = [];
      s.hooksFired = 0; s.hooksHit = 0;
    }
    return s;
  }

  if (s.phase === 'dead') {
    s.levelTimer -= dt;
    if (s.levelTimer <= 0) {
      if (s.player.lives <= 0) { s.phase = 'gameover'; s.bestScore = Math.max(s.bestScore, s.score); playSfx('gameover'); }
      else { s.phase = 'playing'; s.hooks = []; s.powerUps = []; s.player.invincible = 2.5; s.combo = 0; s.comboTimer = 0; s.comboDisplay = 0; s.streak = 0; playMusicForLevel(s.level); }
    }
    return s;
  }

  const { player } = s;
  const diff = s.difficulty;

  s.levelElapsed += dt;
  if (s.shake.duration > 0) { s.shake.elapsed += dt; if (s.shake.elapsed >= s.shake.duration) s.shake = { intensity: 0, duration: 0, elapsed: 0 }; }
  if (s.ballSpawnPulse > 0) s.ballSpawnPulse = Math.max(0, s.ballSpawnPulse - dt * 2);
  if (s.levelIntro > 0) s.levelIntro = Math.max(0, s.levelIntro - dt);
  for (const m of s.milestones) m.life -= dt;
  s.milestones = s.milestones.filter(m => m.life > 0);
  updateAmbient(s, dt, getTheme(s.level).floorGlow);
  if (player.invincible > 0) player.invincible -= dt;

  const halfW = PLAYER_WIDTH / 2;
  // Mouvement tactile : suivi du doigt
  if (input.touchTargetX !== null) {
    const deadZone = options?.deadZonePx ?? 0;
    const sens = options?.touchSensitivity ?? 1.0;
    const dx = input.touchTargetX - player.x;
    const maxStep = PLAYER_SPEED * effectiveDt * sens;
    if (Math.abs(dx) > deadZone) {
      player.x += Math.sign(dx) * Math.min(Math.abs(dx), maxStep);
    }
  }
  // Clavier toujours actif (cumulatif avec tactile si les deux sont utilisés)
  if (input.left)  player.x -= PLAYER_SPEED * effectiveDt;
  if (input.right) player.x += PLAYER_SPEED * effectiveDt;
  player.x = clamp(player.x, halfW, LOGICAL_WIDTH - halfW);
  player.y = FLOOR_Y - PLAYER_HEIGHT / 2 - PLAYER_Y_OFFSET;
  player.squash = player.squash + (1 - player.squash) * Math.min(dt * 8, 1);

  const prevCharge = player.charge;
  if (input.fireHeld) { player.charge = Math.min(1, player.charge + dt * 0.8); if (player.charge >= 0.8 && prevCharge < 0.8) playSfx('charge'); }
  else { player.charge = Math.max(0, player.charge - dt * 3); }

  if (input.fire && (diff.maxShots === 0 || s.hooksFired < diff.maxShots) && s.hooks.length < (effects.multishotTimer > 0 ? 3 : 1)) {
    const count = effects.multishotTimer > 0 ? 3 : 1;
    s.hooksFired += count;
    for (let i = 0; i < count; i++) {
      const spread = count === 1 ? 0 : (i - 1) * 40;
      s.hooks.push({ id: uid(), x: player.x + spread, tipY: player.y - PLAYER_HEIGHT / 2, baseY: player.y - PLAYER_HEIGHT / 2, active: true, spawnScale: 1.3, width: HOOK_WIDTH * (1 + player.charge * 1.5), color: player.charge > 0.8 ? '#ffdd00' : '#aaddff' });
    }
    player.squash = 0.82;
    playSfx(player.charge > 0.8 ? 'shot2' : 'shot');
  }

  s.hooks = s.hooks.filter(h => h.active);
  for (const hook of s.hooks) {
    if (hook.spawnScale > 1) hook.spawnScale -= dt * 3;
    hook.tipY -= HOOK_SPEED * effectiveDt;
    if (hook.tipY <= CEILING_Y) hook.active = false;
  }

  // ── ball physics ──
  const ballsToAdd: Ball[] = [];
  const ballIdsToRemove: Set<number> = new Set();
  const hookIdsToRemove: Set<number> = new Set();

  for (const ball of s.balls) {
    ball.vy += GRAVITY * diff.gravityMultiplier * effectiveDt;
    if (ball.homing && ball.vy > 0) { const toPlayer = player.x - ball.x; ball.vx += toPlayer * 0.7 * effectiveDt; ball.vx = clamp(ball.vx, -350, 350); }
    ball.rotation += ball.rotSpeed * effectiveDt;
    ball.x += ball.vx * effectiveDt;
    ball.y += ball.vy * effectiveDt;
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 8) ball.trail.shift();
    if (ball.x - ball.radius <= 0) { ball.x = ball.radius; ball.vx = Math.abs(ball.vx); }
    if (ball.x + ball.radius >= LOGICAL_WIDTH) { ball.x = LOGICAL_WIDTH - ball.radius; ball.vx = -Math.abs(ball.vx); }

    if (ball.y + ball.radius >= FLOOR_Y) {
      ball.y = FLOOR_Y - ball.radius; ball.vy = -Math.abs(ball.vy);
      const minKick = (BALL_SPEEDS[ball.tier] || TINY_SPEED) * diff.speedMultiplier * 1.1;
      if (Math.abs(ball.vy) < minKick) ball.vy = -minKick;
      ball.radius *= 0.92;
      if (Math.random() < 0.25) playSfx('bounce');
    } else {
      const target = ball.tier === 0 ? TINY_RADIUS : BALL_RADII[ball.tier];
      ball.radius += (target - ball.radius) * Math.min(effectiveDt * 6, 1);
    }

    // ball vs platform bounce
    for (const plat of s.platforms) {
      if (plat.broken) continue;
      const inX = ball.x + ball.radius >= plat.x && ball.x - ball.radius <= plat.x + plat.w;
      const inY = ball.vy > 0 && ball.y + ball.radius >= plat.y && ball.y + ball.radius <= plat.y + plat.h + 8;
      if (inX && inY) {
        ball.y = plat.y - ball.radius;
        ball.vy = -Math.abs(ball.vy) * 0.9;
        ball.vx += (Math.random() - 0.5) * 60;
        ball.vx = clamp(ball.vx, -350, 350);
        if (Math.random() < 0.2) playSfx('bounce');
        break;
      }
    }

    if (ball.y - ball.radius <= CEILING_Y) { ball.y = CEILING_Y + ball.radius; ball.vy = Math.abs(ball.vy); }
    if (ball.flash > 0) ball.flash -= effectiveDt * 4;
  }
  for (const plat of s.platforms) { if (plat.flash > 0) plat.flash -= effectiveDt * 4; }

  // ── hook-ball collision ──
  for (const hook of s.hooks) {
    if (!hook.active) continue;
    for (const ball of s.balls) {
      if (ballIdsToRemove.has(ball.id)) continue;
      const dx = Math.abs(hook.x - ball.x);
      const inVertical = hook.tipY <= ball.y + ball.radius && hook.baseY >= ball.y - ball.radius;
      if (dx <= ball.radius && inVertical) {
        hookIdsToRemove.add(hook.id); hook.active = false;
        s.hooksHit++;

        ball.remainingHits--;
        if (ball.remainingHits > 0) { ball.flash = 1; const kickDir = hook.x < ball.x ? 1 : -1; ball.vx += kickDir * 120; ball.vy = -Math.abs(ball.vy) * 0.8 - 80; playSfx('bounce'); break; }

        ballIdsToRemove.add(ball.id);
        s.combo += 1; s.levelMaxCombo = Math.max(s.levelMaxCombo, s.combo); s.comboTimer = COMBO_WINDOW; s.comboDisplay = 1.8; s.streak += 1; s.totalPopped += 1;
        const scoreBoost = effects.scoreBoostTimer > 0 ? 2 : 1;
        const multiplier = s.combo * scoreBoost;
        const heightFactor = (ball.y - CEILING_Y) / (FLOOR_Y - CEILING_Y);
        const heightBonus = 1 + (1 - heightFactor) * 0.5;
        const speedFactor = Math.min(Math.abs(ball.vy) / GRAVITY, 1);
        const speedBonus = 1 + speedFactor * 0.3;
        const gained = Math.floor(BASE_SCORE[ball.tier] * multiplier * diff.speedMultiplier * heightBonus * speedBonus);
        s.score += gained;
        addFloater(s, ball.x, ball.y - ball.radius - 10, `+${gained}`, ball.glowColor);
        if (ball.tier === 0) { spawnParticles(s.flashParticles, ball.x, ball.y, '#ffffff', 8, 100, Math.PI); spawnRing(s.flashParticles, ball.x, ball.y, 'rgba(255,255,200,0.8)', 6, 50); }
        else { spawnParticles(s.flashParticles, ball.x, ball.y, ball.glowColor, 16); spawnRing(s.flashParticles, ball.x, ball.y, '#ffffff', 12, 80); }
        triggerShake(s, 2 + ball.tier, 0.12 + ball.tier * 0.04);
        maybeSpawnPowerUp(s, ball.x, ball.y);
        if (ball.tier === 0) playSfx('pop'); else playSfx('split');

        if (s.combo === 5) { addMilestone(s, 'COMBO ×5 !', 'Bonus de rapidité', '#ffdd00'); s.score += 250; }
        else if (s.combo === 10) { addMilestone(s, 'COMBO ×10 !', 'En feu !', '#ff6b00'); s.score += 750; }
        else if (s.combo === 20) { addMilestone(s, 'MÉGA COMBO !', 'Légendaire', '#ff3a6e'); s.score += 2500; }
        else if (s.combo > 1 && s.combo % 5 === 0) playSfx('combo');

        const milestoneTier = Math.floor(s.score / 10000);
        if (milestoneTier > s.scoreMilestone) { s.scoreMilestone = milestoneTier; addMilestone(s, `${milestoneTier * 10000} POINTS !`, 'Continue comme ça', '#a259ff'); }
        if (s.totalPopped === 50) addMilestone(s, '50 ORBES !', 'Vétéran', '#39ff14');
        else if (s.totalPopped === 100) addMilestone(s, '100 ORBES !', 'As des orbes', '#00e5ff');
        else if (s.totalPopped === 250) addMilestone(s, '250 ORBES !', 'Machine à pop', '#ff3a6e');

        if (ball.tier > 1 || (diff.smallestCanSplit && ball.tier === 1)) {
          const newTier = ball.tier - 1;
          const newRadius = newTier === 0 ? TINY_RADIUS : BALL_RADII[newTier];
          const newSpd = ((newTier === 0 ? TINY_SPEED : BALL_SPEEDS[newTier]) * diff.speedMultiplier) + diff.extraHSpeed;
          const lift = Math.abs(ball.vy) * 0.7;
          ballsToAdd.push(makeBall(ball.x - newRadius, ball.y, -Math.abs(newSpd), -lift, newTier, Math.floor(Math.random() * 3), false, diff.ballHealth));
          ballsToAdd.push(makeBall(ball.x + newRadius, ball.y, Math.abs(newSpd), -lift, newTier, Math.floor(Math.random() * 3), false, diff.ballHealth));
        }
        break;
      }
    }
  }

  // ── hook-platform collision ──
  for (const hook of s.hooks) {
    if (!hook.active) continue;
    for (const plat of s.platforms) {
      if (plat.broken) continue;
      const inX = hook.x >= plat.x && hook.x <= plat.x + plat.w;
      const inY = hook.tipY <= plat.y + plat.h && hook.baseY >= plat.y;
      if (inX && inY) {
        hookIdsToRemove.add(hook.id); hook.active = false;
        plat.hp--;
        plat.flash = 1;
        spawnParticles(s.flashParticles, hook.x, plat.y, plat.glowColor, 6, 120, Math.PI);
        playSfx('platform');

        if (plat.hp <= 0) {
          plat.broken = true;
          s.score += 50 * plat.maxHp;
          addFloater(s, plat.x + plat.w / 2, plat.y, `+${50 * plat.maxHp}`, plat.glowColor);
          spawnParticles(s.flashParticles, plat.x + plat.w / 2, plat.y + plat.h / 2, plat.glowColor, 16);
          spawnRing(s.flashParticles, plat.x + plat.w / 2, plat.y + plat.h / 2, '#ffffff', 10, 60);
          triggerShake(s, 3, 0.12);
          maybeDropFromPlatform(s, plat.x + plat.w / 2, plat.y);
        }
        break;
      }
    }
  }

  s.balls = s.balls.filter(b => !ballIdsToRemove.has(b.id));
  s.hooks = s.hooks.filter(h => !hookIdsToRemove.has(h.id) && h.active);
  s.balls.push(...ballsToAdd);

  updatePowerUps(s, dt, effects);
  if (checkPowerUpCollection(s, player, effects)) triggerShake(s, 2, 0.15);

  // player hit by ball
  if (player.invincible <= 0 && effects.shieldTimer <= 0) {
    for (const ball of s.balls) {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ball.radius + Math.max(PLAYER_WIDTH, PLAYER_HEIGHT) * 0.4) {
        player.lives -= 1; player.invincible = 0;
        s.hooks = []; s.powerUps = []; s.combo = 0; s.comboTimer = 0; s.comboDisplay = 0; s.streak = 0;
        s.levelHits += 1; s.phase = 'dead'; s.levelTimer = 1.4;
        spawnParticles(s.flashParticles, player.x, player.y, '#ff3a6e', 24, 280);
        spawnRing(s.flashParticles, player.x, player.y, '#ffffff', 18, 120);
        triggerShake(s, 9, 0.45); playSfx('hit');
        break;
      }
    }
  } else if (effects.shieldTimer > 0) {
    for (const ball of s.balls) {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ball.radius + 55) { const nx = dx / dist; const ny = dy / dist; ball.vx += nx * 200 * dt; ball.vy += ny * 200 * dt; }
    }
  }

  if (s.comboTimer > 0) { s.comboTimer -= dt; if (s.comboTimer <= 0) s.combo = 0; }
  if (s.comboDisplay > 0) s.comboDisplay -= dt;

  for (const p of s.flashParticles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.life -= dt; }
  s.flashParticles = s.flashParticles.filter(p => p.life > 0);

  for (const f of s.floaters) { f.y -= 40 * dt; f.life -= dt; f.scale = 1 + (1 - f.life / f.maxLife) * 0.3; }
  s.floaters = s.floaters.filter(f => f.life > 0);

  if (s.ballsPending.length > 0 && s.phase === 'playing') {
    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) { s.balls.push(s.ballsPending.shift()!); s.spawnTimer = s.difficulty.spawnDelay; }
  }

  if (s.balls.length === 0 && s.ballsPending.length === 0 && s.phase === 'playing') {
    s.phase = 'levelup'; s.levelTimer = 2.6;
    s.hooks = []; s.powerUps = [];
    s.maxLevelReached = Math.max(s.maxLevelReached, s.level + 1);
    const bonus = Math.floor(500 * s.level * (1 + s.streak * 0.05));
    s.score += bonus;
    addFloater(s, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 60, `NIVEAU TERMINÉ +${bonus}`, '#39ff14');
    triggerShake(s, 3, 0.25); playSfx('levelup');
    if (s.levelHits === 0) { addMilestone(s, 'NIVEAU PARFAIT !', `+${1000 * s.level} bonus`, '#39ff14'); s.score += 1000 * s.level; }
    // bonus de précision
    if (s.hooksFired > 0) {
      const accuracy = s.hooksHit / s.hooksFired;
      const accBonus = Math.floor(accuracy * 200 * s.level);
      if (accBonus > 0) {
        s.score += accBonus;
        addFloater(s, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 90, `PRÉCISION ${Math.round(accuracy * 100)}% +${accBonus}`, '#ffdd00');
      }
    }
    // bonus de temps
    const timePerBall = s.difficulty.ballCount > 0 ? s.levelElapsed / s.difficulty.ballCount : 99;
    if (timePerBall <= 5) {
      const timeBonus = Math.floor(300 * s.level * Math.max(0, 5 - timePerBall));
      if (timeBonus > 0) {
        s.score += timeBonus;
        addFloater(s, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 120, `VITESSE +${timeBonus}`, '#00e5ff');
      }
    }
  }

  // enregistrer best score / détection de record
  if (s.score > s.bestScore) {
    const wasRecord = s.bestScore > 0 && s.score > s.bestScore;
    s.bestScore = s.score;
    if (wasRecord) playSfx('record');
  }

  return s;
}
