/**
 * RingBuffer — a fixed-length numeric series for live graphs.
 *
 * The engine pushes one value per displayed frame (~50 Hz); panels read the
 * buffer from their own rAF and draw to a <canvas>. Keeping the series here
 * (not in React state) is what stops 60 fps sampling from re-rendering React.
 */
export class RingBuffer {
  private data: Float32Array;
  private head = 0;
  private filled = 0;
  /** Running max, used to auto-scale graphs without a full scan each draw. */
  max = 0;

  constructor(public readonly capacity: number) {
    this.data = new Float32Array(capacity);
  }

  push(value: number): void {
    const v = Number.isFinite(value) ? value : 0;
    this.data[this.head] = v;
    this.head = (this.head + 1) % this.capacity;
    if (this.filled < this.capacity) this.filled++;
    if (v > this.max) this.max = v;
  }

  get length(): number {
    return this.filled;
  }

  /** Most-recent value, or 0 if empty. */
  last(): number {
    if (this.filled === 0) return 0;
    return this.data[(this.head - 1 + this.capacity) % this.capacity];
  }

  /** Iterate oldest → newest, calling `fn(value, index)`. */
  forEach(fn: (value: number, index: number) => void): void {
    const start = this.filled < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.filled; i++) {
      fn(this.data[(start + i) % this.capacity], i);
    }
  }

  /** Recompute `max` from scratch (graphs that need a tight bound call this lazily). */
  recomputeMax(): number {
    let m = 0;
    this.forEach((v) => {
      if (v > m) m = v;
    });
    this.max = m;
    return m;
  }

  clear(): void {
    this.head = 0;
    this.filled = 0;
    this.max = 0;
    this.data.fill(0);
  }
}

/** Named series registry shared between the engine (writer) and panels (readers). */
export class SeriesRegistry {
  private series = new Map<string, RingBuffer>();

  constructor(private readonly capacity: number) {}

  get(name: string): RingBuffer {
    let s = this.series.get(name);
    if (!s) {
      s = new RingBuffer(this.capacity);
      this.series.set(name, s);
    }
    return s;
  }

  clearAll(): void {
    for (const s of this.series.values()) s.clear();
  }
}
