import { GameState } from './types';
import {
  LOGICAL_WIDTH, LOGICAL_HEIGHT,
  FLOOR_Y, CEILING_Y,
  MAX_LIVES,
} from './constants';
import { getTheme, LevelTheme } from './themes';

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

export function drawStarsSummary(ctx: CanvasRenderingContext2D, cx: number, cy: number, stars: number) {
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffdd00';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 8;
  ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), cx, cy);
  ctx.shadowBlur = 0;
}

export function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
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
    if (state.difficulty.maxShots > 0) {
      const remaining = state.difficulty.maxShots - state.hooksFired;
      ctx.fillStyle = remaining <= 3 ? '#ff3a6e' : 'rgba(255,200,100,0.7)';
      ctx.fillText(`TIRS ${Math.max(0, remaining)}/${state.difficulty.maxShots}`, 16, 66);
    }
  }

  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillStyle = theme.hudColor;
  ctx.fillText(`NIVEAU ${level}`, LOGICAL_WIDTH / 2, 36);

  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = 'rgba(200,220,255,0.5)';
  ctx.fillText(theme.name.toUpperCase(), LOGICAL_WIDTH / 2, 50);

  ctx.textAlign = 'right';
  let livesX = LOGICAL_WIDTH - 16;
  for (let i = MAX_LIVES; i > 0; i--) {
    drawHeart(ctx, livesX, FLOOR_Y + 20, 18, i <= player.lives);
    livesX -= 24;
  }

  if (comboDisplay > 0) {
    const alpha = Math.min(1, comboDisplay);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillStyle = '#ffdd00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 16;
    ctx.fillText(`COMBO ×${combo}`, 16, 80);
    ctx.restore();
  }

  ctx.shadowBlur = 0;
}
