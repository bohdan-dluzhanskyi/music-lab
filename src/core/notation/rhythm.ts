import type { NotationDuration } from '@/core/types/notation.types';

import { NOTATION_DURATIONS } from './duration';

export interface RhythmValue {
  duration: NotationDuration;
  beats: number;
  dots: number;
}

const VALUES: RhythmValue[] = Object.entries(NOTATION_DURATIONS)
  .flatMap(([duration, beats]) =>
    [0, 1, 2].map((dots) => ({
      duration: duration as NotationDuration,
      beats: beats * (2 - 2 ** -dots),
      dots,
    })),
  )
  .sort((a, b) => b.beats - a.beats);

const EPSILON = 1e-8;

export function decomposeDuration(beats: number): RhythmValue[] {
  if (!Number.isFinite(beats) || beats <= 0) {
    throw new RangeError('Invalid duration');
  }

  const result: RhythmValue[] = [];
  let remaining = beats;

  while (remaining > EPSILON) {
    const value = VALUES.find((item) => item.beats <= remaining + EPSILON);

    if (!value) {
      throw new RangeError('Duration cannot be represented exactly');
    }

    result.push({ ...value });
    remaining -= value.beats;
  }

  return result;
}
