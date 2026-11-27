import type { NoteEvent } from '@/core/types/music.types';

import type { ScoreMeasure } from '@/core/types/notation.types';

export function getBeatsPerMeasure(timeSignature: readonly [number, number]): number {
  const [numerator, denominator] = timeSignature;

  if (
    !Number.isInteger(numerator) ||
    numerator <= 0 ||
    ![1, 2, 4, 8, 16, 32, 64].includes(denominator)
  ) {
    throw new RangeError('Invalid time signature');
  }

  return numerator * (4 / denominator);
}

export function splitIntoMeasures(
  notes: readonly NoteEvent[],
  lengthBeats: number,
  timeSignature: readonly [number, number] = [4, 4],
): ScoreMeasure[] {
  if (!Number.isFinite(lengthBeats) || lengthBeats < 0) {
    throw new RangeError('Invalid composition length');
  }

  const beatsPerMeasure = getBeatsPerMeasure(timeSignature);

  const sorted = [...notes].sort((a, b) => a.startBeat - b.startBeat);

  const endBeat = Math.max(
    lengthBeats,
    ...sorted.map((note) => note.startBeat + note.durationBeats),
  );

  const count = Math.max(1, Math.ceil(endBeat / beatsPerMeasure));

  return Array.from({ length: count }, (_, index) => {
    const startBeat = index * beatsPerMeasure;
    const endBeat = startBeat + beatsPerMeasure;

    return {
      index,
      startBeat,
      endBeat,
      notes: sorted.filter((note) => note.startBeat >= startBeat && note.startBeat < endBeat),
    };
  });
}
