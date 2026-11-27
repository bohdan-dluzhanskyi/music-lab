import type { NotationDuration } from '@/core/types/notation.types';

export const NOTATION_DURATIONS: Record<NotationDuration, number> = {
  w: 4,
  h: 2,
  q: 1,
  '8': 0.5,
  '16': 0.25,
  '32': 0.125,
  '64': 0.0625,
};

export function beatsToNotationDuration(beats: number): NotationDuration {
  if (!Number.isFinite(beats) || beats <= 0) {
    throw new RangeError('Invalid note duration');
  }

  const entries = Object.entries(NOTATION_DURATIONS) as [NotationDuration, number][];

  return entries.reduce((nearest, current) =>
    Math.abs(current[1] - beats) < Math.abs(nearest[1] - beats) ? current : nearest,
  )[0];
}

export function notationDurationToBeats(duration: NotationDuration): number {
  return NOTATION_DURATIONS[duration];
}
