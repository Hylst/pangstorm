import { GameState } from './types';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, CEILING_Y, FLOOR_Y } from './constants';
import { LevelTheme } from './themes';
import { GameAssets } from './assets';

function drawFallbackBg(ctx: CanvasRenderingContext2D, theme: LevelTheme) {
  const bg = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
  bg.addColorStop(0, theme.fallbackTop);
  bg.addColorStop(1, theme.fallbackBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
}

export function drawBackground(ctx: CanvasRenderingContext2D, theme: LevelTheme, assets: GameAssets, level: number, time: number) {
  if (theme.bgIndex >= 0) {
    const bgImg = assets.backgrounds[theme.bgIndex];
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      const parallaxX = Math.sin(time * 0.1) * 10;
      const parallaxY = Math.cos(time * 0.08) * 6;
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.drawImage(bgImg, parallaxX - 8, parallaxY - 6, LOGICAL_WIDTH + 16, LOGICAL_HEIGHT + 12);
      ctx.restore();
    } else {
      drawFallbackBg(ctx, theme);
    }
  } else {
    drawFallbackBg(ctx, theme);
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

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  ctx.restore();
}

export function drawFloorCeiling(ctx: CanvasRenderingContext2D, theme: LevelTheme, time: number) {
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

  const glow = 0.7 + 0.3 * Math.sin(time * 3);
  ctx.fillStyle = theme.floorGlow;
  ctx.shadowColor = theme.floorGlow;
  ctx.shadowBlur = 10 * glow;
  ctx.fillRect(0, CEILING_Y, LOGICAL_WIDTH, 2);
  ctx.fillRect(0, FLOOR_Y, LOGICAL_WIDTH, 2);
  ctx.shadowBlur = 0;
}

export function drawAmbient(ctx: CanvasRenderingContext2D, state: GameState) {
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
