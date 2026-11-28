import type { NoteEvent } from '@/core/types/music.types';
import { compositionEditGate } from '@/stores/compositionEditGate';
import { useCompositionStore } from '@/stores/composition.store';
import { useSequencerStore } from '@/stores/sequencer.store';

export function transferSequence(
  sequence: readonly NoteEvent[],
  name: string,
  totalBeats: number,
  bpm: number,
  navigate: (path: string) => void,
): void {
  if (compositionEditGate.isLocked()) return;

  useSequencerStore.getState().stop();
  const { importSequence, setBpm } = useCompositionStore.getState();
  importSequence(sequence, name, totalBeats);
  setBpm(bpm);
  navigate('/composer');
}
