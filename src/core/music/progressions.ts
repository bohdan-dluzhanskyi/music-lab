import type { DiatonicChord, ProgressionDefinition, ScaleType } from '@/core/types/theory.types';

import { buildDiatonicChord } from './harmony';

export const PROGRESSIONS = {
  pop: {
    name: 'Pop — 1–5–6–4',
    degrees: [1, 5, 6, 4],
  },

  emotional: {
    name: 'Emotional — 6–4–1–5',
    degrees: [6, 4, 1, 5],
  },

  classical: {
    name: 'Classical — 1–4–5–1',
    degrees: [1, 4, 5, 1],
  },

  jazz: {
    name: 'Jazz — 2–5–1',
    degrees: [2, 5, 1],
  },

  minorPop: {
    name: 'Minor Pop — 1–6–3–7',
    degrees: [1, 6, 3, 7],
  },

  andalusian: {
    name: 'Andalusian — 1–7–6–5',
    degrees: [1, 7, 6, 5],
  },
} satisfies Record<string, ProgressionDefinition>;

export type ProgressionType = keyof typeof PROGRESSIONS;

export function createProgression(
  rootMidi: number,
  scaleType: ScaleType,
  degrees: readonly number[],
  size: 3 | 4 = 3,
): DiatonicChord[] {
  return degrees.map((degree) => buildDiatonicChord(rootMidi, scaleType, degree, size));
}
