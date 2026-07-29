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
  platformCount: number;  // nb de plateformes cassables
  platformHp: number;     // résistance max des plateformes
}

export function getDifficulty(level: number): DifficultyProfile {
  const l = level;
  const base: DifficultyProfile = {
    level: l,
    ballCount:          1 + Math.floor((l - 1) / 4),
    speedMultiplier:    1 + (l - 1) * 0.05,
    gravityMultiplier:  1 + (l - 1) * 0.02,
    homingChance:       0,
    extraHSpeed:        0,
    smallestCanSplit:   false,
    powerUpChance:      0.08 + Math.min(0.12, (l - 1) * 0.01),
    ballHealth:         1,
    spawnDelay:         0,
    maxLives:           3,
    platformCount:      0,
    platformHp:         1,
  };

  if (l >= 4) base.extraHSpeed = 8 + Math.floor((l - 4) / 3) * 8;
  if (l >= 5) base.homingChance = Math.min(0.25, (l - 4) * 0.03);
  if (l >= 7) base.smallestCanSplit = true;
  if (l >= 10) base.ballHealth = 2;
  if (l >= 15) base.spawnDelay = 0.5;
  if (l >= 20) base.maxLives = 4;

  // plateformes : apparaissent niveau 3, 1 plateforme, hp=1
  // puis augmentent progressivement
  if (l >= 3) {
    base.platformCount = Math.min(1 + Math.floor((l - 3) / 4), 4);
    base.platformHp = l >= 12 ? 3 : l >= 7 ? 2 : 1;
  }

  return base;
}
