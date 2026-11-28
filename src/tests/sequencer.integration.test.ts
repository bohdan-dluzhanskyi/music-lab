import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pianoFixture, scoreNote } from './fixtures/pianoGrandStaff';

const audio = vi.hoisted(() => ({
  time: 0,
  start: vi.fn(async () => {}),
  voices: [] as {
    attack: ReturnType<typeof vi.fn>;
    release: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }[],
  queue: new Map<number, () => void>(),
  ticket: 0,
  gains: [] as number[],
  ramps: [] as number[],
  disposed: vi.fn(),
}));
vi.mock('tone', () => {
  class Node {
    dispose = vi.fn(() => audio.disposed());
    connect() {
      return this;
    }
    toDestination() {
      return this;
    }
  }
  return {
    start: audio.start,
    now: () => audio.time,
    immediate: () => audio.time,
    getContext: () => ({
      setTimeout: (fn: () => void) => {
        audio.queue.set(++audio.ticket, fn);
        return audio.ticket;
      },
      clearTimeout: (ticket: number) => audio.queue.delete(ticket),
    }),
    Limiter: Node,
    Gain: class extends Node {
      gain = { rampTo: (value: number) => audio.ramps.push(value) };
      constructor(value: number) {
        super();
        audio.gains.push(value);
      }
    },
    Synth: class extends Node {
      attack = vi.fn();
      release = vi.fn();
      triggerAttack = this.attack;
      triggerRelease = this.release;
      constructor() {
        super();
        audio.voices.push(this);
      }
    },
  };
});

import { sequencer } from '@/engines/audio/Sequencer';
import { useSequencerStore } from '@/stores/sequencer.store';
import { useCompositionStore } from '@/stores/composition.store';
import { useProjectStore } from '@/stores/project.store';
import { compositionEditGate } from '@/stores/compositionEditGate';

const transport = () => useSequencerStore.getState();
const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
    frames.set(++frameId, fn);
    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  transport().stop();
  if (transport().loop) transport().toggleLoop();
  audio.time = 0;
  audio.voices.length = 0;
  audio.gains.length = 0;
  audio.ramps.length = 0;
  audio.disposed.mockClear();
});

describe('composition playback sessions', () => {
  it('leases distinct voices for equal frequencies and microtones, and clips a seek into all of them', async () => {
    const { composition } = pianoFixture().state;
    composition.tracks[0]!.notes = [
      scoreNote('long', 0, 4, 440),
      scoreNote('short', 0, 3, 440),
      scoreNote('micro', 0, 2.5, 440.02),
    ];
    const original = structuredClone(composition);
    expect(await sequencer.play(composition, 2, 0.8)).toBe(true);
    expect(audio.gains).toEqual([0.2, 0.75]);
    expect(audio.voices.map(({ attack }) => attack.mock.calls[0]?.[0])).toEqual([440, 440, 440.02]);
    const releases = audio.voices.map(({ release }) => release.mock.calls[0]?.[0] as number);
    expect(releases[0]! - releases[1]!).toBeCloseTo(0.5);
    expect(releases[1]! - releases[2]!).toBeCloseTo(0.25);
    const queued = [...audio.queue.values()];
    sequencer.stop();
    queued.forEach((callback) => callback());
    expect(audio.voices).toHaveLength(3);
    expect(audio.voices.every(({ dispose }) => dispose.mock.calls.length === 1)).toBe(true);
    expect(audio.queue.size).toBe(0);
    expect(audio.disposed).toHaveBeenCalledTimes(6);
    expect(composition).toEqual(original);
    expect(await sequencer.play(composition, 5.5)).toBe(false);
  });

  it('retains the edit lock during seek, ignores stale startup and pauses at the pending target', async () => {
    const { composition } = pianoFixture().state;
    useCompositionStore.setState({ composition });
    let finish!: () => void;
    audio.start.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const starting = transport().play();
    expect(transport().status).toBe('initializing');
    expect(compositionEditGate.isLocked()).toBe(true);
    transport().seek(1);
    expect(compositionEditGate.isLocked()).toBe(true);
    expect(transport().position).toBe(1);
    transport().pause();
    finish();
    await starting;
    expect(transport().status).toBe('paused');
    expect(transport().position).toBe(1);
    expect(compositionEditGate.isLocked()).toBe(false);
    expect(audio.voices).toHaveLength(0);
  });

  it('reuses an elapsed voice and keeps the lock when looping', async () => {
    const { composition } = pianoFixture().state;
    composition.tracks[0]!.notes = [scoreNote('first', 0, 0.25), scoreNote('second', 2, 0.25)];
    useCompositionStore.setState({ composition });
    transport().toggleLoop();
    await transport().play();
    audio.time = 1;
    for (const [id, callback] of [...audio.queue]) {
      audio.queue.delete(id);
      callback();
    }
    expect(audio.voices).toHaveLength(1);
    expect(audio.voices[0]!.attack).toHaveBeenCalledTimes(2);
    audio.time = 4;
    const [endFrame] = [...frames.values()];
    endFrame?.(0);
    const [, loopFrame] = [...frames.values()];
    loopFrame?.(0);
    await Promise.resolve();
    expect(compositionEditGate.isLocked()).toBe(true);
    transport().stop();
    expect(compositionEditGate.isLocked()).toBe(false);
    expect(audio.queue.size).toBe(0);
  });
  it('deduplicates by source ID, keeps distinct events, and reports deterministic overload', async () => {
    const { composition } = pianoFixture().state;
    const notes = Array.from({ length: 33 }, (_, index) => scoreNote(String(index), 0, 4));
    composition.tracks[0]!.notes = [notes[0]!, ...notes];
    await sequencer.play(composition);
    expect(audio.voices).toHaveLength(32);
    expect(sequencer.getOmittedCount()).toBe(1);
    expect(audio.voices.every(({ attack }) => attack.mock.calls.length === 1)).toBe(true);
    sequencer.stop();
  });

  it('uses the latest master volume and keeps a newer session through stale rejection', async () => {
    const { composition } = pianoFixture().state;
    useCompositionStore.setState({ composition });
    let rejectStart!: (error: Error) => void;
    audio.start.mockImplementationOnce(
      () =>
        new Promise<void>((_, reject) => {
          rejectStart = reject;
        }),
    );
    const stale = transport().play();
    transport().seek(0.5);
    useProjectStore.setState({ volume: 0.4 });
    await Promise.resolve();
    await Promise.resolve();
    expect(transport().status).toBe('playing');
    expect(audio.ramps.at(-1)).toBe(0.1);
    rejectStart(Error('obsolete startup'));
    await stale;
    expect(transport().error).toBeNull();
    expect(compositionEditGate.isLocked()).toBe(true);
    expect(audio.voices.every(({ dispose }) => !dispose.mock.calls.length)).toBe(true);
    audio.time = 0.2;
    transport().pause();
    expect(transport().position).toBeCloseTo(0.7);
    expect(compositionEditGate.isLocked()).toBe(false);
  });

  it('publishes recoverable initialization failure without holding the lock', async () => {
    const { composition } = pianoFixture().state;
    useCompositionStore.setState({ composition });
    audio.start.mockRejectedValueOnce(Error('context unavailable'));
    await transport().play();
    expect(transport()).toMatchObject({ status: 'paused', error: 'context unavailable' });
    expect(compositionEditGate.isLocked()).toBe(false);
    expect(audio.voices).toHaveLength(0);
  });
});
