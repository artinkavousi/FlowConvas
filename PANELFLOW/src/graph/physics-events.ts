export interface Bounce {
  x: number;
  y: number;
  intensity: number;
  t: number;
}

const bounces: Bounce[] = [];

export function emitBounce(x: number, y: number, intensity: number) {
  bounces.push({ x, y, intensity, t: performance.now() });
  if (bounces.length > 50) {
    bounces.shift();
  }
}

export function getBounces(): Bounce[] {
  return bounces;
}
