import * as Tone from 'tone';

import type { Composition } from '@/core/types/composition.types';

import {
  getAudibleTracks,
  getScheduledNotes,
  getCompositionLength,
} from '@/core/composition/composition';

import { generatePartials } from './constants';

interface TrackChannel {
  synth: Tone.PolySynth<Tone.Synth>;
  gain: Tone.Gain;
}

class Sequencer {
  private channels = new Map<string, TrackChannel>();

  private master: Tone.Gain | null = null;
  private limiter: Tone.Limiter | null = null;

  private startedAt = 0;
  private startBeat = 0;
  private endBeat = 0;
  private bpm = 120;

  private generation = 0;
  private playing = false;

  async play(composition: Composition, fromBeat = 0, volume = 0.75): Promise<boolean> {
    this.stop();

    const generation = this.generation;

    await Tone.start();

    if (generation !== this.generation) return false;

    this.bpm = composition.bpm;
    this.startBeat = fromBeat;
    this.endBeat = getCompositionLength(composition);

    if (fromBeat >= this.endBeat) return false;

    try {
      this.limiter = new Tone.Limiter(-3).toDestination();

      this.master = new Tone.Gain(volume * 0.25).connect(this.limiter);

      const tracks = getAudibleTracks(composition.tracks);

      for (const track of tracks) {
        const gain = new Tone.Gain(track.volume).connect(this.master);

        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: track.synth.waveform,
          },
          envelope: track.synth.envelope,
        }).connect(gain);

        synth.maxPolyphony = 32;

        this.channels.set(track.id, { synth, gain });

        if (track.synth.mode === 'additive') {
          synth.set({
            oscillator: {
              type: 'custom',
              partials: generatePartials(track.synth.harmonicCount),
            },
          });
        }
      }

      this.startedAt = Tone.now() + 0.1;

      const secondsPerBeat = 60 / this.bpm;

      const notes = getScheduledNotes(composition, fromBeat, this.endBeat);

      for (const note of notes) {
        const channel = this.channels.get(note.trackId);

        const startTime = this.startedAt + (note.startBeat - fromBeat) * secondsPerBeat;

        channel?.synth.triggerAttackRelease(
          note.frequency,
          note.durationBeats * secondsPerBeat,
          startTime,
          note.velocity,
        );
      }

      this.playing = true;

      return true;
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  getPosition(): number {
    if (!this.playing) return this.startBeat;

    const elapsed = Math.max(0, Tone.immediate() - this.startedAt);

    return Math.min(this.endBeat, this.startBeat + (elapsed * this.bpm) / 60);
  }

  hasEnded(): boolean {
    return this.playing && this.getPosition() >= this.endBeat;
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;

    this.master?.gain.rampTo(Math.max(0, Math.min(1, volume)) * 0.25, 0.05);
  }

  stop(): void {
    this.generation += 1;
    this.playing = false;

    for (const { synth, gain } of this.channels.values()) {
      synth.dispose();
      gain.dispose();
    }

    this.channels.clear();

    this.master?.dispose();
    this.limiter?.dispose();

    this.master = null;
    this.limiter = null;
  }
}

export const sequencer = new Sequencer();
