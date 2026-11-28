import { expect, it } from 'vitest';
import { createCompositionEditGate } from '@/stores/compositionEditGate';

it('retains the lock during transfer and rejects stale owners', () => {
  const gate = createCompositionEditGate();
  const first = gate.acquire();
  if (!first) throw new Error('Expected initial lock ownership');
  expect(gate.isLocked()).toBe(true);
  const second = gate.transfer(first)!;
  expect(second).not.toBe(first);
  expect(gate.transfer(first)).toBeUndefined();
  expect(gate.release(first)).toBe(false);
  expect(gate.acquire()).toBeUndefined();
  expect(gate.isLocked()).toBe(true);
  expect(gate.release(second)).toBe(true);
  expect(gate.isLocked()).toBe(false);
});
