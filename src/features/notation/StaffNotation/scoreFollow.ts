import type { PlaybackNavigation } from '@/stores/sequencer.store';

export type FollowMode = 'following' | 'suspended' | 'off';

export const DEFAULT_FOLLOW_MODE: FollowMode = 'following';

export function followAfterInput(
  mode: FollowMode,
  input: 'manual' | 'programmatic' | 'toggle',
): FollowMode {
  if (input === 'toggle') return mode === 'following' ? 'off' : 'following';
  return input === 'manual' && mode === 'following' ? 'suspended' : mode;
}

export function shouldRevealSystem(
  mode: FollowMode,
  command: PlaybackNavigation,
  visible: boolean,
): boolean {
  if (command === 'seek') return true;
  if (command === 'stop') return mode !== 'off';
  return command !== 'pause' && mode === 'following' && !visible;
}

export function scoreScrollBehavior(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? 'instant' : 'smooth';
}
