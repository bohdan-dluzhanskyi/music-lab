import { useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';

import type { ScaleType } from '@/core/types/theory.types';

import { SCALES, createScale } from '@/core/music/scales';

import { buildDiatonicHarmony } from '@/core/music/harmony';

import { invertChord } from '@/core/music/chords';

import { PROGRESSIONS, createProgression, type ProgressionType } from '@/core/music/progressions';

import { blendFrequencies, quantizeFrequency } from '@/core/music/quantization';

import { midiToFrequency } from '@/core/music/frequency';
import { useAudioStore } from '@/stores/audio.store';
import { useProjectStore } from '@/stores/project.store';

import CircleOfFifths from '../CircleOfFifths/CircleOfFifths';

import './TheoryLab.scss';

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function TheoryLab() {
  const [root, setRoot] = useState(0);
  const [octave, setOctave] = useState(4);
  const [scaleType, setScaleType] = useState<ScaleType>('major');

  const [chordSize, setChordSize] = useState<3 | 4>(3);
  const [inversion, setInversion] = useState(0);

  const [progression, setProgression] = useState<ProgressionType>('pop');

  const [frequency, setFrequency] = useState(355.967478);
  const [strength, setStrength] = useState(1);

  const [isPlaying, setIsPlaying] = useState(false);

  const playbackId = useRef(0);

  const { playTone, playChord, stopAll, error } = useAudioStore();

  const bpm = useProjectStore((state) => state.bpm);

  const rootMidi = (octave + 1) * 12 + root;

  const scale = createScale(rootMidi, scaleType);

  const supportsHarmony = scale.notes.length === 7;

  const harmony = supportsHarmony ? buildDiatonicHarmony(rootMidi, scaleType, chordSize) : [];

  const progressionChords = supportsHarmony
    ? createProgression(rootMidi, scaleType, PROGRESSIONS[progression].degrees, chordSize)
    : [];

  const quantized =
    Number.isFinite(frequency) && frequency > 0
      ? quantizeFrequency(frequency, rootMidi, scaleType)
      : null;

  const blended = quantized
    ? blendFrequencies(frequency, quantized.quantizedFrequency, strength)
    : null;

  const handleStop = () => {
    playbackId.current += 1;
    stopAll();
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      playbackId.current += 1;
      stopAll();
    };
  }, [stopAll]);

  const playSequence = async (sequence: number[][], duration: number) => {
    handleStop();

    const id = playbackId.current;

    setIsPlaying(true);

    try {
      for (const frequencies of sequence) {
        if (id !== playbackId.current) return;

        if (frequencies.length === 1) {
          await playTone(frequencies[0], duration * 0.8);
        } else {
          await playChord(frequencies, duration * 0.8);
        }

        if (useAudioStore.getState().status === 'error') {
          return;
        }

        await new Promise<void>((resolve) => {
          setTimeout(resolve, duration * 1000);
        });
      }
    } finally {
      if (id === playbackId.current) {
        setIsPlaying(false);
      }
    }
  };

  const beatDuration = Number.isFinite(bpm) && bpm > 0 ? 60 / bpm : 0.5;

  const handlePlayScale = () => {
    const sequence = [
      ...scale.notes.map((note) => [note.frequency]),
      [midiToFrequency(rootMidi + 12)],
    ];

    void playSequence(sequence, beatDuration);
  };

  const handlePlayProgression = () => {
    const sequence = progressionChords.map((chord) =>
      invertChord(
        chord.notes.map((note) => note.midi),
        inversion,
      ).map((midi) => midiToFrequency(midi)),
    );

    void playSequence(sequence, beatDuration * 4);
  };

  return (
    <div className="theory-lab">
      <section className="theory-lab__panel">
        <h2>Scale Explorer</h2>

        <div className="theory-lab__controls">
          <label>
            Root
            <select value={root} onChange={(event) => setRoot(Number(event.target.value))}>
              {ROOTS.map((note, index) => (
                <option key={note} value={index}>
                  {note}
                </option>
              ))}
            </select>
          </label>

          <label>
            Scale
            <select
              value={scaleType}
              onChange={(event) => setScaleType(event.target.value as ScaleType)}
            >
              {Object.entries(SCALES).map(([type, scale]) => (
                <option key={type} value={type}>
                  {scale.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Octave
            <select value={octave} onChange={(event) => setOctave(Number(event.target.value))}>
              {[2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="theory-lab__notes">
          {scale.notes.map((note, index) => (
            <button
              type="button"
              key={note.midi}
              onClick={() => {
                handleStop();
                void playTone(note.frequency);
              }}
            >
              <small>Degree {index + 1}</small>

              <strong>
                {note.note}
                {note.octave}
              </strong>

              <span>{note.frequency.toFixed(2)} Hz</span>
            </button>
          ))}
        </div>

        <div className="theory-lab__actions">
          <button type="button" disabled={isPlaying} onClick={handlePlayScale}>
            <Play size={16} />
            Play Scale
          </button>

          <button type="button" onClick={handleStop}>
            <Square size={16} />
            Stop
          </button>
        </div>
      </section>

      <div className="theory-lab__columns">
        <CircleOfFifths
          root={root}
          onSelect={(pitchClass) => {
            setRoot(pitchClass);
            setScaleType('major');
          }}
        />

        <section className="theory-lab__panel">
          <h2>Diatonic Harmony</h2>

          {supportsHarmony ? (
            <>
              <div className="theory-lab__controls">
                <label>
                  Chord size
                  <select
                    value={chordSize}
                    onChange={(event) => {
                      setChordSize(Number(event.target.value) as 3 | 4);
                      setInversion(0);
                    }}
                  >
                    <option value={3}>Triads</option>
                    <option value={4}>Seventh chords</option>
                  </select>
                </label>

                <label>
                  Inversion
                  <select
                    value={inversion}
                    onChange={(event) => setInversion(Number(event.target.value))}
                  >
                    {Array.from({ length: chordSize }, (_, index) => (
                      <option key={index} value={index}>
                        {index === 0 ? 'Root position' : `Inversion ${index}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="theory-lab__chords">
                {harmony.map((chord) => (
                  <button
                    type="button"
                    key={chord.degree}
                    onClick={() => {
                      handleStop();

                      const notes = invertChord(
                        chord.notes.map((note) => note.midi),
                        inversion,
                      );

                      void playChord(notes.map((midi) => midiToFrequency(midi)));
                    }}
                  >
                    <small>{chord.romanNumeral}</small>

                    <strong>{chord.name}</strong>

                    <span>{chord.notes.map((note) => note.note).join(' – ')}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p>Select a seven-note scale to explore diatonic harmony.</p>
          )}
        </section>
      </div>

      <section className="theory-lab__panel">
        <h2>Chord Progressions</h2>

        <label>
          Progression
          <select
            value={progression}
            onChange={(event) => setProgression(event.target.value as ProgressionType)}
          >
            {Object.entries(PROGRESSIONS).map(([id, item]) => (
              <option key={id} value={id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="theory-lab__notes">
          {progressionChords.map((chord, index) => (
            <button
              type="button"
              key={`${chord.degree}-${index}`}
              onClick={() => {
                handleStop();

                void playChord(
                  invertChord(
                    chord.notes.map((note) => note.midi),
                    inversion,
                  ).map((midi) => midiToFrequency(midi)),
                );
              }}
            >
              <small>{chord.romanNumeral}</small>
              <strong>{chord.name}</strong>
            </button>
          ))}
        </div>

        <div className="theory-lab__actions">
          <button
            type="button"
            disabled={!supportsHarmony || isPlaying}
            onClick={handlePlayProgression}
          >
            <Play size={16} />
            Play Progression
          </button>

          <button type="button" onClick={handleStop}>
            <Square size={16} />
            Stop
          </button>
        </div>
      </section>

      <section className="theory-lab__panel">
        <h2>Mathematical Quantization</h2>

        <div className="theory-lab__controls">
          <label>
            Original frequency (Hz)
            <input
              type="number"
              min={20}
              max={20000}
              step="any"
              value={Number.isFinite(frequency) ? frequency : ''}
              onChange={(event) => setFrequency(event.target.valueAsNumber)}
            />
          </label>

          <label>
            Quantization strength: {Math.round(strength * 100)}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={strength}
              onChange={(event) => setStrength(event.target.valueAsNumber)}
            />
          </label>
        </div>

        {quantized && blended !== null && (
          <>
            <div className="theory-lab__results">
              <div>
                <small>Original</small>
                <strong>{frequency.toFixed(3)} Hz</strong>
              </div>

              <div>
                <small>Quantized</small>
                <strong>{quantized.quantizedFrequency.toFixed(3)} Hz</strong>
              </div>

              <div>
                <small>Hybrid</small>
                <strong>{blended.toFixed(3)} Hz</strong>
              </div>

              <div>
                <small>Correction</small>
                <strong>{quantized.centsDifference.toFixed(2)} cents</strong>
              </div>
            </div>

            <div className="theory-lab__actions">
              {[
                ['Original', frequency],
                ['Quantized', quantized.quantizedFrequency],
                ['Hybrid', blended],
              ].map(([label, value]) => (
                <button
                  type="button"
                  key={label}
                  disabled={Number(value) < 20 || Number(value) > 20000}
                  onClick={() => {
                    handleStop();
                    void playTone(Number(value), 1);
                  }}
                >
                  <Play size={16} />
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
