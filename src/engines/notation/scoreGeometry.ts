import type { ScoreInterval } from '@/core/types/notation.types';

export interface ScoreBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface WrittenAnchor {
  measureIndex: number;
  writtenTick: number;
  x: number;
}

export interface SourceAnchor {
  sourceBeat: number;
  writtenTick: number;
}

export interface MeasureGeometry extends ScoreBounds {
  index: number;
  systemIndex: number;
  sourceInterval: ScoreInterval;
  playableInterval: ScoreInterval;
  writtenRange: ScoreInterval;
  contentLeft: number;
  contentRight: number;
  anchors: readonly WrittenAnchor[];
  sourceAnchors: readonly SourceAnchor[];
}

export interface LayoutSnapshot {
  version: number;
  systems: readonly (ScoreBounds & { index: number; staffBounds: ScoreBounds })[];
  measures: readonly MeasureGeometry[];
  staffBounds: readonly ScoreBounds[];
  anchors: readonly WrittenAnchor[];
  playbackEndAnchor: (WrittenAnchor & { sourceBeat: number }) | null;
}

export function createScoreLayoutPublisher() {
  let current = 0;
  let snapshot: LayoutSnapshot | undefined;

  return {
    begin() {
      snapshot = undefined;
      return ++current;
    },
    invalidate() {
      current++;
      snapshot = undefined;
    },
    publish(request: number, value: LayoutSnapshot) {
      if (request !== current || value.version !== request) return false;
      snapshot = value;
      return true;
    },
    read: () => snapshot,
  };
}

export function monotoneSourceAnchors(
  required: readonly SourceAnchor[],
  optional: readonly SourceAnchor[],
): SourceAnchor[] {
  const fixed = new Map<number, SourceAnchor>();
  for (const anchor of required) fixed.set(anchor.sourceBeat, anchor);
  const ordered = [...fixed.values()].sort((a, b) => a.sourceBeat - b.sourceBeat);
  if (
    ordered.some(
      (anchor, index) => index > 0 && anchor.writtenTick < ordered[index - 1]!.writtenTick,
    )
  ) {
    return [];
  }

  const extras = [...optional].sort((a, b) => a.sourceBeat - b.sourceBeat);
  const result: SourceAnchor[] = [];
  let index = 0;
  for (const anchor of ordered) {
    while (index < extras.length && extras[index]!.sourceBeat < anchor.sourceBeat) {
      const candidate = extras[index++]!;
      const previous = result.at(-1);
      if (
        previous &&
        previous.sourceBeat < candidate.sourceBeat &&
        previous.writtenTick <= candidate.writtenTick &&
        candidate.writtenTick <= anchor.writtenTick
      ) {
        result.push(candidate);
      }
    }
    result.push(anchor);
  }
  return result;
}

function interpolate<T>(
  anchors: readonly T[],
  target: number,
  key: (anchor: T) => number,
  value: (anchor: T) => number,
): number {
  const start = anchors[0]!;
  const end = anchors.at(-1)!;
  if (target <= key(start)) return value(start);
  if (target >= key(end)) return value(end);
  const right = anchors.findIndex((anchor) => key(anchor) >= target);
  const a = anchors[right - 1]!;
  const b = anchors[right]!;
  return value(a) + (value(b) - value(a)) * ((target - key(a)) / (key(b) - key(a)));
}

export function createScoreCursorMap(layout: LayoutSnapshot) {
  const systems = new Map(layout.systems.map((system) => [system.index, system.staffBounds]));
  let previous: MeasureGeometry | undefined;
  const valid = layout.measures.every((measure) => {
    if (measure.sourceAnchors.length < 2 || measure.anchors.length < 2) return false;
    const sameSystem = previous?.systemIndex === measure.systemIndex;
    const ordered =
      !previous ||
      (previous.sourceInterval[1] <= measure.sourceInterval[0] &&
        (!sameSystem || previous.contentRight <= measure.anchors[0]!.x));
    previous = measure;
    return (
      ordered &&
      systems.has(measure.systemIndex) &&
      measure.sourceAnchors.every(
        (anchor, index, list) =>
          Number.isFinite(anchor.sourceBeat) &&
          Number.isFinite(anchor.writtenTick) &&
          (index === 0 ||
            (list[index - 1]!.sourceBeat < anchor.sourceBeat &&
              list[index - 1]!.writtenTick <= anchor.writtenTick)),
      ) &&
      measure.anchors.every(
        (anchor, index, list) =>
          Number.isFinite(anchor.x) &&
          Number.isFinite(anchor.writtenTick) &&
          (index === 0 ||
            (list[index - 1]!.x <= anchor.x && list[index - 1]!.writtenTick < anchor.writtenTick)),
      )
    );
  });

  return (beat: number, version = layout.version) => {
    if (!valid || version !== layout.version || !Number.isFinite(beat)) return null;
    const end = layout.playbackEndAnchor;
    const sourceBeat = Math.max(0, Math.min(beat, end?.sourceBeat ?? Infinity));
    let low = 0;
    let high = layout.measures.length;
    while (low < high) {
      const center = (low + high) >>> 1;
      if (layout.measures[center]!.sourceInterval[1] <= sourceBeat) low = center + 1;
      else high = center;
    }
    const terminal = end && sourceBeat === end.sourceBeat;
    const measure = terminal ? layout.measures[end.measureIndex] : layout.measures[low];
    if (!measure) return null;
    const writtenTick = interpolate(
      measure.sourceAnchors,
      sourceBeat,
      (anchor) => anchor.sourceBeat,
      (anchor) => anchor.writtenTick,
    );
    const x = terminal
      ? end.x
      : interpolate(
          measure.anchors,
          writtenTick,
          (anchor) => anchor.writtenTick,
          (anchor) => anchor.x,
        );
    return {
      sourceBeat,
      x,
      systemIndex: measure.systemIndex,
      layoutVersion: layout.version,
      measureIndex: measure.index,
      bounds: systems.get(measure.systemIndex)!,
    };
  };
}
