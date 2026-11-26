export function transposeMidi(midi: number, semitones: number): number {
  if (!Number.isInteger(midi) || !Number.isInteger(semitones) || midi < 0 || midi > 127) {
    throw new RangeError('Invalid transposition');
  }

  const result = midi + semitones;

  if (result < 0 || result > 127) {
    throw new RangeError('MIDI note out of range');
  }

  return result;
}

export function transposeFrequency(frequency: number, semitones: number): number {
  if (!Number.isFinite(frequency) || frequency <= 0 || !Number.isFinite(semitones)) {
    throw new RangeError('Invalid frequency transposition');
  }

  const result = frequency * 2 ** (semitones / 12);

  if (!Number.isFinite(result) || result <= 0) {
    throw new RangeError('Frequency out of range');
  }

  return result;
}

export function transposeNotes(notes: readonly number[], semitones: number): number[] {
  return notes.map((midi) => transposeMidi(midi, semitones));
}
