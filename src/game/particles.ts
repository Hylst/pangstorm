import { FlashParticle } from './types';
import { uid } from './initialState';

// particules à l'arrache — assez pour faire joli
export function spawnParticles(
  particles: FlashParticle[],
  x: number,
  y: number,
  color: string,
  n: number,
  speed = 180,
  spread = Math.PI * 2,
) {
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 - spread / 2 + Math.random() * spread;
    const s = (0.4 + Math.random() * 0.8) * speed;
    particles.push({
      id: uid(),
      x, y,
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s,
      r: 3 + Math.random() * 5,
      color,
      life: 0.7 + Math.random() * 0.6,
      maxLife: 0.7 + Math.random() * 0.6,
    });
  }
}

// anneau qui explose — *chef's kiss*
export function spawnRing(
  particles: FlashParticle[],
  x: number,
  y: number,
  color: string,
  n = 16,
  speed = 120,
) {
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    particles.push({
      id: uid(),
      x, y,
      vx: Math.cos(angle) * speed * (0.7 + Math.random() * 0.4),
      vy: Math.sin(angle) * speed * (0.7 + Math.random() * 0.4),
      r: 2 + Math.random() * 3,
      color,
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.5 + Math.random() * 0.3,
    });
  }
}
