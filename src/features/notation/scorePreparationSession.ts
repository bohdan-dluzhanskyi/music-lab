import type { NoteEvent } from '@/core/types/music.types';
import {
  advanceScoreSearch,
  initializeScoreSearch,
  type PreparedScore,
} from '@/core/notation/score';

export interface PreparationInput {
  trackId: string;
  notes: readonly NoteEvent[];
  lengthBeats: number;
  timeSignature: readonly [number, number];
}

type Snapshot =
  | { status: 'idle' }
  | { status: 'preparing'; requestId: number; input: PreparationInput }
  | { status: 'ready'; requestId: number; input: PreparationInput; result: PreparedScore }
  | { status: 'error'; requestId: number; input: PreparationInput; message: string };

interface Scheduler {
  schedule: (work: () => void) => number;
  cancel: (ticket: number) => void;
  workPerSlice?: number;
  initialize?: (input: PreparationInput) => ReturnType<typeof initializeScoreSearch>;
}

export function samePreparationInput(a: PreparationInput, b: PreparationInput) {
  return (
    a.trackId === b.trackId &&
    a.notes === b.notes &&
    a.lengthBeats === b.lengthBeats &&
    a.timeSignature[0] === b.timeSignature[0] &&
    a.timeSignature[1] === b.timeSignature[1]
  );
}

export function createScorePreparationSession({
  schedule,
  cancel,
  workPerSlice = 2048,
  initialize = (input) =>
    initializeScoreSearch(input.notes, input.lengthBeats, input.timeSignature),
}: Scheduler) {
  let generation = 0;
  let consumers = 0;
  let scheduled: number | undefined;
  let snapshot: Snapshot = { status: 'idle' };
  const listeners = new Set<() => void>();

  function invalidate() {
    generation++;
    if (scheduled !== undefined) cancel(scheduled);
    scheduled = undefined;
    return generation;
  }

  function publish(next: Snapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function stop() {
    invalidate();
    if (snapshot.status !== 'idle') publish({ status: 'idle' });
  }

  return {
    attach() {
      consumers++;
      return () => {
        consumers--;
        // React Strict Mode reattaches before queued cleanup runs.
        queueMicrotask(() => {
          if (consumers === 0) stop();
        });
      };
    },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    isCurrent: (requestId: number) => requestId === generation && snapshot.status !== 'idle',
    request(input: PreparationInput) {
      if (snapshot.status !== 'idle' && samePreparationInput(snapshot.input, input)) {
        return snapshot.requestId;
      }

      const requestId = invalidate();
      publish({ status: 'preparing', requestId, input });

      function fail(error: unknown) {
        if (requestId !== generation) return;
        publish({
          status: 'error',
          requestId,
          input,
          message: error instanceof Error ? error.message : 'Unable to prepare score',
        });
      }

      try {
        const state = initialize(input);
        function run() {
          if (requestId !== generation) return;
          scheduled = undefined;
          try {
            const step = advanceScoreSearch(state, workPerSlice);
            if (requestId !== generation) return;
            if (step.status === 'pending') scheduled = schedule(run);
            else publish({ status: 'ready', requestId, input, result: step.result });
          } catch (error) {
            fail(error);
          }
        }
        if (requestId === generation) scheduled = schedule(run);
      } catch (error) {
        fail(error);
      }

      return requestId;
    },
    cancel: stop,
  };
}
