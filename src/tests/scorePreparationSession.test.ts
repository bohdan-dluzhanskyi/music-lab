import { expect, it, vi } from 'vitest';
import { initializeScoreSearch } from '@/core/notation/score';
import {
  createScorePreparationSession,
  type PreparationInput,
} from '@/features/notation/scorePreparationSession';
import { scoreNote } from './fixtures/pianoGrandStaff';

const input: PreparationInput = {
  trackId: 'track-a',
  notes: [scoreNote('a', 0.1, 0.5), scoreNote('b', 0.1, 1, 440)],
  lengthBeats: 4,
  timeSignature: [4, 4],
};

function harness(workPerSlice: number) {
  const queue = new Map<number, () => void>();
  let id = 0;
  const init = vi.fn((input: PreparationInput) =>
    initializeScoreSearch(input.notes, input.lengthBeats, input.timeSignature, {
      probesPerScore: 1500,
    }),
  );
  const session = createScorePreparationSession({
    schedule: (callback) => {
      queue.set(++id, callback);
      return id;
    },
    cancel: (ticket) => {
      queue.delete(ticket);
    },
    workPerSlice,
    initialize: init,
  });
  const tick = () => {
    const entry = queue.entries().next().value;
    if (!entry) throw Error('Expected pending work');
    queue.delete(entry[0]);
    entry[1]();
  };
  const drain = () => {
    let count = 0;
    while (queue.size && count++ < 10000) tick();
    expect(queue.size).toBe(0);
  };
  return { session, init, queue, tick, drain };
}

it('resumes slices, retains a feasible incumbent and gets identical results for a fixed budget', () => {
  const small = harness(17);
  small.session.request(input);
  const progress = small.init.mock.results[0]!.value!;
  while (!progress.bestCandidate?.represented && small.queue.size) small.tick();
  expect(progress.position).toBeGreaterThan(0);
  expect(progress.bestCandidate?.represented).toBeGreaterThan(0);
  small.drain();
  const large = harness(121);
  large.session.request(input);
  large.drain();
  expect(small.session.getSnapshot()).toEqual(large.session.getSnapshot());
});

it('cancels an in-bar continuation, rejects stale results and invalidates renderer ownership', () => {
  const { session, init, queue, tick, drain } = harness(17);
  const published = vi.fn();
  session.subscribe(published);
  const first = session.request(input);
  while (!init.mock.results[0]!.value?.orderingState.length && queue.size) tick();
  expect(init.mock.results[0]!.value?.orderingState.length).toBeGreaterThan(0);
  const staleWork = queue.values().next().value!;
  const second = session.request({ ...input, trackId: 'other' });
  staleWork();
  expect(session.isCurrent(first)).toBe(false);
  expect(session.isCurrent(second)).toBe(true);
  const third = session.request({ ...input, trackId: 'other', notes: [scoreNote('fresh', 0, 1)] });
  drain();
  expect(published).toHaveBeenCalledTimes(4);
  expect(session.getSnapshot()).toMatchObject({
    status: 'ready',
    requestId: third,
    result: { classification: 'exact' },
  });
  expect(session.isCurrent(second)).toBe(false);
  session.cancel();
  expect(session.isCurrent(third)).toBe(false);
  expect(session.getSnapshot()).toEqual({ status: 'idle' });
});

it('initializes only once for stable input and gives both consumers the same score object', () => {
  const { session, init, drain } = harness(80);
  const a = session.request(input);
  const b = session.request({ ...input, timeSignature: [4, 4] });
  expect(a).toBe(b);
  drain();
  const staff = session.getSnapshot();
  session.request(input);
  const tab = session.getSnapshot();
  expect(staff).toBe(tab);
  expect(staff.status).toBe('ready');
  expect(init).toHaveBeenCalledTimes(1);
});
