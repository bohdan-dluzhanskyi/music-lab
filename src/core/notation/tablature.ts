import type { NoteEvent } from '@/core/types/music.types';

import type { InstrumentTuning, TablatureNote } from '@/core/types/notation.types';

import { findChordFingerings, type ChordFingering } from './chordFingering';

export interface TablatureGroup {
  startBeat: number;
  notes: TablatureNote[];
  alternatives: ChordFingering[];
  playable: boolean;
}

export function prepareTablature(
  notes: readonly NoteEvent[],
  tuning: InstrumentTuning,
  maxStretch = 4,
): TablatureGroup[] {
  const groups = new Map<number, NoteEvent[]>();

  for (const note of notes) {
    const existing = groups.get(note.startBeat) ?? [];

    existing.push(note);

    groups.set(note.startBeat, existing);
  }

  const active: TablatureNote[] = [];

  let previousFret = 0;

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([startBeat, groupNotes]) => {
      for (let index = active.length - 1; index >= 0; index--) {
        const item = active[index]!;

        const endBeat = item.note.startBeat + item.note.durationBeats;

        if (endBeat <= startBeat + 1e-8) {
          active.splice(index, 1);
        }
      }

      const occupiedStrings = active.flatMap((item) =>
        item.position ? [item.position.string] : [],
      );

      const heldFrets = active.flatMap((item) => (item.position ? [item.position.fret] : []));

      const alternatives = findChordFingerings(groupNotes, tuning, {
        previousFret,
        maxStretch,
        maxResults: 10,
        occupiedStrings,
        heldFrets,
      });

      const best = alternatives[0];

      const tablatureNotes =
        best?.notes ??
        groupNotes.map((note) => ({
          note,
          position: null,
        }));

      if (best) {
        previousFret = best.handPosition;

        active.push(...best.notes);
      }

      return {
        startBeat,
        notes: tablatureNotes,
        alternatives,
        playable: Boolean(best),
      };
    });
}
