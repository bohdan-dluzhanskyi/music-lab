export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function normalizeRadians(radians: number): number {
  const tau = 2 * Math.PI;

  return ((radians % tau) + tau) % tau;
}

export function angularDistance(from: number, to: number): number {
  const distance = normalizeDegrees(to - from);

  return Math.min(distance, 360 - distance);
}
