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
  platformCount: number;
  platformHp: number;
  maxShots: number;      // 0 = illimité
}

export function getDifficulty(level: number): DifficultyProfile {
  const l = level;
  const base: DifficultyProfile = {
    level: l,
    ballCount:          1 + Math.min(Math.floor((l - 1) / 15), 7),
    speedMultiplier:    1 + (l - 1) * 0.008,
    gravityMultiplier:  1 + (l - 1) * 0.005,
    homingChance:       0,
    extraHSpeed:        0,
    smallestCanSplit:   false,
    powerUpChance:      0.08 + Math.min(0.12, (l - 1) * 0.008),
    ballHealth:         1,
    spawnDelay:         0,
    maxLives:           3,
    platformCount:      0,
    platformHp:         1,
    maxShots:           0,
  };

  if (l >= 12) base.homingChance = Math.min(0.3, (l - 11) * 0.0034);
  if (l >= 18) base.extraHSpeed = 5 + Math.floor((l - 17) / 12) * 5;
  if (l >= 28) base.smallestCanSplit = true;
  if (l >= 25) base.ballHealth = 2;
  if (l >= 55) base.ballHealth = 3;
  if (l >= 85) base.ballHealth = 4;
  if (l >= 20) base.spawnDelay = 0.5 * Math.pow(0.97, l - 20);
  if (l >= 55) base.maxLives = 4;
  if (l >= 80) base.maxLives = 5;
  if (l >= 8) {
    base.platformCount = Math.min(1 + Math.floor((l - 7) / 16), 6);
    base.platformHp = l >= 45 ? 3 : l >= 22 ? 2 : 1;
  }
  if (l >= 60) base.maxShots = 30 + Math.floor((l - 60) / 10) * 4;

  return base;
}
