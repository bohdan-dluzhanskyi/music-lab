import type { PreparationLimit } from '@/core/types/notation.types';
import {
  fragmentCount,
  TICKS_PER_BEAT,
  TICK_STRIDE,
  TIMING_EPSILON,
  type RhythmTable,
} from './rhythm';
import type { NoteGroup } from './voices';

export interface MeasureAtom {
  group: NoteGroup;
  voice: number;
  onset: number;
  end: number;
  incoming: boolean;
  outgoing: boolean;
}

export interface PlacedAtom {
  atom: MeasureAtom;
  start: number;
  end: number;
}

type Rank = {
  error: bigint;
  fragments: number;
  ties: number;
  restFragments: number;
};

export type PlacementCandidate = Rank & {
  atoms: readonly PlacedAtom[];
  ends: readonly number[];
  cutoff: number;
  represented: number;
};

export interface MeasurePlacement {
  candidate: PlacementCandidate;
  complete: boolean;
  certified: boolean;
  reason?: PreparationLimit;
}

interface Problem {
  groups: readonly (readonly MeasureAtom[])[];
  width: number;
  playable: number;
  voices: number;
  table: RhythmTable;
}

export interface SearchLimits {
  frontier: number;
  probesPerMeasure: number;
  probesPerScore: number;
}

export const DEFAULT_SEARCH_LIMITS: Readonly<SearchLimits> = {
  frontier: 256,
  probesPerMeasure: 32768,
  probesPerScore: 2_000_000,
};

export interface MeasureSearch {
  work: Generator<void, void>;
  bestCandidate: PlacementCandidate;
  probes: number;
  done: boolean;
  pruned: boolean;
  complete: boolean;
  provedInfeasible: boolean;
  frontier: number[];
}

function errorUnits(written: number, source: number): bigint {
  const error = Math.abs(written - source) / TICKS_PER_BEAT;
  return error <= TIMING_EPSILON ? 0n : BigInt(Math.round(error * 1e9));
}

function compare(a: PlacementCandidate, b: PlacementCandidate, playable: number): number {
  const rank =
    b.represented - a.represented ||
    (a.error < b.error ? -1 : a.error > b.error ? 1 : 0) ||
    a.fragments - b.fragments ||
    a.ties - b.ties ||
    a.restFragments - b.restFragments;
  if (rank) return rank;

  for (let index = 0; index < Math.min(a.atoms.length, b.atoms.length); index++) {
    const left = a.atoms[index]!;
    const right = b.atoms[index]!;
    const order = left.start - right.start || left.end - left.start - (right.end - right.start);
    if (order) return order;
  }

  return (
    Number(errorUnits(a.cutoff, playable) - errorUnits(b.cutoff, playable)) || a.cutoff - b.cutoff
  );
}

// Visit stride-aligned values in increasing distance from the source target.
function* ticksNear(target: number, first: number, last: number): Generator<number> {
  let left = Math.min(last, Math.floor(target / TICK_STRIDE) * TICK_STRIDE);
  let right = Math.max(first, left + TICK_STRIDE);
  while (left >= first || right <= last) {
    if (left >= first && (right > last || target - left <= right - target)) {
      yield left;
      left -= TICK_STRIDE;
    } else {
      yield right;
      right += TICK_STRIDE;
    }
  }
}

function addAtom(
  problem: Problem,
  previous: PlacementCandidate,
  atom: MeasureAtom,
  start: number,
  end: number,
) {
  if (end <= start) return;
  const noteCount = fragmentCount(problem.table, end - start);
  const restCount = fragmentCount(problem.table, start - previous.ends[atom.voice]!);
  if (!Number.isFinite(noteCount + restCount)) return;

  const ends = [...previous.ends];
  ends[atom.voice] = end;
  const count = atom.group.notes.length;
  const error =
    BigInt(count) *
    ((atom.incoming ? 0n : errorUnits(start, atom.onset)) +
      (atom.outgoing ? 0n : errorUnits(end, atom.end)));
  return {
    atoms: [...previous.atoms, { atom, start, end }],
    ends,
    cutoff: previous.cutoff,
    represented: previous.represented + count,
    error: previous.error + error,
    fragments: previous.fragments + noteCount,
    ties: previous.ties + count * (noteCount - 1 + Number(atom.incoming)),
    restFragments: previous.restFragments + restCount,
  };
}

function finish(
  problem: Problem,
  candidate: PlacementCandidate,
  cutoff: number,
): PlacementCandidate | undefined {
  const tail = fragmentCount(problem.table, problem.width - cutoff);
  let restFragments = candidate.restFragments;
  for (const end of candidate.ends) {
    restFragments += fragmentCount(problem.table, cutoff - end) + tail;
  }

  if (!Number.isFinite(restFragments)) return;
  return { ...candidate, restFragments, cutoff };
}

function initialCandidate(problem: Problem): PlacementCandidate {
  return {
    atoms: [],
    ends: Array.from({ length: problem.voices }, () => 0),
    cutoff: problem.width,
    represented: 0,
    error: 0n,
    fragments: 0,
    ties: 0,
    restFragments: 0,
  };
}

export function* exactPlacement(problem: Problem): Generator<void, PlacementCandidate | undefined> {
  let candidate = initialCandidate(problem);
  let previousStart = -TICK_STRIDE;
  for (const group of problem.groups) {
    const start = Math.round(group[0]!.onset);
    if (start <= previousStart) return;
    for (const atom of group) {
      yield;
      const end = Math.round(atom.end);
      if (errorUnits(start, atom.onset) || errorUnits(end, atom.end)) return;
      const next = addAtom(problem, candidate, atom, start, end);
      if (!next) return;
      candidate = next;
    }
    previousStart = start;
  }
  const cutoff = Math.round(problem.playable);
  if (problem.playable < problem.width && cutoff >= problem.width) return;
  if (errorUnits(cutoff, problem.playable)) return;
  return finish(problem, candidate, cutoff);
}

function* cutoffs(problem: Problem): Generator<number> {
  if (problem.playable === problem.width) yield problem.width;
  else yield* ticksNear(problem.playable, 0, problem.width - TICK_STRIDE);
}

export function createMeasureSearch(problem: Problem, frontierLimit: number): MeasureSearch {
  const empty = initialCandidate(problem);
  const state: MeasureSearch = {
    work: search(),
    bestCandidate:
      finish(problem, empty, problem.playable === problem.width ? problem.width : 0) ?? empty,
    probes: 0,
    done: false,
    pruned: false,
    complete: false,
    provedInfeasible: false,
    frontier: [],
  };

  const update = (result: PlacementCandidate, complete: boolean) => {
    if (compare(result, state.bestCandidate, problem.playable) < 0) state.bestCandidate = result;
    if (complete) state.complete = true;
  };

  function* finishCandidate(candidate: PlacementCandidate, complete: boolean): Generator<void> {
    for (const cutoff of cutoffs(problem)) {
      const result = finish(problem, candidate, cutoff);
      if (result) update(result, complete);
      yield;
      // A partial incumbent only needs a legal cutoff. Full results rank all
      // cutoffs, since rest fragment count precedes cutoff distance.
      if (result && !complete) return;
    }
  }

  function* visit(
    groupIndex: number,
    previousStart: number,
    candidate: PlacementCandidate,
    allowOmissions = false,
  ): Generator<void> {
    if (groupIndex === problem.groups.length) {
      yield* finishCandidate(candidate, !allowOmissions);
      return;
    }
    if (state.frontier.length >= frontierLimit) {
      state.pruned = true;
      return;
    }
    const group = problem.groups[groupIndex]!;
    const first = group[0]!;
    const onsets = group.some((atom) => atom.incoming)
      ? [0]
      : ticksNear(first.onset, previousStart + TICK_STRIDE, problem.width - TICK_STRIDE);
    state.frontier.push(groupIndex);
    for (const onset of onsets) {
      yield;
      if (onset <= previousStart) continue;
      yield* assign(group, 0, onset, candidate, groupIndex, allowOmissions);
    }
    if (allowOmissions) {
      yield;
      yield* visit(groupIndex + 1, previousStart, candidate, true);
    }
    state.frontier.pop();
  }

  function* assign(
    group: readonly MeasureAtom[],
    index: number,
    onset: number,
    candidate: PlacementCandidate,
    groupIndex: number,
    allowOmissions: boolean,
  ): Generator<void> {
    if (index === group.length) {
      yield* visit(groupIndex + 1, onset, candidate, allowOmissions);
      if (!state.complete) yield* finishCandidate(candidate, false);
      return;
    }
    if (state.frontier.length >= frontierLimit) {
      state.pruned = true;
      return;
    }
    state.frontier.push(index);
    const atom = group[index]!;
    const ends = atom.outgoing
      ? [problem.width]
      : ticksNear(atom.end, onset + TICK_STRIDE, problem.width);

    for (const end of ends) {
      yield;
      const next = addAtom(problem, candidate, atom, onset, end);
      if (next && (!state.complete || next.error <= state.bestCandidate.error)) {
        yield* assign(group, index + 1, onset, next, groupIndex, allowOmissions);
      }
    }
    state.frontier.pop();
  }

  function* search(): Generator<void> {
    yield* finishCandidate(empty, false);
    yield* visit(0, -TICK_STRIDE, empty);
    if (!state.complete) {
      state.provedInfeasible = !state.pruned;
      yield* visit(0, -TICK_STRIDE, empty, true);
    }
  }

  return state;
}

export function stepMeasureSearch(state: MeasureSearch): void {
  const next = state.work.next();
  if (next.done) state.done = true;
  else state.probes++;
}
