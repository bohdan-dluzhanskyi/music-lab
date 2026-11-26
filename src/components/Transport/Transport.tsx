import { Play, Square, SkipBack, Repeat, Volume2 } from 'lucide-react';

import { useProjectStore } from '@/stores/project.store';
import { useAudioStore } from '@/stores/audio.store';

import { isAudioFrequency } from '@/engines/audio/constants';

import './Transport.scss';

export default function Transport() {
  const { bpm, volume, timeSignature, isLoopEnabled, setBpm, setVolume, toggleLoop } =
    useProjectStore();

  const { previewFrequency, playTone, stopAll } = useAudioStore();

  return (
    <section className="transport" aria-label="Playback controls">
      <div className="transport__group">
        <button type="button" title="Return to start — sequencer not available" disabled>
          <SkipBack size={17} />
        </button>

        <button
          type="button"
          className="transport__play"
          title="Play preview tone"
          aria-label="Play preview tone"
          disabled={!isAudioFrequency(previewFrequency)}
          onClick={() => void playTone(previewFrequency, 60 / bpm)}
        >
          <Play size={18} />
        </button>

        <button
          type="button"
          title="Stop all sounds"
          aria-label="Stop all sounds"
          onClick={stopAll}
        >
          <Square size={16} />
        </button>

        <button
          type="button"
          title="Loop preference — sequencer not available"
          aria-pressed={isLoopEnabled}
          className={isLoopEnabled ? 'is-active' : ''}
          onClick={toggleLoop}
        >
          <Repeat size={18} />
        </button>
      </div>

      <div className="transport__time">{previewFrequency.toFixed(2)} Hz</div>

      <div className="transport__group transport__parameters">
        <label className="transport__field">
          <span>BPM</span>

          <input
            type="number"
            min={20}
            max={300}
            value={bpm}
            onChange={(event) => setBpm(event.target.valueAsNumber)}
          />
        </label>

        <div className="transport__field">
          <span>Meter</span>
          <strong>{timeSignature.join('/')}</strong>
        </div>

        <label className="transport__volume">
          <Volume2 size={18} />

          <input
            aria-label="Master volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(event.target.valueAsNumber)}
          />
        </label>
      </div>
    </section>
  );
}
