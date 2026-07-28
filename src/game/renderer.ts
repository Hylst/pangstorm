import { GameState, Hook, ONBOARDING_STEPS } from './types';
import {
  LOGICAL_WIDTH, LOGICAL_HEIGHT,
  FLOOR_Y, CEILING_Y,
  PLAYER_WIDTH, PLAYER_HEIGHT,
  MAX_LIVES,
} from './constants';
import { applyShake } from './animations';
import { getTheme, LevelTheme } from './themes';
import { GameAssets } from './assets';
import { getPowerUpColor, getPowerUpSymbol } from './powerups';

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function drawBallTrail(ctx: CanvasRenderingContext2D, trail: { x: number; y: number }[], r: number, color: string) {
  if (trail.length < 2) return;
  const rgb = hexToRgb(color);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    const f = i / trail.length;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 0.55 * f, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb},${0.18 * f})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  color: string, flash: number, rotation: number, time: number,
) {
  const rgb = hexToRgb(color);

  const grd = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 2.6);
  grd.addColorStop(0,   `rgba(${rgb},${0.42 + flash * 0.55})`);
  grd.addColorStop(0.5, `rgba(${rgb},${0.15 + flash * 0.25})`);
  grd.addColorStop(1,   `rgba(${rgb},0)`);
  ctx.beginPath();
  ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  const bodyGrd = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
  bodyGrd.addColorStop(0, `rgba(255,255,255,0.9)`);
  bodyGrd.addColorStop(0.35, color);
  bodyGrd.addColorStop(1, `rgba(${rgb},0.65)`);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrd;
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 1.6);
  ctx.strokeStyle = `rgba(255,255,255,${0.35 + flash * 0.35})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([r * 0.35, r * 0.55]);
  ctx.stroke();
  ctx.restore();

  const pulse = 0.8 + 0.2 * Math.sin(time * 6 + x * 0.01);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.35 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.25 + flash * 0.25})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = flash > 0.1 ? '#fff' : color;
  ctx.lineWidth = 2 + flash * 3;
  ctx.setLineDash([]);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x - r * 0.32, y - r * 0.30, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.5 + flash * 0.35})`;
  ctx.fill();
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, squash: number, charge: number, invincible: number, shielded: boolean, time: number) {
  if (invincible > 0 && Math.floor(time * 10) % 2 === 0) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squash);

  if (shielded) {
    const sa = 0.4 + 0.2 * Math.sin(time * 8);
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(57,255,20,${sa})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(57,255,20,${0.2 + 0.1 * Math.sin(time * 6)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const w = PLAYER_WIDTH;
  const h = PLAYER_HEIGHT;
  const bw = w / 2;
  const tw = w * 0.32;
  const hh = h / 2;

  if (charge > 0.1) {
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, bw + charge * 25);
    cg.addColorStop(0, `rgba(255,221,0,${charge * 0.5})`);
    cg.addColorStop(1, 'rgba(255,221,0,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, bw + charge * 25, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(-tw, -hh);
  ctx.lineTo(tw, -hh);
  ctx.lineTo(bw, hh);
  ctx.lineTo(-bw, hh);
  ctx.closePath();

  const grd = ctx.createLinearGradient(0, -hh, 0, hh);
  grd.addColorStop(0, '#eef3ff');
  grd.addColorStop(0.5, '#8fa8ff');
  grd.addColorStop(1, '#5060b0');
  ctx.fillStyle = grd;
  ctx.fill();

  ctx.strokeStyle = '#d0e8ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#6699ff';
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.12, tw * 0.5, hh * 0.36, 0, 0, Math.PI * 2);
  ctx.fillStyle = charge > 0.8 ? 'rgba(255,221,0,0.8)' : 'rgba(80,200,255,0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-tw * 0.7, hh * 0.25);
  ctx.lineTo(-bw, hh);
  ctx.lineTo(-tw * 0.2, hh * 0.55);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(tw * 0.7, hh * 0.25);
  ctx.lineTo(bw, hh);
  ctx.lineTo(tw * 0.2, hh * 0.55);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();

  const nGrd = ctx.createRadialGradient(0, hh, 0, 0, hh, bw * 0.7);
  nGrd.addColorStop(0, `rgba(100,200,255,${0.8 + 0.2 * Math.sin(time * 12)})`);
  nGrd.addColorStop(1, 'rgba(80,120,255,0)');
  ctx.beginPath();
  ctx.ellipse(0, hh, bw * 0.7, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = nGrd;
  ctx.fill();

  ctx.restore();
}

function drawHook(ctx: CanvasRenderingContext2D, hook: Hook) {
  const { x, tipY, baseY, spawnScale, width, color } = hook;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = width * spawnScale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, tipY);
  ctx.stroke();

  ctx.shadowBlur = 6;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * 0.5 * spawnScale;
  ctx.stroke();

  ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x - 7 * spawnScale, tipY + 12);
  ctx.lineTo(x, tipY);
  ctx.lineTo(x + 7 * spawnScale, tipY + 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, filled: boolean) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size / 20, size / 20);
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.bezierCurveTo(0, -9, -10, -9, -10, -2);
  ctx.bezierCurveTo(-10, 4, 0, 10, 0, 10);
  ctx.bezierCurveTo(0, 10, 10, 4, 10, -2);
  ctx.bezierCurveTo(10, -9, 0, -9, 0, -4);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = '#ff3a6e';
    ctx.shadowColor = '#ff3a6e';
    ctx.shadowBlur = 14;
    ctx.fill();
  } else {
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawFloorCeiling(ctx: CanvasRenderingContext2D, theme: LevelTheme, time: number) {
  const cGrd = ctx.createLinearGradient(0, CEILING_Y - 10, 0, CEILING_Y + 6);
  cGrd.addColorStop(0, 'rgba(0,0,0,0)');
  cGrd.addColorStop(1, theme.accent);
  ctx.fillStyle = cGrd;
  ctx.fillRect(0, CEILING_Y - 10, LOGICAL_WIDTH, 16);

  const fGrd = ctx.createLinearGradient(0, FLOOR_Y - 6, 0, FLOOR_Y + 30);
  fGrd.addColorStop(0, theme.accent);
  fGrd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fGrd;
  ctx.fillRect(0, FLOOR_Y - 6, LOGICAL_WIDTH, 36);

  // Pulsing neon lines
  const glow = 0.7 + 0.3 * Math.sin(time * 3);
  ctx.fillStyle = theme.floorGlow;
  ctx.shadowColor = theme.floorGlow;
  ctx.shadowBlur = 10 * glow;
  ctx.fillRect(0, CEILING_Y, LOGICAL_WIDTH, 2);
  ctx.fillRect(0, FLOOR_Y, LOGICAL_WIDTH, 2);
  ctx.shadowBlur = 0;
}

function drawBackground(ctx: CanvasRenderingContext2D, theme: LevelTheme, assets: GameAssets, level: number, time: number) {
  const bgImg = assets.backgrounds[theme.bgIndex];
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    const parallaxX = Math.sin(time * 0.1) * 10;
    const parallaxY = Math.cos(time * 0.08) * 6;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(bgImg, parallaxX - 8, parallaxY - 6, LOGICAL_WIDTH + 16, LOGICAL_HEIGHT + 12);
    ctx.restore();
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    bg.addColorStop(0, theme.fallbackTop);
    bg.addColorStop(1, theme.fallbackBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 90; i++) {
    const sx = ((Math.sin(i * 127.1 + level) * 0.5 + 0.5) * LOGICAL_WIDTH) | 0;
    const sy = ((Math.sin(i * 311.7 + level) * 0.5 + 0.5) * LOGICAL_HEIGHT) | 0;
    const flicker = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * (1 + (i % 5)) + i));
    ctx.globalAlpha = flicker * 0.7;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;
}

function drawAmbient(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const a of state.ambient) {
    ctx.save();
    ctx.globalAlpha = a.alpha;
    ctx.fillStyle = a.hue;
    ctx.shadowColor = a.hue;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const { score, level, combo, comboDisplay, player, bestScore } = state;
  const theme = getTheme(level);

  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = theme.hudColor;
  ctx.shadowColor = theme.floorGlow;
  ctx.shadowBlur = 12;
  ctx.fillText(`SCORE  ${score.toString().padStart(7, '0')}`, 16, 36);
  ctx.shadowBlur = 0;

  if (state.phase !== 'title' && state.phase !== 'gameover') {
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.6)';
    ctx.fillText(`RECORD ${bestScore.toString().padStart(7,'0')}`, 16, 52);
  }

  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillStyle = theme.hudColor;
  ctx.fillText(`NIVEAU ${level}`, LOGICAL_WIDTH / 2, 36);

  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = 'rgba(200,220,255,0.5)';
  ctx.fillText(theme.name.toUpperCase(), LOGICAL_WIDTH / 2, 50);

  const heartSize = 18;
  const heartStartX = LOGICAL_WIDTH - 16 - MAX_LIVES * (heartSize + 6);
  for (let i = 0; i < MAX_LIVES; i++) {
    drawHeart(ctx, heartStartX + i * (heartSize + 6) + heartSize / 2, 30, heartSize, i < player.lives);
  }

  const fx = state.effects;
  let fxX = 16;
  const fxY = 70;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  const icons: [boolean, string, string][] = [
    [fx.multishotTimer > 0, '⇈', '#ffdd00'],
    [fx.slowMoTimer > 0, '◷', '#00e5ff'],
    [fx.shieldTimer > 0, '◈', '#39ff14'],
    [fx.scoreBoostTimer > 0, '★', '#a259ff'],
  ];
  for (const [active, sym, col] of icons) {
    if (active) {
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
      ctx.fillText(sym, fxX, fxY);
      ctx.shadowBlur = 0;
      fxX += 22;
    }
  }

  if (comboDisplay > 0 && combo > 1) {
    const alpha = Math.min(1, comboDisplay);
    const scale = 1 + 0.25 * Math.sin(time * 12);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(LOGICAL_WIDTH / 2, CEILING_Y + 70);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.font = 'bold 38px "Courier New", monospace';
    ctx.fillStyle = '#ffdd00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 24;
    ctx.fillText(`COMBO ×${combo} !`, 0, 0);
    ctx.restore();
  }
}

function drawFloaters(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const f of state.floaters) {
    const alpha = Math.min(1, f.life / f.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(f.x, f.y);
    ctx.scale(f.scale, f.scale);
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillStyle = f.color;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 14;
    ctx.fillText(f.text, 0, 0);
    ctx.restore();
  }
}

function drawMilestones(ctx: CanvasRenderingContext2D, state: GameState) {
  let y = LOGICAL_HEIGHT / 2 - 120;
  for (const m of state.milestones) {
    const p = 1 - m.life / m.maxLife;
    const slideIn = p < 0.15 ? (p / 0.15) : 1;
    const fadeOut = m.life < 0.5 ? (m.life / 0.5) : 1;
    const alpha = slideIn * fadeOut;
    const x = LOGICAL_WIDTH / 2 + (1 - slideIn) * 200;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    const bw = 320;
    const bh = 64;

    // Card background
    ctx.fillStyle = 'rgba(10,12,28,0.92)';
    ctx.strokeStyle = m.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = m.color;
    ctx.shadowBlur = 20;
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillStyle = m.color;
    ctx.fillText(m.title, 0, -6);

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.9)';
    ctx.fillText(m.subtitle.toUpperCase(), 0, 16);

    ctx.restore();
    y += 76;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLevelIntro(ctx: CanvasRenderingContext2D, state: GameState, theme: LevelTheme, time: number) {
  if (state.levelIntro <= 0) return;
  const total = 2.6;
  const t = state.levelIntro;
  const fadeIn = Math.min(1, (total - t) / 0.3);
  const fadeOut = t < 0.5 ? (t / 0.5) : 1;
  const alpha = Math.min(fadeIn, fadeOut);

  const cx = LOGICAL_WIDTH / 2;
  const cy = LOGICAL_HEIGHT / 2 - 30;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Banner
  ctx.fillStyle = 'rgba(5,8,20,0.6)';
  ctx.fillRect(0, cy - 70, LOGICAL_WIDTH, 140);

  ctx.textAlign = 'center';
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillStyle = theme.floorGlow;
  ctx.fillText(`NIVEAU ${state.level}`, cx, cy - 38);

  const wob = 1 + 0.04 * Math.sin(time * 6);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(wob, wob);
  ctx.font = 'bold 46px "Courier New", monospace';
  ctx.fillStyle = theme.hudColor;
  ctx.shadowColor = theme.floorGlow;
  ctx.shadowBlur = 30;
  ctx.fillText(theme.name.toUpperCase(), 0, 6);
  ctx.restore();

  ctx.font = '15px "Courier New", monospace';
  ctx.fillStyle = 'rgba(200,220,255,0.85)';
  ctx.shadowBlur = 0;
  ctx.fillText(theme.description, cx, cy + 40);

  ctx.restore();
}

function drawPowerUps(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  for (const p of state.powerUps) {
    const pulse = 1 + 0.15 * Math.sin(time * 6 + p.id);
    const color = getPowerUpColor(p.type);
    const symbol = getPowerUpSymbol(p.type);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(pulse, pulse);

    const g = ctx.createRadialGradient(0, 0, p.radius * 0.2, 0, 0, p.radius * 1.8);
    g.addColorStop(0, `rgba(${hexToRgb(color)},0.6)`);
    g.addColorStop(1, `rgba(${hexToRgb(color)},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const px = Math.cos(ang) * p.radius;
      const py = Math.sin(ang) * p.radius;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#0a0a12';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillText(symbol, 0, 1);

    ctx.restore();
  }
}

function drawOnboarding(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const step = state.onboardingStep < ONBOARDING_STEPS.length ? ONBOARDING_STEPS[state.onboardingStep] : null;
  if (!step) return;

  ctx.fillStyle = 'rgba(3,4,15,0.82)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  const cx = LOGICAL_WIDTH / 2;
  const cy = LOGICAL_HEIGHT / 2;

  const dotY = cy - 110;
  for (let i = 0; i < ONBOARDING_STEPS.length; i++) {
    ctx.beginPath();
    ctx.arc(cx - (ONBOARDING_STEPS.length - 1) * 12 + i * 24, dotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = i === state.onboardingStep ? '#00e5ff' : '#334';
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.font = 'bold 36px "Courier New", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 20;
  ctx.fillText(step.title, cx, cy - 50);

  ctx.font = '18px "Courier New", monospace';
  ctx.fillStyle = '#aaccff';
  ctx.shadowBlur = 0;

  wrapText(ctx, step.text, cx, cy - 10, 560, 24);

    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = `rgba(200,220,255,${0.5 + 0.5 * Math.sin(time * 3)})`;
    ctx.fillText('ESPACE OU CLIC POUR CONTINUER', cx, cy + 50);

  if (step.highlight === 'player') {
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(state.player.x - 40, state.player.y - 25, 80, 50);
    ctx.setLineDash([]);
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = w + ' ';
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

function drawOverlay(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const { phase, score, level, bestScore } = state;
  const cx = LOGICAL_WIDTH / 2;
  const cy = LOGICAL_HEIGHT / 2;

  if (phase === 'title') {
    ctx.fillStyle = 'rgba(3,4,15,0.78)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const pulse = 0.9 + 0.1 * Math.sin(time * 2.5);
    ctx.save();
    ctx.translate(cx, cy - 120);
    ctx.scale(pulse, pulse);
    ctx.textAlign = 'center';
    ctx.font = 'bold 78px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#4499ff';
    ctx.shadowBlur = 55;
    ctx.fillText('PANG', 0, 0);
    ctx.font = 'bold 42px "Courier New", monospace';
    ctx.fillStyle = '#88aaff';
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 26;
    ctx.fillText('GENESIS', 0, 54);
    ctx.restore();

    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#aaccff';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    ctx.fillText(`MEILLEUR SCORE  ${bestScore.toString().padStart(7,'0')}`, cx, cy - 30);

    ctx.font = '20px "Courier New", monospace';
    ctx.fillStyle = `rgba(200,220,255,${0.5 + 0.5 * Math.sin(time * 3)})`;
    ctx.fillText('APPUYEZ SUR ESPACE POUR DÉMARRER', cx, cy + 10);

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = 'rgba(120,140,200,0.9)';
    ctx.fillText('← → DÉPLACER   •   ESPACE TIR / CHARGER   •   M SILENCE', cx, cy + 42);
    ctx.fillText('RÉCUPÈRE LES BONUS  •  FAIS ÉCLATER TOUTES LES ORBES', cx, cy + 64);

    // Credits
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = 'rgba(140,160,210,0.8)';
    ctx.fillText('un jeu par Hylst - Geoffroy', cx, cy + 100);
    ctx.fillStyle = 'rgba(110,130,180,0.7)';
    ctx.fillText('avec l\'aide d\'une IA', cx, cy + 116);
    ctx.fillStyle = 'rgba(90,110,170,0.55)';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('librement inspiré du classique Pang d\'Ocean (Atari ST)', cx, cy + 134);

    const demoColors = ['#ff3a6e', '#00e5ff', '#ffdd00', '#a259ff'];
    for (let i = 0; i < 4; i++) {
      const angle = time * 0.5 + (i * Math.PI * 2) / 4;
      const dx = Math.cos(angle) * 150;
      const dy = Math.sin(angle * 0.7) * 52;
      drawGlowCircle(ctx, cx + dx, cy - 215 + dy, 18 + i * 4, demoColors[i], 0.2, time + i, time);
    }
    return;
  }

  if (phase === 'levelup') {
    ctx.fillStyle = 'rgba(3,4,15,0.55)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.textAlign = 'center';
    ctx.font = 'bold 58px "Courier New", monospace';
    ctx.fillStyle = '#39ff14';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 36;
    ctx.fillText('NIVEAU TERMINÉ !', cx, cy - 24);
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = '#ffdd00';
    ctx.shadowColor = '#ffaa00';
    ctx.fillText(`SUIVANT : ${getTheme(level + 1).name.toUpperCase()}`, cx, cy + 24);
    ctx.shadowBlur = 0;
    return;
  }

  if (phase === 'dead') {
    ctx.fillStyle = `rgba(180,0,0,${0.25 + 0.15 * Math.sin(time * 15)})`;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px "Courier New", monospace';
    ctx.fillStyle = '#ff3a6e';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 36;
    ctx.fillText('TOUCHÉ !', cx, cy);
    ctx.shadowBlur = 0;
    return;
  }

  if (phase === 'gameover') {
    ctx.fillStyle = 'rgba(3,4,15,0.88)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.textAlign = 'center';
    ctx.font = 'bold 68px "Courier New", monospace';
    ctx.fillStyle = '#ff3a6e';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 36;
    ctx.fillText('PERDU', cx, cy - 70);
    ctx.font = 'bold 30px "Courier New", monospace';
    ctx.fillStyle = '#c0d8ff';
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 12;
    ctx.fillText(`SCORE  ${score.toString().padStart(7,'0')}`, cx, cy - 16);
    ctx.font = '20px "Courier New", monospace';
    ctx.fillStyle = '#88aaff';
    ctx.fillText(`RECORD  ${bestScore.toString().padStart(7,'0')}`, cx, cy + 16);
    ctx.font = '20px "Courier New", monospace';
    ctx.fillStyle = `rgba(200,220,255,${0.5 + 0.5 * Math.sin(time * 3)})`;
    ctx.shadowBlur = 0;
    ctx.fillText('APPUYEZ SUR ESPACE POUR REJOUER', cx, cy + 64);
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = 'rgba(140,160,210,0.7)';
    ctx.fillText('un jeu par Hylst - Geoffroy — avec l\'aide d\'une IA', cx, cy + 120);
    return;
  }
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number,
  assets: GameAssets,
) {
  ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  const theme = getTheme(state.level);

  ctx.save();
  applyShake(ctx, state.shake);

  drawBackground(ctx, theme, assets, state.level, time);
  drawFloorCeiling(ctx, theme, time);
  drawAmbient(ctx, state);

  // Balls with trails
  for (const ball of state.balls) {
    drawBallTrail(ctx, ball.trail, ball.radius, ball.color);
    drawGlowCircle(ctx, ball.x, ball.y, ball.radius, ball.color, Math.max(0, ball.flash), ball.rotation, time);
  }

  drawPowerUps(ctx, state, time);

  for (const hook of state.hooks) {
    drawHook(ctx, hook);
  }

  for (const p of state.flashParticles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }

  if (state.phase === 'playing' || state.phase === 'dead' || state.phase === 'onboarding') {
    drawPlayer(ctx, state.player.x, state.player.y, state.player.squash, state.player.charge, state.player.invincible, state.effects.shieldTimer > 0, time);
  }

  drawHUD(ctx, state, time);
  drawFloaters(ctx, state);

  ctx.restore(); // end shake

  if (state.phase === 'onboarding') {
    drawOnboarding(ctx, state, time);
  }

  if (state.phase === 'playing' || state.phase === 'levelup') {
    drawLevelIntro(ctx, state, theme, time);
  }

  drawMilestones(ctx, state);
  drawOverlay(ctx, state, time);
}
