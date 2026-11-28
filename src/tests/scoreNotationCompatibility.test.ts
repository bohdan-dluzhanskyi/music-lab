import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Stave, StaveNote } from 'vexflow';
import { prepareScoreResult } from '@/core/notation/score';
import { TICKS_PER_BEAT } from '@/core/notation/rhythm';
import { buildScoreTies, notationEngine } from '@/engines/notation/NotationEngine';
import { scoreNote } from './fixtures/pianoGrandStaff';

describe('source-linked notation ties', () => {
  beforeEach(() => {
    const warn = console.warn;
    vi.spyOn(console, 'warn').mockImplementation((...args) => {
      if (args[0] !== 'Element: No context for txtCanvas. Returning empty text metrics.')
        warn(...args);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([false, true])(
    'ties source fragments within bars, across bars and across systems (piano=%s)',
    (piano) => {
      const score = prepareScoreResult(
        [
          scoreNote('sustain', 10.5, 3, 440),
          scoreNote('repeat', 13.5, 0.5, 440),
          scoreNote('within', 1, 76 / TICKS_PER_BEAT, 440),
          scoreNote('between', 3.5, 1, 440),
          scoreNote('diagnostic', 6.1, 0.5, 440),
        ],
        16,
      );
      const result = piano
        ? notationEngine.layoutPiano(
            { score, piano, timeSignature: [4, 4], availableWidth: 340 },
            1,
          )
        : notationEngine.layoutStandard({ score, timeSignature: [4, 4] });
      const ties = result.ties;
      expect(
        ties.filter((x) => x.sourceNoteId === 'sustain').filter((x) => x.tie.isPartial()),
      ).toHaveLength(2);
      expect(ties.some((x) => x.sourceNoteId === 'within' && !x.tie.isPartial())).toBe(true);
      expect(ties.some((x) => x.sourceNoteId === 'between')).toBe(true);
      expect(ties.some((x) => x.sourceNoteId === 'repeat')).toBe(false);
      expect(result.diagnostics).toEqual(expect.arrayContaining([...score.diagnostics]));
      expect(result.diagnostics.some((d) => d.scope.sourceNoteIds.includes('diagnostic'))).toBe(
        true,
      );
    },
  );

  it('uses the correct chord head on each fragment, including partial ties', () => {
    const note = (keys: string[]) =>
      new StaveNote({ keys, duration: 'q' }).setStave(new Stave(0, 0, 300));
    const score = prepareScoreResult([scoreNote('held', 0, 1)], 4);
    const event = score.measures[0]!.voices[0]!.segments[0]!;
    const first = {
      event: { ...event, id: 'first', sourceNoteIds: ['other', 'held'] },
      note: note(['c/4', 'a/4']),
      row: 0,
      staff: 0,
    };
    const last = {
      event: { ...event, id: 'last', sourceNoteIds: ['held', 'new'] },
      note: note(['a/4', 'b/4']),
      row: 1,
      staff: 0,
    };
    const edge = { sourceNoteId: 'held', fragmentEndpoints: ['first', 'last'] as const };
    const halves = buildScoreTies([edge], [first, last]);
    expect(halves.map((item) => item.tie.getNotes().firstIndexes)).toEqual([[1], [0]]);
    expect(halves.map((item) => item.tie.getNotes().lastIndexes)).toEqual([[1], [0]]);
    const full = buildScoreTies([edge], [first, { ...last, row: 0 }])[0]!.tie.getNotes();
    expect(full.firstIndexes).toEqual([1]);
    expect(full.lastIndexes).toEqual([0]);
  });
});
