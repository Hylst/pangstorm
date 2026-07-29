// difficulté très progressive — on laisse le joueur s'installer
export interface DifficultyProfile {
  level: number;
  ballCount: number;
  speedMultiplier: number;
  gravityMultiplier: number;
  homingChance: number;
  extraHSpeed: number;
  smallestCanSplit: boolean;
  powerUpChance: number;
  ballHealth: number;
  spawnDelay: number;
  maxLives: number;
}

export function getDifficulty(level: number): DifficultyProfile {
  const l = level;
  const base: DifficultyProfile = {
    level: l,
    ballCount:      1 + Math.floor((l - 1) / 4),          // +1 tous les 4 niveaux
    speedMultiplier: 1 + (l - 1) * 0.05,                  // +5%/niveau
    gravityMultiplier: 1 + (l - 1) * 0.02,                // +2%/niveau
    homingChance:    0,
    extraHSpeed:     0,
    smallestCanSplit: false,
    powerUpChance:   0.08 + Math.min(0.12, (l - 1) * 0.01), // 8%→20%, +1%/niveau
    ballHealth:      1,
    spawnDelay:      0,
    maxLives:        3,
  };

  // extraHSpeed : +8 tous les 3 niveaux à partir du niveau 4
  if (l >= 4) base.extraHSpeed = 8 + Math.floor((l - 4) / 3) * 8;

  // homing : apparaît niveau 5, monte doucement
  if (l >= 5) base.homingChance = Math.min(0.25, (l - 4) * 0.03);

  // tiny split : niveau 7
  if (l >= 7) base.smallestCanSplit = true;

  // ballHealth = 2 : niveau 10
  if (l >= 10) base.ballHealth = 2;

  // spawn échelonné : niveau 15
  if (l >= 15) base.spawnDelay = 0.5;

  // 4 vies de départ à partir du niveau 20
  if (l >= 20) base.maxLives = 4;

  return base;
}
