export type Waveform = 'sine' | 'triangle' | 'square' | 'sawtooth';

export type SynthesisMode = 'oscillator' | 'additive';

export type AudioStatus = 'idle' | 'initializing' | 'ready' | 'error';

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface SynthSettings {
  waveform: Waveform;
  mode: SynthesisMode;
  envelope: ADSREnvelope;
  harmonicCount: number;
}

export interface PlayToneOptions {
  frequency: number;
  duration?: number;
  velocity?: number;
}

export interface AudioEngineContract {
  initialize(): Promise<void>;

  playTone(options: PlayToneOptions): Promise<void>;

  playChord(frequencies: number[], duration?: number, velocity?: number): Promise<void>;

  setVolume(volume: number): void;

  setSettings(settings: SynthSettings): void;

  stopAll(): void;

  dispose(): void;
}
