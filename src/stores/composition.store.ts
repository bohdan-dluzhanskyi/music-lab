import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Composition, Track } from '@/core/types/composition.types';

import type { NoteEvent } from '@/core/types/music.types';

import {
  createComposition,
  createTrack,
  createCompositionNote,
} from '@/core/composition/composition';

import { frequencyToPitch } from '@/core/music/notes';

type TrackPatch = Partial<Omit<Track, 'id' | 'notes'>>;

interface NotePatch {
  frequency?: number;
  startBeat?: number;
  durationBeats?: number;
  velocity?: number;
}

interface CompositionState {
  composition: Composition;
  selectedTrackId: string | null;
  selectedNoteId: string | null;

  past: Composition[];
  future: Composition[];

  selectTrack: (id: string) => void;
  selectNote: (id: string | null) => void;

  setName: (name: string) => void;
  setBpm: (bpm: number) => void;

  addTrack: () => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, patch: TrackPatch) => void;

  addNote: (trackId: string, frequency: number, startBeat: number, durationBeats?: number) => void;

  updateNote: (trackId: string, noteId: string, patch: NotePatch) => void;

  removeNote: (trackId: string, noteId: string) => void;

  importSequence: (notes: readonly NoteEvent[], name?: string, totalBeats?: number) => void;

  undo: () => void;
  redo: () => void;
  reset: () => void;
}

const HISTORY_LIMIT = 100;
const initial = createComposition();

export const useCompositionStore = create<CompositionState>()(
  persist(
    (set, get) => {
      function commit(composition: Composition) {
        set((state) => ({
          composition,
          past: [...state.past, state.composition].slice(-HISTORY_LIMIT),
          future: [],
        }));
      }

      function changeTrack(id: string, updater: (track: Track) => Track) {
        const composition = get().composition;

        if (!composition.tracks.some((t) => t.id === id)) {
          return;
        }

        commit({
          ...composition,
          tracks: composition.tracks.map((track) => (track.id === id ? updater(track) : track)),
        });
      }

      return {
        composition: initial,
        selectedTrackId: initial.tracks[0]?.id ?? null,
        selectedNoteId: null,
        past: [],
        future: [],

        selectTrack: (id) =>
          set({
            selectedTrackId: id,
            selectedNoteId: null,
          }),

        selectNote: (id) => set({ selectedNoteId: id }),

        setName: (name) =>
          commit({
            ...get().composition,
            name,
          }),

        setBpm: (bpm) => {
          if (!Number.isFinite(bpm)) return;

          commit({
            ...get().composition,
            bpm: Math.max(20, Math.min(300, bpm)),
          });
        },

        addTrack: () => {
          const composition = get().composition;
          const track = createTrack(composition.tracks.length);

          commit({
            ...composition,
            tracks: [...composition.tracks, track],
          });

          set({
            selectedTrackId: track.id,
            selectedNoteId: null,
          });
        },

        removeTrack: (id) => {
          const composition = get().composition;

          if (composition.tracks.length <= 1) return;

          const tracks = composition.tracks.filter((track) => track.id !== id);

          commit({ ...composition, tracks });

          set({
            selectedTrackId: tracks[0]?.id ?? null,
            selectedNoteId: null,
          });
        },

        updateTrack: (id, patch) => {
          if (patch.volume !== undefined && !Number.isFinite(patch.volume)) {
            return;
          }

          changeTrack(id, (track) => ({
            ...track,
            ...patch,
            volume: Math.max(0, Math.min(1, patch.volume ?? track.volume)),
          }));
        },

        addNote: (trackId, frequency, startBeat, durationBeats = 0.5) => {
          const note = createCompositionNote(trackId, frequency, startBeat, durationBeats);

          changeTrack(trackId, (track) => ({
            ...track,
            notes: [...track.notes, note],
          }));

          set({
            selectedTrackId: trackId,
            selectedNoteId: note.id,
          });
        },

        updateNote: (trackId, noteId, patch) =>
          changeTrack(trackId, (track) => ({
            ...track,
            notes: track.notes.map((note) => {
              if (note.id !== noteId) return note;

              const validated = createCompositionNote(
                trackId,
                patch.frequency ?? note.pitch.frequency,
                patch.startBeat ?? note.startBeat,
                patch.durationBeats ?? note.durationBeats,
                patch.velocity ?? note.velocity,
              );

              return {
                ...validated,
                id: note.id,
                pitch:
                  patch.frequency === undefined ? note.pitch : frequencyToPitch(patch.frequency),
              };
            }),
          })),

        removeNote: (trackId, noteId) => {
          changeTrack(trackId, (track) => ({
            ...track,
            notes: track.notes.filter((note) => note.id !== noteId),
          }));

          set({ selectedNoteId: null });
        },

        importSequence: (notes, name = 'Mathematics', totalBeats = 0) => {
          const composition = get().composition;
          const track = createTrack(composition.tracks.length);

          track.name = name;

          track.notes = notes.map((note) =>
            createCompositionNote(
              track.id,
              note.pitch.frequency,
              note.startBeat,
              note.durationBeats,
              note.velocity,
            ),
          );

          commit({
            ...composition,
            lengthBeats: Math.max(composition.lengthBeats, totalBeats),
            tracks: [...composition.tracks, track],
          });

          set({
            selectedTrackId: track.id,
            selectedNoteId: null,
          });
        },

        undo: () => {
          const { past, future, composition } = get();
          const previous = past.at(-1);

          if (!previous) return;

          set({
            composition: previous,
            past: past.slice(0, -1),
            future: [composition, ...future],
            selectedTrackId: previous.tracks[0]?.id ?? null,
            selectedNoteId: null,
          });
        },

        redo: () => {
          const { past, future, composition } = get();
          const next = future[0];

          if (!next) return;

          set({
            composition: next,
            past: [...past, composition],
            future: future.slice(1),
            selectedTrackId: next.tracks[0]?.id ?? null,
            selectedNoteId: null,
          });
        },

        reset: () => {
          const composition = createComposition();

          commit(composition);

          set({
            selectedTrackId: composition.tracks[0]?.id ?? null,
            selectedNoteId: null,
          });
        },
      };
    },
    {
      name: 'music-lab-composition-v1',
      version: 1,

      partialize: (state) => ({
        composition: state.composition,
        selectedTrackId: state.selectedTrackId,
      }),
    },
  ),
);
