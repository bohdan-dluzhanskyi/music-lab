import { describe, expect, it } from 'vitest';
import {
  advanceScoreSearch,
  initializeScoreSearch,
  prepareScoreResult,
} from '@/core/notation/score';
import { scoreNote } from './fixtures/pianoGrandStaff';

const tokens = [
  16, 24, 28, 32, 48, 56, 64, 96, 112, 128, 192, 224, 256, 384, 448, 512, 768, 896, 1024, 1536,
  1792,
];
const beats = (ticks: number) => ticks / 256;

// Independent enumeration of token sequences, including all choices of first token.
function fragments(ticks: number): number {
  if (ticks === 0) return 0;
  return Math.min(
    Infinity,
    ...tokens.filter((token) => token <= ticks).map((token) => 1 + fragments(ticks - token)),
  );
}

function oracle(start: number, end: number, bar: number, crosses: boolean) {
  const candidates: Array<{ start: number; end: number; fragments: number; error: number }> = [];
  for (let a = 0; a < bar; a++) {
    for (let b = crosses ? bar + 1 : a + 1; b <= (crosses ? 2 * bar : bar); b++) {
      const count = crosses ? fragments(bar - a) + fragments(b - bar) : fragments(b - a);
      if (!Number.isFinite(fragments(a) + count + fragments((crosses ? 2 * bar : bar) - b)))
        continue;
      candidates.push({
        start: a,
        end: b,
        fragments: count,
        error: Math.abs(a - start) + Math.abs(b - end),
      });
    }
  }
  const measureEnd = crosses ? 2 * bar : bar;
  return candidates.sort(
    (a, b) =>
      a.error - b.error ||
      a.fragments - b.fragments ||
      fragments(a.start) +
        fragments(measureEnd - a.end) -
        (fragments(b.start) + fragments(measureEnd - b.end)) ||
      a.start - b.start ||
      a.end - b.end,
  );
}

describe('constrained written placement', () => {
  it.each([
    [11, 37],
    [19, 45],
    [31, 47],
  ])('matches a single-bar exhaustive oracle at %s–%s', (start, end) => {
    const expected = oracle(start, end, 64, false)[0]!;
    const score = prepareScoreResult(
      [scoreNote('a', beats(start), beats(end - start))],
      0.25,
      [1, 16],
    );
    const notes = score.measures
      .flatMap((measure) => measure.voices.flatMap((voice) => voice.segments))
      .filter((event) => !event.isRest);
    expect(score.classification).toBe('optimal');
    expect(notes[0]!.startTick).toBe(expected.start);
    expect(notes.reduce((total, event) => total + event.durationTicks, 0)).toBe(
      expected.end - expected.start,
    );
    expect(notes).toHaveLength(expected.fragments);
  });

  it('agrees with the multi-bar oracle for equal error with different fragment/tie counts', () => {
    const candidates = oracle(1, 100, 64, true);
    const expected = candidates[0]!;
    expect(candidates[1]!.error).toBe(expected.error);
    expect(candidates[1]!.fragments).toBeGreaterThan(expected.fragments);
    const score = prepareScoreResult([scoreNote('crossing', beats(1), beats(99))], 0.5, [1, 16]);
    expect(score.classification).toBe('bounded');
    const notes = score.measures
      .flatMap((measure) => measure.voices.flatMap((voice) => voice.segments))
      .filter((event) => !event.isRest);
    expect(notes[0]!.startTick).toBe(expected.start);
    expect(notes.at(-1)!.startTick + notes.at(-1)!.durationTicks).toBe(expected.end);
    expect(notes).toHaveLength(expected.fragments);
    expect(score.continuities).toHaveLength(expected.fragments - 1);
  });

  it('resumes deterministically and preserves an incumbent at a pinned probe budget', () => {
    const notes = [scoreNote('a', 0.1, 0.5), scoreNote('b', 0.1, 1, 440)];
    const run = (slice: number) => {
      const state = initializeScoreSearch(notes, 4, [4, 4], { probesPerScore: 1500 });
      let previous = 0;
      let step = advanceScoreSearch(state, slice);
      while (step.status === 'pending') {
        expect(step.state.position).toBeGreaterThan(previous);
        previous = step.state.position;
        step = advanceScoreSearch(step.state, slice);
      }
      return step.result;
    };
    expect(run(1)).toEqual(run(71));
    expect(run(17).classification).toBe('bounded');
  });

  it('preserves later exact bars on exhaustion and distinguishes a proved conflict', () => {
    const limited = prepareScoreResult(
      [scoreNote('offgrid', 0.1, 0.5), scoreNote('later', 4, 1)],
      8,
      [4, 4],
      { probesPerScore: 0 },
    );
    expect(
      limited.measures[1]!.voices.flatMap((voice) => voice.segments).some((event) =>
        event.sourceNoteIds.includes('later'),
      ),
    ).toBe(true);
    expect(limited.diagnostics.some((item) => item.reason === 'budget-exhausted')).toBe(true);
    const conflict = prepareScoreResult(
      [scoreNote('first', 0, 0.015625), scoreNote('second', 0.03125, 0.015625)],
      0.0625,
      [1, 64],
    );
    expect(conflict.classification).toBe('partial');
    expect(conflict.diagnostics.some((item) => item.reason === 'infeasible')).toBe(true);
  });
});

it('shares scarce probes across distant unresolved bars and tolerates input reordering', () => {
  const notes = [
    scoreNote('early', 0.1, 0.5),
    scoreNote('late', 40.1, 0.5),
    scoreNote('exact', 76, 1),
  ];
  const settings = { probesPerScore: 240, probesPerMeasure: 240 };
  const score = prepareScoreResult(notes, 80, [4, 4], settings);
  const reversed = prepareScoreResult(notes.toReversed(), 80, [4, 4], settings);
  expect(reversed).toEqual(score);
  expect(
    score.measures[0]!.voices[0]!.segments.some((event) => event.sourceNoteIds.includes('early')),
  ).toBe(true);
  expect(
    score.measures[10]!.voices[0]!.segments.some((event) => event.sourceNoteIds.includes('late')),
  ).toBe(true);
  expect(score.localResults[19]!.classification).toBe('exact');
});

it('retains a later legal note when an earlier group cannot coexist with it in a tiny bar', () => {
  const score = prepareScoreResult(
    [scoreNote('a', 0, 0.001), scoreNote('b', 0.03125, 0.03125)],
    0.0625,
    [1, 64],
  );
  expect(score.measures[0]!.voices[0]!.segments[0]!.sourceNoteIds).toEqual(['b']);
  expect(
    score.diagnostics.find((item) => item.code === 'omitted-event')?.scope.sourceNoteIds,
  ).toEqual(['a']);
});

it('diagnoses positive durations whose source endpoint rounds to a barline', () => {
  const notes = [scoreNote('sub-ulp', 4, Number.EPSILON)];
  const score = prepareScoreResult(notes, 4);
  expect(score.classification).toBe('partial');
  expect(score.diagnostics[0]?.scope.sourceNoteIds).toEqual(['sub-ulp']);
  expect(notes[0]?.durationBeats).toBe(Number.EPSILON);
});
