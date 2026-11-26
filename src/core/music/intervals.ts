import { frequencyRatio, ratioToCents } from './frequency';

import type { MusicalInterval } from '../types/music.types';

export function getInterval(from: number, to: number): MusicalInterval {
  const ratio = frequencyRatio(from, to);
  const cents = ratioToCents(ratio);

  return {
    ratio,
    cents,
    semitones: cents / 100,
  };
}

export function semitonesToRatio(semitones: number): number {
  return 2 ** (semitones / 12);
}

export function ratioToSemitones(ratio: number): number {
  return ratioToCents(ratio) / 100;
}

export function invertRatio(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    throw new RangeError('Invalid frequency ratio');
  }

  return 1 / ratio;
}
