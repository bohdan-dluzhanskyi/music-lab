import { describe, expect, it } from 'vitest';
import { midiToFrequency } from '@/core/music/frequency';
import { projectPianoScore } from '@/core/notation/pianoStaffProjection';
import { prepareScoreResult, type ScoreEvent } from '@/core/notation/score';
import { scoreNote } from './fixtures/pianoGrandStaff';

const pitch = (id: string, midi: number, start = 0, duration = 1) =>
  scoreNote(id, start, duration, midiToFrequency(midi));

function written(events: readonly ScoreEvent[]) {
  return events.flatMap((event) =>
    event.sourceNoteIds.map((id) => [id, event.startTick, event.durationTicks]),
  );
}

describe('piano staff projection', () => {
  it.each([
    ['empty', [], [], []],
    ['treble', [pitch('c', 60)], ['c'], []],
    ['bass', [pitch('b', 59)], [], ['b']],
  ] as const)('keeps both staves for a %s track', (_, notes, upper, lower) => {
    const m = projectPianoScore(prepareScoreResult(notes, 4)).measures[0]!;
    expect(m.treble.flatMap((v) => v.segments).flatMap((e) => e.sourceNoteIds)).toEqual(upper);
    expect(m.bass.flatMap((v) => v.segments).flatMap((e) => e.sourceNoteIds)).toEqual(lower);
    for (const v of [...m.treble, ...m.bass]) {
      expect(v.segments.reduce((sum, e) => sum + e.durationTicks, 0)).toBe(1024);
    }
  });

  it('splits by source pitch at C4, retaining written timing and voice membership', () => {
    const notes = [
      pitch('below', 59.999),
      pitch('on', 60),
      pitch('above', 60.001),
      pitch('long', 48, 0, 2),
    ];
    const snapshot = structuredClone(notes);
    const prepared = prepareScoreResult(notes, 4);
    const { treble, bass } = projectPianoScore(prepared).measures[0]!;
    expect(treble.flatMap((v) => written(v.segments))).toEqual(
      [
        ['on', 0, 256],
        ['above', 0, 256],
      ].sort(),
    );
    expect(bass.flatMap((v) => written(v.segments))).toEqual([
      ['below', 0, 256],
      ['long', 0, 512],
    ]);
    expect(treble.map((v) => v.id)).toEqual(bass.map((v) => v.id));
    const moved = projectPianoScore(prepared, 61).measures[0]!;
    expect(moved.treble.flatMap((v) => written(v.segments))).toEqual([]);
    expect(moved.bass.flatMap((v) => written(v.segments)).sort()).toEqual(
      prepared.measures[0]!.voices.flatMap((v) => written(v.segments)).sort(),
    );
    expect(notes).toEqual(snapshot);
  });

  it('includes A0 and C8 and diagnoses out-of-range events without omitting them', () => {
    const score = prepareScoreResult(
      [pitch('low', 20.99), pitch('a0', 21), pitch('c8', 108), pitch('high', 108.01, 3, 2)],
      8,
    );
    const projected = projectPianoScore(score);
    expect(
      projected.diagnostics
        .filter((d) => d.code === 'piano-range')
        .flatMap((d) => d.scope.sourceNoteIds),
    ).toEqual(['high', 'low']);
    expect(
      projected.measures
        .flatMap((m) => m.treble.flatMap((v) => written(v.segments)))
        .filter((e) => e[0] === 'high'),
    ).toHaveLength(2);
    expect(projected.continuities).toEqual(score.continuities);
  });

  it('retains legal voice-local rests even when merging voices would leave a 4-tick gap', () => {
    const score = prepareScoreResult(
      [
        pitch('a', 69, 0, 24 / 256),
        pitch('overlap', 40, 24 / 256, 32 / 256),
        pitch('b', 69, 28 / 256, 16 / 256),
      ],
      1,
      [1, 4],
    );
    const voice = projectPianoScore(score).measures[0]!.treble;
    for (const v of voice) {
      let next = 0;
      for (const e of v.segments) {
        expect(e.startTick).toBe(next);
        expect(e.durationTicks).toBeGreaterThanOrEqual(16);
        next += e.durationTicks;
      }
      expect(next).toBe(256);
    }
    expect(voice.flatMap((v) => written(v.segments))).toEqual([
      ['a', 0, 24],
      ['b', 28, 16],
    ]);
  });

  it('replaces an invalid voice locally and keeps other notes and preparation diagnostics', () => {
    const score = prepareScoreResult([pitch('treble', 60, 0.1), pitch('bass', 44, 0.25)], 4);
    const measure = score.measures[0]!;
    const badVoice = measure.voices[0]!;
    const corrupt = {
      ...measure,
      voices: [{ ...badVoice, segments: badVoice.segments.slice(1) }, ...measure.voices.slice(1)],
    };
    const projected = projectPianoScore({ ...score, measures: [corrupt] });
    expect(projected.diagnostics).toEqual(expect.arrayContaining([...score.diagnostics]));
    expect(projected.diagnostics.some((d) => d.code === 'invalid-staff-voice')).toBe(true);
    expect(projected.measures[0]!.bass.flatMap((v) => written(v.segments))).toContainEqual([
      'bass',
      64,
      256,
    ]);
  });
});
