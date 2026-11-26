import { degreesToRadians, normalizeDegrees } from '../mathematics/angles';

import type { Point2D } from '../types/music.types';

export function frequencyToAngle(frequency: number, reference = 440): number {
  if (
    !Number.isFinite(frequency) ||
    !Number.isFinite(reference) ||
    frequency <= 0 ||
    reference <= 0
  ) {
    throw new RangeError('Invalid frequency');
  }

  return 360 * Math.log2(frequency / reference);
}

export function angleToFrequency(angle: number, reference = 440): number {
  return reference * 2 ** (angle / 360);
}

export function frequencyToClockAngle(frequency: number, reference = 440): number {
  return normalizeDegrees(frequencyToAngle(frequency, reference));
}

export function midiToClockAngle(midi: number, referenceMidi = 69): number {
  return normalizeDegrees((midi - referenceMidi) * 30);
}

export function clockAngleToPoint(angle: number, radius = 1): Point2D {
  const radians = degreesToRadians(angle);

  return {
    x: radius * Math.sin(radians),
    y: -radius * Math.cos(radians),
  };
}
