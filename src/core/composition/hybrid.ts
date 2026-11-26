export function blendFrequencies(classical: number, mathematical: number, weight: number): number {
  if (
    !Number.isFinite(classical) ||
    !Number.isFinite(mathematical) ||
    classical <= 0 ||
    mathematical <= 0
  ) {
    throw new RangeError('Invalid frequencies');
  }

  if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
    throw new RangeError('Weight must be between 0 and 1');
  }

  if (weight === 0) return classical;
  if (weight === 1) return mathematical;

  return 2 ** (Math.log2(classical) * (1 - weight) + Math.log2(mathematical) * weight);
}

export function blendSequences(
  classical: readonly number[],
  mathematical: readonly number[],
  weight: number,
): number[] {
  if (classical.length !== mathematical.length) {
    throw new RangeError('Sequence lengths must match');
  }

  return classical.map((frequency, index) =>
    blendFrequencies(frequency, mathematical[index]!, weight),
  );
}
