import { create } from 'zustand';

import type { Composition, PlaybackStatus } from '@/core/types/composition.types';
import { getCompositionLength } from '@/core/composition/composition';
import { sequencer } from '@/engines/audio/Sequencer';

import { useCompositionStore } from './composition.store';
import { useProjectStore } from './project.store';
import { useAudioStore } from './audio.store';
import { compositionEditGate } from './compositionEditGate';

export type PlaybackNavigation = 'play' | 'pause' | 'stop' | 'seek' | 'loop';

interface SequencerState {
  status: PlaybackStatus;
  position: number;
  loop: boolean;
  error: string | null;
  omitted: number;
  navigation: { kind: PlaybackNavigation; revision: number };

  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (beat: number) => void;
  toggleLoop: () => void;
}

export function isCompositionPlaybackActive({ status }: Pick<SequencerState, 'status'>): boolean {
  return status === 'initializing' || status === 'playing';
}

interface PlaybackSession {
  requestId: number;
  composition: Composition;
  pendingTargetBeat: number;
  editLock: symbol;
}

export const useSequencerStore = create<SequencerState>((set, get) => {
  let frame: number | undefined;
  let generation = 0;
  let session: PlaybackSession | undefined;

  function navigation(kind: PlaybackNavigation) {
    return { kind, revision: get().navigation.revision + 1 };
  }

  function cancelAudio() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    sequencer.stop();
  }

  function finish() {
    generation++;
    cancelAudio();
    if (session) compositionEditGate.release(session.editLock);
    session = undefined;
  }

  async function start(composition: Composition, requestedBeat: number, kind: PlaybackNavigation) {
    const editLock = session
      ? compositionEditGate.transfer(session.editLock)
      : compositionEditGate.acquire();
    if (!editLock) return;

    const requestId = ++generation;
    const end = getCompositionLength(composition);
    const pendingTargetBeat = requestedBeat >= end && get().loop && end > 0 ? 0 : requestedBeat;
    session = { requestId, composition, pendingTargetBeat, editLock };
    cancelAudio();
    set({
      status: 'initializing',
      position: pendingTargetBeat,
      error: null,
      navigation: navigation(kind),
      omitted: 0,
    });

    const fail = (error: unknown) => {
      if (session?.requestId !== requestId) return;
      finish();
      set({
        status: 'paused',
        navigation: navigation('pause'),
        error: error instanceof Error ? error.message : 'Playback failed',
      });
    };

    const tick = () => {
      if (session?.requestId !== requestId) return;
      set({ position: sequencer.getPosition(), omitted: sequencer.getOmittedCount() });
      if (session?.requestId !== requestId) return;
      if (sequencer.hasEnded()) {
        frame = requestAnimationFrame(() => {
          if (session?.requestId !== requestId) return;
          if (get().loop) void start(session.composition, 0, 'loop');
          else get().stop();
        });
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    try {
      if (session?.requestId !== requestId) return;
      if (kind === 'play') useAudioStore.getState().stopAll();
      const started = await sequencer.play(
        composition,
        pendingTargetBeat,
        useProjectStore.getState().volume,
        fail,
      );
      if (session?.requestId !== requestId) return;
      if (!started) {
        finish();
        set({ status: 'paused' });
        return;
      }
      sequencer.setVolume(useProjectStore.getState().volume);
      set({ status: 'playing' });
      tick();
    } catch (error) {
      fail(error);
    }
  }

  return {
    status: 'stopped',
    position: 0,
    loop: false,
    error: null,
    omitted: 0,
    navigation: { kind: 'stop', revision: 0 },

    play: async () => {
      if (session) return;
      const composition = useCompositionStore.getState().composition;
      await start(composition, Math.min(get().position, getCompositionLength(composition)), 'play');
    },

    pause: () => {
      if (!session) return;
      const position =
        get().status === 'playing' ? sequencer.getPosition() : session.pendingTargetBeat;
      finish();
      set({ position, status: 'paused', navigation: navigation('pause') });
    },

    stop: () => {
      finish();
      useAudioStore.getState().stopAll();
      set({ status: 'stopped', position: 0, navigation: navigation('stop'), error: null });
    },

    seek: (beat) => {
      if (!Number.isFinite(beat)) return;
      const composition = session?.composition ?? useCompositionStore.getState().composition;
      const position = Math.max(0, Math.min(getCompositionLength(composition), beat));

      if (session) void start(composition, position, 'seek');
      else set({ position, navigation: navigation('seek'), error: null });
    },

    toggleLoop: () => set((state) => ({ loop: !state.loop })),
  };
});

useProjectStore.subscribe((state, previous) => {
  if (state.volume !== previous.volume) sequencer.setVolume(state.volume);
});
