import React, { useCallback, useEffect, useRef } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';
import {
  DEFAULT_DOTGRID_PHYSICS_CONFIG as DEFAULT_CONFIG,
  type DotGridPhysicsConfig,
} from '@/lib/physics';
import { useGraphStore, type FluidityNode } from '@/graph/graph-store';

type Sample = { x: number; y: number; t: number };

type DragEvent = globalThis.MouseEvent | globalThis.TouchEvent;

const GRID_CELL = 40; // mirrors --grid-cell; magnetic snap target
const snapToGrid = (v: number) => Math.round(v / GRID_CELL) * GRID_CELL;

export interface MomentumBridge {
  onNodeDragStart: (event: DragEvent, node: Node) => void;
  onNodeDrag: (event: DragEvent, node: Node) => void;
  onNodeDragStop: (event: DragEvent, node: Node) => void;
  onNodeMouseEnter: (event: React.MouseEvent, node: Node) => void;
  onNodeMouseLeave: (event: React.MouseEvent, node: Node) => void;
}

export interface MomentumBridgeOptions {
  onBounce?: (x: number, y: number, intensity: number) => void;
  config?: DotGridPhysicsConfig;
  /** estimated node footprint in flow units, used to keep nodes inside bounds */
  nodeSize?: { width: number; height: number };
}

/**
 * The single seam between the DotGrid physics engine and XYFlow (ADR-003).
 * Samples drag velocity and, on release, coasts the node with momentum +
 * boundary bounce by writing positions through the graph store's `setNodes`.
 */
export function useMomentumBridge(opts: MomentumBridgeOptions = {}): MomentumBridge {
  const config = opts.config ?? DEFAULT_CONFIG;
  const nodeSize = opts.nodeSize ?? { width: 180, height: 80 };
  const onBounce = opts.onBounce;

  const rf = useReactFlow();
  const setNodes = useGraphStore((s) => s.setNodes);

  const samplesRef = useRef<Map<string, Sample[]>>(new Map());
  const rafRef = useRef<Map<string, number>>(new Map());

  const cancelLoop = useCallback((id: string) => {
    const raf = rafRef.current.get(id);
    if (raf != null) {
      cancelAnimationFrame(raf);
      rafRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const loops = rafRef.current;
    return () => {
      loops.forEach((raf) => cancelAnimationFrame(raf));
      loops.clear();
    };
  }, []);

  // visible viewport expressed in flow coordinates, inset by margin and node size
  const getBounds = useCallback(() => {
    const { x, y, zoom } = rf.getViewport();
    const pane = document.querySelector('.react-flow__viewport')?.parentElement;
    const w = pane?.clientWidth ?? window.innerWidth;
    const h = pane?.clientHeight ?? window.innerHeight;
    const m = config.boundaryMargin;
    return {
      minX: (-x) / zoom + m,
      maxX: (-x + w) / zoom - nodeSize.width - m,
      minY: (-y) / zoom + m,
      maxY: (-y + h) / zoom - nodeSize.height - m,
    };
  }, [rf, config.boundaryMargin, nodeSize.width, nodeSize.height]);

  const clampVel = useCallback(
    (vx: number, vy: number) => {
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > config.maxVelocity) {
        const r = config.maxVelocity / speed;
        return { vx: vx * r, vy: vy * r };
      }
      return { vx, vy };
    },
    [config.maxVelocity],
  );

  const releaseVelocity = useCallback((samples: Sample[]) => {
    if (samples.length < 2) return { x: 0, y: 0 };
    const now = performance.now();
    const maxAge = 80;
    if (now - samples[samples.length - 1].t > maxAge) return { x: 0, y: 0 };

    let totalWeight = 0;
    let vX = 0;
    let vY = 0;
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];
      const dt = curr.t - prev.t;
      const age = now - curr.t;
      if (age <= maxAge && dt >= 8 && dt < 100) {
        const weight = i / samples.length;
        vX += ((curr.x - prev.x) / dt) * 16.67 * weight;
        vY += ((curr.y - prev.y) / dt) * 16.67 * weight;
        totalWeight += weight;
      }
    }
    if (totalWeight === 0) return { x: 0, y: 0 };
    return { x: vX / totalWeight, y: vY / totalWeight };
  }, []);

  const writePosition = useCallback(
    (id: string, x: number, y: number) => {
      setNodes((nodes: FluidityNode[]) =>
        nodes.map((n) => (n.id === id ? { ...n, position: { x, y } } : n)),
      );
    },
    [setNodes],
  );

  const setEnergy = useCallback(
    (id: string, energy: number) => {
      setNodes((nodes: FluidityNode[]) =>
        nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, energy } } : n)),
      );
    },
    [setNodes],
  );

  // bounce points are emitted in flow/world coords — the dot-grid renders in
  // world space and applies the viewport transform itself.
  const emitBounce = useCallback(
    (fx: number, fy: number, impact: number) => onBounce?.(fx, fy, impact),
    [onBounce],
  );

  const animateMomentum = useCallback(
    (id: string, startX: number, startY: number, vx0: number, vy0: number) => {
      const clamped = clampVel(vx0, vy0);
      let x = startX;
      let y = startY;
      let vx = clamped.vx;
      let vy = clamped.vy;
      const justBounced = { x: false, y: false };

      const step = () => {
        const bounds = getBounds();
        const speed = Math.sqrt(vx * vx + vy * vy);
        const speedRatio = Math.min(speed / config.maxVelocity, 1);
        const friction =
          config.baseFriction - speedRatio * (config.baseFriction - config.highSpeedFriction);

        vx *= friction * (justBounced.x ? config.bounceFrictionBoost : 1);
        vy *= friction * (justBounced.y ? config.bounceFrictionBoost : 1);
        justBounced.x = false;
        justBounced.y = false;

        x += vx;
        y += vy;

        const preBounce = Math.sqrt(vx * vx + vy * vy);
        const impact = Math.min(preBounce / config.maxVelocity, 1);
        let bounced = false;

        if (x < bounds.minX) {
          x = bounds.minX;
          vx = Math.abs(vx) * config.bounceDamping;
          justBounced.x = true;
          bounced = true;
          emitBounce(x, y + nodeSize.height / 2, impact);
        } else if (x > bounds.maxX) {
          x = bounds.maxX;
          vx = -Math.abs(vx) * config.bounceDamping;
          justBounced.x = true;
          bounced = true;
          emitBounce(x + nodeSize.width, y + nodeSize.height / 2, impact);
        }
        if (y < bounds.minY) {
          y = bounds.minY;
          vy = Math.abs(vy) * config.bounceDamping;
          justBounced.y = true;
          bounced = true;
          emitBounce(x + nodeSize.width / 2, y, impact);
        } else if (y > bounds.maxY) {
          y = bounds.maxY;
          vy = -Math.abs(vy) * config.bounceDamping;
          justBounced.y = true;
          bounced = true;
          emitBounce(x + nodeSize.width / 2, y + nodeSize.height, impact);
        }
        void bounced;

        if (Math.sqrt(vx * vx + vy * vy) > config.minVelocity) {
          writePosition(id, x, y);
          rafRef.current.set(id, requestAnimationFrame(step));
        } else {
          // settle exactly onto the grid so the node rests on a dot
          writePosition(id, snapToGrid(x), snapToGrid(y));
          rafRef.current.delete(id);
        }
      };

      cancelLoop(id);
      rafRef.current.set(id, requestAnimationFrame(step));
    },
    [clampVel, getBounds, config, emitBounce, nodeSize.width, nodeSize.height, writePosition, cancelLoop],
  );

  const onNodeDragStart = useCallback(
    (_e: DragEvent, node: Node) => {
      cancelLoop(node.id);
      samplesRef.current.set(node.id, [
        { x: node.position.x, y: node.position.y, t: performance.now() },
      ]);
    },
    [cancelLoop],
  );

  const onNodeDrag = useCallback(
    (_e: DragEvent, node: Node) => {
      const buf = samplesRef.current.get(node.id) ?? [];
      buf.push({ x: node.position.x, y: node.position.y, t: performance.now() });
      if (buf.length > config.velocitySampleCount) buf.shift();
      samplesRef.current.set(node.id, buf);
    },
    [config.velocitySampleCount],
  );

  const onNodeDragStop = useCallback(
    (e: DragEvent, node: Node) => {
      const buf = samplesRef.current.get(node.id) ?? [];
      const v = releaseVelocity(buf);
      const { vx, vy } = clampVel(v.x, v.y);
      const speed = Math.sqrt(vx * vx + vy * vy);
      samplesRef.current.delete(node.id);
      if (speed > config.momentumThreshold) {
        animateMomentum(node.id, node.position.x, node.position.y, vx, vy);
      } else {
        // magnetic snap: settle onto the nearest grid cell so the node rests on a dot
        writePosition(node.id, snapToGrid(node.position.x), snapToGrid(node.position.y));
      }
      void e;
    },
    [releaseVelocity, clampVel, config.momentumThreshold, animateMomentum, writePosition],
  );

  const onNodeMouseEnter = useCallback(
    (_e: React.MouseEvent, node: Node) => setEnergy(node.id, 1),
    [setEnergy],
  );
  const onNodeMouseLeave = useCallback(
    (_e: React.MouseEvent, node: Node) => setEnergy(node.id, 0),
    [setEnergy],
  );

  return { onNodeDragStart, onNodeDrag, onNodeDragStop, onNodeMouseEnter, onNodeMouseLeave };
}
