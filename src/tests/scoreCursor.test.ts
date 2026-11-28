import { describe, expect, it } from 'vitest';
import {
  createScoreCursorMap,
  monotoneSourceAnchors,
  type LayoutSnapshot,
} from '@/engines/notation/scoreGeometry';

const bounds = { left: 0, right: 100, top: 0, bottom: 200 };
const anchors = [
  { measureIndex: 0, writtenTick: 0, x: 10 },
  { measureIndex: 0, writtenTick: 4, x: 90 },
];
const fixture: LayoutSnapshot = {
  version: 3,
  systems: [{ ...bounds, index: 0, staffBounds: bounds }],
  staffBounds: [bounds],
  anchors,
  measures: [
    {
      ...bounds,
      index: 0,
      systemIndex: 0,
      sourceInterval: [0, 4],
      playableInterval: [0, 2],
      writtenRange: [0, 4],
      contentLeft: 10,
      contentRight: 90,
      anchors,
      sourceAnchors: [
        { sourceBeat: 0, writtenTick: 0 },
        { sourceBeat: 2, writtenTick: 2 },
      ],
    },
  ],
  playbackEndAnchor: { measureIndex: 0, writtenTick: 2, x: 50, sourceBeat: 2 },
};

describe('score cursor', () => {
  it('interpolates through rests, clamps padding and rejects stale layout versions', () => {
    const map = createScoreCursorMap(fixture);
    expect(map(1, 3)).toMatchObject({ x: 30, sourceBeat: 1, systemIndex: 0 });
    expect(map(4, 3)).toMatchObject({ x: 50, sourceBeat: 2 });
    expect(map(1, 4)).toBeNull();
    expect(createScoreCursorMap({ ...fixture, version: 4 })(1, 4)).toMatchObject({
      layoutVersion: 4,
    });
  });

  it('discards contradictory optional anchors', () => {
    expect(
      monotoneSourceAnchors(fixture.measures[0]!.sourceAnchors, [
        { sourceBeat: 0.5, writtenTick: 1 },
        { sourceBeat: 1, writtenTick: 0 },
        { sourceBeat: 2, writtenTick: 4 },
      ]).map((anchor) => anchor.writtenTick),
    ).toEqual([0, 1, 2]);
  });
  it('is monotone across a written approximation and an empty measure, resetting x at a system break', () => {
    const measure = fixture.measures[0]!;
    const next = (
      index: number,
      systemIndex: number,
      x: number,
    ): LayoutSnapshot['measures'][number] => ({
      ...measure,
      index,
      systemIndex,
      sourceInterval: [4 * index, 4 * (index + 1)],
      playableInterval: [4 * index, 4 * (index + 1)],
      contentLeft: x,
      contentRight: x + 80,
      sourceAnchors: [
        { sourceBeat: 4 * index, writtenTick: 0 },
        { sourceBeat: 4 * (index + 1), writtenTick: 4 },
      ],
      anchors: [
        { measureIndex: index, writtenTick: 0, x },
        { measureIndex: index, writtenTick: 4, x: x + 80 },
      ],
    });
    const map = createScoreCursorMap({
      ...fixture,
      systems: [...fixture.systems, { ...bounds, index: 1, staffBounds: bounds }],
      measures: [
        {
          ...measure,
          playableInterval: [0, 4],
          sourceAnchors: [
            { sourceBeat: 0, writtenTick: 0 },
            { sourceBeat: 0.8, writtenTick: 2 },
            { sourceBeat: 4, writtenTick: 4 },
          ],
        },
        next(1, 0, 100),
        next(2, 1, 10),
      ],
      playbackEndAnchor: { measureIndex: 2, writtenTick: 4, sourceBeat: 12, x: 90 },
    });
    expect(map(0)?.x).toBe(10);
    expect(map(0.8)?.x).toBe(50);
    expect(map(6)?.x).toBe(140);
    expect(map(8)).toMatchObject({ x: 10, systemIndex: 1 });
    expect(map(12)?.x).toBe(90);
    for (let beat = 0; beat < 7.95; beat += 0.05) {
      expect(map(beat + 0.05)!.x).toBeGreaterThanOrEqual(map(beat)!.x);
    }
  });

  it('ignores a snapshot whose written coordinates move backward', () => {
    const measure = fixture.measures[0]!;
    const map = createScoreCursorMap({
      ...fixture,
      measures: [{ ...measure, anchors: [{ ...anchors[0]!, x: 95 }, anchors[1]!] }],
    });
    expect(map(0.5)).toBeNull();
  });
});
