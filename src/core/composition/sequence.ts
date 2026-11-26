import type { NoteEvent } from '@/core/types/music.types';

import { frequencyToPitch } from '@/core/music/notes';

export interface SequenceOptions {
  durationBeats?: number;
  velocity?: number;
  trackId?: string;
  rhythm?: readonly boolean[];
}

export function createNoteSequence(
  frequencies: readonly number[],
  { durationBeats = 0.5, velocity = 0.7, trackId = 'mathematics', rhythm }: SequenceOptions = {},
): NoteEvent[] {
  if (
    !Number.isFinite(durationBeats) ||
    durationBeats <= 0 ||
    !Number.isFinite(velocity) ||
    velocity < 0 ||
    velocity > 1 ||
    (rhythm && rhythm.length === 0)
  ) {
    throw new RangeError('Invalid sequence options');
  }

  return frequencies.flatMap((frequency, index) => {
    if (rhythm && !rhythm[index % rhythm.length]) {
      return [];
    }

    return [
      {
        id: `${trackId}-${index}`,
        pitch: frequencyToPitch(frequency),
        startBeat: index * durationBeats,
        durationBeats,
        velocity,
        trackId,
      },
    ];
  });
}

export function beatsToSeconds(beats: number, bpm: number): number {
  if (!Number.isFinite(beats) || beats < 0 || !Number.isFinite(bpm) || bpm <= 0) {
    throw new RangeError('Invalid timing parameters');
  }

  return (beats * 60) / bpm;
}
