export type EaseFn = (t: number) => number;

export const Ease = {
  linear:    (t: number) => t,
  inQuad:    (t: number) => t * t,
  outQuad:   (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  inCubic:   (t: number) => t * t * t,
  outCubic:  (t: number) => 1 - Math.pow(1 - t, 3),
  elastic:   (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

export interface Tween<T> {
  from: T;
  to: T;
  duration: number;
  elapsed: number;
  ease: EaseFn;
  onDone?: () => void;
  update: (progress: number) => void;
}

export class Animator {
  private tweens: Array<{ value: number; start: number; end: number; duration: number; elapsed: number; ease: EaseFn; onDone?: () => void }> = [];

  animate(
    start: number,
    end: number,
    duration: number,
    ease: EaseFn = Ease.outQuad,
    onDone?: () => void,
  ): { value: number } {
    const ref = { value: start };
    this.tweens.push({ value: ref.value, start, end, duration, elapsed: 0, ease, onDone });
    return ref;
  }

  update(dt: number) {
    for (const t of this.tweens) {
      t.elapsed += dt;
      const p = Math.min(t.elapsed / t.duration, 1);
      const e = t.ease(p);
      t.value = t.start + (t.end - t.start) * e;
      t.onDone?.();
    }
    this.tweens = this.tweens.filter(t => t.elapsed < t.duration);
  }
}

import type { ScreenShake } from './types';

export function applyShake(ctx: CanvasRenderingContext2D, shake: ScreenShake) {
  if (shake.duration <= 0) return;
  const progress = 1 - shake.elapsed / shake.duration;
  const mag = shake.intensity * progress;
  const dx = (Math.random() * 2 - 1) * mag;
  const dy = (Math.random() * 2 - 1) * mag;
  ctx.translate(dx, dy);
}
