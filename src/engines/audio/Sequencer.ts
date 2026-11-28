import * as Tone from 'tone';

import type { Composition, ScheduledNote, Track } from '@/core/types/composition.types';
import {
  getAudibleTracks,
  getScheduledNotes,
  getCompositionLength,
} from '@/core/composition/composition';
import { generatePartials } from './constants';

const POLYPHONY = 32;
const LOOKAHEAD = 0.15;
const REFILL_INTERVAL = 0.02;

interface VoiceLease {
  sessionId: number;
  trackId: string;
  sourceNoteId: string;
  attackAt: number;
  releaseAt: number;
  reusableAfter: number;
  token: symbol;
}

interface Voice {
  synth: Tone.Synth;
  lease?: VoiceLease;
}

interface TrackChannel {
  track: Track;
  gain: Tone.Gain;
  voices: Voice[];
  pending: ScheduledNote[];
  next: number;
}

class Sequencer {
  private channels = new Map<string, TrackChannel>();
  private master: Tone.Gain | null = null;
  private limiter: Tone.Limiter | null = null;
  private wakeup: number | undefined;
  private context: ReturnType<typeof Tone.getContext> | undefined;
  private startedAt = 0;
  private startBeat = 0;
  private endBeat = 0;
  private secondsPerBeat = 0.5;
  private generation = 0;
  private playing = false;
  private omitted = 0;

  async play(
    composition: Composition,
    fromBeat = 0,
    volume = 0.75,
    onError?: (error: unknown) => void,
  ): Promise<boolean> {
    this.stop();
    const sessionId = this.generation;
    const endBeat = getCompositionLength(composition);
    if (fromBeat >= endBeat) return false;

    await Tone.start();
    if (sessionId !== this.generation) return false;

    try {
      this.context = Tone.getContext();
      this.secondsPerBeat = 60 / composition.bpm;
      this.startBeat = fromBeat;
      this.endBeat = endBeat;
      this.omitted = 0;
      this.limiter = new Tone.Limiter(-3);
      this.limiter.toDestination();
      this.master = new Tone.Gain(volume * 0.25);
      this.master.connect(this.limiter);

      for (const track of getAudibleTracks(composition.tracks)) {
        const gain = new Tone.Gain(track.volume);
        this.channels.set(track.id, { track, gain, voices: [], pending: [], next: 0 });
        gain.connect(this.master);
      }

      const seen = new Set<string>();
      for (const note of getScheduledNotes(composition, fromBeat, endBeat)) {
        if (seen.has(note.sourceNoteId)) continue;
        seen.add(note.sourceNoteId);
        this.channels.get(note.trackId)?.pending.push(note);
      }

      this.startedAt = Tone.now() + 0.1;
      this.playing = true;
      const refill = () => {
        if (sessionId !== this.generation) return;
        this.wakeup = undefined;
        const now = Tone.immediate();
        const horizon = Tone.now() + LOOKAHEAD;

        for (const channel of this.channels.values()) {
          while (channel.next < channel.pending.length) {
            const note = channel.pending[channel.next]!;
            const attackAt = this.startedAt + (note.startBeat - fromBeat) * this.secondsPerBeat;
            if (attackAt > horizon) break;
            const releaseAt = attackAt + note.durationBeats * this.secondsPerBeat;
            if (releaseAt <= now) {
              this.omitted++;
              channel.next++;
              continue;
            }
            let voice = channel.voices.find(({ lease }) => !lease || lease.reusableAfter <= now);
            if (!voice && channel.voices.length < POLYPHONY) {
              voice = this.addVoice(channel);
            }
            if (!voice && channel.voices.some(({ lease }) => lease!.reusableAfter <= attackAt)) {
              break;
            }
            channel.next++;
            if (!voice) {
              this.omitted++;
              continue;
            }
            voice.lease = {
              sessionId,
              trackId: note.trackId,
              sourceNoteId: note.sourceNoteId,
              attackAt: Math.max(now, attackAt),
              releaseAt,
              reusableAfter: releaseAt + channel.track.synth.envelope.release,
              token: Symbol(note.sourceNoteId),
            };
            voice.synth.triggerAttack(note.frequency, voice.lease.attackAt, note.velocity);
            voice.synth.triggerRelease(voice.lease.releaseAt);
          }
        }

        if ([...this.channels.values()].some(({ next, pending }) => next < pending.length)) {
          this.wakeup = this.context?.setTimeout(() => {
            try {
              refill();
            } catch (error) {
              if (sessionId !== this.generation) return;
              this.stop();
              onError?.(error);
            }
          }, REFILL_INTERVAL);
        }
      };
      refill();
      return true;
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  private addVoice(channel: TrackChannel): Voice {
    const settings = channel.track.synth;
    const synth = new Tone.Synth({
      oscillator:
        settings.mode === 'additive'
          ? { type: 'custom', partials: generatePartials(settings.harmonicCount) }
          : { type: settings.waveform },
      envelope: settings.envelope,
    });
    const voice = { synth };
    channel.voices.push(voice);
    synth.connect(channel.gain);
    return voice;
  }

  getPosition(): number {
    if (!this.playing) return this.startBeat;
    const elapsed = Math.max(0, Tone.immediate() - this.startedAt);
    return Math.min(this.endBeat, this.startBeat + elapsed / this.secondsPerBeat);
  }

  hasEnded(): boolean {
    return this.playing && this.getPosition() >= this.endBeat;
  }

  getOmittedCount(): number {
    return this.omitted;
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.master?.gain.rampTo(Math.max(0, Math.min(1, volume)) * 0.25, 0.05);
  }

  stop(): void {
    this.generation++;
    this.playing = false;
    if (this.wakeup !== undefined) this.context?.clearTimeout(this.wakeup);
    this.wakeup = undefined;
    this.context = undefined;

    for (const { voices, gain } of this.channels.values()) {
      for (const voice of voices) {
        voice.lease = undefined;
        voice.synth.dispose();
      }
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
