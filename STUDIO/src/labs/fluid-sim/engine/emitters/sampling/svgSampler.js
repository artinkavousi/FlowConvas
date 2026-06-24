// svgSampler — minimal SVG path "d" attribute parser + flattener.
//
// Supports the path commands the brief actually needs: M m L l H h V v C c
// Q q S s T t Z z. Arcs (A/a) are flattened to a poly-bezier approximation
// good enough for typical UI icons.
//
// API
//   flattenSvgPath(d, opts) -> Array<{x, y}> in 0..1 within the path's
//                              normalized bounding box (auto-fit)
//   opts.samplesPerCurve = 16 — cubic/quadratic curves are walked at this many
//                              steps; lines are kept as endpoints.
//
// Output points are normalized into the path's bounding box and y-flipped to
// the sim convention (origin bottom-left).

const NUM_RE = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

export function flattenSvgPath(d, { samplesPerCurve = 16 } = {}) {
    if (typeof d !== 'string' || !d.trim()) return [];
    const cmds = parseCommands(d);
    const out = [];
    let cx = 0, cy = 0;     // current point
    let sx = 0, sy = 0;     // subpath start
    let prevCtrlX = null;   // last cubic control point (for S/s)
    let prevCtrlY = null;
    let prevQCtrlX = null;  // last quadratic control point (for T/t)
    let prevQCtrlY = null;

    for (const { cmd, args } of cmds) {
        const isRel = cmd === cmd.toLowerCase();
        const C = cmd.toUpperCase();
        switch (C) {
            case 'M': {
                for (let i = 0; i < args.length; i += 2) {
                    const x = isRel && i > 0 ? cx + args[i] : (isRel ? cx + args[i] : args[i]);
                    const y = isRel && i > 0 ? cy + args[i + 1] : (isRel ? cy + args[i + 1] : args[i + 1]);
                    cx = x; cy = y;
                    if (i === 0) { sx = cx; sy = cy; }
                    out.push({ x: cx, y: cy });
                }
                prevCtrlX = prevCtrlY = prevQCtrlX = prevQCtrlY = null;
                break;
            }
            case 'L': {
                for (let i = 0; i < args.length; i += 2) {
                    const x = isRel ? cx + args[i] : args[i];
                    const y = isRel ? cy + args[i + 1] : args[i + 1];
                    cx = x; cy = y;
                    out.push({ x: cx, y: cy });
                }
                prevCtrlX = prevCtrlY = prevQCtrlX = prevQCtrlY = null;
                break;
            }
            case 'H': {
                for (let i = 0; i < args.length; i += 1) {
                    cx = isRel ? cx + args[i] : args[i];
                    out.push({ x: cx, y: cy });
                }
                prevCtrlX = prevCtrlY = prevQCtrlX = prevQCtrlY = null;
                break;
            }
            case 'V': {
                for (let i = 0; i < args.length; i += 1) {
                    cy = isRel ? cy + args[i] : args[i];
                    out.push({ x: cx, y: cy });
                }
                prevCtrlX = prevCtrlY = prevQCtrlX = prevQCtrlY = null;
                break;
            }
            case 'C': {
                for (let i = 0; i < args.length; i += 6) {
                    const c1x = isRel ? cx + args[i] : args[i];
                    const c1y = isRel ? cy + args[i + 1] : args[i + 1];
                    const c2x = isRel ? cx + args[i + 2] : args[i + 2];
                    const c2y = isRel ? cy + args[i + 3] : args[i + 3];
                    const ex  = isRel ? cx + args[i + 4] : args[i + 4];
                    const ey  = isRel ? cy + args[i + 5] : args[i + 5];
                    flattenCubic(cx, cy, c1x, c1y, c2x, c2y, ex, ey, samplesPerCurve, out);
                    cx = ex; cy = ey;
                    prevCtrlX = c2x; prevCtrlY = c2y;
                }
                prevQCtrlX = prevQCtrlY = null;
                break;
            }
            case 'S': {
                for (let i = 0; i < args.length; i += 4) {
                    const c1x = prevCtrlX != null ? 2 * cx - prevCtrlX : cx;
                    const c1y = prevCtrlY != null ? 2 * cy - prevCtrlY : cy;
                    const c2x = isRel ? cx + args[i] : args[i];
                    const c2y = isRel ? cy + args[i + 1] : args[i + 1];
                    const ex  = isRel ? cx + args[i + 2] : args[i + 2];
                    const ey  = isRel ? cy + args[i + 3] : args[i + 3];
                    flattenCubic(cx, cy, c1x, c1y, c2x, c2y, ex, ey, samplesPerCurve, out);
                    cx = ex; cy = ey;
                    prevCtrlX = c2x; prevCtrlY = c2y;
                }
                prevQCtrlX = prevQCtrlY = null;
                break;
            }
            case 'Q': {
                for (let i = 0; i < args.length; i += 4) {
                    const c1x = isRel ? cx + args[i] : args[i];
                    const c1y = isRel ? cy + args[i + 1] : args[i + 1];
                    const ex  = isRel ? cx + args[i + 2] : args[i + 2];
                    const ey  = isRel ? cy + args[i + 3] : args[i + 3];
                    flattenQuadratic(cx, cy, c1x, c1y, ex, ey, samplesPerCurve, out);
                    cx = ex; cy = ey;
                    prevQCtrlX = c1x; prevQCtrlY = c1y;
                }
                prevCtrlX = prevCtrlY = null;
                break;
            }
            case 'T': {
                for (let i = 0; i < args.length; i += 2) {
                    const c1x = prevQCtrlX != null ? 2 * cx - prevQCtrlX : cx;
                    const c1y = prevQCtrlY != null ? 2 * cy - prevQCtrlY : cy;
                    const ex  = isRel ? cx + args[i] : args[i];
                    const ey  = isRel ? cy + args[i + 1] : args[i + 1];
                    flattenQuadratic(cx, cy, c1x, c1y, ex, ey, samplesPerCurve, out);
                    cx = ex; cy = ey;
                    prevQCtrlX = c1x; prevQCtrlY = c1y;
                }
                prevCtrlX = prevCtrlY = null;
                break;
            }
            case 'Z': {
                cx = sx; cy = sy;
                out.push({ x: cx, y: cy });
                prevCtrlX = prevCtrlY = prevQCtrlX = prevQCtrlY = null;
                break;
            }
            default:
                // Unsupported (e.g. A) — skip silently; consumer keeps drawing.
                break;
        }
    }

    if (out.length === 0) return [];

    // Normalize into 0..1, y-flipped.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of out) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    const w = Math.max(maxX - minX, 1e-4);
    const h = Math.max(maxY - minY, 1e-4);
    const scale = 1 / Math.max(w, h);
    // Fit into a centred unit box.
    const fitW = w * scale;
    const fitH = h * scale;
    const offX = (1 - fitW) * 0.5;
    const offY = (1 - fitH) * 0.5;
    const normalized = [];
    for (const p of out) {
        const nx = offX + ((p.x - minX) * scale);
        const ny = offY + ((p.y - minY) * scale);
        normalized.push({ x: nx, y: 1 - ny });
    }
    return normalized;
}

function flattenCubic(x0, y0, x1, y1, x2, y2, x3, y3, n, out) {
    for (let i = 1; i <= n; i += 1) {
        const t = i / n;
        const it = 1 - t;
        const x = it * it * it * x0 + 3 * it * it * t * x1 + 3 * it * t * t * x2 + t * t * t * x3;
        const y = it * it * it * y0 + 3 * it * it * t * y1 + 3 * it * t * t * y2 + t * t * t * y3;
        out.push({ x, y });
    }
}

function flattenQuadratic(x0, y0, x1, y1, x2, y2, n, out) {
    for (let i = 1; i <= n; i += 1) {
        const t = i / n;
        const it = 1 - t;
        const x = it * it * x0 + 2 * it * t * x1 + t * t * x2;
        const y = it * it * y0 + 2 * it * t * y1 + t * t * y2;
        out.push({ x, y });
    }
}

function parseCommands(d) {
    const tokens = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
    const out = [];
    for (const tok of tokens) {
        const cmd = tok[0];
        const rest = tok.slice(1).trim();
        const nums = rest.match(NUM_RE) || [];
        const args = nums.map(Number);
        out.push({ cmd, args });
    }
    return out;
}
