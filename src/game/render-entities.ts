import { GameState, Hook } from './types';
import {
  LOGICAL_WIDTH, LOGICAL_HEIGHT,
  FLOOR_Y, CEILING_Y,
  PLAYER_WIDTH, PLAYER_HEIGHT,
  MAX_LIVES,
} from './constants';
import { hexToRgb, roundRect } from './render-utils';
import { getPowerUpColor, getPowerUpSymbol } from './powerups';

export function drawBallTrail(ctx: CanvasRenderingContext2D, trail: { x: number; y: number }[], r: number, color: string) {
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

export function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  color: string, flash: number, rotation: number, time: number,
  remainingHits: number,
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

  if (remainingHits > 1) {
    const ringPulse = 0.85 + 0.15 * Math.sin(time * 5 + x);
    ctx.beginPath();
    ctx.arc(x, y, r * 1.25 * ringPulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,0.5)`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${remainingHits}`, x, y + r * 1.6);
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, squash: number, charge: number, invincible: number, shielded: boolean, time: number) {
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

  const nGrd = ctx.createRadialGradient(0, hh, 0, 0, hh, bw * 0.7);
  nGrd.addColorStop(0, `rgba(100,200,255,${0.8 + 0.2 * Math.sin(time * 12)})`);
  nGrd.addColorStop(1, 'rgba(80,120,255,0)');
  ctx.beginPath();
  ctx.ellipse(0, hh, bw * 0.7, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = nGrd;
  ctx.fill();

  ctx.restore();
}

export function drawHook(ctx: CanvasRenderingContext2D, hook: Hook) {
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

export function drawPlatforms(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  for (const p of state.platforms) {
    if (p.broken) continue;
    const alpha = p.flash > 0 ? 0.6 + 0.4 * Math.sin(time * 40) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;

    const grd = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    grd.addColorStop(0, p.color);
    grd.addColorStop(0.5, p.glowColor);
    grd.addColorStop(1, p.color);
    ctx.fillStyle = grd;
    ctx.shadowColor = p.glowColor;
    ctx.shadowBlur = p.flash > 0 ? 20 : 8;
    roundRect(ctx, p.x, p.y, p.w, p.h, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(p.x + 4, p.y + 1, p.w - 8, 2);

    if (p.maxHp > 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${p.hp}`, p.x + p.w / 2, p.y + p.h / 2);
    }

    ctx.restore();
  }
}

export function drawPowerUps(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
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
