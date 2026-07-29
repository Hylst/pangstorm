import { GameState, ONBOARDING_STEPS } from './types';
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

const PAUSE_TIPS: string[] = [
  'Tire vers le haut : le grappin traverse plusieurs balles',
  'Un combo ×5 donne 250 points bonus',
  'La bombe détruit toutes les balles d\'un coup',
  'Le bouclier te protège des balles 10 secondes',
  'Attrape l\'aimant pour que les bonus volent vers toi',
  'Précision ≥90% = +1★ sur ta note de niveau',
  'Termine en ≤3s par balle pour +1★',
  'Un combo ≥15 = +0.5★',
  'Les plateformes apparaissent au niveau 8',
  'Le score ×2 double tous tes gains 10 secondes',
  'Le bonus de hauteur peut aller jusqu\'à ×1,5',
  'Tirer chargé (espace maintenu) élargit le grappin',
  'Tirs limités à partir du niveau 60',
  '3★ minimum si tu ne prends aucun dégât',
];

export function drawPauseOverlay(ctx: CanvasRenderingContext2D, state: GameState, time: number) {
  if (state.phase !== 'paused') return;
  ctx.fillStyle = 'rgba(3,4,15,0.82)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  const cx = LOGICAL_WIDTH / 2;
  const cy = LOGICAL_HEIGHT / 2;
  const pulse = 0.92 + 0.08 * Math.sin(time * 3);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);
  ctx.textAlign = 'center';
  ctx.font = 'bold 68px "Courier New", monospace';
  ctx.fillStyle = '#4488ff';
  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 40;
  ctx.fillText('PAUSE', 0, -10);
  ctx.restore();

  // astuce aléatoire qui change toutes les 4s
  const tipIdx = Math.floor(time / 4) % PAUSE_TIPS.length;
  ctx.font = '14px "Courier New", monospace';
  ctx.fillStyle = 'rgba(200,220,255,0.8)';
  ctx.shadowBlur = 0;
  ctx.fillText('💡 ' + PAUSE_TIPS[tipIdx], cx, cy + 50);

  ctx.font = '18px "Courier New", monospace';
  ctx.fillStyle = `rgba(200,220,255,${0.5 + 0.5 * Math.sin(time * 3)})`;
  ctx.fillText('P POUR REPRENDRE', cx, cy + 90);
  ctx.fillText('Q POUR QUITTER', cx, cy + 118);
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

    const totalStars = state.levelStars.reduce((sum, ls) => sum + ls.stars, 0);
    const maxStars = Math.max(state.levelStars.length * 5, 1);
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.7)';
    ctx.fillText(`ÉTOILES : ${totalStars} / ${maxStars}`, cx, cy - 8);

    ctx.font = '20px "Courier New", monospace';
    ctx.fillStyle = `rgba(200,220,255,${0.5 + 0.5 * Math.sin(time * 3)})`;
    ctx.fillText('APPUYEZ SUR ESPACE POUR DÉMARRER', cx, cy + 10);

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = 'rgba(120,140,200,0.9)';
    ctx.fillText('← → DÉPLACER   •   ESPACE TIR / CHARGER   •   M SILENCE', cx, cy + 42);
    ctx.fillText('RÉCUPÈRE LES BONUS  •  FAIS ÉCLATER TOUTES LES ORBES', cx, cy + 64);

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = 'rgba(140,160,210,0.8)';
    ctx.fillText('un jeu par Hylst - Geoffroy', cx, cy + 100);
    ctx.fillStyle = 'rgba(110,130,180,0.7)';
    ctx.fillText('avec l\'aide d\'une IA', cx, cy + 116);
    ctx.fillStyle = 'rgba(100,120,170,0.6)';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('graphismes réalisés par IA', cx, cy + 132);
    ctx.fillStyle = 'rgba(90,110,170,0.5)';
    ctx.fillText('librement inspiré du classique Pang d\'Ocean (Atari ST)', cx, cy + 148);

    const demoColors = ['#ff3a6e', '#00e5ff', '#ffdd00', '#a259ff'];
    for (let i = 0; i < 4; i++) {
      const angle = time * 0.5 + (i * Math.PI * 2) / 4;
      const dx = Math.cos(angle) * 150;
      const dy = Math.sin(angle * 0.7) * 52;
      drawGlowCircle(ctx, cx + dx, cy - 215 + dy, 18 + i * 4, demoColors[i], 0.2, time + i, time, 1);
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
    ['M', 'Activer / couper le son'],
    ['ENTRÉE', 'Menu niveaux / Retour titre'],
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
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = p.color;
    ctx.textAlign = 'right';
    ctx.fillText(p.sym, LOGICAL_WIDTH - 80, cyy + 4);
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText(p.name, LOGICAL_WIDTH - 40, cyy);
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.7)';
    ctx.fillText(p.desc, LOGICAL_WIDTH - 40, cyy + 16);
    cyy += 30;
  }

  // ─── Astuces (bas) ───
  ctx.textAlign = 'center';
  cyy = 340;
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillStyle = '#39ff14';
  ctx.fillText('SYSTÈME DE SCORE', cx, cyy);

  const tips = [
    'COMBO : enchaînez les éclatements sans attendre (×multiplicateur)',
    'HAUTEUR : les balles près du plafond rapportent jusqu\'à 1,5×',
    'VÉLOCITÉ : les balles rapides rapportent jusqu\'à 1,3×',
    'PRÉCISION : bonus de fin de niveau basé sur % de tirs réussis',
    'TEMPS : terminez rapidement pour un bonus vitesse ×niveau',
    'ÉTOILES 1-5★ : dégâts + précision + vitesse + combo max',
    'PLATEFORMES : les plateformes peuvent droper bonus ou malus',
  ];
  cyy += 24;
  for (const tip of tips) {
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.8)';
    ctx.fillText(`• ${tip}`, cx, cyy);
    cyy += 20;
  }

  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = `rgba(200,220,255,${0.5 + 0.5 * Math.sin(time * 3)})`;
  ctx.shadowBlur = 0;
  ctx.fillText('I POUR FERMER', cx, LOGICAL_HEIGHT - 24);
}
