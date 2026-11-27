import type { NoteEvent } from '@/core/types/music.types';

import type { FretPosition, InstrumentTuning, TablatureNote } from '@/core/types/notation.types';

export function getFretPositions(midi: number, tuning: InstrumentTuning): FretPosition[] {
  if (!Number.isFinite(midi)) {
    throw new RangeError('Invalid MIDI pitch');
  }

  const roundedMidi = Math.round(midi);

  return tuning.strings
    .map((openMidi, index) => ({
      string: tuning.strings.length - index,
      fret: roundedMidi - openMidi,
      midi: roundedMidi,
    }))
    .filter((position) => position.fret >= 0 && position.fret <= tuning.maxFret)
    .sort((a, b) => a.fret - b.fret);
}

export function getPositionCost(position: FretPosition, previous: FretPosition | null): number {
  const fretCost = position.fret * 0.15;

  if (!previous) {
    return fretCost;
  }

  const movementCost = Math.abs(position.fret - previous.fret);

  const stringCost = Math.abs(position.string - previous.string) * 0.5;

  return fretCost + movementCost + stringCost;
}

export function chooseFretPosition(
  positions: readonly FretPosition[],
  previous: FretPosition | null = null,
): FretPosition | null {
  if (!positions.length) {
    return null;
  }

  return [...positions].sort(
    (a, b) => getPositionCost(a, previous) - getPositionCost(b, previous),
  )[0]!;
}

export function generateTablature(
  notes: readonly NoteEvent[],
  tuning: InstrumentTuning,
): TablatureNote[] {
  let previous: FretPosition | null = null;

  return [...notes]
    .sort((a, b) => a.startBeat - b.startBeat)
    .map((note) => {
      const positions = getFretPositions(note.pitch.midi, tuning);

      const position = chooseFretPosition(positions, previous);

      if (position) {
        previous = position;
      }

      return {
        note,
        position,
      };
    });
}
