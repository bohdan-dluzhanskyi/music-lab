import { TAU } from '@/core/mathematics/constants';

export function generateLissajous(
  ratioX: number,
  ratioY: number,
  phase = Math.PI / 2,
  samples = 1200,
  cycles = 1,
) {
  if (!Number.isFinite(ratioX) || !Number.isFinite(ratioY) || ratioX <= 0 || ratioY <= 0) {
    throw new RangeError('Invalid frequency ratio');
  }

  if (!Number.isInteger(samples) || samples < 2 || samples > 10000) {
    throw new RangeError('Invalid sample count');
  }

  if (!Number.isFinite(phase) || !Number.isFinite(cycles) || cycles <= 0) {
    throw new RangeError('Invalid phase or cycles');
  }

  return Array.from({ length: samples }, (_, index) => {
    const t = (index / (samples - 1)) * TAU * cycles;

    return {
      x: Math.sin(ratioX * t + phase),
      y: Math.sin(ratioY * t),
    };
  });
}
