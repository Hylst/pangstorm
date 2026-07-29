import { GameState } from './types';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './constants';
import { applyShake } from './animations';
import { getTheme } from './themes';
import { GameAssets } from './assets';

import { drawBallTrail, drawGlowCircle, drawPlayer, drawHook, drawPlatforms, drawPowerUps } from './render-entities';
import { drawBackground, drawFloorCeiling, drawAmbient } from './render-background';
import { drawHUD } from './render-hud';
import { drawFloaters, drawMilestones, drawLevelIntro, drawOnboarding, drawPauseOverlay, drawLevelSelect, drawOverlay, drawInfoOverlay } from './render-overlays';

export {
  drawBallTrail, drawGlowCircle, drawPlayer, drawHook, drawPlatforms, drawPowerUps,
  drawBackground, drawFloorCeiling, drawAmbient,
  drawHUD,
  drawFloaters, drawMilestones, drawLevelIntro, drawOnboarding, drawPauseOverlay, drawLevelSelect, drawOverlay, drawInfoOverlay,
};

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

  for (const ball of state.balls) {
    drawBallTrail(ctx, ball.trail, ball.radius, ball.color);
    drawGlowCircle(ctx, ball.x, ball.y, ball.radius, ball.color, Math.max(0, ball.flash), ball.rotation, time, ball.remainingHits);
  }

  drawPlatforms(ctx, state, time);
  drawPowerUps(ctx, state, time);

  for (const hook of state.hooks) {
    drawHook(ctx, hook);
  }

  if (state.phase === 'playing' || state.phase === 'dead' || state.phase === 'onboarding' || state.phase === 'paused') {
    drawPlayer(ctx, state.player.x, state.player.y, state.player.squash, state.player.charge, state.player.invincible, state.effects.shieldTimer > 0, time);
  }

  drawHUD(ctx, state, time);
  drawFloaters(ctx, state);

  ctx.restore();

  if (state.phase === 'onboarding') {
    drawOnboarding(ctx, state, time);
  }

  if (state.phase === 'playing' || state.phase === 'levelup') {
    drawLevelIntro(ctx, state, theme, time);
  }

  drawMilestones(ctx, state);
  drawOverlay(ctx, state, time);
  drawPauseOverlay(ctx, state, time);
  drawLevelSelect(ctx, state, time);
  drawInfoOverlay(ctx, state, time);

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
}
