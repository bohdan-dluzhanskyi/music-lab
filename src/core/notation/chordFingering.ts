import type { NoteEvent } from '@/core/types/music.types';

import type { FretPosition, InstrumentTuning, TablatureNote } from '@/core/types/notation.types';

import { getFretPositions } from './fingering';

export interface ChordFingeringOptions {
  maxStretch?: number;
  maxResults?: number;
  previousFret?: number;
  occupiedStrings?: readonly number[];
  heldFrets?: readonly number[];
}

export interface ChordFingering {
  notes: TablatureNote[];
  cost: number;
  fretSpan: number;
  handPosition: number;
}

function getFretSpan(frets: readonly number[]): number {
  const pressed = frets.filter((fret) => fret > 0);

  if (pressed.length < 2) return 0;

  return Math.max(...pressed) - Math.min(...pressed);
}

function evaluateFingering(
  positions: readonly FretPosition[],
  previousFret: number,
  heldFrets: readonly number[],
) {
  const frets = [...positions.map((position) => position.fret), ...heldFrets];

  const pressed = frets.filter((fret) => fret > 0);

  const handPosition = pressed.length ? Math.min(...pressed) : previousFret;

  const fretSpan = getFretSpan(frets);

  const movementCost = Math.abs(handPosition - previousFret);

  const fretCost = positions.reduce((sum, position) => sum + position.fret * 0.1, 0);

  const cost = fretSpan * 2 + movementCost * 0.8 + fretCost;

  return {
    cost,
    fretSpan,
    handPosition,
  };
}

export function findChordFingerings(
  notes: readonly NoteEvent[],
  tuning: InstrumentTuning,
  options: ChordFingeringOptions = {},
): ChordFingering[] {
  const {
    maxStretch = 4,
    maxResults = 10,
    previousFret = 0,
    occupiedStrings = [],
    heldFrets = [],
  } = options;

  if (
    !Number.isInteger(maxResults) ||
    maxResults < 1 ||
    !Number.isFinite(maxStretch) ||
    maxStretch < 0
  ) {
    throw new RangeError('Invalid fingering options');
  }

  const usedStrings = new Set(occupiedStrings);

  if (!notes.length || notes.length > tuning.strings.length - usedStrings.size) {
    return [];
  }

  const candidates = notes
    .map((note, index) => ({
      index,
      positions: getFretPositions(note.pitch.midi, tuning).filter(
        (position) => !usedStrings.has(position.string),
      ),
    }))
    .sort((a, b) => a.positions.length - b.positions.length);

  if (candidates.some((candidate) => !candidate.positions.length)) {
    return [];
  }

  const results: ChordFingering[] = [];

  const selected: FretPosition[] = [];

  function search(depth: number): void {
    if (depth === candidates.length) {
      const evaluation = evaluateFingering(selected, previousFret, heldFrets);

      results.push({
        ...evaluation,
        notes: notes.map((note, index) => ({
          note,
          position: selected[index]!,
        })),
      });

      results.sort((a, b) => a.cost - b.cost);

      if (results.length > maxResults) {
        results.pop();
      }

      return;
    }

    const candidate = candidates[depth]!;

    for (const position of candidate.positions) {
      if (usedStrings.has(position.string)) {
        continue;
      }

      selected[candidate.index] = position;
      usedStrings.add(position.string);

      const frets = [...selected.filter(Boolean).map((item) => item.fret), ...heldFrets];

      if (getFretSpan(frets) <= maxStretch) {
        search(depth + 1);
      }

      usedStrings.delete(position.string);

      delete selected[candidate.index];
    }
  }

  search(0);

  return results;
}
