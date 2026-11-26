export function generateEuclideanRhythm(steps: number, pulses: number, rotation = 0): boolean[] {
  if (
    !Number.isInteger(steps) ||
    steps < 1 ||
    steps > 256 ||
    !Number.isInteger(pulses) ||
    pulses < 0 ||
    pulses > steps ||
    !Number.isInteger(rotation)
  ) {
    throw new RangeError('Invalid rhythm parameters');
  }

  const rhythm = Array.from(
    { length: steps },
    (_, index) =>
      Math.floor(((index + 1) * pulses) / steps) !== Math.floor((index * pulses) / steps),
  );

  const offset = ((rotation % steps) + steps) % steps;

  return [...rhythm.slice(offset), ...rhythm.slice(0, offset)];
}
