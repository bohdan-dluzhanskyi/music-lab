import { describe, expect, it } from 'vitest';

import { beatsToNotationDuration, notationDurationToBeats } from '@/core/notation/duration';

import { getBeatsPerMeasure, splitIntoMeasures } from '@/core/notation/measures';

import { frequencyToNotationPitch } from '@/core/notation/pitch';

import { getFretPositions, chooseFretPosition, generateTablature } from '@/core/notation/fingering';

import { INSTRUMENT_TUNINGS } from '@/core/notation/tunings';

import { frequencyToPitch } from '@/core/music/notes';

import type { NoteEvent } from '@/core/types/music.types';

function createNote(frequency: number, startBeat = 0, durationBeats = 1): NoteEvent {
  return {
    id: `note-${startBeat}-${frequency}`,
    pitch: frequencyToPitch(frequency),
    startBeat,
    durationBeats,
    velocity: 0.7,
    trackId: 'test-track',
  };
}

describe('Notation durations', () => {
  it('converts whole notes', () => {
    expect(beatsToNotationDuration(4)).toBe('w');
  });

  it('converts half notes', () => {
    expect(beatsToNotationDuration(2)).toBe('h');
  });

  it('converts quarter notes', () => {
    expect(beatsToNotationDuration(1)).toBe('q');
  });

  it('converts eighth notes', () => {
    expect(beatsToNotationDuration(0.5)).toBe('8');
  });

  it('converts sixteenth notes', () => {
    expect(beatsToNotationDuration(0.25)).toBe('16');
  });

  it('converts notation back to beats', () => {
    expect(notationDurationToBeats('16')).toBe(0.25);
  });

  it('rejects invalid durations', () => {
    expect(() => beatsToNotationDuration(0)).toThrow();
  });
});

describe('Measures', () => {
  it('calculates 4/4', () => {
    expect(getBeatsPerMeasure([4, 4])).toBe(4);
  });

  it('calculates 3/4', () => {
    expect(getBeatsPerMeasure([3, 4])).toBe(3);
  });

  it('calculates 6/8', () => {
    expect(getBeatsPerMeasure([6, 8])).toBe(3);
  });

  it('calculates 7/8', () => {
    expect(getBeatsPerMeasure([7, 8])).toBe(3.5);
  });

  it('splits a composition into measures', () => {
    const notes = [createNote(440, 0), createNote(440, 4)];

    const measures = splitIntoMeasures(notes, 8);

    expect(measures).toHaveLength(2);
    expect(measures[0]?.notes).toHaveLength(1);
    expect(measures[1]?.notes).toHaveLength(1);
  });

  it('preserves empty measures', () => {
    const measures = splitIntoMeasures([], 8);

    expect(measures).toHaveLength(2);
    expect(measures[0]?.notes).toHaveLength(0);
  });
});

describe('Notation pitch', () => {
  it('converts A4', () => {
    const pitch = frequencyToNotationPitch(440);

    expect(pitch.key).toBe('a/4');
    expect(pitch.midi).toBe(69);
    expect(pitch.cents).toBeCloseTo(0);
  });

  it('preserves exact frequency', () => {
    const frequency = 220 * ((1 + Math.sqrt(5)) / 2);

    const pitch = frequencyToNotationPitch(frequency);

    expect(pitch.frequency).toBe(frequency);
    expect(pitch.cents).not.toBe(0);
  });
});

describe('Guitar fingering', () => {
  const tuning = INSTRUMENT_TUNINGS.guitarStandard;

  it('finds an open E4 string', () => {
    const positions = getFretPositions(64, tuning);

    expect(positions).toContainEqual({
      string: 1,
      fret: 0,
      midi: 64,
    });
  });

  it('finds six positions for E4', () => {
    expect(getFretPositions(64, tuning)).toHaveLength(6);
  });

  it('rejects notes below the instrument range', () => {
    expect(getFretPositions(20, tuning)).toEqual([]);
  });

  it('prefers an open string initially', () => {
    const positions = getFretPositions(64, tuning);

    expect(chooseFretPosition(positions)?.fret).toBe(0);
  });

  it('returns null for unavailable positions', () => {
    expect(chooseFretPosition([])).toBeNull();
  });

  it('generates tablature without changing frequency', () => {
    const note = createNote(355.967478);

    const result = generateTablature([note], tuning);

    expect(result[0]?.note.pitch.frequency).toBe(note.pitch.frequency);

    expect(result[0]?.position).not.toBeNull();
  });
});
