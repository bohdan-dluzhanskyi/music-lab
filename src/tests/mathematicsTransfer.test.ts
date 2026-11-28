import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { transferSequence } from '@/features/mathematics/transferSequence';
import { useCompositionStore } from '@/stores/composition.store';
import { useSequencerStore } from '@/stores/sequencer.store';
import { compositionEditGate } from '@/stores/compositionEditGate';
import { pianoFixture, scoreNote } from './fixtures/pianoGrandStaff';

const store = useCompositionStore.getState;
const transport = useSequencerStore.getState;
const source = [scoreNote('generated', 0.35, 0.65, 271.023)];

beforeEach(() => {
  const { composition, selectedTrackId } = pianoFixture().state;
  useCompositionStore.setState({
    composition,
    selectedTrackId,
    selectedNoteId: 'bass',
    past: [composition],
    future: [composition],
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  useSequencerStore.setState({ status: 'stopped', position: 0 });
});

it.each(['initializing', 'playing'] as const)(
  'rejects Mathematics transfer before any side effect while %s',
  (status) => {
    useSequencerStore.setState({ status, position: 1 });
    const token = compositionEditGate.acquire()!;
    const before = store();
    const stop = vi.spyOn(transport(), 'stop');
    const importNotes = vi.spyOn(store(), 'importSequence');
    const setBpm = vi.spyOn(store(), 'setBpm');
    const navigate = vi.fn();
    try {
      transferSequence(source, 'Generated', 6, 138, navigate);
      expect(stop).not.toHaveBeenCalled();
      expect(importNotes).not.toHaveBeenCalled();
      expect(setBpm).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      expect(store()).toBe(before);
      expect(transport()).toMatchObject({ status, position: 1 });
    } finally {
      compositionEditGate.release(token);
    }
  },
);

it.each(['stopped', 'paused'] as const)(
  'preserves the existing Mathematics tempo transfer while %s',
  (status) => {
    useSequencerStore.setState({ status, position: 1 });
    const navigate = vi.fn();
    const before = store();
    transferSequence(source, 'Generated', 7, 138, navigate);
    expect(transport()).toMatchObject({ status: 'stopped', position: 0 });
    const imported = store().composition.tracks.at(-1)!;
    expect(imported.name).toBe('Generated');
    expect(imported.notes[0]).toMatchObject({
      startBeat: 0.35,
      durationBeats: 0.65,
      pitch: { frequency: 271.023 },
    });
    expect(store().composition).toMatchObject({ bpm: 138, lengthBeats: 7 });
    expect(store().past).toHaveLength(before.past.length + 2);
    expect(store().future).toEqual([]);
    expect(store().selectedTrackId).toBe(imported.id);
    expect(store().selectedNoteId).toBeNull();
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/composer');
  },
);
