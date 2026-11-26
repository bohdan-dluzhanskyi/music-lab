import { normalizeDegrees } from '@/core/mathematics/angles';
import { angleToFrequency } from './noteClock';
import { frequencyToPitch } from '@/core/music/notes';

export function generateAngleSequence(
  reference: number,
  stepAngle: number,
  count: number,
  foldOctaves = true,
) {
  if (!Number.isFinite(reference) || reference <= 0) {
    throw new RangeError('Invalid reference frequency');
  }

  if (!Number.isFinite(stepAngle)) {
    throw new RangeError('Invalid angle');
  }

  if (!Number.isInteger(count) || count < 1 || count > 256) {
    throw new RangeError('Count must be between 1 and 256');
  }

  return Array.from({ length: count }, (_, index) => {
    const angle = index * stepAngle;
    const clockAngle = normalizeDegrees(angle);

    const frequency = angleToFrequency(foldOctaves ? clockAngle : angle, reference);

    return {
      index,
      angle,
      clockAngle,
      frequency,
      pitch: frequencyToPitch(frequency),
    };
  });
}
