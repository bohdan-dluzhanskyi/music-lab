export function fibonacci(count: number): number[] {
  if (!Number.isInteger(count) || count < 0 || count > 79) {
    throw new RangeError('Count must be an integer between 0 and 79');
  }

  const result: number[] = [];

  let a = 0;
  let b = 1;

  for (let i = 0; i < count; i++) {
    result.push(a);

    [a, b] = [b, a + b];
  }

  return result;
}

export function fibonacciRatios(count: number): number[] {
  const sequence = fibonacci(count);
  const ratios: number[] = [];

  for (let i = 1; i < sequence.length; i++) {
    const previous = sequence[i - 1]!;

    if (previous !== 0) {
      ratios.push(sequence[i]! / previous);
    }
  }

  return ratios;
}
