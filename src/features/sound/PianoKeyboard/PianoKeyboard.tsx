import { useState } from 'react';

import { midiToFrequency } from '@/core/music/frequency';
import { midiToNote } from '@/core/music/notes';
import { useAudioStore } from '@/stores/audio.store';

import './PianoKeyboard.scss';

const BLACK_NOTES = [1, 3, 6, 8, 10];

const KEYS = Array.from({ length: 24 }, (_, index) => {
  const midi = 48 + index;
  const pitchClass = midi % 12;

  const { note, octave } = midiToNote(midi);

  return {
    midi,
    label: `${note}${octave}`,
    frequency: midiToFrequency(midi),
    isBlack: BLACK_NOTES.includes(pitchClass),
  };
});

const WHITE_KEYS = KEYS.filter((key) => !key.isBlack);

const BLACK_KEYS = KEYS.filter((key) => key.isBlack).map((key) => ({
  ...key,

  position: WHITE_KEYS.filter((whiteKey) => whiteKey.midi < key.midi).length,
}));

export default function PianoKeyboard() {
  const [activeMidi, setActiveMidi] = useState<number | null>(null);

  const playTone = useAudioStore((state) => state.playTone);

  const setPreviewFrequency = useAudioStore((state) => state.setPreviewFrequency);

  const handlePlay = (midi: number) => {
    const frequency = midiToFrequency(midi);

    setActiveMidi(midi);
    setPreviewFrequency(frequency);

    void playTone(frequency, 0.4);
  };

  return (
    <section className="piano-keyboard">
      <div className="piano-keyboard__heading">
        <h2>Piano Keyboard</h2>
        <span>C3–B4</span>
      </div>

      <div className="piano-keyboard__keys">
        <div className="piano-keyboard__white-keys">
          {WHITE_KEYS.map((key) => (
            <button
              type="button"
              key={key.midi}
              aria-label={key.label}
              title={`${key.label} — ${key.frequency.toFixed(2)} Hz`}
              className={`piano-keyboard__key piano-keyboard__key--white${
                activeMidi === key.midi ? ' is-selected' : ''
              }`}
              onClick={() => handlePlay(key.midi)}
            >
              <span>{key.label}</span>
            </button>
          ))}
        </div>

        {BLACK_KEYS.map((key) => (
          <button
            type="button"
            key={key.midi}
            aria-label={key.label}
            title={`${key.label} — ${key.frequency.toFixed(2)} Hz`}
            className={`piano-keyboard__key piano-keyboard__key--black${
              activeMidi === key.midi ? ' is-selected' : ''
            }`}
            style={{
              left: `${(key.position / WHITE_KEYS.length) * 100}%`,
            }}
            onClick={() => handlePlay(key.midi)}
          >
            <span>{key.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
