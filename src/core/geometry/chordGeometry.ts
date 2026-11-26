import { clockAngleToPoint, frequencyToClockAngle } from './noteClock';

export function getChordGeometry(frequencies: readonly number[], reference = 440, radius = 1) {
  return frequencies.map((frequency) => {
    const angle = frequencyToClockAngle(frequency, reference);

    return {
      frequency,
      angle,
      ...clockAngleToPoint(angle, radius),
    };
  });
}
