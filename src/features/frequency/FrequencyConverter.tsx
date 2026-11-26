import { useState } from 'react';
import { AudioWaveform } from 'lucide-react';

import { frequencyToPitch } from '@/core/music/notes';
import { frequencyRatio } from '@/core/music/frequency';

import { frequencyToAngle, frequencyToClockAngle } from '@/core/geometry/noteClock';

import { useProjectStore } from '@/stores/project.store';

import './FrequencyConverter.scss';

import { Play, Square } from 'lucide-react';

import { useAudioStore } from '@/stores/audio.store';

import { isAudioFrequency } from '@/engines/audio/constants';

const PRESETS = [110, 220, 261.625565, 440, 660, 880];

export default function FrequencyConverter() {
  const playTone = useAudioStore((state) => state.playTone);

  const stopAll = useAudioStore((state) => state.stopAll);

  const setPreviewFrequency = useAudioStore((state) => state.setPreviewFrequency);

  const audioError = useAudioStore((state) => state.error);

  const [value, setValue] = useState('440');

  const reference = useProjectStore((state) => state.referenceFrequency);

  const frequency = Number(value);

  const isValid = Number.isFinite(frequency) && frequency >= 1 && frequency <= 100000;

  const pitch = isValid ? frequencyToPitch(frequency) : null;

  const results = pitch
    ? [
        {
          label: 'Note',
          value: `${pitch.note}${pitch.octave}`,
        },
        {
          label: 'MIDI',
          value: pitch.midi.toFixed(3),
        },
        {
          label: 'Cents',
          value: pitch.cents.toFixed(2),
        },
        {
          label: 'Angle',
          value: `${frequencyToAngle(frequency, reference).toFixed(2)}°`,
        },
        {
          label: 'Clock angle',
          value: `${frequencyToClockAngle(frequency, reference).toFixed(2)}°`,
        },
        {
          label: 'Ratio',
          value: frequencyRatio(reference, frequency).toFixed(5),
        },
      ]
    : [];

  const wavePath = isValid
    ? Array.from({ length: 801 }, (_, index) => {
        const time = (index / 800) * 0.01;

        const y = 60 - 45 * Math.sin(2 * Math.PI * frequency * time);

        return `${index === 0 ? 'M' : 'L'}${index},${y}`;
      }).join(' ')
    : '';

  return (
    <section className="frequency-converter">
      <div className="frequency-converter__heading">
        <AudioWaveform size={20} />
        <h2>Frequency Converter</h2>
      </div>

      <label className="frequency-converter__field">
        <span>Frequency (Hz)</span>

        <input
          type="number"
          min={1}
          max={100000}
          step="any"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>

      <div className="frequency-converter__presets">
        {PRESETS.map((preset) => (
          <button type="button" key={preset} onClick={() => setValue(String(preset))}>
            {Number(preset.toFixed(2))} Hz
          </button>
        ))}
      </div>
      <div className="frequency-converter__actions">
        <button
          type="button"
          disabled={!isAudioFrequency(frequency)}
          onClick={() => {
            setPreviewFrequency(frequency);

            void playTone(frequency, 1);
          }}
        >
          <Play size={16} />
          Play Frequency
        </button>

        <button type="button" onClick={stopAll}>
          <Square size={16} />
          Stop
        </button>
      </div>

      {audioError && (
        <p role="alert" className="frequency-converter__error">
          {audioError}
        </p>
      )}

      {isValid ? (
        <>
          <div className="frequency-converter__results">
            {results.map(({ label, value }) => (
              <div className="frequency-converter__result" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="frequency-converter__wave">
            <svg
              viewBox="0 0 800 120"
              role="img"
              aria-label="Frequency waveform over 10 milliseconds"
            >
              {[15, 60, 105].map((y) => (
                <line key={y} x1={0} y1={y} x2={800} y2={y} stroke="var(--color-border)" />
              ))}

              <path d={wavePath} fill="none" stroke="var(--color-accent)" strokeWidth={1.8} />
            </svg>
          </div>

          <p className="frequency-converter__reference">
            Pitch: A4 = 440 Hz · Geometry reference: {reference} Hz · 12-TET
          </p>
        </>
      ) : (
        <p className="frequency-converter__error">Enter a frequency between 1 and 100000 Hz.</p>
      )}
    </section>
  );
}
