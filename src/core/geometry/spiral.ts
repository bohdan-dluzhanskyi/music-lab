import { PHI, TAU } from '../mathematics/constants';

import type { Point2D } from '../types/music.types';

export function musicalSpiralRadius(theta: number, initialRadius = 1): number {
  return initialRadius * 2 ** (theta / TAU);
}

export function goldenSpiralRadius(theta: number, initialRadius = 1): number {
  return initialRadius * PHI ** ((2 * theta) / Math.PI);
}

export function polarToCartesian(radius: number, theta: number): Point2D {
  return {
    x: radius * Math.sin(theta),
    y: -radius * Math.cos(theta),
  };
}

export function musicalSpiralPoint(theta: number, initialRadius = 1): Point2D {
  return polarToCartesian(musicalSpiralRadius(theta, initialRadius), theta);
}

export function goldenSpiralPoint(theta: number, initialRadius = 1): Point2D {
  return polarToCartesian(goldenSpiralRadius(theta, initialRadius), theta);
}

export function spiralIntersectionRatio(): number {
  const a = Math.log(2);
  const b = 4 * Math.log(PHI);

  return Math.exp((a * b) / (b - a));
}

export function spiralIntersectionFrequency(index: number, reference = 440): number {
  return reference * spiralIntersectionRatio() ** index;
}
