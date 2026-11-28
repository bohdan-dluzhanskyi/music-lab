import { describe, expect, it } from 'vitest';

import type { NoteEvent } from '@/core/types/music.types';

import { midiToFrequency } from '@/core/music/frequency';

import { frequencyToPitch } from '@/core/music/notes';

import { INSTRUMENT_TUNINGS } from '@/core/notation/tunings';

import { findChordFingerings } from '@/core/notation/chordFingering';

import { prepareScoreResult } from '@/core/notation/score';
import { prepareTablature, prepareTablatureScore } from '@/core/notation/tablature';

const guitar = INSTRUMENT_TUNINGS.guitarStandard;

function note(midi: number, startBeat = 0, durationBeats = 1): NoteEvent {
  return {
    id: crypto.randomUUID(),
    pitch: frequencyToPitch(midiToFrequency(midi)),
    startBeat,
    durationBeats,
    velocity: 0.7,
    trackId: 'test',
  };
}

describe('Chord fingering', () => {
  it('finds positions for a single note', () => {
    const results = findChordFingerings([note(64)], guitar);

    expect(results.length).toBeGreaterThan(1);
  });

  it('finds a playable A minor chord', () => {
    const results = findChordFingerings([note(45), note(52), note(57), note(60), note(64)], guitar);

    expect(results.length).toBeGreaterThan(0);
  });

  it('never assigns two notes to one string', () => {
    const results = findChordFingerings([note(57), note(60), note(64)], guitar);

    expect(results.length).toBeGreaterThan(0);

    for (const result of results) {
      const strings = result.notes.map((item) => item.position?.string);

      expect(new Set(strings).size).toBe(strings.length);
    }
  });

  it('preserves exact original pitches', () => {
    const source = note(64.23);

    const results = findChordFingerings([source], guitar);

    expect(results[0]?.notes[0]?.note.pitch.frequency).toBe(source.pitch.frequency);
  });

  it('preserves the nearest MIDI pitch', () => {
    const results = findChordFingerings([note(57), note(60), note(64)], guitar);

    expect(results.length).toBeGreaterThan(0);

    for (const result of results) {
      for (const item of result.notes) {
        const position = item.position!;

        const openMidi = guitar.strings[guitar.strings.length - position.string]!;

        expect(openMidi + position.fret).toBe(Math.round(item.note.pitch.midi));
      }
    }
  });

  it('respects maximum fret stretch', () => {
    const results = findChordFingerings([note(57), note(60), note(64)], guitar, { maxStretch: 3 });

    expect(results.length).toBeGreaterThan(0);

    expect(results.every((result) => result.fretSpan <= 3)).toBe(true);
  });

  it('sorts alternatives by cost', () => {
    const results = findChordFingerings([note(64)], guitar);

    const costs = results.map((result) => result.cost);

    expect(costs).toEqual([...costs].sort((a, b) => a - b));
  });

  it('limits the number of alternatives', () => {
    const results = findChordFingerings([note(64)], guitar, { maxResults: 2 });

    expect(results).toHaveLength(2);
  });

  it('rejects pitches outside the instrument range', () => {
    expect(findChordFingerings([note(20)], guitar)).toEqual([]);
  });

  it('rejects more notes than available strings', () => {
    const notes = Array.from({ length: 7 }, () => note(64));

    expect(findChordFingerings(notes, guitar)).toEqual([]);
  });

  it('respects occupied strings', () => {
    const results = findChordFingerings([note(64)], guitar, { occupiedStrings: [1] });

    expect(results.length).toBeGreaterThan(0);

    expect(results.every((result) => result.notes[0]?.position?.string !== 1)).toBe(true);
  });

  it('supports Drop D tuning', () => {
    const results = findChordFingerings([note(38)], INSTRUMENT_TUNINGS.guitarDropD);

    expect(results[0]?.notes[0]?.position).toMatchObject({
      string: 6,
      fret: 0,
    });
  });

  it('supports seven-string guitar', () => {
    const results = findChordFingerings([note(35)], INSTRUMENT_TUNINGS.guitarSevenString);

    expect(results[0]?.notes[0]?.position).toMatchObject({
      string: 7,
      fret: 0,
    });
  });

  it('supports bass guitar', () => {
    const results = findChordFingerings([note(28)], INSTRUMENT_TUNINGS.bassStandard);

    expect(results[0]?.notes[0]?.position).toMatchObject({
      string: 4,
      fret: 0,
    });
  });
});

describe('Tablature preparation', () => {
  it('groups simultaneous notes', () => {
    const result = prepareTablature([note(57), note(60), note(64)], guitar);

    expect(result).toHaveLength(1);
    expect(result[0]?.notes).toHaveLength(3);
    expect(result[0]?.playable).toBe(true);
  });

  it('sorts events chronologically', () => {
    const result = prepareTablature([note(64, 2), note(60, 0), note(57, 1)], guitar);

    expect(result.map((group) => group.startBeat)).toEqual([0, 1, 2]);
  });

  it('keeps sustained strings occupied', () => {
    const result = prepareTablature([note(64, 0, 2), note(64, 1, 1)], guitar);

    expect(result[0]?.playable).toBe(true);
    expect(result[1]?.playable).toBe(true);

    expect(result[0]?.notes[0]?.position?.string).not.toBe(result[1]?.notes[0]?.position?.string);
  });

  it('releases strings after a note ends', () => {
    const result = prepareTablature([note(40, 0, 1), note(40, 1, 1)], guitar);

    expect(result[0]?.playable).toBe(true);
    expect(result[1]?.playable).toBe(true);
  });

  it('marks unplayable notes', () => {
    const result = prepareTablature([note(20)], guitar);

    expect(result[0]?.playable).toBe(false);
    expect(result[0]?.notes[0]?.position).toBeNull();
  });

  it('handles an empty track', () => {
    expect(prepareTablature([], guitar)).toEqual([]);
  });
});

it('adapts written timing and rests without changing source fingerings or frequencies', () => {
  const microtone = note(64.25, 0.1, 0.5);
  const held = note(52, 0, 1);
  const chord = note(57, 0, 1);
  const unplayable = note(16, 1, 1);
  const notes = [held, chord, microtone, unplayable];
  const before = structuredClone(notes);
  const score = prepareScoreResult(notes, 4);
  const tab = prepareTablatureScore(score, notes, guitar);
  expect(tab.groups).toEqual(prepareTablature(notes, guitar));
  expect(tab.unplayableCount).toBe(1);
  expect(tab.diagnostics).toBe(score.diagnostics);
  for (const [i, measure] of tab.measures.entries()) {
    for (const [j, voice] of measure.voices.entries()) {
      expect(voice.segments.map((segment) => segment.event)).toEqual(
        score.measures[i]!.voices[j]!.segments,
      );
      expect(voice.segments.reduce((sum, segment) => sum + segment.event.durationTicks, 0)).toBe(
        1024,
      );
    }
  }
  expect(notes).toEqual(before);
  expect(
    tab.measures
      .flatMap((m) => m.voices.flatMap((v) => v.segments))
      .some((s) =>
        s.positions.some(
          (position) =>
            position.note.id === microtone.id &&
            position.note.pitch.frequency === microtone.pitch.frequency,
        ),
      ),
  ).toBe(true);
});

it('retains the partial prepared result without converting omissions into tuning failures', () => {
  const notes = [note(64, 0.02, 0.01)];
  const partial = prepareScoreResult(notes, 0.0625, [1, 64], { probesPerScore: 0 });
  expect(partial.classification).toBe('partial');
  const tab = prepareTablatureScore(partial, notes, guitar);
  expect(tab.diagnostics).toBe(partial.diagnostics);
  expect(tab.measures[0]!.voices[0]!.segments.every((s) => s.event.isRest)).toBe(true);
  expect(tab.unplayableCount).toBe(0);
});
