import { PHI, GOLDEN_ANGLE, TAU } from '@/core/mathematics/constants';

import { fibonacci } from '@/core/mathematics/fibonacci';

import { spiralIntersectionRatio } from '@/core/geometry/spiral';

export type GeneratorType =
  | 'fibonacci'
  | 'golden-ratio'
  | 'golden-angle'
  | 'spiral-intersections'
  | 'sine'
  | 'harmonics'
  | 'logistic';

export interface GeneratorOptions {
  type: GeneratorType;
  reference: number;
  count: number;
  foldOctaves?: boolean;
  period?: number;
  logisticRate?: number;
  logisticSeed?: number;
}

// Move a frequency into [reference, reference * 2).
export function foldFrequency(frequency: number, reference: number): number {
  if (
    !Number.isFinite(frequency) ||
    !Number.isFinite(reference) ||
    frequency <= 0 ||
    reference <= 0
  ) {
    throw new RangeError('Invalid frequency');
  }

  const octaves = Math.log2(frequency) - Math.log2(reference);

  const fraction = octaves - Math.floor(octaves);

  return reference * 2 ** fraction;
}

export function generateFrequencies({
  type,
  reference,
  count,
  foldOctaves = true,
  period = 8,
  logisticRate = 3.9,
  logisticSeed = 0.37,
}: GeneratorOptions): number[] {
  if (!Number.isFinite(reference) || reference <= 0) {
    throw new RangeError('Invalid reference frequency');
  }

  if (!Number.isInteger(count) || count < 1 || count > 64) {
    throw new RangeError('Count must be between 1 and 64');
  }

  if (!Number.isFinite(period) || period <= 0) {
    throw new RangeError('Invalid period');
  }

  if (
    !Number.isFinite(logisticRate) ||
    logisticRate <= 0 ||
    logisticRate > 4 ||
    !Number.isFinite(logisticSeed) ||
    logisticSeed <= 0 ||
    logisticSeed >= 1
  ) {
    throw new RangeError('Invalid logistic parameters');
  }

  const fib = fibonacci(count + 1).slice(1);
  const intersectionRatio = spiralIntersectionRatio();

  let logisticValue = logisticSeed;

  return Array.from({ length: count }, (_, index) => {
    let frequency: number;

    switch (type) {
      case 'fibonacci':
        frequency = reference * fib[index]!;
        break;

      case 'golden-ratio':
        frequency = reference * PHI ** index;
        break;

      case 'golden-angle':
        frequency = reference * 2 ** ((index * GOLDEN_ANGLE) / 360);
        break;

      case 'spiral-intersections':
        frequency = reference * intersectionRatio ** index;
        break;

      case 'sine': {
        const semitones = 6 + 6 * Math.sin((TAU * index) / period);

        frequency = reference * 2 ** (semitones / 12);
        break;
      }

      case 'harmonics':
        frequency = reference * (index + 1);
        break;

      case 'logistic':
        frequency = reference * 2 ** logisticValue;

        logisticValue = logisticRate * logisticValue * (1 - logisticValue);

        break;

      default:
        throw new RangeError('Unknown generator');
    }

    if (!Number.isFinite(frequency) || frequency <= 0) {
      throw new RangeError('Generated frequency is invalid');
    }

    return foldOctaves ? foldFrequency(frequency, reference) : frequency;
  });
}
