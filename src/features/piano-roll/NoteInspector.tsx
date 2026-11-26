import { Trash2 } from 'lucide-react';

import { useCompositionStore } from '@/stores/composition.store';
import { useSequencerStore } from '@/stores/sequencer.store';

import { frequencyToClockAngle } from '@/core/geometry/noteClock';

export default function NoteInspector() {
  const { composition, selectedTrackId, selectedNoteId, updateNote, removeNote } =
    useCompositionStore();

  const playing = useSequencerStore((state) => state.status === 'playing');

  const track = composition.tracks.find((item) => item.id === selectedTrackId);

  const note = track?.notes.find((item) => item.id === selectedNoteId);

  if (!track || !note) {
    return (
      <section className="note-inspector">
        <h2>Note Inspector</h2>
        <p>Select a note</p>
      </section>
    );
  }

  const fields = [
    {
      key: 'frequency',
      label: 'Frequency (Hz)',
      value: note.pitch.frequency,
      min: 20,
      max: 20000,
      step: 'any',
    },
    {
      key: 'startBeat',
      label: 'Start beat',
      value: note.startBeat,
      min: 0,
      max: 1024,
      step: 0.125,
    },
    {
      key: 'durationBeats',
      label: 'Duration (beats)',
      value: note.durationBeats,
      min: 0.01,
      max: 128,
      step: 0.125,
    },
    {
      key: 'velocity',
      label: 'Velocity',
      value: note.velocity,
      min: 0,
      max: 1,
      step: 0.01,
    },
  ] as const;

  return (
    <section className="note-inspector">
      <header className="composer-panel-header">
        <h2>Note Inspector</h2>

        <button
          disabled={playing}
          aria-label="Delete note"
          onClick={() => removeNote(track.id, note.id)}
        >
          <Trash2 size={16} />
        </button>
      </header>

      <div className="note-inspector__pitch">
        <strong>
          {note.pitch.note}
          {note.pitch.octave}
        </strong>

        <span>{note.pitch.cents.toFixed(2)} cents</span>
      </div>

      {fields.map((field) => (
        <label key={field.key}>
          {field.label}

          <input
            key={`${note.id}-${field.value}`}
            type="number"
            defaultValue={field.value}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={playing}
            onBlur={(event) => {
              const value = event.target.valueAsNumber;

              if (Number.isFinite(value) && value >= field.min && value <= field.max) {
                if (value !== field.value) {
                  updateNote(track.id, note.id, {
                    [field.key]: value,
                  });
                }
              } else {
                event.target.value = String(field.value);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
        </label>
      ))}

      <div className="note-inspector__details">
        <span>MIDI: {note.pitch.midi.toFixed(4)}</span>

        <span>Angle (A440): {frequencyToClockAngle(note.pitch.frequency).toFixed(2)}°</span>
      </div>
    </section>
  );
}
