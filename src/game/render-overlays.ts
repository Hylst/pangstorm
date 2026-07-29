import { GameState, GameOptions, OnboardingStep, ONBOARDING_STEPS, PAUSE_BUTTONS } from './types';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './constants';
import { getTheme, LevelTheme } from './themes';
import { roundRect } from './render-utils';
import { drawStarsSummary } from './render-hud';
import { drawGlowCircle } from './render-entities';
import { calcStars } from './update';

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

export function drawMilestones(ctx: CanvasRenderingContext2D, state: GameState) {
  let y = 76;
  for (const m of state.milestones) {
    const p = 1 - m.life / m.maxLife;
    const slideIn = p < 0.15 ? (p / 0.15) : 1;
    const fadeOut = m.life < 0.5 ? (m.life / 0.5) : 1;
    const alpha = slideIn * fadeOut;
    const x = LOGICAL_WIDTH - 180 + (1 - slideIn) * 200;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    const bw = 320;
    const bh = 64;

    ctx.fillStyle = 'rgba(10,12,28,0.40)';
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

export function drawLevelIntro(ctx: CanvasRenderingContext2D, state: GameState, theme: LevelTheme, time: number) {
  if (state.levelIntro <= 0) return;
  const total = 2.6;
  const t = state.levelIntro;
  const fadeIn = Math.min(1, (total - t) / 0.3);
  const fadeOut = t < 0.5 ? (t / 0.5) : 1;
  const alpha = Math.min(fadeIn, fadeOut);

  const cx = LOGICAL_WIDTH / 2;
  const cy = 95;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(5,8,20,0.5)';
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

export function drawFloaters(ctx: CanvasRenderingContext2D, state: GameState) {
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

export function drawOnboarding(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const step = state.onboardingStep < ONBOARDING_STEPS.length ? ONBOARDING_STEPS[state.onboardingStep] : null;
  if (!step) return;

  const isTouch = window.matchMedia('(any-pointer: coarse)').matches;

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

  // Texte adapté au tactile
  const stepText = isTouch ? stepTextTouch(step) : step.text;
  wrapText(ctx, stepText, cx, cy - 10, 560, 24);

  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = `rgba(200,220,255,${0.5 + 0.5 * Math.sin(time * 3)})`;
  const contHint = isTouch ? 'TAPER POUR CONTINUER' : 'ESPACE OU CLIC POUR CONTINUER';
  ctx.fillText(contHint, cx, cy + 50);

  if (step.highlight === 'player') {
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(state.player.x - 40, state.player.y - 25, 80, 50);
    ctx.setLineDash([]);
  }
}

function stepTextTouch(step: OnboardingStep): string {
  switch (step.id) {
    case 2: return 'Glisse sur la moitié droite de l\'écran pour bouger le vaisseau.';
    case 3: return 'Tape sur la moitié gauche de l\'écran pour lancer un grappin. Maintiens pour auto-feu.';
    case 6: return 'Évite les orbes. Tu as 3 vies. Tu peux mettre en pause avec ⏸ en haut à gauche.';
    default: return step.text;
  }
}

export function drawPauseButtons(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const cx = LOGICAL_WIDTH / 2;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);

  for (let i = 0; i < PAUSE_BUTTONS.length; i++) {
    const btn = PAUSE_BUTTONS[i];
    if (state.confirmDialog) continue;
    const bx = cx - 130;
    const bw = 260;
    const selected = state.pauseCursor === i;

    ctx.save();
    ctx.globalAlpha = selected ? 0.9 : 0.85;
    ctx.fillStyle = selected ? 'rgba(30,60,120,0.7)' : 'rgba(15,25,55,0.6)';
    ctx.strokeStyle = selected ? '#4488ff' : 'rgba(60,100,200,0.5)';
    ctx.lineWidth = selected ? 2 : 1.5;
    if (selected) {
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 8 * pulse;
    }
    roundRect(ctx, bx, btn.y, bw, btn.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Courier New", monospace';
    if (btn.action === 'resume') {
      ctx.fillStyle = '#39ff14';
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 10;
    } else if (btn.action === 'quit') {
      ctx.fillStyle = '#ff6b6b';
      ctx.shadowColor = '#ff6b6b';
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = '#c0d8ff';
    }
    ctx.fillText(btn.label, cx, btn.y + 28);
    ctx.shadowBlur = 0;
  }
}

export function drawConfirmDialog(ctx: CanvasRenderingContext2D, state: GameState, time: number, options?: GameOptions) {
  if (!state.confirmDialog) return;
  const cx = LOGICAL_WIDTH / 2;
  const cy = LOGICAL_HEIGHT / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  const bw = 340;
  const bh = 180;
  const bx = cx - bw / 2;
  const by = cy - bh / 2;

  ctx.fillStyle = 'rgba(10,15,35,0.92)';
  ctx.strokeStyle = 'rgba(100,160,255,0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillStyle = '#c0d8ff';
  ctx.fillText(state.confirmDialog.message, cx, cy - 30);

  const btnAlpha = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.font = 'bold 16px "Courier New", monospace';

  // Oui
  ctx.fillStyle = '#39ff14';
  ctx.shadowColor = '#39ff14';
  ctx.shadowBlur = 12 * btnAlpha;
  ctx.fillText('[ OUI ]', cx - 80, cy + 30);
  ctx.shadowBlur = 0;

  // Non
  ctx.fillStyle = '#ff6b6b';
  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 12 * btnAlpha;
  ctx.fillText('[ NON ]', cx + 80, cy + 30);
  ctx.shadowBlur = 0;

  if (window.matchMedia('(any-pointer: coarse)').matches) {
    const mode = options?.controlMode ?? 'overlay';
    const hint = mode === 'tilt' ? 'Toucher = OUI (gauche) / NON (droite)' :
                 mode === 'classic' ? '◀ NON  🔥 OUI  ▶ NON' :
                 'Toucher gauche = OUI, droite = NON';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = `rgba(200,220,255,${0.3 + 0.3 * Math.sin(time * 3)})`;
    ctx.fillText(hint, cx, cy + 65);
  }
}

export function drawPauseOverlay(ctx: CanvasRenderingContext2D, state: GameState, time: number, options?: GameOptions) {
  if (state.phase !== 'paused') return;

  if (state.confirmDialog) {
    drawConfirmDialog(ctx, state, time, options);
    return;
  }

  ctx.fillStyle = 'rgba(3,4,15,0.82)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  const cx = LOGICAL_WIDTH / 2;
  const cy = LOGICAL_HEIGHT / 2;
  const pulse = 0.92 + 0.08 * Math.sin(time * 3);

  ctx.save();
  ctx.translate(cx, cy - 100);
  ctx.scale(pulse, pulse);
  ctx.textAlign = 'center';
  ctx.font = 'bold 68px "Courier New", monospace';
  ctx.fillStyle = '#4488ff';
  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 40;
  ctx.fillText('PAUSE', 0, -10);
  ctx.restore();

  drawPauseButtons(ctx, state, time);

  const isTouch = window.matchMedia('(any-pointer: coarse)').matches;
  if (!isTouch) {
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.6)';
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ NAVIGUER  •  SPACE/ENTRÉE SÉLECTIONNER  •  P REPRENDRE  •  Q QUITTER', cx, LOGICAL_HEIGHT - 30);
  }
}

export function drawLevelSelect(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  if (state.phase !== 'levelselect') return;
  ctx.fillStyle = 'rgba(3,4,15,0.90)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  const cx = LOGICAL_WIDTH / 2;
  ctx.textAlign = 'center';
  ctx.font = 'bold 42px "Courier New", monospace';
  ctx.fillStyle = '#c0d8ff';
  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 24;
  ctx.fillText('SÉLECTION DU NIVEAU', cx, 70);
  ctx.shadowBlur = 0;

  const cols = 5;
  const rows = 4;
  const PER_PAGE = cols * rows;
  const page = Math.floor((state.level - 1) / PER_PAGE);
  const maxUnlocked = state.maxLevelReached;
  const pageStart = page * PER_PAGE;
  const pageEnd = Math.min(maxUnlocked, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(maxUnlocked / PER_PAGE);

  const cellW = 120;
  const cellH = 100;
  const gap = 16;
  const gridW = cols * (cellW + gap) - gap;
  const startX = (LOGICAL_WIDTH - gridW) / 2;
  const startY = 140;

  for (let i = pageStart; i < pageEnd; i++) {
    const lvl = i + 1;
    const col = (i - pageStart) % cols;
    const row = Math.floor((i - pageStart) / cols);
    const x = startX + col * (cellW + gap);
    const y = startY + row * (cellH + gap);
    const selected = lvl === state.level;

    const starData = state.levelStars.find(ls => ls.level === lvl);
    const stars = starData?.stars ?? 0;

    ctx.fillStyle = selected ? 'rgba(40,70,140,0.7)' : (stars > 0 ? 'rgba(30,50,100,0.6)' : 'rgba(20,25,50,0.5)');
    ctx.strokeStyle = selected ? 'rgba(100,200,255,0.8)' : (stars > 0 ? 'rgba(80,160,255,0.5)' : 'rgba(60,60,80,0.3)');
    ctx.lineWidth = selected ? 3 : 1.5;
    roundRect(ctx, x, y, cellW, cellH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = selected ? '#ffffff' : (stars > 0 ? '#c0d8ff' : '#555');
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText(`${lvl}`, x + cellW / 2, y + 38);

    if (stars > 0) {
      const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#ffdd00';
      ctx.fillText(starStr, x + cellW / 2, y + 70);
    }
  }

  if (totalPages > 1) {
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = 'rgba(140,160,210,0.6)';
    ctx.fillText(`Page ${page + 1}/${totalPages}`, cx, startY + rows * (cellH + gap) + 20);
  }

  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = `rgba(200,220,255,${0.5 + 0.5 * Math.sin(time * 3)})`;
  ctx.shadowBlur = 0;
  ctx.fillText('← → CHOISIR   •   ESPACE JOUER   •   ENTRÉE RETOUR', cx, LOGICAL_HEIGHT - 40);
}

export function drawOverlay(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  const { phase, score, level, bestScore } = state;
  const cx = LOGICAL_WIDTH / 2;
  const cy = LOGICAL_HEIGHT / 2;

  if (phase === 'title') {
    ctx.fillStyle = 'rgba(3,4,15,0.78)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const pulse = 0.9 + 0.1 * Math.sin(time * 2.5);
    ctx.save();
    ctx.translate(cx, cy - 155);
    ctx.scale(pulse, pulse);
    ctx.textAlign = 'center';
    ctx.font = 'bold 60px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#4499ff';
    ctx.shadowBlur = 55;
    ctx.fillText('PANG', 0, 0);
    ctx.font = 'bold 30px "Courier New", monospace';
    ctx.fillStyle = '#88aaff';
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 26;
    ctx.fillText('GENESIS', 0, 40);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;

    // Meilleur score et étoiles
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#aaccff';
    ctx.fillText(`MEILLEUR SCORE  ${bestScore.toString().padStart(7,'0')}`, cx, cy - 55);

    const totalStars = state.levelStars.reduce((sum, ls) => sum + ls.stars, 0);
    const maxStars = Math.max(state.levelStars.length * 5, 1);
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.7)';
    ctx.fillText(`ÉTOILES : ${totalStars} / ${maxStars}`, cx, cy - 36);

    if (state.maxLevelReached > 1) {
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = '#ffdd00';
      ctx.fillText(`PROGRESSION : NIVEAU ${state.maxLevelReached - 1} DÉBLOQUÉ`, cx, cy - 18);
    }

    // Boutons
    const btnAlpha = 0.5 + 0.5 * Math.sin(time * 3);
    const btnW = 260, btnH = 28;
    const bx = cx - btnW / 2;
    const btns: { label: string; y: number; color: string; glow: string; visible: boolean }[] = [];
    btns.push({ label: 'ESPACE = DÉMARRER',     y: 295, color: '#39ff14', glow: '#39ff14', visible: true });
    if (state.maxLevelReached > 1) {
      btns.push({ label: 'ENTRÉE = CONTINUER',  y: 330, color: '#ffdd00', glow: '#ffaa00', visible: true });
    }
    btns.push({ label: 'O = OPTIONS',           y: 365, color: '#4488ff', glow: '#4488ff', visible: true });
    if (state.maxLevelReached > 1) {
      btns.push({ label: 'R = RÉINITIALISER',   y: 400, color: '#ff6b6b', glow: '#ff4400', visible: true });
    }

    for (const btn of btns) {
      if (!btn.visible) continue;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(15,25,55,0.6)';
      ctx.strokeStyle = btn.glow;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = btn.glow;
      ctx.shadowBlur = 6 * btnAlpha;
      roundRect(ctx, bx, btn.y, btnW, btnH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();

      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.fillStyle = btn.color;
      ctx.fillText(btn.label, cx, btn.y + 20);
    }

    // Credits compact
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = 'rgba(120,140,200,0.55)';
    ctx.fillText('Hylst - Geoffroy  •  inspiré du classique Pang (Atari ST)', cx, cy + 172);

    const demoColors = ['#ff3a6e', '#00e5ff', '#ffdd00', '#a259ff'];
    for (let i = 0; i < 4; i++) {
      const angle = time * 0.5 + (i * Math.PI * 2) / 4;
      const dx = Math.cos(angle) * 140;
      const dy = Math.sin(angle * 0.7) * 46;
      drawGlowCircle(ctx, cx + dx, cy - 250 + dy, 16 + i * 3, demoColors[i], 0.2, time + i, time, 1);
    }
    return;
  }

  if (phase === 'levelup') {
    ctx.fillStyle = 'rgba(3,4,15,0.55)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const stars = calcStars(state);
    drawStarsSummary(ctx, cx, cy - 75, stars);

    ctx.textAlign = 'center';
    ctx.font = 'bold 50px "Courier New", monospace';
    ctx.fillStyle = '#39ff14';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 36;
    ctx.fillText('NIVEAU TERMINÉ !', cx, cy - 24);
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillStyle = '#ffdd00';
    ctx.shadowColor = '#ffaa00';
    ctx.fillText(`SUIVANT : ${getTheme(level + 1).name.toUpperCase()}`, cx, cy + 16);
    // infos de performance
    const accPct = state.hooksFired > 0 ? Math.round(state.hooksHit / state.hooksFired * 100) : 0;
    const seconds = Math.floor(state.levelElapsed);
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.7)';
    ctx.shadowBlur = 0;
    ctx.fillText(`${accPct}% précision  •  ${seconds}s  •  combo max ×${state.levelMaxCombo}`, cx, cy + 46);
    const lvlBest = state.levelBestScores.find(ls => ls.level === level);
    if (lvlBest) {
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = '#88aaff';
      ctx.fillText(`RECORD NIVEAU : ${lvlBest.score.toString().padStart(7, '0')}`, cx, cy + 68);
    }
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

    const stars = calcStars(state);
    drawStarsSummary(ctx, cx, cy - 105, stars);
    const accPct = state.hooksFired > 0 ? Math.round(state.hooksHit / state.hooksFired * 100) : 0;
    const seconds = Math.floor(state.levelElapsed);
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.6)';
    ctx.shadowBlur = 0;
    ctx.fillText(`${accPct}% précision  •  ${seconds}s  •  combo max ×${state.levelMaxCombo}`, cx, cy - 82);

    ctx.textAlign = 'center';
    ctx.font = 'bold 68px "Courier New", monospace';
    ctx.fillStyle = '#ff3a6e';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 36;
    ctx.fillText('PERDU', cx, cy - 48);
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

export function drawInfoOverlay(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  if (state.phase !== 'info') return;
  ctx.fillStyle = 'rgba(3,4,15,0.92)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  ctx.textAlign = 'center';

  const cx = LOGICAL_WIDTH / 2;
  ctx.font = 'bold 30px "Courier New", monospace';
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 18;
  ctx.fillText('INFORMATIONS', cx, 40);
  ctx.shadowBlur = 0;

  // ─── Contrôles (gauche) ───
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillStyle = '#ffdd00';
  ctx.fillText('CONTRÔLES', 40, 78);

  const ctrls = [
    ['← →', 'Déplacement du vaisseau'],
    ['ESPACE', 'Tirer le grappin (maintenir = charger)'],
    ['P', 'Pause / Reprendre'],
    ['I', 'Écran d\'informations'],
    ['O', 'Options de contrôle'],
    ['M', 'Activer / couper le son (Muet)'],
    ['R', 'Réinitialiser la progression (écran titre)'],
    ['ENTRÉE', 'Menu niveaux / Continuer / Retour titre'],
    ['Q (pause)', 'Quitter la partie en cours'],
    ['↑↓ Spc (pause)', 'Naviguer et sélectionner dans le menu pause'],
  ];
  ctx.font = '14px "Courier New", monospace';
  let cyy = 102;
  for (const [key, desc] of ctrls) {
    ctx.fillStyle = '#a259ff';
    ctx.fillText(key, 40, cyy);
    ctx.fillStyle = 'rgba(200,220,255,0.85)';
    ctx.fillText(desc, 220, cyy);
    cyy += 24;
  }

  // Tactile
  ctx.textAlign = 'left';
  cyy += 4;
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillStyle = '#39ff14';
  ctx.fillText('TACTILE (mobile)', 40, cyy);
  cyy += 20;
  const touchCtrls = [
    ['Zone droite', 'Déplacement (glisser = suit le doigt)'],
    ['Zone gauche', 'Tir (tap maintenu = auto-feu)'],
    ['⏸ (haut-gauche)', 'Pause'],
    ['ℹ (haut-droite)', 'Informations'],
  ];
  ctx.font = '13px "Courier New", monospace';
  for (const [key, desc] of touchCtrls) {
    ctx.fillStyle = '#ff8800';
    ctx.fillText(key, 40, cyy);
    ctx.fillStyle = 'rgba(200,220,255,0.8)';
    ctx.fillText(desc, 220, cyy);
    cyy += 20;
  }

  // ─── Power-ups (droite) ───
  ctx.textAlign = 'right';
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillStyle = '#ffdd00';
  ctx.fillText('POWER-UPS', LOGICAL_WIDTH - 40, 78);

  const pows: { sym: string; name: string; desc: string; color: string }[] = [
    { sym: '⇈', name: 'MULTI-TIR',     desc: '3 grappins par tir (8s)', color: '#ffdd00' },
    { sym: '◷', name: 'RALENTI',        desc: 'Ralentit les balles (6s)', color: '#00e5ff' },
    { sym: '◈', name: 'BOUCLIER',       desc: 'Protège des balles (10s)', color: '#39ff14' },
    { sym: '♥', name: 'VIE SUPPL.',     desc: '+1 vie (max 5)',          color: '#ff3a6e' },
    { sym: '★', name: 'SCORE ×2',       desc: 'Points doublés (10s)',    color: '#a259ff' },
    { sym: '🧲', name: 'AIMANT',        desc: 'Attire les bonus (8s)',   color: '#ff88cc' },
    { sym: '💥', name: 'BOMBE',         desc: 'Détruit toutes les balles', color: '#ff4400' },
  ];
  cyy = 102;
  for (const p of pows) {
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = p.color;
    ctx.textAlign = 'right';
    ctx.fillText(p.sym, LOGICAL_WIDTH - 100, cyy + 16);
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText(p.name, LOGICAL_WIDTH - 40, cyy + 4);
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.6)';
    ctx.fillText(p.desc, LOGICAL_WIDTH - 40, cyy + 28);
    cyy += 38;
  }

  // ─── Astuces (bas) ───
  ctx.textAlign = 'center';
  cyy = 460;
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillStyle = '#39ff14';
  ctx.fillText('SYSTÈME DE SCORE', cx, cyy);

  const tips = [
    'COMBO : ×multiplicateur en enchaînant les éclatements',
    'HAUTEUR : balles près du plafond → jusqu\'à 1,5×',
    'VÉLOCITÉ : balles rapides → jusqu\'à 1,3×',
    'PRÉCISION : bonus fin de niveau basé sur % de tirs',
    'TEMPS : terminer vite → bonus vitesse',
    'ÉTOILES 1-5★ : dégâts + précision + vitesse + combo',
  ];
  cyy += 22;
  ctx.font = '12px "Courier New", monospace';
  ctx.fillStyle = 'rgba(200,220,255,0.75)';
  for (const tip of tips) {
    ctx.fillText(tip, cx, cyy);
    cyy += 16;
  }

  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = `rgba(200,220,255,${0.5 + 0.5 * Math.sin(time * 3)})`;
  ctx.shadowBlur = 0;
  ctx.fillText('I POUR FERMER', cx, LOGICAL_HEIGHT - 24);
}

export function drawOptionsOverlay(ctx: CanvasRenderingContext2D, state: GameState, time: number, options?: GameOptions) {
  if (state.phase !== 'options') return;
  ctx.fillStyle = 'rgba(3,4,15,0.92)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  ctx.textAlign = 'center';

  const cx = LOGICAL_WIDTH / 2;
  ctx.font = 'bold 30px "Courier New", monospace';
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 18;
  ctx.fillText('OPTIONS', cx, 48);
  ctx.shadowBlur = 0;

  const opts = options;
  if (!opts) {
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.6)';
    ctx.fillText('Chargement…', cx, 120);
    return;
  }

  ctx.textAlign = 'left';
  let yy = 90;
  const rw = 360, rh = 28, rx = cx - rw / 2;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);

  const modeLabels: Record<string, string> = { overlay: 'ZONES', classic: 'BOUTONS', tilt: 'INCLINAISON' };
  const optionRows = [
    { label: 'INVERSER ZONES',      value: opts.invertZones ? 'OUI' : 'NON' },
    { label: 'TAILLE ZONE DEPLAC.',  value: `${Math.round(opts.zoneSplitRatio * 100)}%` },
    { label: 'ZONE MORTE',          value: `${opts.deadZonePx}px` },
    { label: 'CONTRÔLE',            value: modeLabels[opts.controlMode] ?? opts.controlMode },
    { label: 'SENSIBILITÉ',         value: `${opts.touchSensitivity.toFixed(1)}×` },
    { label: 'SANS CHROME',         value: opts.chromeLess ? 'OUI' : 'NON' },
  ];

  for (let i = 0; i < optionRows.length; i++) {
    const row = optionRows[i];
    const y = yy + i * 30;
    const selected = state.optionsCursor === i;

    if (selected) {
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.1 * pulse;
      ctx.fillStyle = '#4488ff';
      roundRect(ctx, rx, y - rh / 2, rw, rh, 6);
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 8;
      roundRect(ctx, rx, y - rh / 2, rw, rh, 6);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#aaccff';
    }

    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillText(row.label, 60, y + 5);

    ctx.textAlign = 'right';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = selected ? '#ffdd00' : '#8899bb';
    ctx.fillText(row.value, LOGICAL_WIDTH - 60, y + 5);
    ctx.textAlign = 'left';
  }

  yy += optionRows.length * 30 + 20;
  ctx.textAlign = 'center';
  ctx.font = '13px "Courier New", monospace';
  ctx.fillStyle = 'rgba(200,220,255,0.45)';
  const isTouch = window.matchMedia('(any-pointer: coarse)').matches;
  const hint = isTouch
    ? 'TAPER SUR UNE LIGNE POUR TOGGLER  •  O/ENTRÉE FERMER'
    : '↑↓ CURSEUR  •  ←→ TOGGLER  •  ENTRÉE/O FERMER';
  ctx.fillText(hint, cx, yy);
}
