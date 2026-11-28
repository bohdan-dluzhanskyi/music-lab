import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compositionEditGate } from '@/stores/compositionEditGate';
import { pianoFixture } from './fixtures/pianoGrandStaff';

const engine = vi.hoisted(() => ({
  play: vi.fn<(...args: unknown[]) => Promise<boolean>>(async () => true),
  stop: vi.fn(),
  setVolume: vi.fn(),
  getPosition: vi.fn(() => 0),
  getOmittedCount: () => 0,
  hasEnded: vi.fn(() => false),
}));
vi.mock('@/engines/audio/Sequencer', () => ({ sequencer: engine }));
vi.hoisted(() => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (name: string) => data.get(name) ?? null,
    setItem: vi.fn((name: string, value: string) => {
      data.set(name, value);
    }),
    removeItem: (name: string) => data.delete(name),
    clear: () => data.clear(),
  };
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('window', { localStorage: storage });
});

const { useCompositionStore } = await import('@/stores/composition.store');
const { useSequencerStore } = await import('@/stores/sequencer.store');

const key = 'music-lab-composition-v1';
const store = useCompositionStore.getState;
const transport = useSequencerStore.getState;
const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;

function snapshot() {
  const { composition, past, future, selectedTrackId, selectedNoteId } = store();
  return {
    composition,
    past,
    future,
    selectedTrackId,
    selectedNoteId,
    persisted: localStorage.getItem(key),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  engine.play.mockReset().mockResolvedValue(true);
  engine.hasEnded.mockReturnValue(false);
  engine.getPosition.mockReturnValue(0);
  localStorage.clear();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  transport().stop();
  if (transport().loop) transport().toggleLoop();
  const { composition } = pianoFixture().state;
  useCompositionStore.setState({
    composition,
    selectedTrackId: 'piano',
    selectedNoteId: 'bass',
    past: [{ ...composition, name: 'Prior' }],
    future: [{ ...composition, name: 'Future' }],
  });
});

afterEach(() => {
  transport().stop();
  frames.clear();
});

function delayStartup() {
  let finish!: (started: boolean) => void;
  engine.play.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  return () => finish(true);
}

function runFrame() {
  const [next] = frames;
  if (!next) throw new Error('Expected an active frame');
  frames.delete(next[0]);
  next[1](0);
}

describe('composition edit protection', () => {
  it.each(['initializing', 'playing'] as const)(
    'rejects every mutation without side effects while %s',
    async (phase) => {
      const finish = phase === 'initializing' ? delayStartup() : undefined;
      const starting = transport().play();
      if (!finish) await starting;
      expect(transport().status).toBe(phase);
      const before = snapshot();
      const generateId = vi.spyOn(crypto, 'randomUUID');
      const track = before.composition.tracks[0]!;
      const actions = store();
      const attempts = {
        name: () => actions.setName('Blocked'),
        bpm: () => actions.setBpm(99),
        addNote: () => actions.addNote(track.id, 450.123, 0.75),
        updateNote: () =>
          actions.updateNote(track.id, 'bass', {
            frequency: 450.123,
            startBeat: 0.3,
            durationBeats: 0.7,
            velocity: 0.2,
          }),
        removeNote: () => actions.removeNote(track.id, 'bass'),
        addTrack: actions.addTrack,
        removeTrack: () => actions.removeTrack(track.id),
        trackName: () => actions.updateTrack(track.id, { name: 'Blocked' }),
        gain: () => actions.updateTrack(track.id, { volume: 0.3 }),
        mute: () => actions.updateTrack(track.id, { muted: true }),
        solo: () => actions.updateTrack(track.id, { solo: false }),
        synth: () =>
          actions.updateTrack(track.id, { synth: { ...track.synth, waveform: 'triangle' } }),
        undo: actions.undo,
        redo: actions.redo,
        reset: actions.reset,
        import: () => actions.importSequence(track.notes, 'Imported', 100),
      };
      vi.mocked(localStorage.setItem).mockClear();
      for (const [name, run] of Object.entries(attempts)) {
        run();
        expect(snapshot(), name).toEqual(before);
        expect(store().composition, name).toBe(before.composition);
        expect(store().past, name).toBe(before.past);
        expect(store().future, name).toBe(before.future);
      }
      expect(generateId).not.toHaveBeenCalled();
      expect(localStorage.setItem).not.toHaveBeenCalled();
      actions.selectTrack('bass');
      actions.selectNote('pedal');
      expect(snapshot()).toMatchObject({
        selectedTrackId: 'bass',
        selectedNoteId: 'pedal',
        composition: before.composition,
        past: before.past,
        future: before.future,
      });
      expect(JSON.parse(localStorage.getItem(key)!)).toEqual({
        version: 1,
        state: { composition: before.composition, selectedTrackId: 'bass' },
      });
      finish?.();
      await starting;
    },
  );

  it.each(['pause', 'stop'] as const)(
    '%s unlocks pending startup and subsequent Play uses current data',
    async (command) => {
      const finish = delayStartup();
      const starting = transport().play();
      transport()[command]();
      store().updateNote('piano', 'bass', { frequency: 131.123 });
      store().setBpm(150);
      const edited = store().composition;
      finish();
      await starting;
      expect(compositionEditGate.isLocked()).toBe(false);
      expect(edited.bpm).toBe(150);
      expect(edited.tracks[0]!.notes[0]!.pitch.frequency).toBe(131.123);
      await transport().play();
      expect(engine.play.mock.lastCall?.[0]).toBe(edited);
    },
  );

  it('keeps the gate during Seek and Loop and ignores superseded startup', async () => {
    const finish = delayStartup();
    const obsolete = transport().play();
    const initial = store().composition;
    const unlockObservations: boolean[] = [];
    const unsubscribe = useSequencerStore.subscribe(() =>
      unlockObservations.push(!compositionEditGate.isLocked()),
    );
    try {
      transport().seek(1);
      finish();
      await obsolete;
      expect(transport().status).toBe('playing');
      transport().toggleLoop();
      engine.hasEnded.mockReturnValue(true);
      runFrame();
      runFrame();
      expect(transport().status).toBe('initializing');
      expect(transport().position).toBe(0);
      store().reset();
      expect(store().composition).toBe(initial);
      expect(unlockObservations).not.toContain(true);
    } finally {
      unsubscribe();
    }
  });

  it('unlocks after current startup failure', async () => {
    engine.play.mockRejectedValueOnce(new Error('startup failed'));
    await transport().play();
    expect(transport().status).toBe('paused');
    expect(compositionEditGate.isLocked()).toBe(false);
    store().setName('Editable');
    expect(store().composition.name).toBe('Editable');
  });
});
