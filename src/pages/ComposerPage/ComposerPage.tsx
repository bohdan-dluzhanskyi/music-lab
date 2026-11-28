import { Music, Undo2, Redo2, Plus } from 'lucide-react';

import TrackList from '@/features/composer/TrackList';
import Timeline from '@/features/composer/Timeline';

import PianoRoll from '@/features/piano-roll/PianoRoll';
import NoteInspector from '@/features/piano-roll/NoteInspector';

import { useCompositionStore } from '@/stores/composition.store';
import { isCompositionPlaybackActive, useSequencerStore } from '@/stores/sequencer.store';

import './ComposerPage.scss';

export default function ComposerPage() {
  const { composition, setName, setBpm, past, future, undo, redo, reset } = useCompositionStore();

  const error = useSequencerStore((state) => state.error);
  const editingLocked = useSequencerStore(isCompositionPlaybackActive);

  return (
    <section className="composer-page">
      <header className="composer-page__header">
        <Music size={24} />

        <input
          aria-label="Composition name"
          value={composition.name}
          disabled={editingLocked}
          onChange={(event) => setName(event.target.value)}
        />

        <div className="composer-page__actions">
          <button disabled={editingLocked || !past.length} onClick={undo} aria-label="Undo">
            <Undo2 size={16} />
          </button>

          <button disabled={editingLocked || !future.length} onClick={redo} aria-label="Redo">
            <Redo2 size={16} />
          </button>

          <button
            disabled={editingLocked}
            onClick={() => {
              if (window.confirm('Create a new composition?')) {
                reset();
              }
            }}
          >
            <Plus size={16} />
            New
          </button>

          <label>
            BPM
            <input
              type="number"
              min={20}
              max={300}
              value={composition.bpm}
              disabled={editingLocked}
              onChange={(event) => setBpm(event.target.valueAsNumber)}
            />
          </label>
        </div>
      </header>

      <div className="composer-page__arrangement">
        <TrackList />
        <Timeline />
      </div>

      <div className="composer-page__editor">
        <PianoRoll />
        <NoteInspector />
      </div>

      {error && <p role="alert">{error}</p>}
    </section>
  );
}
