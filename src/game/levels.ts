// ─── Progressive difficulty system ────────────────────────────────────────────

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
}

export function getDifficulty(level: number): DifficultyProfile {
  const base: DifficultyProfile = {
    level,
    ballCount: Math.min(1 + Math.floor((level - 1) / 2), 7),
    speedMultiplier: 1 + (level - 1) * 0.10,
    gravityMultiplier: 1 + (level - 1) * 0.04,
    homingChance: 0,
    extraHSpeed: 0,
    smallestCanSplit: false,
    powerUpChance: 0.15,
    ballHealth: 1,
    spawnDelay: 0,
  };

  if (level >= 2) {
    base.extraHSpeed = 15 + (level - 2) * 12;
  }
  if (level >= 3) {
    base.homingChance = Math.min(0.20, (level - 2) * 0.06);
    base.ballCount = Math.min(base.ballCount + 1, 7);
  }
  if (level >= 4) {
    base.homingChance = Math.min(0.35, 0.20 + (level - 3) * 0.08);
    base.speedMultiplier += 0.10;
  }
  if (level >= 5) {
    base.smallestCanSplit = true;
    base.powerUpChance = 0.20;
  }
  if (level >= 7) {
    base.ballHealth = 2;
    base.speedMultiplier += 0.15;
  }
  if (level >= 10) {
    base.spawnDelay = 0.5;
  }

  return base;
}
