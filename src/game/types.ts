import type { DifficultyProfile } from './levels';
import type { PowerUp, ActiveEffects } from './powerups';

export type { DifficultyProfile } from './levels';
export type { PowerUp, ActiveEffects } from './powerups';

export interface Vec2 { x: number; y: number }

export interface ConfirmDialog {
  visible: boolean;
  message: string;
  action: 'quit' | 'resetFull' | 'resetLevel' | null;
}

export interface Ball {
  id:     number;
  x:      number;
  y:      number;
  vx:     number;
  vy:     number;
  radius: number;
  tier:   number;   // 3 = largest, 1 = smallest, 0 = tiny
  color:  string;
  glowColor: string;
  flash:  number;
  rotation: number;
  rotSpeed: number;
  homing: boolean;
  trail: { x: number; y: number }[];
  remainingHits: number; // >1 = multi-hit
}

export interface Platform {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;      // coups restants
  maxHp: number;
  color: string;
  glowColor: string;
  flash: number;
  broken: boolean;
}

export interface Hook {
  id:     number;
  x:      number;
  tipY:   number;
  baseY:  number;
  active: boolean;
  spawnScale: number;
  width: number;
  color: string;
}

export interface Player {
  x:       number;
  y:       number;
  lives:   number;
  invincible: number;
  squash: number;
  charge: number;
}

export type GamePhase = 'title' | 'onboarding' | 'playing' | 'paused' | 'dead' | 'levelup' | 'gameover' | 'levelselect' | 'info' | 'options';

export interface OnboardingStep {
  id: number;
  title: string;
  text: string;
  highlight?: 'player' | 'hook' | 'ball' | 'lives' | 'score';
  action?: 'move' | 'shoot' | 'wait';
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, title: 'OBJECTIF', text: 'Fais éclater toutes les orbes rebondissantes pour terminer le niveau.', action: 'wait' },
  { id: 2, title: 'DÉPLACEMENT', text: 'Utilise ← → ou les boutons tactiles pour bouger ton vaisseau.', highlight: 'player', action: 'move' },
  { id: 3, title: 'TIR', text: 'Appuie sur ESPACE ou 🔥 pour lancer un grappin vertical.', highlight: 'hook', action: 'shoot' },
  { id: 4, title: 'DIVISION', text: 'Les grosses orbes se divisent en plus petites. Continue !', highlight: 'ball', action: 'shoot' },
  { id: 5, title: 'BONUS', text: 'Attrape les icônes qui tombent : multi-tir, ralenti, bouclier et plus !', action: 'wait' },
  { id: 6, title: 'SURVIE', text: 'Évite les orbes. Tu as 3 vies. Bonne chance !', highlight: 'lives', action: 'wait' },
];

export interface Milestone {
  id: number;
  title: string;
  subtitle: string;
  life: number;
  maxLife: number;
  color: string;
}

export interface LevelScore {
  level: number;
  score: number;
}

export interface GameState {
  phase:         GamePhase;
  score:         number;
  level:         number;
  difficulty:    DifficultyProfile;
  combo:         number;
  comboTimer:    number;
  comboDisplay:  number;
  player:        Player;
  balls:         Ball[];
  hooks:         Hook[];
  powerUps:      PowerUp[];
  effects:       ActiveEffects;
  nextId:        number;
  flashParticles: FlashParticle[];
  levelTimer:    number;
  titleTimer:    number;
  shake:         ScreenShake;
  floaters:      Floater[];
  ballSpawnPulse: number;
  streak:        number;
  onboardingStep: number;
  onboardingTimer: number;
  totalPopped:   number;
  bestScore:     number;
  maxLevelReached: number;
  levelIntro:    number;
  milestones:    Milestone[];
  levelHits:     number;
  scoreMilestone: number;
  ambient:       Ambient[];
  ballsPending:  Ball[];
  spawnTimer:    number;
  levelStars:    { level: number; stars: number; score: number }[];
  prevPhase:     GamePhase;
  platforms:     Platform[];
  levelBestScores: LevelScore[];
  hooksFired: number;
  hooksHit: number;
  levelElapsed: number;
  levelMaxCombo: number;
  confirmDialog: ConfirmDialog | null;
  optionsCursor: number;
  pauseCursor: number;
}

export interface Ambient {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: string;
  alpha: number;
}

export interface FlashParticle {
  id:    number;
  x:     number;
  y:     number;
  vx:    number;
  vy:    number;
  r:     number;
  color: string;
  life:  number;
  maxLife: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  elapsed: number;
}

export interface Floater {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export type ControlMode = 'overlay' | 'classic' | 'tilt';

export interface InputState {
  left:     boolean;
  right:    boolean;
  fire:     boolean;
  fireHeld: boolean;
  mute:     boolean;
  pause:    boolean;
  enter:    boolean;
  info:     boolean;
  options:  boolean;
  quit:     boolean;
  resetLevel: boolean;
  resetFull: boolean;
  reset:    boolean;
  touchFireHeld: boolean;
  tiltGamma: number;
  joystickActive: boolean;
  joystickCenter: { x: number; y: number } | null;
  joystickDeltaX: number;
}

export const OPTIONS_VERSION = 2;

export interface GameOptions {
  _v?: number;
  controlMode: ControlMode;
  invertZones: boolean;
  zoneSplitRatio: number;
  deadZonePx: number;
  touchSensitivity: number;
  chromeLess: boolean;
}

export const DEFAULT_OPTIONS: GameOptions = {
  _v: OPTIONS_VERSION,
  controlMode: 'overlay',
  invertZones: false,
  zoneSplitRatio: 0.5,
  deadZonePx: 10,
  touchSensitivity: 1.0,
  chromeLess: false,
};

export interface PauseButton {
  id: string;
  label: string;
  y: number;
  h: number;
  action: 'resume' | 'resetLevel' | 'resetFull' | 'quit' | 'options';
}

export const PAUSE_BUTTONS: PauseButton[] = [
  { id: 'resume',      label: '▶ REPRENDRE',           y: 230, h: 36, action: 'resume' },
  { id: 'resetLevel',  label: '↻ RECOMMENCER NIVEAU',  y: 276, h: 36, action: 'resetLevel' },
  { id: 'resetFull',   label: '↻ REC. COMPLET',        y: 322, h: 36, action: 'resetFull' },
  { id: 'options',     label: '⚙ OPTIONS',             y: 368, h: 36, action: 'options' },
  { id: 'quit',        label: '✕ QUITTER',             y: 414, h: 36, action: 'quit' },
];

// Géométrie des lignes de l'écran Options — partagée entre le rendu canvas
// (render-overlays.ts) et le hit-test tactile (App.tsx) pour rester synchronisée.
export const OPTIONS_ROWS_TOP = 90;
export const OPTIONS_ROW_SPACING = 30;
export const OPTIONS_ROW_COUNT = 6;
export const OPTIONS_ROW_W = 720;
export const OPTIONS_ROW_H = 28;
