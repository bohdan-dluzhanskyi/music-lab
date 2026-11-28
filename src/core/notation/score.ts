import type { NoteEvent } from '@/core/types/music.types';
import type {
  Diagnostic,
  Measure,
  OnsetGroup,
  PreparationClass,
  PreparationResult,
  SearchState,
  SearchStep,
  TimingDeviation,
  WrittenContinuity,
  WrittenEvent,
} from '@/core/types/notation.types';
import { getBeatsPerMeasure, getMeasureRange } from './measures';
import {
  createMeasureSearch,
  DEFAULT_SEARCH_LIMITS,
  exactPlacement,
  stepMeasureSearch,
  type MeasureAtom,
  type MeasurePlacement,
  type MeasureSearch,
  type SearchLimits,
  type PlacementCandidate,
} from './placement';
import {
  buildRhythmTable,
  rhythmTokens,
  TIMING_EPSILON,
  TICKS_PER_BEAT,
  type RhythmValue,
} from './rhythm';
import { assignNotationVoices, orderNotationItems } from './voices';

export interface ScoreEvent extends RhythmValue, WrittenEvent {
  startBeat: number;
  notes: readonly NoteEvent[];
  isRest: boolean;
  tieFromPrevious: boolean;
  tieToNext: boolean;
}

// The existing renderer-facing arrays are projections of the same derived voices.
export interface PreparedMeasure {
  index: number;
  startBeat: number;
  endBeat: number;
  voices: ScoreEvent[][];
}

export type PreparedScore = PreparationResult<Measure<ScoreEvent>>;

interface SearchProgress {
  frontier: number[];
  bestCandidate: PlacementCandidate | null;
  remainingBudgets: number;
  certificationEvidence: { certified: boolean };
  orderingState: number[];
}

const MAX_TABLE_TICKS = 65_536;
const MAX_MEASURES = 4096;
const MAX_SCORE_TOKENS = 250_000;
const CLASSES: readonly PreparationClass[] = ['exact', 'optimal', 'bounded', 'partial'];

function worst(a: PreparationClass, b: PreparationClass): PreparationClass {
  return CLASSES.indexOf(a) >= CLASSES.indexOf(b) ? a : b;
}

function compareDiagnostics(a: Diagnostic, b: Diagnostic): number {
  const first = a.scope.sourceNoteIds[0] ?? '';
  const second = b.scope.sourceNoteIds[0] ?? '';
  return (
    (a.scope.measureIndex ?? Infinity) - (b.scope.measureIndex ?? Infinity) ||
    (first < second ? -1 : first > second ? 1 : 0) ||
    (a.code < b.code ? -1 : a.code > b.code ? 1 : 0)
  );
}

export function initializeScoreSearch(
  notes: readonly NoteEvent[],
  lengthBeats: number,
  timeSignature: readonly [number, number] = [4, 4],
  options: Partial<SearchLimits> = {},
): SearchState<PreparedScore, PlacementCandidate> {
  if (!Number.isFinite(lengthBeats) || lengthBeats < 0) {
    throw new RangeError('Invalid score length');
  }

  const limits = { ...DEFAULT_SEARCH_LIMITS, ...options };
  if (Object.values(limits).some((value) => !Number.isSafeInteger(value) || value < 0)) {
    throw new RangeError('Invalid score search limit');
  }

  const progress: SearchProgress = {
    frontier: [],
    bestCandidate: null,
    remainingBudgets: limits.probesPerScore,
    certificationEvidence: { certified: false },
    orderingState: [],
  };
  const work = prepare(notes, lengthBeats, getBeatsPerMeasure(timeSignature), limits, progress);

  let position = 0;
  let result: PreparedScore | undefined;
  const continuation: Iterator<void, PreparedScore> = {
    next() {
      if (result) return { done: true, value: result };
      const step = work.next();
      if (step.done) result = step.value;
      else position++;
      return step;
    },
  };

  return {
    work: continuation,
    get position() {
      return position;
    },
    get frontier() {
      return progress.frontier;
    },
    get bestCandidate() {
      return progress.bestCandidate;
    },
    get remainingBudgets() {
      return progress.remainingBudgets;
    },
    get certificationEvidence() {
      return progress.certificationEvidence;
    },
    get orderingState() {
      return progress.orderingState;
    },
  };
}

export function advanceScoreSearch(
  state: SearchState<PreparedScore, PlacementCandidate>,
  maxWork: number,
): SearchStep<PreparedScore, PlacementCandidate> {
  if (!Number.isSafeInteger(maxWork) || maxWork <= 0) throw new RangeError('Invalid work slice');
  for (let count = 0; count < maxWork; count++) {
    const step = state.work.next();
    if (step.done) return { status: 'complete', result: step.value };
  }

  return { status: 'pending', state };
}

export function prepareScoreResult(
  notes: readonly NoteEvent[],
  lengthBeats: number,
  timeSignature: readonly [number, number] = [4, 4],
  limits?: Partial<SearchLimits>,
): PreparedScore {
  let step = advanceScoreSearch(
    initializeScoreSearch(notes, lengthBeats, timeSignature, limits),
    4096,
  );
  while (step.status === 'pending') step = advanceScoreSearch(step.state, 4096);
  return step.result;
}

export function prepareScore(
  notes: readonly NoteEvent[],
  lengthBeats: number,
  timeSignature: readonly [number, number] = [4, 4],
): PreparedMeasure[] {
  return prepareScoreResult(notes, lengthBeats, timeSignature).measures.map((measure) => ({
    index: measure.index,
    startBeat: measure.sourceInterval[0],
    endBeat: measure.sourceInterval[1],
    voices: measure.voices.map((voice) => [...voice.segments]),
  }));
}

function* prepare(
  notes: readonly NoteEvent[],
  lengthBeats: number,
  meter: number,
  limits: SearchLimits,
  progress: SearchProgress,
): Generator<void, PreparedScore> {
  const diagnostics: Diagnostic[] = [];
  const continuities: WrittenContinuity[] = [];
  const onsetGroups: OnsetGroup[] = [];
  const localResults: Array<PreparedScore['localResults'][number]> = [];
  const measures: Measure<ScoreEvent>[] = [];
  const valid: NoteEvent[] = [];
  const previews = new Map<string, { start: number; end: number; duration: number; id: string }>();
  let length = lengthBeats;
  let classification: PreparationClass = 'exact';
  let hasCrossBarNotes = false;

  for (const note of notes) {
    yield;
    const end = note.startBeat + note.durationBeats;
    if (
      !Number.isFinite(end) ||
      !Number.isFinite(note.pitch.frequency) ||
      !Number.isFinite(note.velocity) ||
      note.startBeat < 0 ||
      note.durationBeats <= 0 ||
      note.pitch.frequency <= 0
    ) {
      diagnostics.push({
        code: 'omitted-event',
        reason: 'display-limit',
        scope: { sourceNoteIds: [note.id] },
        message: 'Source timing or pitch is invalid for notation.',
      });
      classification = 'partial';
    } else {
      valid.push(note);
      length = Math.max(length, end);
    }
  }

  const width = meter * TICKS_PER_BEAT;
  const requestedMeasures = Math.max(1, Math.ceil(length / meter));
  const count = Math.min(requestedMeasures, MAX_MEASURES);
  if (!Number.isSafeInteger(width) || width > MAX_TABLE_TICKS) {
    for (const note of valid) {
      yield;
      diagnostics.push({
        code: 'omitted-event',
        reason: 'display-limit',
        scope: { sourceNoteIds: [note.id] },
        message: 'Source event lies outside the supported score preparation window.',
      });
    }
    diagnostics.push({
      code: 'display-limit',
      reason: 'display-limit',
      scope: { sourceNoteIds: [] },
      message: 'The requested score exceeds the notation window or meter limit.',
    });
    const end = Math.min(length, meter);
    measures.push({
      index: 0,
      voices: [],
      sourceInterval: [0, meter],
      playableInterval: [0, end],
      writtenRange: [0, width],
      writtenPlaybackCutoff: null,
      visualTail: null,
    });
    return {
      classification: 'partial',
      certificationEvidence: { certified: false, reason: 'display-limit' },
      measures,
      diagnostics: yield* orderNotationItems(diagnostics, compareDiagnostics),
      continuities,
      onsetGroups,
      localResults,
    };
  }

  if (requestedMeasures > count) {
    classification = 'partial';
    diagnostics.push({
      code: 'display-limit',
      reason: 'display-limit',
      scope: { sourceNoteIds: [] },
      message: 'The score extends beyond the current notation window.',
    });
  }

  const table = yield* buildRhythmTable(width);
  const sourceVoices = yield* assignNotationVoices(valid);
  const voiceCount = Math.max(1, sourceVoices.length);
  const bars = Array.from({ length: count }, () => new Map<number, MeasureAtom[]>());

  for (const [voice, groups] of sourceVoices.entries()) {
    for (const group of groups) {
      const sourceEnd = group.startBeat + group.durationBeats;
      const first = Math.floor(group.startBeat / meter);
      // A positive sub-ULP note still receives a placement attempt within a bar.
      const last = Math.max(first, Math.ceil(sourceEnd / meter) - 1);
      if (last >= count) {
        classification = 'partial';
        for (const note of group.notes) {
          yield;
          diagnostics.push({
            code: 'omitted-event',
            reason: 'display-limit',
            scope: { sourceNoteIds: [note.id] },
            message:
              requestedMeasures > count
                ? 'All or part of the source event lies beyond the notation window.'
                : 'The positive source duration is below the precision of the score endpoint.',
          });
        }
      }
      for (let index = first; index <= last && index < count; index++) {
        yield;
        const bar = getMeasureRange(index, meter, length);
        const sourceOnset = Math.max(bar.startBeat, group.startBeat);
        const atom: MeasureAtom = {
          group,
          voice,
          onset: (sourceOnset - bar.startBeat) * TICKS_PER_BEAT,
          end: (Math.min(bar.endBeat, sourceEnd) - bar.startBeat) * TICKS_PER_BEAT,
          incoming: group.startBeat < bar.startBeat,
          outgoing: sourceEnd > bar.endBeat,
        };
        hasCrossBarNotes ||= atom.incoming || atom.outgoing;
        const simultaneous = bars[index]!.get(sourceOnset);
        if (simultaneous) simultaneous.push(atom);
        else bars[index]!.set(sourceOnset, [atom]);
      }
    }
  }

  const placements: MeasurePlacement[] = [];
  const pending = new Map<number, MeasureSearch>();
  for (const [index, bar] of bars.entries()) {
    yield;
    const range = getMeasureRange(index, meter, length);
    const groups: MeasureAtom[][] = [];
    for (const [, atoms] of yield* orderNotationItems(bar, ([a], [b]) => a - b)) {
      groups.push(
        yield* orderNotationItems(
          atoms,
          (a, b) =>
            a.group.startBeat - b.group.startBeat ||
            a.group.durationBeats - b.group.durationBeats ||
            a.voice - b.voice,
        ),
      );
    }
    const problem = {
      width,
      playable: length === 0 ? width : (range.playableEndBeat - range.startBeat) * TICKS_PER_BEAT,
      voices: voiceCount,
      table,
      groups,
    };
    const exact = yield* exactPlacement(problem);
    if (exact) placements[index] = { candidate: exact, complete: true, certified: true };
    else pending.set(index, createMeasureSearch(problem, limits.frontier));
  }

  // One probe per unresolved bar per round. Done bars return their unused share.
  while (pending.size) {
    for (const [index, search] of pending) {
      yield;
      progress.orderingState = [index, search.probes];
      if (progress.remainingBudgets > 0 && search.probes < limits.probesPerMeasure) {
        stepMeasureSearch(search);
        progress.remainingBudgets--;
      }
      progress.frontier = search.frontier;
      progress.bestCandidate = search.bestCandidate;
      progress.certificationEvidence = { certified: search.done && !search.pruned };

      const exhausted = progress.remainingBudgets === 0 || search.probes >= limits.probesPerMeasure;
      if (search.done || exhausted) {
        const limited = !search.done || search.pruned;
        placements[index] = {
          candidate: search.bestCandidate,
          complete: search.complete,
          certified: !limited && search.complete,
          reason: search.provedInfeasible ? 'infeasible' : limited ? 'budget-exhausted' : undefined,
        };
        pending.delete(index);
      }
    }
  }

  let tokensUsed = 0;
  for (const [index, placement] of placements.entries()) {
    yield;
    const bar = getMeasureRange(index, meter, length);
    const absoluteStart = index * width;
    const { candidate } = placement;
    const tokenCount = candidate.fragments + candidate.restFragments;
    if (tokensUsed + tokenCount > MAX_SCORE_TOKENS) {
      classification = 'partial';
      const reason = 'display-limit';
      const certificationEvidence = { certified: false, reason } as const;
      localResults.push({ measureIndex: index, classification: 'partial', certificationEvidence });
      diagnostics.push({
        code: 'display-limit',
        reason,
        scope: { sourceNoteIds: [], measureIndex: index },
        message: 'The measure exceeds the remaining written token budget.',
      });

      for (const group of bars[index]!.values()) {
        for (const atom of group) {
          for (const note of atom.group.notes) {
            yield;
            diagnostics.push({
              code: 'omitted-event',
              reason,
              scope: { sourceNoteIds: [note.id], measureIndex: index, voiceId: atom.voice },
              message: 'Source event exceeds the available notation token budget.',
            });
          }
        }
      }
      measures.push({
        index,
        sourceInterval: [bar.startBeat, bar.endBeat],
        playableInterval: [bar.startBeat, bar.playableEndBeat],
        writtenRange: [absoluteStart, absoluteStart + width],
        writtenPlaybackCutoff: null,
        visualTail: null,
        voices: [],
      });
      continue;
    }

    tokensUsed += tokenCount;
    const partial = !placement.complete;
    const exact =
      !partial &&
      candidate.error === 0n &&
      Math.abs(candidate.cutoff / TICKS_PER_BEAT + bar.startBeat - bar.playableEndBeat) <=
        TIMING_EPSILON;
    const certified = exact || (placement.certified && !hasCrossBarNotes);
    const local: PreparationClass = partial
      ? 'partial'
      : exact
        ? 'exact'
        : certified
          ? 'optimal'
          : 'bounded';
    const reason = placement.reason ?? (certified ? undefined : 'uncertified');
    classification = worst(classification, local);
    localResults.push({
      measureIndex: index,
      classification: local,
      certificationEvidence: { certified, reason },
    });

    const voices: ScoreEvent[][] = Array.from({ length: voiceCount }, () => []);
    const ends = Array.from({ length: voiceCount }, () => 0);
    const represented = new Set<MeasureAtom>();
    const onsets = new Map<number, { tick: number; ids: string[] }>();

    function* emit(voice: number, from: number, to: number, atom?: MeasureAtom) {
      let tick = absoluteStart + from;
      const source = atom?.group.notes ?? [];
      const ids = source.map((note) => note.id);
      for (const token of rhythmTokens(table, to - from)) {
        yield;
        const id = JSON.stringify([index, voice, tick, ids]);
        const next = tick + token.ticks;
        const segment: ScoreEvent = {
          id,
          voiceId: voice,
          measureIndex: index,
          startTick: tick,
          durationTicks: token.ticks,
          startBeat: tick / TICKS_PER_BEAT,
          baseDuration: token.duration,
          sourceNoteIds: ids,
          duration: token.duration,
          beats: token.beats,
          dots: token.dots,
          notes: source,
          isRest: !atom,
          tieFromPrevious: false,
          tieToNext: false,
        };
        for (const note of source) {
          yield;
          const previous = previews.get(note.id);
          if (previous?.end === tick) {
            continuities.push({ sourceNoteId: note.id, fragmentEndpoints: [previous.id, id] });
            segment.tieFromPrevious = true;
          }
          previews.set(note.id, {
            start: previous?.start ?? tick,
            end: next,
            duration: (previous?.duration ?? 0) + token.ticks,
            id,
          });
        }
        voices[voice]!.push(segment);
        tick = next;
      }
    }

    for (const { atom, start, end } of candidate.atoms) {
      yield;
      represented.add(atom);
      yield* emit(atom.voice, ends[atom.voice]!, start);
      yield* emit(atom.voice, start, end, atom);
      ends[atom.voice] = end;
      if (!atom.incoming) {
        const source = atom.group.startBeat;
        const group = onsets.get(source) ?? { tick: absoluteStart + start, ids: [] };
        for (const note of atom.group.notes) group.ids.push(note.id);
        onsets.set(source, group);
      }
    }

    for (const [sourceOnsetBeat, group] of onsets) {
      yield;
      onsetGroups.push({ sourceOnsetBeat, sourceNoteIds: group.ids, writtenOnsetTick: group.tick });
    }

    for (const atoms of bars[index]!.values()) {
      for (const atom of atoms) {
        if (represented.has(atom)) continue;
        for (const note of atom.group.notes) {
          yield;
          diagnostics.push({
            code: 'omitted-event',
            reason,
            scope: { sourceNoteIds: [note.id], measureIndex: index, voiceId: atom.voice },
            message: 'Source event has no written fragment in this measure.',
          });
        }
      }
    }

    for (const [voice, end] of ends.entries()) {
      yield* emit(voice, end, candidate.cutoff);
      yield* emit(voice, candidate.cutoff, width);
    }

    const padded = bar.playableEndBeat < bar.endBeat;
    const writtenPlaybackCutoff = length === 0 ? absoluteStart : absoluteStart + candidate.cutoff;
    measures.push({
      index,
      voices: voices.map((segments, id) => ({ id, segments })),
      sourceInterval: [bar.startBeat, bar.endBeat],
      playableInterval: [bar.startBeat, bar.playableEndBeat],
      writtenRange: [absoluteStart, absoluteStart + width],
      writtenPlaybackCutoff,
      visualTail: padded ? [writtenPlaybackCutoff, absoluteStart + width] : null,
    });
  }

  const outgoing = new Set<string>();
  for (const edge of continuities) {
    yield;
    outgoing.add(edge.fragmentEndpoints[0]);
  }
  for (const measure of measures) {
    for (const voice of measure.voices) {
      for (const event of voice.segments) {
        yield;
        event.tieToNext = outgoing.has(event.id);
      }
    }
  }

  for (const note of valid) {
    yield;
    const shown = previews.get(note.id);
    if (!shown) continue;
    const startBeat = shown.start / TICKS_PER_BEAT;
    const durationBeats = shown.duration / TICKS_PER_BEAT;
    const deviations = {
      onsetBeats: startBeat - note.startBeat,
      durationBeats: durationBeats - note.durationBeats,
    };
    if (
      Math.abs(deviations.onsetBeats) <= TIMING_EPSILON &&
      Math.abs(deviations.durationBeats) <= TIMING_EPSILON
    )
      continue;
    const timing: TimingDeviation = {
      sourceNoteId: note.id,
      sourceTiming: { startBeat: note.startBeat, durationBeats: note.durationBeats },
      writtenTiming: { startBeat, durationBeats },
      deviations,
    };
    diagnostics.push({
      code: 'timing-approximation',
      scope: { sourceNoteIds: [note.id] },
      message: 'Written timing differs from the original event.',
      timing,
    });
  }

  return {
    classification,
    localResults,
    measures,
    diagnostics: yield* orderNotationItems(diagnostics, compareDiagnostics),
    continuities,
    onsetGroups,
    certificationEvidence: {
      certified: classification === 'exact' || classification === 'optimal',
      reason:
        localResults.find((item) => item.classification === classification)?.certificationEvidence
          .reason ?? (classification === 'partial' ? 'display-limit' : undefined),
    },
  };
}
