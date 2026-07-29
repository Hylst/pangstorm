// difficulté progressive : chaque palier est plus doux que l'ancien
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
  maxLives: number; // vies de départ
}

export function getDifficulty(level: number): DifficultyProfile {
  const l = level;
  const base: DifficultyProfile = {
    level: l,
    ballCount:      1 + Math.floor((l - 1) / 3),      // +1 tous les 3 niveaux (était /2)
    speedMultiplier: 1 + (l - 1) * 0.07,              // +7% par niveau (était 10%)
    gravityMultiplier: 1 + (l - 1) * 0.03,            // +3% (était 4%)
    homingChance:    0,
    extraHSpeed:     0,
    smallestCanSplit: false,
    powerUpChance:   0.10 + Math.min(0.12, (l - 1) * 0.015), // 10%→22% progressif (était 15%→20% brutal)
    ballHealth:      1,
    spawnDelay:      0,
    maxLives:        3,
  };

  // vitesse horizontale extra : +10 tous les 2 niveaux à partir du 3e
  if (l >= 3) base.extraHSpeed = 10 + Math.floor((l - 3) / 2) * 10;

  // homing : apparaît niveau 4, monte très progressivement
  if (l >= 4) base.homingChance = Math.min(0.30, (l - 3) * 0.04);

  // tiny split : niveau 6 au lieu de 5 (laisse le temps)
  if (l >= 6) base.smallestCanSplit = true;

  // ballHealth = 2 : niveau 8 au lieu de 7
  if (l >= 8) base.ballHealth = 2;

  // spawn échelonné : niveau 12 au lieu de 10
  if (l >= 12) base.spawnDelay = 0.5;

  // vies de départ : 4 à partir du niveau 15 (rattrapage)
  if (l >= 15) base.maxLives = 4;

  return base;
}
