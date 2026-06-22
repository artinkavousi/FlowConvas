import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    DynamicDrawUsage,
    Float32BufferAttribute,
    OrthographicCamera,
    Points,
    PointsNodeMaterial,
    Scene
} from 'three/webgpu';
import { attribute } from 'three/tsl';
import { config } from '../config.js';

// Secondary solver detail layer. NOT cosmetic billboards — this is a dense
// field of fine points that are advected by the fluid velocity field, born
// from splats carrying the fluid's own dye colour, accumulating (additive)
// into flowing filaments that trace the sub-grid structure the Eulerian grid
// can't resolve. They are an extension of the solver + splat: they flow with
// the fluid and read as part of it, not an overlay of dots.

export const PARTICLE_ROLES = { foam: 0, spray: 1, bubble: 2, spark: 3 };

export class ParticleSystem {
    constructor(renderer, capacity = 24000) {
        this.renderer = renderer;
        this.capacity = capacity;
        // Slots [0, ambientReserve) are a persistent flow-field pool (respawned
        // on death so the population stays constant and traces the whole flow);
        // slots [ambientReserve, capacity) are a ring buffer for splat bursts.
        this.ambientReserve = Math.floor(capacity * 0.6);
        this.cursor = this.ambientReserve;

        // CPU state (struct-of-arrays).
        this.px = new Float32Array(capacity);
        this.py = new Float32Array(capacity);
        this.vx = new Float32Array(capacity);
        this.vy = new Float32Array(capacity);
        this.life = new Float32Array(capacity);
        this.maxLife = new Float32Array(capacity);
        this.role = new Uint8Array(capacity);
        // base colour per particle
        this.cr = new Float32Array(capacity);
        this.cg = new Float32Array(capacity);
        this.cb = new Float32Array(capacity);

        // GPU attributes: position (z holds nothing) + colour (premultiplied by
        // fade so additive blending dims dead/old points to invisible).
        this.positions = new Float32Array(capacity * 3);
        this.colors = new Float32Array(capacity * 3);
        for (let i = 0; i < capacity; i += 1) {
            this.positions[i * 3] = -10; // park offscreen until spawned
        }

        const geometry = new BufferGeometry();
        this.posAttr = new Float32BufferAttribute(this.positions, 3);
        this.colAttr = new Float32BufferAttribute(this.colors, 3);
        this.posAttr.setUsage(DynamicDrawUsage);
        this.colAttr.setUsage(DynamicDrawUsage);
        geometry.setAttribute('position', this.posAttr);
        geometry.setAttribute('color', this.colAttr);

        const material = new PointsNodeMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: AdditiveBlending
        });
        // Each point's colour drives output; additive accumulation builds the
        // flowing filament look. Fade is baked into the colour (→0 = invisible).
        material.colorNode = attribute('color');

        this.points = new Points(geometry, material);
        this.points.frustumCulled = false;
        this.scene = new Scene();
        this.scene.add(this.points);
        // Unit ortho camera, x/y in [0,1], origin bottom-left.
        this.camera = new OrthographicCamera(0, 1, 1, 0, -1, 1);

        // Downsampled fluid velocity field (CPU copy, one frame late) so points
        // are advected BY the solver.
        this.velField = null;
        this.velWidth = 0;
        this.velHeight = 0;
        this.simWidth = 128;
        this._tmp = [0, 0];
        this._scratch = new Color();
    }

    get enabled() {
        return !!config.PARTICLES_ENABLED;
    }

    setVelocityField(field, width, height, simWidth) {
        this.velField = field;
        this.velWidth = width;
        this.velHeight = height;
        this.simWidth = simWidth || this.simWidth;
    }

    sampleVelocity(x, y, out) {
        const field = this.velField;
        const w = this.velWidth, h = this.velHeight;
        if (!field || w < 2 || h < 2) {
            out[0] = 0; out[1] = 0;
            return out;
        }
        const fx = (x < 0 ? 0 : x > 1 ? 1 : x) * (w - 1);
        const fy = (y < 0 ? 0 : y > 1 ? 1 : y) * (h - 1);
        const x0 = fx | 0, y0 = fy | 0;
        const x1 = x0 + 1 < w ? x0 + 1 : x0;
        const y1 = y0 + 1 < h ? y0 + 1 : y0;
        const tx = fx - x0, ty = fy - y0;
        const i00 = (y0 * w + x0) * 2, i10 = (y0 * w + x1) * 2;
        const i01 = (y1 * w + x0) * 2, i11 = (y1 * w + x1) * 2;
        out[0] = (field[i00] * (1 - tx) + field[i10] * tx) * (1 - ty) + (field[i01] * (1 - tx) + field[i11] * tx) * ty;
        out[1] = (field[i00 + 1] * (1 - tx) + field[i10 + 1] * tx) * (1 - ty) + (field[i01 + 1] * (1 - tx) + field[i11 + 1] * tx) * ty;
        return out;
    }

    // Spawn `count` points at (x,y). They inherit the splat's dye colour so the
    // filaments are coloured by the fluid, and a long life so they trace the
    // flow. `vx,vy` give a small initial impulse (spray/foam character).
    emit(role, x, y, vx, vy, count, opts = {}) {
        if (!this.enabled || count <= 0) {
            return;
        }
        const roleId = PARTICLE_ROLES[role] ?? PARTICLE_ROLES.foam;
        // Foam / spray / white-water is WHITE — it is aerated water, not a
        // coloured emissive thing. (The composite maps point density to foam
        // coverage with straight alpha, so this reads as froth, not glow.)
        let r = 0.9, g = 0.95, b = 1.0;
        if (role === 'spark') { r = 1.0; g = 0.85, b = 0.55; }

        const spread = opts.spread ?? 0.05;
        const impulse = opts.speed ?? 0.06;
        const life = (opts.life ?? config.PARTICLE_LIFETIME) * (0.6 + Math.random() * 0.8);

        const base = this.ambientReserve;
        const span = this.capacity - base;
        for (let n = 0; n < count; n += 1) {
            const i = this.cursor;
            this.cursor = base + ((this.cursor - base + 1) % span);
            const ang = Math.random() * Math.PI * 2;
            const mag = impulse * (0.2 + Math.random());
            this.px[i] = x + (Math.random() - 0.5) * spread;
            this.py[i] = y + (Math.random() - 0.5) * spread;
            this.vx[i] = vx * 0.00015 + Math.cos(ang) * mag;
            this.vy[i] = vy * 0.00015 + Math.sin(ang) * mag;
            if (role === 'bubble') this.vy[i] = Math.abs(this.vy[i]) * 0.5 + 0.03;
            this.life[i] = life;
            this.maxLife[i] = life;
            this.role[i] = roleId;
            this.cr[i] = r; this.cg[i] = g; this.cb[i] = b;
        }
    }

    update(dt) {
        if (!this.enabled) {
            return;
        }

        // Persistent ambient flow-field pool: keep the first `ambientActive`
        // slots always alive (respawn on death/exit at a fresh random spot), so
        // a constant dense field of points traces the whole velocity field into
        // flowing filaments — the "secondary solver detail" layer.
        const ambientLife = (config.PARTICLE_LIFETIME ?? 3);
        this._ambientActive = Math.min(config.PARTICLE_AMBIENT | 0, this.ambientReserve);
        const ambientActive = this._ambientActive;

        const flow = config.PARTICLE_FLOW ?? 1;
        const flipY = config.PARTICLE_FLOW_FLIP_Y ? -1 : 1;
        const gravity = config.PARTICLE_GRAVITY ?? 0;
        const brightness = config.PARTICLE_BRIGHTNESS ?? 1;
        const simW = this.simWidth || 128;
        const tmp = this._tmp;
        const pos = this.positions, col = this.colors;
        const px = this.px, py = this.py, vx = this.vx, vy = this.vy;

        for (let i = 0; i < this.capacity; i += 1) {
            const o = i * 3;
            if (this.life[i] <= 0) {
                if (i < ambientActive) {
                    // respawn this ambient point at a fresh random location
                    px[i] = Math.random(); py[i] = Math.random();
                    vx[i] = 0; vy[i] = 0;
                    const l = ambientLife * (0.4 + Math.random());
                    this.life[i] = l; this.maxLife[i] = l;
                    this.role[i] = PARTICLE_ROLES.foam;
                    this.cr[i] = 0.9; this.cg[i] = 0.95; this.cb[i] = 1.0;
                } else {
                    col[o] = 0; col[o + 1] = 0; col[o + 2] = 0;
                    continue;
                }
            }
            this.life[i] -= dt;
            const role = this.role[i];

            // Advected BY the fluid (UV/sec = vel / simWidth).
            this.sampleVelocity(px[i], py[i], tmp);
            const carryX = (tmp[0] / simW) * flow;
            const carryY = (tmp[1] / simW) * flow * flipY;

            // Per-role residual momentum.
            if (role === PARTICLE_ROLES.bubble) {
                vy[i] += gravity * 1.2 * dt; vx[i] *= 0.95; vy[i] *= 0.96;
            } else if (role === PARTICLE_ROLES.foam) {
                vx[i] *= 0.88; vy[i] *= 0.88;
            } else {
                vy[i] -= gravity * dt; vx[i] *= 0.97; vy[i] *= 0.97;
            }

            px[i] += (carryX + vx[i]) * dt;
            py[i] += (carryY + vy[i]) * dt;

            if (px[i] < -0.02 || px[i] > 1.02 || py[i] < -0.02 || py[i] > 1.02) {
                this.life[i] = 0;
                col[o] = 0; col[o + 1] = 0; col[o + 2] = 0;
                continue;
            }

            pos[o] = px[i];
            pos[o + 1] = py[i];
            // Fade-in then fade-out over life for soft foam edges.
            const t = this.life[i] / this.maxLife[i];        // 1→0
            const fade = (t < 0.85 ? t / 0.85 : (1 - t) / 0.15) * brightness;
            const sparkBoost = role === PARTICLE_ROLES.spark ? 1.8 : 1;
            // White-water: foam only forms where the fluid is agitated. Weight
            // foam density by the local flow speed so foam concentrates in the
            // churn and shows nothing on calm water. Spray/spark ignore this
            // (they are thrown ballistically by the splat itself).
            let churn = 1;
            if (role === PARTICLE_ROLES.foam) {
                const speed = Math.hypot(tmp[0], tmp[1]);
                const thresh = config.FOAM_VELOCITY_THRESHOLD || 120;
                churn = speed < thresh * 0.4 ? 0 : Math.min(1, (speed - thresh * 0.4) / thresh);
            }
            const b = fade * sparkBoost * churn;
            col[o] = this.cr[i] * b;
            col[o + 1] = this.cg[i] * b;
            col[o + 2] = this.cb[i] * b;
        }

        this.posAttr.needsUpdate = true;
        this.colAttr.needsUpdate = true;
    }

    // Render the points into an offscreen target (FluidSimulation composites it
    // additively over the canvas via a FullscreenPass).
    renderToTarget(target) {
        if (!this.enabled) {
            return false;
        }
        const renderer = this.renderer;
        const prevTarget = renderer.getRenderTarget();
        const prevAutoClear = renderer.autoClear;
        renderer.setRenderTarget(target);
        renderer.setClearColor?.(0x000000, 0);
        renderer.autoClear = true;          // clear the layer each frame
        renderer.clear?.();
        renderer.autoClear = false;
        renderer.render(this.scene, this.camera);
        renderer.autoClear = prevAutoClear;
        renderer.setRenderTarget(prevTarget);
        return true;
    }

    dispose() {
        this.points.geometry.dispose();
        this.points.material.dispose();
    }
}
