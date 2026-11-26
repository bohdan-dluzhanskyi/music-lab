import { Plus, Trash2 } from 'lucide-react';

import { useCompositionStore } from '@/stores/composition.store';
import { useSequencerStore } from '@/stores/sequencer.store';

import type { Waveform } from '@/core/types/audio.types';

const waveforms: Waveform[] = ['sine', 'triangle', 'square', 'sawtooth'];

export default function TrackList() {
  const { composition, selectedTrackId, selectTrack, addTrack, removeTrack, updateTrack } =
    useCompositionStore();

  const playing = useSequencerStore((state) => state.status === 'playing');

  return (
    <section className="track-list">
      <header className="composer-panel-header">
        <h2>Tracks</h2>

        <button disabled={playing} onClick={addTrack} aria-label="Add track">
          <Plus size={16} />
        </button>
      </header>

      {composition.tracks.map((track) => (
        <div
          key={track.id}
          className={`track-item ${selectedTrackId === track.id ? 'is-selected' : ''}`}
          style={{ borderLeftColor: track.color }}
        >
          <button className="track-item__name" onClick={() => selectTrack(track.id)}>
            {track.name}
          </button>

          <input
            aria-label="Track name"
            value={track.name}
            disabled={playing}
            onChange={(event) =>
              updateTrack(track.id, {
                name: event.target.value,
              })
            }
          />

          <select
            aria-label="Waveform"
            disabled={playing}
            value={track.synth.waveform}
            onChange={(event) =>
              updateTrack(track.id, {
                synth: {
                  ...track.synth,
                  waveform: event.target.value as Waveform,
                  mode: 'oscillator',
                },
              })
            }
          >
            {waveforms.map((waveform) => (
              <option key={waveform}>{waveform}</option>
            ))}
          </select>

          <div className="track-item__controls">
            <button
              disabled={playing}
              aria-pressed={track.muted}
              className={track.muted ? 'is-active' : ''}
              onClick={() =>
                updateTrack(track.id, {
                  muted: !track.muted,
                })
              }
            >
              M
            </button>

            <button
              disabled={playing}
              aria-pressed={track.solo}
              className={track.solo ? 'is-active' : ''}
              onClick={() =>
                updateTrack(track.id, {
                  solo: !track.solo,
                })
              }
            >
              S
            </button>

            <input
              type="range"
              aria-label="Track volume"
              min={0}
              max={1}
              step={0.01}
              value={track.volume}
              disabled={playing}
              onChange={(event) =>
                updateTrack(track.id, {
                  volume: event.target.valueAsNumber,
                })
              }
            />

            <button
              disabled={playing || composition.tracks.length <= 1}
              aria-label="Delete track"
              onClick={() => removeTrack(track.id)}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
