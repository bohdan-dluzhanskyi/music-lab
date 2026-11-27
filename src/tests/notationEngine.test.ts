import { describe, expect, it } from 'vitest';

import { decomposeDuration } from '@/core/notation/rhythm';

import { groupSimultaneousNotes, splitIntoVoices } from '@/core/notation/voices';

import { frequencyToPitch } from '@/core/music/notes';

import type { NoteEvent } from '@/core/types/music.types';

import { prepareScore } from '@/core/notation/score';

function note(frequency: number, startBeat: number, durationBeats: number): NoteEvent {
  return {
    id: `${frequency}-${startBeat}`,
    pitch: frequencyToPitch(frequency),
    startBeat,
    durationBeats,
    velocity: 0.7,
    trackId: 'test',
  };
}

describe('Rhythm decomposition', () => {
  it('represents a quarter note', () => {
    expect(decomposeDuration(1)).toEqual([{ duration: 'q', beats: 1, dots: 0 }]);
  });

  it('represents a dotted quarter note', () => {
    expect(decomposeDuration(1.5)).toEqual([{ duration: 'q', beats: 1.5, dots: 1 }]);
  });

  it('represents a double dotted quarter note', () => {
    expect(decomposeDuration(1.75)).toEqual([{ duration: 'q', beats: 1.75, dots: 2 }]);
  });

  it('decomposes five beats', () => {
    const result = decomposeDuration(5);

    expect(result.reduce((sum, item) => sum + item.beats, 0)).toBe(5);
  });

  it('rejects invalid durations', () => {
    expect(() => decomposeDuration(0)).toThrow();
  });

  it('rejects unsupported durations', () => {
    expect(() => decomposeDuration(1 / 3)).toThrow();
  });
});

describe('Notation voices', () => {
  it('groups simultaneous notes into a chord', () => {
    const groups = groupSimultaneousNotes([
      note(220, 0, 1),
      note(261.625565, 0, 1),
      note(329.627557, 0, 1),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.notes).toHaveLength(3);
  });

  it('keeps sequential notes in one voice', () => {
    expect(splitIntoVoices([note(220, 0, 1), note(440, 1, 1)])).toHaveLength(1);
  });

  it('separates overlapping notes', () => {
    expect(splitIntoVoices([note(220, 0, 2), note(440, 1, 1)])).toHaveLength(2);
  });

  it('preserves original frequencies', () => {
    const frequency = 355.967478;

    const groups = groupSimultaneousNotes([note(frequency, 0, 1)]);

    expect(groups[0]?.notes[0]?.pitch.frequency).toBe(frequency);
  });
});
describe('Score preparation', () => {
  it('creates a complete empty measure', () => {
    const score = prepareScore([], 4);

    expect(score).toHaveLength(1);

    expect(score[0]?.voices[0]?.[0]).toMatchObject({
      isRest: true,
      beats: 4,
    });
  });

  it('creates rests before and after a note', () => {
    const score = prepareScore([note(440, 1, 1)], 4);

    const events = score[0]!.voices[0]!;

    expect(events.map((event) => event.isRest)).toEqual([true, false, true]);

    expect(events.map((event) => event.beats)).toEqual([1, 1, 2]);
  });

  it('splits notes across measures', () => {
    const score = prepareScore([note(440, 2, 4)], 8);

    const first = score[0]!.voices[0]!.find((event) => !event.isRest);

    const second = score[1]!.voices[0]!.find((event) => !event.isRest);

    expect(first?.beats).toBe(2);
    expect(first?.tieToNext).toBe(true);

    expect(second?.beats).toBe(2);
    expect(second?.tieFromPrevious).toBe(true);
  });

  it('preserves chords', () => {
    const score = prepareScore(
      [note(220, 0, 1), note(261.625565, 0, 1), note(329.627557, 0, 1)],
      4,
    );

    const event = score[0]!.voices[0]![0]!;

    expect(event.notes).toHaveLength(3);
  });

  it('preserves exact frequencies', () => {
    const frequency = 355.967478;

    const score = prepareScore([note(frequency, 0, 1)], 4);

    expect(score[0]?.voices[0]?.[0]?.notes[0]?.pitch.frequency).toBe(frequency);
  });

  it('supports 6/8 time signature', () => {
    const score = prepareScore([], 6, [6, 8]);

    expect(score).toHaveLength(2);

    expect(score[0]?.endBeat).toBe(3);
  });

  it('fills every voice to the measure length', () => {
    const score = prepareScore([note(220, 0, 2), note(440, 1, 2)], 4);

    for (const voice of score[0]!.voices) {
      const duration = voice.reduce((sum, event) => sum + event.beats, 0);

      expect(duration).toBe(4);
    }
  });

  it('preserves dotted durations', () => {
    const score = prepareScore([note(440, 0, 1.5)], 4);

    expect(score[0]?.voices[0]?.[0]).toMatchObject({
      duration: 'q',
      dots: 1,
      beats: 1.5,
    });
  });
});
