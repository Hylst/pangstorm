import { GameState } from './types';
import {
  LOGICAL_WIDTH,
  FLOOR_Y,
  MAX_LIVES,
} from './constants';
import { getTheme } from './themes';

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

export function drawStarsSummary(ctx: CanvasRenderingContext2D, cx: number, cy: number, stars: number, max = 5) {
  const filled = Math.min(stars, max);
  const empty = max - filled;
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffdd00';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 8;
  ctx.fillText('★'.repeat(filled) + '☆'.repeat(empty), cx, cy);
  ctx.shadowBlur = 0;
}

const BONUS_META: { key: keyof import('./types').ActiveEffects; sym: string; color: string }[] = [
  { key: 'multishotTimer', sym: '⇈', color: '#ffdd00' },
  { key: 'slowMoTimer',    sym: '◷', color: '#00e5ff' },
  { key: 'shieldTimer',    sym: '◈', color: '#39ff14' },
  { key: 'scoreBoostTimer', sym: '★', color: '#a259ff' },
  { key: 'magnetTimer',    sym: '🧲', color: '#ff88cc' },
];

export function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const { score, level, combo, comboDisplay, player, bestScore } = state;
  const theme = getTheme(level);
  const e = state.effects;

  ctx.textAlign = 'left';

  // SCORE
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.fillStyle = theme.hudColor;
  ctx.shadowColor = theme.floorGlow;
  ctx.shadowBlur = 12;
  ctx.fillText(`SCORE  ${score.toString().padStart(7, '0')}`, 16, 36);
  ctx.shadowBlur = 0;

  if (state.phase !== 'title' && state.phase !== 'gameover') {
    let lineY = 52;
    ctx.font = '12px "Courier New", monospace';

    // RECORD
    ctx.fillStyle = 'rgba(200,220,255,0.6)';
    ctx.fillText(`RECORD ${bestScore.toString().padStart(7,'0')}`, 16, lineY);
    lineY += 14;

    // TIRS (toujours affiché)
    const shotsColor = state.difficulty.maxShots > 0
      ? (state.difficulty.maxShots - state.hooksFired <= 3 ? '#ff3a6e' : 'rgba(255,200,100,0.7)')
      : 'rgba(200,220,255,0.5)';
    ctx.fillStyle = shotsColor;
    if (state.difficulty.maxShots > 0) {
      const remaining = Math.max(0, state.difficulty.maxShots - state.hooksFired);
      ctx.fillText(`TIRS ${remaining}/${state.difficulty.maxShots}`, 16, lineY);
    } else {
      ctx.fillText(`TIRS ${state.hooksFired}`, 16, lineY);
    }
    lineY += 14;

    // bonus actifs
    for (const b of BONUS_META) {
      const t = e[b.key];
      if (t <= 0) continue;
      ctx.font = t < 2 ? 'bold 14px "Courier New", monospace' : '13px "Courier New", monospace';
      ctx.fillStyle = t < 2 ? '#ff3a6e' : b.color;
      ctx.fillText(`${b.sym}  ${t.toFixed(1)}s`, 16, lineY);
      lineY += 16;
    }

    // COMBO
    if (comboDisplay > 0) {
      const alpha = Math.min(1, comboDisplay);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = '#ffdd00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 16;
      ctx.fillText(`COMBO ×${combo}`, 16, lineY + 6);
      ctx.restore();
    }
  }

  // centre — niveau
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillStyle = theme.hudColor;
  ctx.fillText(`NIVEAU ${level}`, LOGICAL_WIDTH / 2, 36);
  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = 'rgba(200,220,255,0.5)';
  ctx.fillText(theme.name.toUpperCase(), LOGICAL_WIDTH / 2, 50);

  // droite — vies
  ctx.textAlign = 'right';
  let livesX = LOGICAL_WIDTH - 16;
  for (let i = MAX_LIVES; i > 0; i--) {
    drawHeart(ctx, livesX, FLOOR_Y + 20, 18, i <= player.lives);
    livesX -= 24;
  }
  ctx.shadowBlur = 0;
}
