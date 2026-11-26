import * as Tone from 'tone';

import type { AudioEngineContract, PlayToneOptions, SynthSettings } from '@/core/types/audio.types';

import {
  DEFAULT_SYNTH_SETTINGS,
  MAX_POLYPHONY,
  clampVolume,
  generatePartials,
  isAudioFrequency,
} from './constants';

class AudioEngine implements AudioEngineContract {
  private synth: Tone.PolySynth<Tone.Synth> | null = null;

  private masterGain: Tone.Gain | null = null;

  private limiter: Tone.Limiter | null = null;

  private initialization: Promise<void> | null = null;

  private volume = 0.75;

  private settings: SynthSettings = {
    ...DEFAULT_SYNTH_SETTINGS,
    envelope: { ...DEFAULT_SYNTH_SETTINGS.envelope },
  };

  private generation = 0;

  async initialize(): Promise<void> {
    if (this.synth) return;

    if (!this.initialization) {
      this.initialization = this.createAudioGraph().finally(() => {
        this.initialization = null;
      });
    }

    await this.initialization;
  }

  private async createAudioGraph(): Promise<void> {
    await Tone.start();

    this.limiter = new Tone.Limiter(-3).toDestination();

    this.masterGain = new Tone.Gain(this.volume * 0.25).connect(this.limiter);

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine',
      },

      envelope: this.settings.envelope,
    }).connect(this.masterGain);

    this.synth.maxPolyphony = MAX_POLYPHONY;

    this.applySettings();
  }

  private applySettings(): void {
    if (!this.synth) return;

    if (this.settings.mode === 'additive') {
      this.synth.set({
        oscillator: {
          type: 'custom',
          partials: generatePartials(this.settings.harmonicCount),
        },

        envelope: this.settings.envelope,
      });

      return;
    }

    this.synth.set({
      oscillator: {
        type: this.settings.waveform,
      },

      envelope: this.settings.envelope,
    });
  }

  async playTone({ frequency, duration = 0.5, velocity = 0.7 }: PlayToneOptions): Promise<void> {
    if (!isAudioFrequency(frequency)) {
      throw new RangeError('Invalid audio frequency');
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new RangeError('Invalid duration');
    }

    const generation = this.generation;

    await this.initialize();

    if (generation !== this.generation) return;

    this.synth?.triggerAttackRelease(frequency, duration, Tone.now(), clampVolume(velocity));
  }

  async playChord(frequencies: number[], duration = 1, velocity = 0.6): Promise<void> {
    if (
      frequencies.length === 0 ||
      frequencies.length > MAX_POLYPHONY ||
      !frequencies.every(isAudioFrequency)
    ) {
      throw new RangeError('Invalid chord frequencies');
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new RangeError('Invalid duration');
    }

    const generation = this.generation;

    await this.initialize();

    if (generation !== this.generation) return;

    this.synth?.triggerAttackRelease(frequencies, duration, Tone.now(), clampVolume(velocity));
  }

  setVolume(volume: number): void {
    this.volume = clampVolume(volume);

    this.masterGain?.gain.rampTo(this.volume * 0.25, 0.05);
  }

  setSettings(settings: SynthSettings): void {
    this.settings = {
      ...settings,
      envelope: { ...settings.envelope },
    };

    this.applySettings();
  }

  stopAll(): void {
    this.generation += 1;

    this.synth?.releaseAll();
  }

  dispose(): void {
    this.stopAll();

    this.synth?.dispose();
    this.masterGain?.dispose();
    this.limiter?.dispose();

    this.synth = null;
    this.masterGain = null;
    this.limiter = null;
  }
}

export const audioEngine = new AudioEngine();
