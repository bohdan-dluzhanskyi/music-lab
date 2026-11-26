import { Play, Square, SkipBack, Repeat, Volume2 } from 'lucide-react';

import { useProjectStore } from '@/stores/project.store';

import './Transport.scss';

export default function Transport() {
  const bpm = useProjectStore((state) => state.bpm);
  const volume = useProjectStore((state) => state.volume);
  const timeSignature = useProjectStore((state) => state.timeSignature);

  const isLoopEnabled = useProjectStore((state) => state.isLoopEnabled);

  const setBpm = useProjectStore((state) => state.setBpm);
  const setVolume = useProjectStore((state) => state.setVolume);
  const toggleLoop = useProjectStore((state) => state.toggleLoop);

  return (
    <section className="transport" aria-label="Playback controls">
      <div className="transport__group">
        <button type="button" title="Return to start" disabled>
          <SkipBack size={17} />
        </button>

        <button
          type="button"
          className="transport__play"
          title="Playback will be available after audio engine setup"
          disabled
        >
          <Play size={18} />
        </button>

        <button type="button" title="Stop" disabled>
          <Square size={16} />
        </button>

        <button
          type="button"
          title="Toggle loop"
          aria-pressed={isLoopEnabled}
          className={isLoopEnabled ? 'is-active' : ''}
          onClick={toggleLoop}
        >
          <Repeat size={18} />
        </button>
      </div>

      <div className="transport__time">00:00.000</div>

      <div className="transport__group transport__parameters">
        <label className="transport__field">
          <span>BPM</span>

          <input
            type="number"
            min={20}
            max={300}
            value={bpm}
            onChange={(event) => {
              setBpm(event.target.valueAsNumber);
            }}
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
            onChange={(event) => {
              setVolume(event.target.valueAsNumber);
            }}
          />
        </label>
      </div>
    </section>
  );
}
