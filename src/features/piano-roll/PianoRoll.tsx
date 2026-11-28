import { useState } from 'react';

import { midiToFrequency } from '@/core/music/frequency';
import { midiToNote } from '@/core/music/notes';

import { getCompositionLength, snapBeat } from '@/core/composition/composition';

import { compositionEditGate } from '@/stores/compositionEditGate';
import { useCompositionStore } from '@/stores/composition.store';
import { isCompositionPlaybackActive, useSequencerStore } from '@/stores/sequencer.store';
import { useAudioStore } from '@/stores/audio.store';

export default function PianoRoll() {
  const [grid, setGrid] = useState(0.5);

  const { composition, selectedTrackId, selectedNoteId, addNote, selectNote } =
    useCompositionStore();

  const position = useSequencerStore((state) => state.position);
  const editingLocked = useSequencerStore(isCompositionPlaybackActive);

  const playTone = useAudioStore((state) => state.playTone);

  const track =
    composition.tracks.find((item) => item.id === selectedTrackId) ?? composition.tracks[0];

  if (!track) return null;

  const minMidi = Math.max(16, Math.min(48, ...track.notes.map((n) => Math.floor(n.pitch.midi))));

  const maxMidi = Math.min(135, Math.max(83, ...track.notes.map((n) => Math.ceil(n.pitch.midi))));

  const keyWidth = 64;
  const rowHeight = 20;
  const beatWidth = 64;

  const rows = maxMidi - minMidi + 1;

  const beats = Math.ceil(getCompositionLength(composition));

  const width = keyWidth + beats * beatWidth;
  const height = rows * rowHeight;

  function selectPianoRollNote(id: string, frequency: number) {
    selectNote(id);
    if (!compositionEditGate.isLocked()) void playTone(frequency, 0.25);
  }

  return (
    <section className="piano-roll">
      <header className="composer-panel-header">
        <h2>Piano Roll — {track.name}</h2>

        <label>
          Grid
          <select value={grid} onChange={(event) => setGrid(Number(event.target.value))}>
            <option value={1}>1/4</option>
            <option value={0.5}>1/8</option>
            <option value={0.25}>1/16</option>
            <option value={0.125}>1/32</option>
          </select>
        </label>
      </header>

      <div className="piano-roll__viewport">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          onDoubleClick={(event) => {
            if (compositionEditGate.isLocked()) return;

            const bounds = event.currentTarget.getBoundingClientRect();

            const x = ((event.clientX - bounds.left) / bounds.width) * width;

            const y = ((event.clientY - bounds.top) / bounds.height) * height;

            if (x < keyWidth) return;

            const midi = maxMidi - Math.floor(y / rowHeight);

            const startBeat = snapBeat((x - keyWidth) / beatWidth, grid);

            const frequency = midiToFrequency(midi);

            if (frequency < 20 || frequency > 20000) {
              return;
            }

            addNote(track.id, frequency, startBeat, grid);

            void playTone(frequency, 0.25);
          }}
        >
          {Array.from({ length: rows }, (_, index) => {
            const midi = maxMidi - index;
            const { note, octave } = midiToNote(midi);

            const black = note.includes('#');

            return (
              <g key={midi}>
                <rect
                  x={0}
                  y={index * rowHeight}
                  width={width}
                  height={rowHeight}
                  fill={black ? 'var(--color-bg)' : 'var(--color-surface)'}
                />

                <rect
                  x={0}
                  y={index * rowHeight}
                  width={keyWidth}
                  height={rowHeight - 1}
                  fill={black ? '#343a35' : '#d8ddd9'}
                  onClick={() => {
                    const frequency = midiToFrequency(midi);

                    if (!compositionEditGate.isLocked() && frequency >= 20 && frequency <= 20000) {
                      void playTone(frequency, 0.25);
                    }
                  }}
                />

                <text
                  x={8}
                  y={index * rowHeight + 14}
                  fontSize={11}
                  fill={black ? '#d8ddd9' : '#343a35'}
                  pointerEvents="none"
                >
                  {note}
                  {octave}
                </text>
              </g>
            );
          })}

          {Array.from({ length: Math.floor(beats / grid) + 1 }, (_, index) => (
            <line
              key={index}
              x1={keyWidth + index * grid * beatWidth}
              x2={keyWidth + index * grid * beatWidth}
              y1={0}
              y2={height}
              stroke="var(--color-border)"
              strokeWidth={(index * grid) % 1 === 0 ? 1 : 0.4}
            />
          ))}

          {track.notes.map((note) => (
            <rect
              key={note.id}
              x={keyWidth + note.startBeat * beatWidth}
              y={(maxMidi - note.pitch.midi) * rowHeight + 2}
              width={Math.max(2, note.durationBeats * beatWidth - 1)}
              height={rowHeight - 4}
              rx={3}
              fill={track.color}
              stroke={selectedNoteId === note.id ? 'var(--color-text)' : 'transparent'}
              strokeWidth={2}
              role="button"
              tabIndex={0}
              aria-label={`${note.pitch.note}${note.pitch.octave}, beat ${note.startBeat}`}
              aria-pressed={selectedNoteId === note.id}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                selectPianoRollNote(note.id, note.pitch.frequency);
              }}
              onDoubleClick={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();

                selectPianoRollNote(note.id, note.pitch.frequency);
              }}
            >
              <title>{note.pitch.frequency.toFixed(3)} Hz</title>
            </rect>
          ))}

          <line
            x1={keyWidth + position * beatWidth}
            x2={keyWidth + position * beatWidth}
            y1={0}
            y2={height}
            stroke="var(--color-text)"
            pointerEvents="none"
          />
        </svg>
      </div>

      <p className="composer-hint">
        {editingLocked
          ? 'Pause or stop playback to edit notes.'
          : 'Double-click to add a note. Select a note to edit its parameters.'}
      </p>
    </section>
  );
}
