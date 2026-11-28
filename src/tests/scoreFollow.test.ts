import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FOLLOW_MODE,
  followAfterInput,
  scoreScrollBehavior,
  shouldRevealSystem,
} from '@/features/notation/StaffNotation/scoreFollow';

describe('Piano score following', () => {
  it('suspends on manual input alone and explicitly resumes', () => {
    expect(followAfterInput('following', 'programmatic')).toBe('following');
    expect(followAfterInput('following', 'manual')).toBe('suspended');
    expect(followAfterInput('suspended', 'toggle')).toBe('following');
    expect(followAfterInput('off', 'manual')).toBe('off');
  });

  it('starts enabled and honors reduced motion', () => {
    expect(DEFAULT_FOLLOW_MODE).toBe('following');
    expect(scoreScrollBehavior(true)).toBe('instant');
    expect(scoreScrollBehavior(false)).toBe('smooth');
    expect(shouldRevealSystem('following', 'loop', false)).toBe(true);
    expect(shouldRevealSystem('following', 'play', true)).toBe(false);
    expect(shouldRevealSystem('suspended', 'seek', false)).toBe(true);
    expect(followAfterInput('following', 'toggle')).toBe('off');
  });

  it('keeps pause and visible systems still, including during a loop', () => {
    expect(shouldRevealSystem('following', 'pause', false)).toBe(false);
    expect(shouldRevealSystem('following', 'loop', true)).toBe(false);
    expect(shouldRevealSystem('following', 'play', false)).toBe(true);
    expect(shouldRevealSystem('suspended', 'play', false)).toBe(false);
    expect(shouldRevealSystem('suspended', 'stop', true)).toBe(true);
    expect(shouldRevealSystem('off', 'seek', false)).toBe(true);
    expect(shouldRevealSystem('off', 'stop', false)).toBe(false);
  });
});
