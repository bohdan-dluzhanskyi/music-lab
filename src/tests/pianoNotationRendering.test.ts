import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { midiToFrequency } from '@/core/music/frequency';
import { prepareScoreResult } from '@/core/notation/score';
import { notationEngine } from '@/engines/notation/NotationEngine';
import { createScoreLayoutPublisher } from '@/engines/notation/scoreGeometry';
import { scoreNote } from './fixtures/pianoGrandStaff';

const score = prepareScoreResult(
  [
    scoreNote('low', 0, 0.5, midiToFrequency(48)),
    scoreNote('high', 0, 0.5, 440),
    scoreNote('chord', 0, 0.5, 523.25),
    scoreNote('voice', 0, 1, 659.25),
    scoreNote('end', 5, 0.5, 440),
  ],
  5.5,
);

describe('grand staff renderer contract', () => {
  beforeEach(() => {
    const warn = console.warn;
    vi.spyOn(console, 'warn').mockImplementation((...args) => {
      if (args[0] !== 'Element: No context for txtCanvas. Returning empty text metrics.')
        warn(...args);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('uses real shared tick positions, braces, matching barlines and complete voices', () => {
    const drawing = notationEngine.layoutPiano(
      { score, timeSignature: [4, 4], availableWidth: 800 },
      7,
    );
    const [first] = drawing.measures;
    expect(first!.connectors.map((connector) => connector.kind)).toEqual([
      'brace',
      'singleLeft',
      'singleRight',
    ]);
    expect(first!.staves[0].getX()).toBe(first!.staves[1].getX());
    expect(first!.staves[0].getWidth()).toBe(first!.staves[1].getWidth());
    const attacks = first!.events.filter(
      (event) => !event.event.isRest && event.event.startTick === 0,
    );
    expect(attacks).toHaveLength(3);
    expect(attacks.some((event) => event.note.getKeys().length === 2)).toBe(true);
    expect(new Set(attacks.map((event) => event.note.getAbsoluteX())).size).toBe(1);
    expect(drawing.snapshot.anchors.find((anchor) => anchor.writtenTick === 0)?.x).toBe(
      attacks[0]!.note.getAbsoluteX(),
    );
    for (const measure of drawing.measures) {
      for (const { voice } of measure.voices) expect(voice.isComplete()).toBe(true);
    }
    expect(drawing.snapshot.version).toBe(7);
    expect(drawing.snapshot.playbackEndAnchor?.sourceBeat).toBe(5.5);
    expect(drawing.snapshot.playbackEndAnchor?.writtenTick).toBe(1408);
    expect(drawing.snapshot.playbackEndAnchor!.x).toBeLessThan(drawing.snapshot.measures[1]!.right);
  });

  it('reflows with viewport and zoom while retaining source-to-written anchors', () => {
    const atWidth = (availableWidth: number, zoom: number, version: number) =>
      notationEngine.layoutPiano(
        { score, timeSignature: [4, 4], availableWidth, zoom, showCents: false },
        version,
      ).snapshot;
    const wide = atWidth(1500, 1, 1);
    const narrow = atWidth(340, 1.25, 2);
    expect(narrow.systems.length).toBeGreaterThan(wide.systems.length);
    expect(narrow.version).toBe(2);
    expect(narrow.playbackEndAnchor?.writtenTick).toBe(wide.playbackEndAnchor?.writtenTick);
    expect(narrow.measures[1]!.left).not.toBe(wide.measures[1]!.left);
  });

  it('formats a full rest for each empty staff', () => {
    const drawing = notationEngine.layoutPiano(
      { score: prepareScoreResult([], 4), timeSignature: [4, 4] },
      1,
    );
    expect(drawing.measures[0]!.voices).toHaveLength(2);
    expect(
      drawing.measures[0]!.events.every(
        (event) => event.event.isRest && event.event.durationTicks === 1024,
      ),
    ).toBe(true);
  });

  it('reserves visible ledger space for out-of-range pitches', () => {
    const extreme = prepareScoreResult(
      [
        scoreNote('top', 0, 1, midiToFrequency(109)),
        scoreNote('bottom', 0, 1, midiToFrequency(16)),
      ],
      4,
    );
    const layout = notationEngine.layoutPiano({ score: extreme, timeSignature: [4, 4] }, 1);
    const ys = layout.measures[0]!.events.flatMap(({ event, note }) =>
      event.isRest ? [] : note.getYs(),
    );
    expect(Math.min(...ys)).toBeGreaterThan(30);
    expect(Math.max(...ys)).toBeLessThan(layout.height - 30);
  });

  it('rejects geometry from a superseded or invalidated request', () => {
    const publisher = createScoreLayoutPublisher();
    const first = publisher.begin();
    const current = publisher.begin();
    const snapshot = notationEngine.layoutPiano({ score, timeSignature: [4, 4] }, current).snapshot;
    expect(publisher.publish(first, { ...snapshot, version: first })).toBe(false);
    expect(publisher.publish(current, snapshot)).toBe(true);
    expect(publisher.read()).toBe(snapshot);
    publisher.invalidate();
    expect(publisher.publish(current, snapshot)).toBe(false);
    expect(publisher.read()).toBeUndefined();
  });
});
