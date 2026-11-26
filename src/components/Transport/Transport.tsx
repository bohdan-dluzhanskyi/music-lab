import { Play, Pause, Square, SkipBack, Repeat, Volume2 } from 'lucide-react';

import { useLocation } from 'react-router-dom';

import { useProjectStore } from '@/stores/project.store';
import { useAudioStore } from '@/stores/audio.store';

import { useCompositionStore } from '@/stores/composition.store';
import { useSequencerStore } from '@/stores/sequencer.store';

import { isAudioFrequency } from '@/engines/audio/constants';

import './Transport.scss';

export default function Transport() {
  const { pathname } = useLocation();

  const isComposer = pathname === '/composer' || pathname === '/piano-roll';

  const project = useProjectStore();
  const audio = useAudioStore();
  const transport = useSequencerStore();

  const composition = useCompositionStore((state) => state.composition);

  const setCompositionBpm = useCompositionStore((state) => state.setBpm);

  const playing = transport.status === 'playing';

  const bpm = isComposer ? composition.bpm : project.bpm;

  const timeSignature = isComposer ? composition.timeSignature : project.timeSignature;

  const loop = isComposer ? transport.loop : project.isLoopEnabled;

  const seconds = (transport.position * 60) / composition.bpm;

  function handlePlay() {
    if (isComposer) {
      if (playing) {
        transport.pause();
      } else {
        void transport.play();
      }

      return;
    }

    void audio.playTone(audio.previewFrequency, 60 / bpm);
  }

  return (
    <section className="transport" aria-label="Playback controls">
      <div className="transport__group">
        <button
          disabled={!isComposer}
          aria-label="Return to start"
          onClick={() => transport.seek(0)}
        >
          <SkipBack size={17} />
        </button>

        <button
          className="transport__play"
          aria-label={isComposer && playing ? 'Pause' : 'Play'}
          disabled={!isComposer && !isAudioFrequency(audio.previewFrequency)}
          onClick={handlePlay}
        >
          {isComposer && playing ? <Pause size={17} /> : <Play size={17} />}
        </button>

        <button aria-label="Stop" onClick={transport.stop}>
          <Square size={16} />
        </button>

        <button
          className={loop ? 'is-active' : ''}
          aria-label="Loop"
          aria-pressed={loop}
          onClick={isComposer ? transport.toggleLoop : project.toggleLoop}
        >
          <Repeat size={17} />
        </button>
      </div>

      <div className="transport__time">
        {isComposer ? `${seconds.toFixed(3)} s` : `${audio.previewFrequency.toFixed(2)} Hz`}
      </div>

      <div className="transport__group transport__parameters">
        <label>
          BPM
          <input
            type="number"
            min={20}
            max={300}
            value={bpm}
            disabled={isComposer && playing}
            onChange={(event) => {
              const value = event.target.valueAsNumber;

              if (isComposer) {
                setCompositionBpm(value);
              } else {
                project.setBpm(value);
              }
            }}
          />
        </label>

        <span>{timeSignature.join('/')}</span>

        <label>
          <Volume2 size={16} />

          <input
            type="range"
            aria-label="Master volume"
            min={0}
            max={1}
            step={0.01}
            value={project.volume}
            onChange={(event) => project.setVolume(event.target.valueAsNumber)}
          />
        </label>
      </div>
    </section>
  );
}
