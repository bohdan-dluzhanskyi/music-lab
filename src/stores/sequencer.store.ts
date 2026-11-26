import { create } from 'zustand';

import type { PlaybackStatus } from '@/core/types/composition.types';

import { getCompositionLength } from '@/core/composition/composition';

import { sequencer } from '@/engines/audio/Sequencer';

import { useCompositionStore } from './composition.store';
import { useProjectStore } from './project.store';
import { useAudioStore } from './audio.store';

interface SequencerState {
  status: PlaybackStatus;
  position: number;
  loop: boolean;
  error: string | null;

  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (beat: number) => void;
  toggleLoop: () => void;
}

let frame: number | null = null;
let generation = 0;

function cancelFrame() {
  if (frame !== null) {
    cancelAnimationFrame(frame);
    frame = null;
  }
}

export const useSequencerStore = create<SequencerState>((set, get) => {
  function tick() {
    if (get().status !== 'playing') return;

    set({ position: sequencer.getPosition() });

    if (sequencer.hasEnded()) {
      sequencer.stop();

      if (get().loop) {
        set({
          position: 0,
          status: 'stopped',
        });

        void get().play();
      } else {
        get().stop();
      }

      return;
    }

    frame = requestAnimationFrame(tick);
  }

  return {
    status: 'stopped',
    position: 0,
    loop: false,
    error: null,

    play: async () => {
      const id = ++generation;

      cancelFrame();

      useAudioStore.getState().stopAll();

      const composition = useCompositionStore.getState().composition;

      const volume = useProjectStore.getState().volume;

      set({
        status: 'playing',
        error: null,
      });

      try {
        const started = await sequencer.play(composition, get().position, volume);

        if (id !== generation) return;

        if (!started) {
          get().stop();
          return;
        }

        tick();
      } catch (error) {
        if (id !== generation) return;

        set({
          status: 'stopped',
          error: error instanceof Error ? error.message : 'Playback failed',
        });
      }
    },

    pause: () => {
      generation += 1;

      const position = sequencer.getPosition();

      cancelFrame();
      sequencer.stop();

      set({
        position,
        status: 'paused',
      });
    },

    stop: () => {
      generation += 1;

      cancelFrame();
      sequencer.stop();

      useAudioStore.getState().stopAll();

      set({
        status: 'stopped',
        position: 0,
      });
    },

    seek: (beat) => {
      if (!Number.isFinite(beat)) return;

      const wasPlaying = get().status === 'playing';

      generation += 1;

      cancelFrame();
      sequencer.stop();

      const composition = useCompositionStore.getState().composition;

      set({
        position: Math.max(0, Math.min(getCompositionLength(composition), beat)),
        status: 'paused',
      });

      if (wasPlaying) {
        void get().play();
      }
    },

    toggleLoop: () => set((state) => ({ loop: !state.loop })),
  };
});

useProjectStore.subscribe((state, previous) => {
  if (state.volume !== previous.volume) {
    sequencer.setVolume(state.volume);
  }
});
