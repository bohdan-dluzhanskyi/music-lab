import { frequencyToPitch } from './notes';
import { frequencyToAngle } from '../geometry/noteClock';
import { normalizeDegrees } from '../mathematics/angles';

export function generateHarmonics(fundamental: number, count = 16) {
  if (!Number.isFinite(fundamental) || fundamental <= 0) {
    throw new RangeError('Invalid fundamental frequency');
  }

  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('Invalid harmonic count');
  }

  return Array.from({ length: count }, (_, index) => {
    const harmonic = index + 1;
    const frequency = fundamental * harmonic;
    const angle = frequencyToAngle(frequency, fundamental);

    return {
      harmonic,
      frequency,
      ratio: harmonic,
      amplitude: 1 / harmonic,
      angle,
      clockAngle: normalizeDegrees(angle),
      pitch: frequencyToPitch(frequency),
    };
  });
}
