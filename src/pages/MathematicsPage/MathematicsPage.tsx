import { useEffect, useMemo, useRef, useState } from 'react';

import { Play, Square, Sigma, Download } from 'lucide-react';

import { generateFrequencies, type GeneratorType } from '@/core/composition/generators';

import {
  quantizeSequence,
  QUANTIZATION_SCALES,
  type QuantizationScale,
} from '@/core/composition/quantization';

import { blendSequences } from '@/core/composition/hybrid';

import { generateEuclideanRhythm } from '@/core/composition/rhythm';

import { createNoteSequence, beatsToSeconds } from '@/core/composition/sequence';

import { frequencyToMidi } from '@/core/music/frequency';

import { useAudioStore } from '@/stores/audio.store';

import { useProjectStore } from '@/stores/project.store';

import SequencePreview from '@/features/mathematics/SequencePreview';

import './MathematicsPage.scss';

const generators: {
  id: GeneratorType;
  label: string;
}[] = [
  { id: 'fibonacci', label: 'Fibonacci' },
  { id: 'golden-ratio', label: 'Golden Ratio' },
  { id: 'golden-angle', label: 'Golden Angle' },
  {
    id: 'spiral-intersections',
    label: 'Spiral Intersections',
  },
  { id: 'sine', label: 'Sine Wave' },
  { id: 'harmonics', label: 'Harmonic Series' },
  { id: 'logistic', label: 'Logistic Map' },
];

// Temporary classical reference melody.
const classicalPattern = [0, 3, 7, 3, 0, 5, 8, 5, 3, 7, 10, 7, 2, 5, 10, 5];

export default function MathematicsPage() {
  const [generator, setGenerator] = useState<GeneratorType>('golden-ratio');

  const [reference, setReference] = useState(220);
  const [count, setCount] = useState(16);
  const [weight, setWeight] = useState(50);

  const [quantize, setQuantize] = useState(true);

  const [scale, setScale] = useState<QuantizationScale>('minor');

  const [rhythmEnabled, setRhythmEnabled] = useState(false);

  const [pulses, setPulses] = useState(5);
  const [rotation, setRotation] = useState(0);

  const [period, setPeriod] = useState(8);
  const [logisticRate, setLogisticRate] = useState(3.9);

  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');

  const playbackId = useRef(0);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const releaseWait = useRef<(() => void) | null>(null);

  const bpm = useProjectStore((state) => state.bpm);

  const setBpm = useProjectStore((state) => state.setBpm);

  const playChord = useAudioStore((state) => state.playChord);

  const durationBeats = 0.5;
  const totalBeats = count * durationBeats;

  const sequence = useMemo(() => {
    const mathematical = generateFrequencies({
      type: generator,
      reference,
      count,
      foldOctaves: true,
      period,
      logisticRate,
    });

    const classical = Array.from(
      { length: count },
      (_, index) => reference * 2 ** (classicalPattern[index % classicalPattern.length]! / 12),
    );

    const hybrid = blendSequences(classical, mathematical, weight / 100);

    const frequencies = quantize
      ? quantizeSequence(hybrid, Math.round(frequencyToMidi(reference)), scale)
      : hybrid;

    const rhythm = rhythmEnabled ? generateEuclideanRhythm(16, pulses, rotation) : undefined;

    return createNoteSequence(frequencies, {
      durationBeats,
      velocity: 0.7,
      rhythm,
    });
  }, [
    generator,
    reference,
    count,
    weight,
    quantize,
    scale,
    rhythmEnabled,
    pulses,
    rotation,
    period,
    logisticRate,
  ]);

  function stopPlayback() {
    playbackId.current += 1;

    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    releaseWait.current?.();
    releaseWait.current = null;

    setIsPlaying(false);
  }

  useEffect(() => {
    return () => {
      playbackId.current += 1;

      if (timer.current !== null) {
        clearTimeout(timer.current);
      }

      releaseWait.current?.();
    };
  }, []);

  function wait(seconds: number) {
    return new Promise<void>((resolve) => {
      releaseWait.current = resolve;

      timer.current = setTimeout(
        () => {
          timer.current = null;
          releaseWait.current = null;
          resolve();
        },
        Math.max(0, seconds * 1000),
      );
    });
  }

  async function handlePlay() {
    stopPlayback();
    setError('');

    if (!sequence.length) return;

    const id = playbackId.current;

    setIsPlaying(true);

    try {
      const startedAt = performance.now();

      for (const note of sequence) {
        if (playbackId.current !== id) return;

        const startSeconds = beatsToSeconds(note.startBeat, bpm);

        const elapsed = (performance.now() - startedAt) / 1000;

        const delay = startSeconds - elapsed;

        if (delay > 0) {
          await wait(delay);
        }

        if (playbackId.current !== id) return;

        const duration = beatsToSeconds(note.durationBeats, bpm);

        await playChord([note.pitch.frequency], duration * 0.85);
      }

      const remaining = beatsToSeconds(totalBeats, bpm) - (performance.now() - startedAt) / 1000;

      if (remaining > 0 && playbackId.current === id) {
        await wait(remaining);
      }
    } catch {
      if (playbackId.current === id) {
        setError('Unable to play sequence');
      }
    } finally {
      if (playbackId.current === id) {
        setIsPlaying(false);
      }
    }
  }

  function exportSequence() {
    const data = {
      version: 1,
      generator,
      reference,
      count,
      bpm,
      mathematicalWeight: weight / 100,
      quantize,
      scale,
      period,
      logisticRate,
      logisticSeed: 0.37,
      rhythmEnabled,
      pulses,
      rotation,
      totalBeats,
      notes: sequence,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = `music-lab-${generator}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="mathematics-page">
      <header className="mathematics-page__header">
        <Sigma size={26} />

        <div>
          <span>Laboratory</span>
          <h1>Mathematics Laboratory</h1>
          <p>Generate musical structures using mathematical algorithms.</p>
        </div>
      </header>

      <div className="mathematics-page__layout">
        <aside className="math-panel math-generators">
          <h2>Generators</h2>

          {generators.map((item) => (
            <button
              key={item.id}
              disabled={isPlaying}
              aria-pressed={generator === item.id}
              className={generator === item.id ? 'is-active' : ''}
              onClick={() => setGenerator(item.id)}
            >
              {item.label}
            </button>
          ))}

          <fieldset disabled={isPlaying}>
            <label>
              Reference frequency
              <select
                value={reference}
                onChange={(event) => setReference(Number(event.target.value))}
              >
                {[110, 220, 440].map((value) => (
                  <option key={value} value={value}>
                    {value} Hz
                  </option>
                ))}
              </select>
            </label>

            <label>
              Notes: {count}
              <input
                type="range"
                min={4}
                max={64}
                step={4}
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
              />
            </label>

            {generator === 'sine' && (
              <label>
                Period: {period}
                <input
                  type="range"
                  min={2}
                  max={32}
                  value={period}
                  onChange={(event) => setPeriod(Number(event.target.value))}
                />
              </label>
            )}

            {generator === 'logistic' && (
              <label>
                Rate: {logisticRate.toFixed(2)}
                <input
                  type="range"
                  min={2.5}
                  max={4}
                  step={0.01}
                  value={logisticRate}
                  onChange={(event) => setLogisticRate(Number(event.target.value))}
                />
              </label>
            )}
          </fieldset>
        </aside>

        <div className="math-workspace">
          <div className="math-panel">
            <h2>Sequence Preview</h2>

            <SequencePreview notes={sequence} totalBeats={totalBeats} />

            <div className="math-actions">
              <button disabled={isPlaying || !sequence.length} onClick={handlePlay}>
                <Play size={16} />
                Play sequence
              </button>

              <button disabled={!isPlaying} onClick={stopPlayback}>
                <Square size={16} />
                Stop
              </button>

              <button onClick={exportSequence}>
                <Download size={16} />
                Export JSON
              </button>
            </div>

            {error && <p role="alert">{error}</p>}
          </div>

          <fieldset className="math-panel" disabled={isPlaying}>
            <h2>Hybrid Composition</h2>

            <div className="math-weight">
              <span>Classical: {100 - weight}%</span>
              <span>Mathematics: {weight}%</span>
            </div>

            <input
              type="range"
              aria-label="Mathematical influence"
              min={0}
              max={100}
              step={5}
              value={weight}
              onChange={(event) => setWeight(Number(event.target.value))}
            />

            <div className="math-presets">
              {[0, 10, 25, 50, 75, 100].map((value) => (
                <button
                  key={value}
                  aria-pressed={weight === value}
                  className={weight === value ? 'is-active' : ''}
                  onClick={() => setWeight(value)}
                >
                  {value}%
                </button>
              ))}
            </div>

            <label className="math-checkbox">
              <input
                type="checkbox"
                checked={quantize}
                onChange={(event) => setQuantize(event.target.checked)}
              />
              Quantize to scale
            </label>

            <label>
              Musical scale
              <select
                disabled={!quantize}
                value={scale}
                onChange={(event) => setScale(event.target.value as QuantizationScale)}
              >
                {Object.keys(QUANTIZATION_SCALES).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tempo: {bpm} BPM
              <input
                type="range"
                min={40}
                max={240}
                value={bpm}
                onChange={(event) => setBpm(Number(event.target.value))}
              />
            </label>
          </fieldset>

          <fieldset className="math-panel" disabled={isPlaying}>
            <h2>Euclidean Rhythm</h2>

            <label className="math-checkbox">
              <input
                type="checkbox"
                checked={rhythmEnabled}
                onChange={(event) => setRhythmEnabled(event.target.checked)}
              />
              Enable mathematical rhythm
            </label>

            <label>
              Pulses: {pulses} / 16
              <input
                type="range"
                min={1}
                max={16}
                value={pulses}
                onChange={(event) => setPulses(Number(event.target.value))}
              />
            </label>

            <label>
              Rotation: {rotation}
              <input
                type="range"
                min={0}
                max={15}
                value={rotation}
                onChange={(event) => setRotation(Number(event.target.value))}
              />
            </label>

            <div className="math-rhythm">
              {generateEuclideanRhythm(16, pulses, rotation).map((active, index) => (
                <span key={index} className={active ? 'is-active' : ''} />
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <div className="math-panel math-results">
        <h2>Generated Notes</h2>

        <div className="math-results__grid">
          {sequence.map((note) => (
            <div key={note.id}>
              <strong>
                {note.pitch.note}
                {note.pitch.octave}
              </strong>

              <span>{note.pitch.frequency.toFixed(3)} Hz</span>

              <span>{note.pitch.cents.toFixed(2)} ct</span>

              <span>Beat: {note.startBeat.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
