import { Play, Square } from 'lucide-react';

import type { ADSREnvelope, Waveform } from '@/core/types/audio.types';

import { frequencyToPitch } from '@/core/music/notes';

import { generatePartials, isAudioFrequency } from '@/engines/audio/constants';

import { useAudioStore } from '@/stores/audio.store';

import './SoundLab.scss';

const WAVEFORMS: Waveform[] = ['sine', 'triangle', 'square', 'sawtooth'];

const ENVELOPE_FIELDS: {
  key: keyof ADSREnvelope;
  max: number;
}[] = [
  { key: 'attack', max: 2 },
  { key: 'decay', max: 2 },
  { key: 'sustain', max: 1 },
  { key: 'release', max: 3 },
];

export default function SoundLab() {
  const {
    settings,
    status,
    error,
    previewFrequency,
    setPreviewFrequency,
    setWaveform,
    setMode,
    setEnvelope,
    setHarmonicCount,
    playTone,
    playChord,
    stopAll,
  } = useAudioStore();

  const validFrequency = isAudioFrequency(previewFrequency);

  const pitch = validFrequency ? frequencyToPitch(previewFrequency) : null;

  const partials = generatePartials(settings.harmonicCount);

  const { attack, decay, sustain, release } = settings.envelope;

  const hold = 0.6;
  const total = attack + decay + hold + release;

  const attackX = 20 + (attack / total) * 760;

  const decayX = 20 + ((attack + decay) / total) * 760;

  const releaseX = 20 + ((attack + decay + hold) / total) * 760;

  const sustainY = 110 - sustain * 90;

  const envelopePath = [
    'M20 110',
    `L${attackX} 20`,
    `L${decayX} ${sustainY}`,
    `L${releaseX} ${sustainY}`,
    'L780 110',
  ].join(' ');

  return (
    <div className="sound-lab">
      <section className="sound-lab__panel">
        <h2>Synthesizer</h2>

        <div className="sound-lab__buttons">
          <button
            type="button"
            className={settings.mode === 'oscillator' ? 'is-active' : ''}
            onClick={() => setMode('oscillator')}
          >
            Oscillator
          </button>

          <button
            type="button"
            className={settings.mode === 'additive' ? 'is-active' : ''}
            onClick={() => setMode('additive')}
          >
            Additive
          </button>
        </div>

        <label className="sound-lab__field">
          <span>Frequency (Hz)</span>

          <input
            type="number"
            min={20}
            max={20000}
            step="any"
            value={previewFrequency}
            onChange={(event) => setPreviewFrequency(event.target.valueAsNumber)}
          />
        </label>

        {pitch && (
          <div className="sound-lab__pitch">
            <strong>
              {pitch.note}
              {pitch.octave}
            </strong>

            <span>MIDI {pitch.midi.toFixed(3)}</span>

            <span>{pitch.cents.toFixed(2)} cents</span>
          </div>
        )}

        {settings.mode === 'oscillator' ? (
          <div className="sound-lab__buttons">
            {WAVEFORMS.map((waveform) => (
              <button
                type="button"
                key={waveform}
                className={settings.waveform === waveform ? 'is-active' : ''}
                onClick={() => setWaveform(waveform)}
              >
                {waveform}
              </button>
            ))}
          </div>
        ) : (
          <div className="sound-lab__harmonics">
            <label className="sound-lab__field">
              <span>Harmonics: {settings.harmonicCount}</span>

              <input
                type="range"
                min={1}
                max={32}
                value={settings.harmonicCount}
                onChange={(event) => setHarmonicCount(event.target.valueAsNumber)}
              />
            </label>

            <svg viewBox="0 0 800 140" role="img" aria-label="Relative harmonic amplitudes">
              {partials.map((amplitude, index) => {
                const width = 760 / partials.length;

                return (
                  <rect
                    key={index}
                    x={20 + index * width}
                    y={130 - amplitude * 110}
                    width={width * 0.65}
                    height={amplitude * 110}
                    rx={2}
                    fill="var(--color-accent)"
                  />
                );
              })}
            </svg>
          </div>
        )}

        <div className="sound-lab__buttons">
          <button
            type="button"
            className="is-active"
            disabled={!validFrequency}
            onClick={() => void playTone(previewFrequency, 1)}
          >
            <Play size={16} />
            Play Tone
          </button>

          <button type="button" onClick={stopAll}>
            <Square size={16} />
            Stop
          </button>
        </div>

        <span className="sound-lab__status">Audio: {status}</span>

        {error && (
          <p role="alert" className="sound-lab__error">
            {error}
          </p>
        )}
      </section>

      <section className="sound-lab__panel">
        <h2>Amplitude Envelope</h2>

        <svg viewBox="0 0 800 130" role="img" aria-label="ADSR envelope">
          <path d={`${envelopePath} Z`} fill="var(--color-accent-muted)" />

          <path d={envelopePath} stroke="var(--color-accent)" strokeWidth={2} fill="none" />
        </svg>

        <div className="sound-lab__envelope">
          {ENVELOPE_FIELDS.map(({ key, max }) => (
            <label className="sound-lab__field" key={key}>
              <span>
                {key}: {settings.envelope[key].toFixed(2)}
                {key !== 'sustain' ? ' s' : ''}
              </span>

              <input
                type="range"
                min={0.01}
                max={max}
                step={0.01}
                value={settings.envelope[key]}
                onChange={(event) =>
                  setEnvelope({
                    [key]: event.target.valueAsNumber,
                  })
                }
              />
            </label>
          ))}
        </div>
      </section>

      <section className="sound-lab__panel">
        <h2>Chord Preview</h2>

        <div className="sound-lab__buttons">
          <button
            type="button"
            onClick={() => void playChord([261.625565, 329.627557, 391.995436])}
          >
            C Major
          </button>

          <button type="button" onClick={() => void playChord([220, 261.625565, 329.627557])}>
            A Minor
          </button>

          <button type="button" onClick={() => void playChord([220, 330, 440])}>
            Pure 2:3:4
          </button>

          <button
            type="button"
            onClick={() => void playChord([220, 220 * ((1 + Math.sqrt(5)) / 2), 440])}
          >
            Golden Ratio
          </button>
        </div>
      </section>
    </div>
  );
}
