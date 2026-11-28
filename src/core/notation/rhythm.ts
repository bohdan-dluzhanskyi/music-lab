import type { NotationDuration, WrittenDots } from '@/core/types/notation.types';

import { NOTATION_DURATIONS } from './duration';

export const TICKS_PER_BEAT = 256;
export const TICK_STRIDE = 4;
export const TIMING_EPSILON = 1e-8;

export interface RhythmValue {
  duration: NotationDuration;
  beats: number;
  dots: WrittenDots;
}

interface WrittenRhythm extends RhythmValue {
  ticks: number;
}

const DOTS = [0, 1, 2] as const;

export const WRITTEN_RHYTHMS: readonly WrittenRhythm[] = (
  Object.entries(NOTATION_DURATIONS) as [NotationDuration, number][]
).flatMap(([duration, base]) =>
  DOTS.map((dots) => {
    const beats = base * (2 - 2 ** -dots);
    return { duration, beats, dots, ticks: beats * TICKS_PER_BEAT };
  }),
);

export type RhythmTable = { counts: number[]; tokens: (WrittenRhythm | undefined)[] };

// One unit performs at most one comparison per rhythm token.
export function* buildRhythmTable(maxTicks: number): Generator<void, RhythmTable> {
  const table: RhythmTable = { counts: [0], tokens: [undefined] };

  for (let index = 1; index <= maxTicks / TICK_STRIDE; index++) {
    let bestCount = Infinity;
    let best: WrittenRhythm | undefined;
    for (const token of WRITTEN_RHYTHMS) {
      const previous = table.counts[index - token.ticks / TICK_STRIDE] ?? Infinity;
      if (previous + 1 < bestCount) {
        bestCount = previous + 1;
        best = token;
      }
    }

    table.counts.push(bestCount);
    table.tokens.push(best);
    yield;
  }

  return table;
}

export function fragmentCount(table: RhythmTable, ticks: number): number {
  return table.counts[ticks / TICK_STRIDE] ?? Infinity;
}

export function* rhythmTokens(table: RhythmTable, ticks: number): Generator<WrittenRhythm> {
  while (ticks > 0) {
    const token = table.tokens[ticks / TICK_STRIDE];
    if (!token) throw new RangeError('Duration cannot be represented exactly');
    yield token;
    ticks -= token.ticks;
  }
}

export function decomposeDuration(beats: number): RhythmValue[] {
  const ticks = Math.round(beats * TICKS_PER_BEAT);
  if (
    !Number.isSafeInteger(ticks) ||
    ticks <= 0 ||
    Math.abs(ticks / TICKS_PER_BEAT - beats) > TIMING_EPSILON
  ) {
    throw new RangeError('Invalid or unsupported duration');
  }

  const work = buildRhythmTable(ticks);
  let step = work.next();
  while (!step.done) step = work.next();

  return Array.from(rhythmTokens(step.value, ticks), ({ duration, beats, dots }) => ({
    duration,
    beats,
    dots,
  }));
}
