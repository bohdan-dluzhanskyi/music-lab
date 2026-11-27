import type { NoteEvent } from '@/core/types/music.types';

import { getBeatsPerMeasure } from './measures';
import { decomposeDuration, type RhythmValue } from './rhythm';
import { splitIntoVoices } from './voices';

export interface ScoreEvent extends RhythmValue {
  id: string;
  startBeat: number;
  notes: NoteEvent[];
  isRest: boolean;
  tieFromPrevious: boolean;
  tieToNext: boolean;
}

export interface PreparedMeasure {
  index: number;
  startBeat: number;
  endBeat: number;
  voices: ScoreEvent[][];
}

const EPSILON = 1e-8;

function createEvents(
  startBeat: number,
  durationBeats: number,
  notes: NoteEvent[],
  tieFromPrevious = false,
  tieToNext = false,
): ScoreEvent[] {
  if (durationBeats <= EPSILON) return [];

  const values = decomposeDuration(durationBeats);
  let position = startBeat;

  return values.map((value, index) => {
    const isRest = notes.length === 0;

    const event: ScoreEvent = {
      ...value,
      id: `${notes.map((note) => note.id).join('-')}-${position}`,
      startBeat: position,
      notes,
      isRest,
      tieFromPrevious: !isRest && (tieFromPrevious || index > 0),
      tieToNext: !isRest && (tieToNext || index < values.length - 1),
    };

    position += value.beats;

    return event;
  });
}

export function prepareScore(
  notes: readonly NoteEvent[],
  lengthBeats: number,
  timeSignature: readonly [number, number] = [4, 4],
): PreparedMeasure[] {
  if (!Number.isFinite(lengthBeats) || lengthBeats < 0) {
    throw new RangeError('Invalid score length');
  }

  const beatsPerMeasure = getBeatsPerMeasure(timeSignature);

  const voices = splitIntoVoices(notes);

  if (!voices.length) {
    voices.push([]);
  }

  const scoreLength = Math.max(
    lengthBeats,
    ...notes.map((note) => note.startBeat + note.durationBeats),
  );

  const measureCount = Math.max(1, Math.ceil(scoreLength / beatsPerMeasure));

  return Array.from({ length: measureCount }, (_, index) => {
    const startBeat = index * beatsPerMeasure;
    const endBeat = startBeat + beatsPerMeasure;

    const measureVoices = voices.map((voice) => {
      const events: ScoreEvent[] = [];
      let cursor = startBeat;

      for (const group of voice) {
        const groupEnd = group.startBeat + group.durationBeats;

        if (groupEnd <= startBeat || group.startBeat >= endBeat) {
          continue;
        }

        const start = Math.max(group.startBeat, startBeat);

        const end = Math.min(groupEnd, endBeat);

        // Fill the gap with rests.
        events.push(...createEvents(cursor, start - cursor, []));

        // Split notes at measure boundaries.
        events.push(
          ...createEvents(
            start,
            end - start,
            group.notes,
            group.startBeat < startBeat,
            groupEnd > endBeat,
          ),
        );

        cursor = end;
      }

      // Complete the measure with rests.
      events.push(...createEvents(cursor, endBeat - cursor, []));

      return events;
    });

    return {
      index,
      startBeat,
      endBeat,
      voices: measureVoices,
    };
  });
}
