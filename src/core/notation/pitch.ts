import { frequencyToPitch } from '@/core/music/notes';

import type { NotationPitch } from '@/core/types/notation.types';

export function frequencyToNotationPitch(frequency: number): NotationPitch {
  const pitch = frequencyToPitch(frequency);

  const accidental = pitch.note.includes('#') ? '#' : null;

  return {
    key: `${pitch.note.toLowerCase()}/${pitch.octave}`,
    midi: Math.round(pitch.midi),
    cents: pitch.cents,
    frequency,
    accidental,
  };
}
