import {
    Color,
    LinearSRGBColorSpace,
    NearestFilter,
    NoToneMapping,
    RepeatWrapping,
    TextureLoader,
    Vector2,
    Vector3
} from 'three/webgpu';
import { config } from '../config.js';
import { generateColor } from '../input.js';
import ditheringUrl from '../assets/LDR_LLL1_0.png';
import { createDoubleRenderTarget, createRenderTarget, getSimulationResolution } from './renderTargets.js';
import {
    createAddPass,
    createAdvectionPass,
    createBFECCAdvectionPass,
    createBloomBlurPass,
    createBloomFinalPass,
    createBloomPrefilterPass,
    createBlurPass,
    createCheckerboardPass,
    createClearPass,
    createColorPass,
    createCopyPass,
    createCurlNoiseForcePass,
    createCurlPass,
    createDisplayPass,
    createDivergencePass,
    createFoamBuoyancyPass,
    createFoamPass,
    createForcePass,
    createGradientSubtractPass,
    createMacCormackAdvectionPass,
    createOceanPass,
    createObstacleDyePass,
    createObstaclePaintPass,
    createObstacleVelocityPass,
    createParticleCompositePass,
    createPressurePass,
    createReactionDiffusionPass,
    createReactionCompositePass,
    createReactionDyeCouplePass,
    createDissolvePass,
    createChemicalDissolveSystem,
    createAbsorptionCompositePass,
    createProlongPass,
    createRedBlackPressurePass,
    createResidualPass,
    createRestrictPass,
    createRK4AdvectionPass,
    createScalarDebugPass,
    createSmokeCompositePass,
    createSmokeShadowPass,
    createSparklePass,
    createSplatPass,
    createSplatMaskPass,
    createSplatMaskDissipationPass,
    createSunraysMaskPass,
    createSunraysPass,
    createTemperatureBuoyancyPass,
    createVectorDebugPass,
    createViscosityPass,
    createVorticityPass
} from './passes.js';
import { updateColorUniforms } from './colorEngine.js';
import { updateMaterialUniforms } from './materialModels.js';
import { getReactionModelIndex, getReactionModelRange } from './reactions/index.js';
import { ParticleSystem } from '../particles/ParticleSystem.js';

const scratchColor = new Color();
const scratchVector = new Vector3();

export class FluidSimulation {
    constructor(renderer, canvas) {
        this.renderer = renderer;
        this.canvas = canvas;
        this.width = 1;
        this.height = 1;
        this.simRes = { width: 1, height: 1 };
        this.dyeRes = { width: 1, height: 1 };
        this.bloomFramebuffers = [];
        this.bloomTempFramebuffers = [];
        this.needsInitialSplats = true;
        this.colorUpdateTimer = 0;
        this.stepCount = 0;
        this.elapsedTime = 0;
        this._maxVelocity = 0;
        this.statsReadPending = false;
        this.statsEnabled = new URLSearchParams(window.location.search).has('debugStats');
        this.ditheringTexture = new TextureLoader().load(ditheringUrl);
        this.ditheringTexture.wrapS = RepeatWrapping;
        this.ditheringTexture.wrapT = RepeatWrapping;

        this.renderer.toneMapping = NoToneMapping;
        this.renderer.outputColorSpace = LinearSRGBColorSpace;
        // Never auto-clear: this is a ping-pong sim where every pass writes a
        // full frame (or uses the explicit clear pass), and the display + FX
        // composite passes layer onto the canvas. With autoClear on, each
        // composite pass (particles/sparkle/smoke) would clear the canvas and
        // wipe the fluid display before drawing its own (partial) content.
        this.renderer.autoClear = false;

        // White-water / FX particle layer (CPU sim, instanced render).
        this.particles = new ParticleSystem(renderer);

        this.passes = {
            copy: createCopyPass(),
            clear: createClearPass(),
            color: createColorPass(),
            splat: createSplatPass(),
            velocityAdvection: createAdvectionPass(),
            dyeAdvection: createAdvectionPass(),
            dyeMacCormackAdvection: createMacCormackAdvectionPass(),
            dyeBFECCAdvection: createBFECCAdvectionPass(),
            dyeRK4Advection: createRK4AdvectionPass(),
            temperatureAdvection: createAdvectionPass(),
            curl: createCurlPass(),
            vorticity: createVorticityPass(),
            force: createForcePass(),
            curlNoiseForce: createCurlNoiseForcePass(),
            temperatureBuoyancy: createTemperatureBuoyancyPass(),
            viscosity: createViscosityPass(),
            divergence: createDivergencePass(),
            pressure: createPressurePass(),
            redBlackPressure: createRedBlackPressurePass(),
            mgResidual: createResidualPass(),
            mgRestrict: createRestrictPass(),
            mgProlong: createProlongPass(),
            gradientSubtract: createGradientSubtractPass(),
            foam: createFoamPass(),
            foamAdvection: createAdvectionPass(),
            foamBuoyancy: createFoamBuoyancyPass(),
            densityAdvection: createMacCormackAdvectionPass(),
            smokeBuoyancy: createFoamBuoyancyPass(),
            smokeShadow: createSmokeShadowPass(),
            smokeComposite: createSmokeCompositePass(),
            sparkle: createSparklePass(),
            reactionDiffusion: createReactionDiffusionPass(),
            reactionComposite: createReactionCompositePass(),
            reactionDyeCouple: createReactionDyeCouplePass(),
            chemAdvection: createMacCormackAdvectionPass(),
            dissolve: createDissolvePass(),
            absorption: createAbsorptionCompositePass(),
            particleComposite: createParticleCompositePass(),
            ocean: createOceanPass(),
            splatMask: createSplatMaskPass(),
            splatMaskDecay: createSplatMaskDissipationPass(),
            obstaclePaint: createObstaclePaintPass(),
            obstacleVelocity: createObstacleVelocityPass(),
            obstacleDye: createObstacleDyePass(),
            blur: createBlurPass(),
            bloomPrefilter: createBloomPrefilterPass(),
            bloomBlur: createBloomBlurPass(),
            bloomFinal: createBloomFinalPass(),
            add: createAddPass(),
            sunraysMask: createSunraysMaskPass(),
            sunrays: createSunraysPass(),
            display: createDisplayPass(),
            scalarDebug: createScalarDebugPass(),
            vectorDebug: createVectorDebugPass(),
            checkerboard: createCheckerboardPass()
        };

        // Chemical dissolution: three passes sharing one uniform set + rates().
        const chem = createChemicalDissolveSystem();
        this.passes.chemSaturation = chem.saturation;
        this.passes.chemCarve = chem.carve;
        this.passes.chemDeposit = chem.deposit;
    }

    resize(force = false) {
        const width = Math.max(1, this.canvas.clientWidth);
        const height = Math.max(1, this.canvas.clientHeight);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(width, height, false);

        if (!force && width === this.width && height === this.height && this.velocity) {
            return;
        }

        this.width = width;
        this.height = height;
        this.simRes = getSimulationResolution(width, height, config.SIM_RESOLUTION);
        this.dyeRes = getSimulationResolution(width, height, config.DYE_RESOLUTION);
        const bloomRes = getSimulationResolution(width, height, config.BLOOM_RESOLUTION);
        const sunraysRes = getSimulationResolution(width, height, config.SUNRAYS_RESOLUTION);

        this.disposeTargets();
        this.velocity = createDoubleRenderTarget('velocity', this.simRes.width, this.simRes.height);
        this.viscosity = createDoubleRenderTarget('viscosity', this.simRes.width, this.simRes.height);
        this.dye = createDoubleRenderTarget('dye', this.dyeRes.width, this.dyeRes.height);
        this.temperature = createDoubleRenderTarget('temperature', this.simRes.width, this.simRes.height);
        this.foam = createDoubleRenderTarget('foam', this.simRes.width, this.simRes.height);
        // Small velocity copy read back to CPU each frame so particles can be
        // advected by the solver (flow with the fluid).
        this.velSample = createRenderTarget('velSample', 96, 96);
        this.particleLayer = createRenderTarget('particleLayer', this.dyeRes.width, this.dyeRes.height);
        this.density = createDoubleRenderTarget('density', this.simRes.width, this.simRes.height);
        this.chem = createDoubleRenderTarget('chem', this.simRes.width, this.simRes.height);
        this.saturation = createDoubleRenderTarget('saturation', this.simRes.width, this.simRes.height, { filter: NearestFilter });
        this.smokeShadow = createRenderTarget('smokeShadow', this.simRes.width, this.simRes.height);
        this.obstacles = createDoubleRenderTarget('obstacles', this.simRes.width, this.simRes.height, { filter: NearestFilter });
        this.pressure = createDoubleRenderTarget('pressure', this.simRes.width, this.simRes.height, { filter: NearestFilter });
        this.divergence = createRenderTarget('divergence', this.simRes.width, this.simRes.height, { filter: NearestFilter });
        this.curl = createRenderTarget('curl', this.simRes.width, this.simRes.height, { filter: NearestFilter });
        this.splatMask = createDoubleRenderTarget('splatMask', this.simRes.width, this.simRes.height);
        this.buildMultigridPyramid();
        this.bloom = createRenderTarget('bloom', bloomRes.width, bloomRes.height);
        this.sunrays = createRenderTarget('sunrays', sunraysRes.width, sunraysRes.height);
        this.sunraysTemp = createRenderTarget('sunrays.temp', sunraysRes.width, sunraysRes.height);
        this.bloomFramebuffers = [];
        this.bloomTempFramebuffers = [];

        for (let i = 0; i < config.BLOOM_ITERATIONS; i += 1) {
            const targetWidth = bloomRes.width >> (i + 1);
            const targetHeight = bloomRes.height >> (i + 1);

            if (targetWidth < 2 || targetHeight < 2) {
                break;
            }

            this.bloomFramebuffers.push(createRenderTarget(`bloom.${i}`, targetWidth, targetHeight));
            this.bloomTempFramebuffers.push(createRenderTarget(`bloom.temp.${i}`, targetWidth, targetHeight));
        }

        this.clearTarget(this.velocity.read);
        this.clearTarget(this.velocity.write);
        this.clearTarget(this.viscosity.read);
        this.clearTarget(this.viscosity.write);
        this.clearTarget(this.dye.read);
        this.clearTarget(this.dye.write);
        this.clearTarget(this.temperature.read);
        this.clearTarget(this.temperature.write);
        this.clearTarget(this.foam.read);
        this.clearTarget(this.foam.write);
        this.clearTarget(this.density.read);
        this.clearTarget(this.density.write);
        this.clearTarget(this.smokeShadow);
        this.clearTarget(this.obstacles.read);
        this.clearTarget(this.obstacles.write);
        this.clearTarget(this.pressure.read);
        this.clearTarget(this.pressure.write);
        this.clearTarget(this.splatMask.read);
        this.clearTarget(this.splatMask.write);
        this.clearTarget(this.saturation.read);
        this.clearTarget(this.saturation.write);
        this.initChem();

        this.needsInitialSplats = true;
    }

    update(input, dt, options = {}) {
        if (this.needsInitialSplats) {
            this.multipleSplats(Math.floor(Math.random() * 20) + 5);
            this.needsInitialSplats = false;
        }

        this.applyInputs(input);
        this.applyEmitters(input, dt);
        this.updatePointerColors(input, dt);

        if (!input.paused && !config.PAUSED) {
            this.step(dt);
        }

        this.updateParticleVelocityField();
        this.particles.update(dt);

        if (options.render !== false) {
            this.render();
        }
    }

    renderDebugTarget(name) {
        if (name === 'clear') {
            this.clearAll();
            window.__fluidDebugTarget = '';
            return false;
        }

        if (name === 'velocity') {
            const pass = this.passes.vectorDebug;
            pass.source.value = this.velocity.read.texture;
            pass.scale.value = 0.002;
            pass.render(this.renderer, null);
            return true;
        }

        if (name === 'curl') {
            const pass = this.passes.scalarDebug;
            pass.source.value = this.curl.texture;
            pass.scale.value = 0.015;
            pass.bias.value = 0.5;
            pass.render(this.renderer, null);
            return true;
        }

        if (name === 'divergence') {
            const pass = this.passes.scalarDebug;
            pass.source.value = this.divergence.texture;
            pass.scale.value = 0.02;
            pass.bias.value = 0.5;
            pass.render(this.renderer, null);
            return true;
        }

        if (name === 'pressure') {
            const pass = this.passes.scalarDebug;
            pass.source.value = this.pressure.read.texture;
            pass.scale.value = 0.02;
            pass.bias.value = 0.5;
            pass.render(this.renderer, null);
            return true;
        }

        if (name === 'temperature') {
            const pass = this.passes.scalarDebug;
            pass.source.value = this.temperature.read.texture;
            pass.scale.value = 1;
            pass.bias.value = 0;
            pass.render(this.renderer, null);
            return true;
        }

        if (name === 'foam') {
            const pass = this.passes.scalarDebug;
            pass.source.value = this.foam.read.texture;
            pass.scale.value = 1;
            pass.bias.value = 0;
            pass.render(this.renderer, null);
            return true;
        }

        if (name === 'density') {
            const pass = this.passes.scalarDebug;
            pass.source.value = this.density.read.texture;
            pass.scale.value = 1;
            pass.bias.value = 0;
            pass.render(this.renderer, null);
            return true;
        }

        if (name === 'display-clean') {
            const color = this.passes.color;
            color.color.value.setRGB(0, 0, 0);
            color.alpha.value = 1;
            color.render(this.renderer, null);

            const display = this.passes.display;
            display.dye.value = this.dye.read.texture;
            display.velocity.value = this.velocity.read.texture;
            display.temperature.value = this.temperature.read.texture;
            display.foam.value = this.foam.read.texture;
            display.bloom.value = this.bloom.texture;
            display.sunrays.value = this.sunrays.texture;
            display.obstacles.value = this.obstacles.read.texture;
            this.applyDisplaySettings(display);
            display.dithering.value = this.ditheringTexture;
            display.texelSize.value.set(1 / Math.max(this.canvas.width, 1), 1 / Math.max(this.canvas.height, 1));
            display.ditherScale.value.set(
                this.canvas.width / Math.max(this.ditheringTexture.image?.width || 1, 1),
                this.canvas.height / Math.max(this.ditheringTexture.image?.height || 1, 1)
            );
            display.bloomEnabled.value = 0;
            display.sunraysEnabled.value = 0;
            display.shadingEnabled.value = 1;
            display.render(this.renderer, null);
            return true;
        }

        return false;
    }

    applyInputs(input) {
        input.pointers.forEach((pointer) => {
            if (!pointer.moved) {
                return;
            }

            pointer.moved = false;
            if (config.BRUSH_MODE === 'obstacle' || config.BRUSH_MODE === 'erase-obstacle') {
                this.paintObstacle(pointer, config.BRUSH_MODE === 'obstacle' ? 1 : 0);
            } else {
                this.splatPointer(pointer);
            }
        });

        if (input.randomSplats > 0) {
            const amount = input.randomSplats;
            input.randomSplats = 0;
            this.multipleSplats(amount);
        }
    }

    applyEmitters(input, dt) {
        const splats = input.emitters?.resolveFrame({
            dt,
            config,
            audio: input.audio || { energy: 0, beat: false }
        }) || [];

        splats.forEach((splat) => {
            this.splat(splat.x, splat.y, splat.dx, splat.dy, splat.color, splat.radius);
        });
    }

    updatePointerColors(input, dt) {
        if (!config.COLORFUL) {
            return;
        }

        this.colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;

        if (this.colorUpdateTimer < 1) {
            return;
        }

        this.colorUpdateTimer = wrap(this.colorUpdateTimer, 0, 1);
        input.pointers.forEach((pointer) => {
            pointer.color.copy(generateColor());
        });
    }

    step(dt) {
        const frameDt = Math.min(dt, 1 / 60);
        this.stepCount += 1;
        this.elapsedTime += frameDt;
        document.documentElement.dataset.fluidSteps = String(this.stepCount);

        // Frame-level bookkeeping runs once; the physics body runs once per
        // substep with an even slice of the frame's dt. With ADAPTIVE_SUBSTEP
        // off this is a single substep — identical to the previous behaviour.
        this.decaySplatMask();

        const substeps = this.computeSubsteps(frameDt);
        const subDt = frameDt / substeps;
        document.documentElement.dataset.fluidSubsteps = String(substeps);

        for (let i = 0; i < substeps; i += 1) {
            this.stepPhysics(subDt);
        }

        this.queueStatsReadback();
    }

    stepPhysics(dt) {
        this.runCurl();
        this.runVorticity(dt);
        this.runForces(dt);
        this.runTemperature(dt);
        this.runViscosity(dt);
        this.applyObstacleVelocity();
        this.runDivergence();
        this.runPressure();
        this.runGradientSubtract();
        this.applyObstacleVelocity();
        this.runAdvection(dt);
        this.applyObstacleDye();
        this.runReactionDiffusion(dt);
        this.runDissolution(dt);
        this.runFoam(dt);
        this.runSmoke(dt);
    }

    // Initialise the reaction-diffusion field to the model's homogeneous rest
    // state, then perturb it so patterns emerge without user interaction. Each
    // RD family has a different steady state and a different seeding strategy —
    // using the wrong one (e.g. V=0 for Gierer-Meinhardt) makes the kinetics
    // explode, so the init is model-aware.
    initChem() {
        if (!this.chem) {
            return;
        }

        const model = config.RD_MODEL;
        const a = config.RD_FEED;
        const b = config.RD_KILL;
        let u0 = 1;
        let v0 = 0;
        let grayScottSeed = false;

        if (model === 'grayScott') {
            u0 = 1; v0 = 0; grayScottSeed = true;
        } else if (model === 'giererMeinhardt') {
            u0 = 1; v0 = 1;
        } else if (model === 'fitzHughNagumo') {
            u0 = 0; v0 = 0;
        } else if (model === 'brusselator') {
            u0 = a; v0 = a > 0.0001 ? b / a : 1;
        } else if (model === 'schnakenberg') {
            u0 = a + b; v0 = u0 > 0.0001 ? b / (u0 * u0) : 1;
        } else if (model === 'ginzburgLandau') {
            u0 = 0.1; v0 = 0.1;
        }

        const color = this.passes.color;
        color.color.value.setRGB(u0, v0, 0);
        color.alpha.value = 1;
        color.render(this.renderer, this.chem.read);
        color.render(this.renderer, this.chem.write);

        const pass = this.passes.splat;
        pass.aspectRatio.value = this.width / Math.max(this.height, 1);

        if (grayScottSeed) {
            // Classic Gray-Scott: a few strong V blobs near the centre.
            for (let i = 0; i < 6; i += 1) {
                pass.point.value.set(0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4);
                pass.radius.value = this.correctRadius(0.02);
                pass.source.value = this.chem.read.texture;
                pass.splatColor.value.set(0, 0.9, 0);
                pass.render(this.renderer, this.chem.write);
                this.chem.swap();
            }
        } else {
            // Turing/excitable/complex models: distributed small ± noise across
            // the whole field to break symmetry and nucleate patterns.
            for (let i = 0; i < 48; i += 1) {
                pass.point.value.set(Math.random(), Math.random());
                pass.radius.value = this.correctRadius(0.015);
                pass.source.value = this.chem.read.texture;
                const amp = (Math.random() - 0.5) * 0.4;
                pass.splatColor.value.set(amp, amp * 0.6, 0);
                pass.render(this.renderer, this.chem.write);
                this.chem.swap();
            }
        }
    }

    // Reaction-diffusion stage. Optionally advects the chem field with the flow
    // (RD_FLOW_COUPLING, applied by scaling the advection backtrace via dt) then
    // runs RD_SUBSTEPS reaction iterations at the RD internal timestep.
    runReactionDiffusion(dt) {
        if (!config.RD_ENABLED || !this.chem) {
            return;
        }

        if (config.RD_FLOW_COUPLING > 0) {
            const advection = this.passes.chemAdvection;
            advection.velocity.value = this.velocity.read.texture;
            advection.source.value = this.chem.read.texture;
            advection.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
            advection.dt.value = dt * config.RD_FLOW_COUPLING;
            advection.dissipation.value = 0;
            advection.render(this.renderer, this.chem.write);
            this.chem.swap();
        }

        const pass = this.passes.reactionDiffusion;
        pass.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        pass.dt.value = config.RD_TIMESTEP;
        pass.du.value = config.RD_DU;
        pass.dv.value = config.RD_DV;
        pass.feed.value = config.RD_FEED;
        pass.kill.value = config.RD_KILL;
        pass.reactionRate.value = config.RD_REACTION_RATE;
        pass.model.value = getReactionModelIndex(config.RD_MODEL);

        const substeps = Math.max(1, config.RD_SUBSTEPS | 0 || 1);
        for (let i = 0; i < substeps; i += 1) {
            pass.source.value = this.chem.read.texture;
            pass.render(this.renderer, this.chem.write);
            this.chem.swap();
        }

        // Couple the RD pattern INTO the dye so the reaction is part of the
        // fluid (it flows, blooms and dissolves the ink) rather than a separate
        // overlay. This is the default render path; the flat overlay is opt-in.
        if (config.RD_COUPLE > 0) {
            const range = getReactionModelRange(config.RD_MODEL);
            const couple = this.passes.reactionDyeCouple;
            couple.dye.value = this.dye.read.texture;
            couple.chem.value = this.chem.read.texture;
            couple.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
            couple.colorA.value.set(config.RD_COLOR_A.r / 255, config.RD_COLOR_A.g / 255, config.RD_COLOR_A.b / 255);
            couple.colorB.value.set(config.RD_COLOR_B.r / 255, config.RD_COLOR_B.g / 255, config.RD_COLOR_B.b / 255);
            couple.vLo.value = range[0];
            couple.vHi.value = range[1];
            couple.couple.value = config.RD_COUPLE;
            couple.dissolve.value = config.RD_DISSOLVE;
            couple.tint.value = config.RD_TINT;
            couple.dt.value = dt;
            couple.render(this.renderer, this.dye.write);
            this.dye.swap();
        }
    }

    // Dissolution stage — decay / diffusion / turbulent mixing / evaporation of
    // the dye field. A single pass with independent strengths.
    runDissolution(dt) {
        this.runChemicalDissolve(dt);

        if (!config.DISSOLVE_ENABLED) {
            return;
        }
        if (config.DISSOLVE_DECAY <= 0 && config.DISSOLVE_DIFFUSE <= 0
            && config.DISSOLVE_MIX <= 0 && config.DISSOLVE_EVAPORATE <= 0
            && config.DISSOLVE_SETTLE <= 0) {
            return;
        }

        const pass = this.passes.dissolve;
        pass.source.value = this.dye.read.texture;
        pass.velocity.value = this.velocity.read.texture;
        pass.texelSize.value.set(1 / this.dyeRes.width, 1 / this.dyeRes.height);
        pass.dt.value = dt;
        pass.decay.value = config.DISSOLVE_DECAY;
        pass.diffuse.value = config.DISSOLVE_DIFFUSE;
        pass.mixStrength.value = config.DISSOLVE_MIX;
        pass.evaporate.value = config.DISSOLVE_EVAPORATE;
        pass.settle.value = config.DISSOLVE_SETTLE;
        pass.render(this.renderer, this.dye.write);
        this.dye.swap();
    }

    // Chemical dissolution (C.7/C.8). The obstacle field is the soluble solid:
    // it erodes into dye at its wetted interface, saturation-limited, and
    // re-precipitates where supersaturated. Three passes share the rate term;
    // all read the pre-step solid/saturation, then both targets swap.
    runChemicalDissolve(dt) {
        if (!config.CHEM_DISSOLVE_ENABLED) {
            return;
        }

        const sat = this.passes.chemSaturation;
        const carve = this.passes.chemCarve;
        const deposit = this.passes.chemDeposit;

        // Shared uniform nodes — set once on any pass (all three reference them).
        sat.solid.value = this.obstacles.read.texture;
        sat.saturation.value = this.saturation.read.texture;
        sat.velocity.value = this.velocity.read.texture;
        sat.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        sat.dt.value = dt;
        sat.rate.value = config.CHEM_RATE;
        sat.solubility.value = config.CHEM_SOLUBILITY;
        sat.stirGain.value = config.CHEM_STIR;
        sat.supersat.value = config.CHEM_SUPERSAT;
        sat.precipRate.value = config.CHEM_PRECIP;
        deposit.dye.value = this.dye.read.texture;
        deposit.soluteColor.value.set(config.CHEM_COLOR.r / 255, config.CHEM_COLOR.g / 255, config.CHEM_COLOR.b / 255);

        // Deposit dye (reads original solid + saturation + dye).
        deposit.render(this.renderer, this.dye.write);
        // Update saturation (reads original solid + saturation).
        sat.render(this.renderer, this.saturation.write);
        // Carve the solid/obstacle (reads original solid + saturation).
        carve.render(this.renderer, this.obstacles.write);

        this.dye.swap();
        this.saturation.swap();
        this.obstacles.swap();
    }

    // CFL-adaptive substep count. Uses a one-frame-late max-velocity estimate
    // (from the async stats readback) — perfectly adequate since velocities
    // change continuously. Returns 1 unless ADAPTIVE_SUBSTEP is enabled.
    computeSubsteps(dt) {
        if (!config.ADAPTIVE_SUBSTEP) {
            return 1;
        }

        const maxVelocity = this._maxVelocity || 0;
        if (!(maxVelocity > 0)) {
            return 1;
        }

        // Semi-Lagrangian advection samples back by velocity * texelSize * dt;
        // the texelSize and cell size cancel, so the back-trace distance in
        // grid cells per step is simply velocity * dt. Keep it to a couple of
        // cells per substep to limit smearing on fast flow.
        const cellsPerStep = maxVelocity * dt;
        const count = Math.ceil(cellsPerStep / 2);
        return Math.max(1, Math.min(config.MAX_SUBSTEPS | 0 || 1, count));
    }

    runCurl() {
        const pass = this.passes.curl;
        pass.velocity.value = this.velocity.read.texture;
        pass.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        pass.render(this.renderer, this.curl);
    }

    runVorticity(dt) {
        const pass = this.passes.vorticity;
        pass.velocity.value = this.velocity.read.texture;
        pass.curl.value = this.curl.texture;
        pass.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        pass.curlStrength.value = config.CURL;
        pass.dt.value = dt;
        pass.render(this.renderer, this.velocity.write);
        this.velocity.swap();
    }

    runForces(dt) {
        const baseX = config.WIND_X + config.GRAVITY_X;
        const baseY = config.WIND_Y + config.GRAVITY_Y;
        const hasBase = baseX !== 0 || baseY !== 0;
        const curlMode = config.TURBULENCE_MODE === 'curl';
        const sinTurbulence = curlMode ? 0 : config.TURBULENCE_AMOUNT;
        const curlAmount = curlMode ? config.CURL_NOISE_AMOUNT : 0;

        // Curl-noise mode folds base force + divergence-free turbulence into a
        // single pass; the sinusoidal turbulence in the legacy force pass is
        // skipped (sinTurbulence === 0).
        if (curlMode && (hasBase || curlAmount > 0)) {
            const pass = this.passes.curlNoiseForce;
            pass.velocity.value = this.velocity.read.texture;
            pass.force.value.set(baseX, baseY);
            pass.amount.value = curlAmount;
            pass.scale.value = config.CURL_NOISE_SCALE;
            pass.speed.value = config.CURL_NOISE_SPEED;
            pass.time.value = this.elapsedTime;
            pass.dt.value = dt;
            pass.render(this.renderer, this.velocity.write);
            this.velocity.swap();
            return;
        }

        if (!hasBase && sinTurbulence === 0) {
            return;
        }

        const pass = this.passes.force;
        pass.velocity.value = this.velocity.read.texture;
        pass.force.value.set(baseX, baseY);
        pass.turbulenceAmount.value = sinTurbulence;
        pass.turbulenceScale.value = config.TURBULENCE_SCALE;
        pass.turbulenceSpeed.value = config.TURBULENCE_SPEED;
        pass.time.value = this.elapsedTime;
        pass.dt.value = dt;
        pass.render(this.renderer, this.velocity.write);
        this.velocity.swap();
    }

    runTemperature(dt) {
        if (config.TEMPERATURE_AMOUNT <= 0) {
            return;
        }

        const advection = this.passes.temperatureAdvection;
        advection.velocity.value = this.velocity.read.texture;
        advection.source.value = this.temperature.read.texture;
        advection.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        advection.dt.value = dt;
        advection.dissipation.value = Math.max(0, 1 - config.TEMPERATURE_DISSIPATION);
        advection.render(this.renderer, this.temperature.write);
        this.temperature.swap();

        const buoyancy = this.passes.temperatureBuoyancy;
        buoyancy.velocity.value = this.velocity.read.texture;
        buoyancy.temperature.value = this.temperature.read.texture;
        buoyancy.direction.value = config.BUOYANCY_DIRECTION;
        buoyancy.strength.value = config.BUOYANCY_STRENGTH * config.TEMPERATURE_AMOUNT;
        buoyancy.dt.value = dt;
        buoyancy.render(this.renderer, this.velocity.write);
        this.velocity.swap();
    }

    runViscosity(dt) {
        if (config.VISCOSITY <= 0 || config.VISCOSITY_ITERATIONS <= 0) {
            return;
        }

        this.passes.copy.source.value = this.velocity.read.texture;
        this.passes.copy.render(this.renderer, this.viscosity.read);
        this.passes.copy.render(this.renderer, this.viscosity.write);

        const pass = this.passes.viscosity;
        pass.source.value = this.velocity.read.texture;
        pass.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        pass.viscosity.value = config.VISCOSITY;
        pass.dt.value = dt;

        for (let i = 0; i < config.VISCOSITY_ITERATIONS; i += 1) {
            pass.velocity.value = this.viscosity.read.texture;
            pass.render(this.renderer, this.viscosity.write);
            this.viscosity.swap();
        }

        this.passes.copy.source.value = this.viscosity.read.texture;
        this.passes.copy.render(this.renderer, this.velocity.write);
        this.velocity.swap();
    }

    applyObstacleVelocity() {
        const pass = this.passes.obstacleVelocity;
        pass.velocity.value = this.velocity.read.texture;
        pass.obstacles.value = this.obstacles.read.texture;
        pass.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        pass.mode.value = config.OBSTACLE_BOUNDARY === 'freeslip' ? 1 : 0;
        pass.render(this.renderer, this.velocity.write);
        this.velocity.swap();
    }

    runDivergence() {
        const pass = this.passes.divergence;
        pass.velocity.value = this.velocity.read.texture;
        pass.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        pass.edgeOpen.value = config.DOMAIN_EDGE === 'open' ? 1 : 0;
        pass.render(this.renderer, this.divergence);
    }

    runPressure() {
        const clear = this.passes.clear;
        clear.source.value = this.pressure.read.texture;
        clear.value.value = config.PRESSURE;
        clear.render(this.renderer, this.pressure.write);
        this.pressure.swap();

        // True geometric multigrid V-cycle (Phase 1). Falls back to red-black
        // if the pyramid couldn't be built (e.g. a single level).
        if (config.PRESSURE_SOLVER === 'multigrid' && this.mgLevels && this.mgLevels.length >= 2) {
            const cycles = Math.max(1, config.MULTIGRID_CYCLES | 0 || 1);
            for (let c = 0; c < cycles; c += 1) {
                this.runVCycle(0);
            }
            return;
        }

        if (config.PRESSURE_SOLVER === 'redblack' || config.PRESSURE_SOLVER === 'multigrid') {
            const pressure = this.passes.redBlackPressure;
            pressure.divergence.value = this.divergence.texture;
            pressure.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);

            for (let i = 0; i < config.PRESSURE_ITERATIONS; i += 1) {
                pressure.phase.value = i % 2;
                pressure.pressure.value = this.pressure.read.texture;
                pressure.render(this.renderer, this.pressure.write);
                this.pressure.swap();
            }
            return;
        }

        const pressure = this.passes.pressure;
        pressure.divergence.value = this.divergence.texture;
        pressure.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);

        for (let i = 0; i < config.PRESSURE_ITERATIONS; i += 1) {
            pressure.pressure.value = this.pressure.read.texture;
            pressure.render(this.renderer, this.pressure.write);
            this.pressure.swap();
        }
    }

    // Build the multigrid pyramid. Level 0 aliases the existing pressure
    // (error) and divergence (rhs) targets; coarser levels allocate their own
    // error (double, linear for prolongation), rhs and residual targets.
    buildMultigridPyramid() {
        this.disposeMultigridPyramid();
        this.mgLevels = [];
        const levelCount = Math.max(1, config.MULTIGRID_LEVELS | 0 || 1);
        let width = this.simRes.width;
        let height = this.simRes.height;

        for (let level = 0; level < levelCount; level += 1) {
            if (level > 0 && (width < 4 || height < 4)) {
                break;
            }

            if (level === 0) {
                this.mgLevels.push({
                    width,
                    height,
                    error: this.pressure,
                    rhs: this.divergence,
                    residual: createRenderTarget('mg.res.0', width, height, { filter: NearestFilter }),
                    owns: false
                });
            } else {
                this.mgLevels.push({
                    width,
                    height,
                    error: createDoubleRenderTarget(`mg.err.${level}`, width, height),
                    rhs: createRenderTarget(`mg.rhs.${level}`, width, height, { filter: NearestFilter }),
                    residual: createRenderTarget(`mg.res.${level}`, width, height, { filter: NearestFilter }),
                    owns: true
                });
            }

            width = Math.max(2, width >> 1);
            height = Math.max(2, height >> 1);
        }
    }

    disposeMultigridPyramid() {
        if (!this.mgLevels) {
            return;
        }
        for (const level of this.mgLevels) {
            level.residual?.dispose();
            if (level.owns) {
                level.error?.dispose();
                level.rhs?.dispose();
            }
        }
        this.mgLevels = null;
    }

    // Recursive V-cycle. Pre-smooth, compute & restrict residual, recurse on
    // the error correction, prolong it back, post-smooth.
    runVCycle(levelIndex) {
        const level = this.mgLevels[levelIndex];
        const isCoarsest = levelIndex === this.mgLevels.length - 1;
        const smooth = Math.max(1, config.MULTIGRID_SMOOTH | 0 || 2);

        this.mgSmooth(level, isCoarsest ? smooth * 2 : smooth);

        if (isCoarsest) {
            return;
        }

        // residual = rhs - laplacian(p)
        const residualPass = this.passes.mgResidual;
        residualPass.pressure.value = level.error.read.texture;
        residualPass.rhs.value = level.rhs.texture;
        residualPass.texelSize.value.set(1 / level.width, 1 / level.height);
        residualPass.render(this.renderer, level.residual);

        // restrict residual → coarse rhs (×4 via summed 2×2)
        const coarse = this.mgLevels[levelIndex + 1];
        const restrictPass = this.passes.mgRestrict;
        restrictPass.source.value = level.residual.texture;
        restrictPass.fineTexel.value.set(1 / level.width, 1 / level.height);
        restrictPass.gain.value = config.MULTIGRID_RESTRICT_GAIN ?? 0.25;
        restrictPass.render(this.renderer, coarse.rhs);

        // zero the coarse error before recursing
        this.clearTarget(coarse.error.read);
        this.clearTarget(coarse.error.write);

        this.runVCycle(levelIndex + 1);

        // prolong coarse error and add to this level's pressure
        const prolongPass = this.passes.mgProlong;
        prolongPass.base.value = level.error.read.texture;
        prolongPass.correction.value = coarse.error.read.texture;
        prolongPass.gain.value = config.MULTIGRID_PROLONG_GAIN ?? 1;
        prolongPass.render(this.renderer, level.error.write);
        level.error.swap();

        this.mgSmooth(level, smooth);
    }

    mgSmooth(level, iterations) {
        const pass = this.passes.redBlackPressure;
        pass.divergence.value = level.rhs.texture;
        pass.texelSize.value.set(1 / level.width, 1 / level.height);

        for (let i = 0; i < iterations * 2; i += 1) {
            pass.phase.value = i % 2;
            pass.pressure.value = level.error.read.texture;
            pass.render(this.renderer, level.error.write);
            level.error.swap();
        }
    }

    runGradientSubtract() {
        const pass = this.passes.gradientSubtract;
        pass.pressure.value = this.pressure.read.texture;
        pass.velocity.value = this.velocity.read.texture;
        pass.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        pass.render(this.renderer, this.velocity.write);
        this.velocity.swap();
    }

    runAdvection(dt) {
        const velocityAdvection = this.passes.velocityAdvection;
        velocityAdvection.velocity.value = this.velocity.read.texture;
        velocityAdvection.source.value = this.velocity.read.texture;
        velocityAdvection.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        velocityAdvection.dt.value = dt;
        velocityAdvection.dissipation.value = config.VELOCITY_DISSIPATION;
        velocityAdvection.render(this.renderer, this.velocity.write);
        this.velocity.swap();

        const dyeAdvection = getDyeAdvectionPass(this.passes, config.ADVECTION_METHOD);
        dyeAdvection.velocity.value = this.velocity.read.texture;
        dyeAdvection.source.value = this.dye.read.texture;
        dyeAdvection.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        dyeAdvection.dt.value = dt;
        dyeAdvection.dissipation.value = config.DENSITY_DISSIPATION;
        dyeAdvection.render(this.renderer, this.dye.write);
        this.dye.swap();
    }

    applyObstacleDye() {
        const pass = this.passes.obstacleDye;
        pass.dye.value = this.dye.read.texture;
        pass.obstacles.value = this.obstacles.read.texture;
        pass.render(this.renderer, this.dye.write);
        this.dye.swap();
    }

    decaySplatMask() {
        // Slower decay (0.94) makes the mask linger ~12 frames at 60fps so a
        // single splat seeds particles over its visible lifetime, not just on
        // the spawn frame. Particles read this mask as their spawn predicate
        // and inherit dye colour — giving the "sparkle trailing the splat"
        // look the user wants.
        const pass = this.passes.splatMaskDecay;
        pass.source.value = this.splatMask.read.texture;
        pass.decay.value = 0.94;
        pass.render(this.renderer, this.splatMask.write);
        this.splatMask.swap();
    }

    runFoam(dt) {
        if (config.FOAM_AMOUNT <= 0) {
            return;
        }

        // Optionally advect the foam scalar with the flow so white-water
        // travels with the fluid instead of being a static field. Off by
        // default (FOAM_ADVECTION) to preserve the legacy foam look.
        if (config.FOAM_ADVECTION) {
            const advection = this.passes.foamAdvection;
            advection.velocity.value = this.velocity.read.texture;
            advection.source.value = this.foam.read.texture;
            advection.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
            advection.dt.value = dt;
            advection.dissipation.value = 0; // decay handled by the foam pass
            advection.render(this.renderer, this.foam.write);
            this.foam.swap();
        }

        const pass = this.passes.foam;
        pass.foam.value = this.foam.read.texture;
        pass.velocity.value = this.velocity.read.texture;
        pass.curl.value = this.curl.texture;
        pass.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        pass.amount.value = config.FOAM_AMOUNT;
        pass.threshold.value = config.FOAM_VELOCITY_THRESHOLD;
        pass.dissipation.value = config.FOAM_DISSIPATION;
        pass.vorticityWeight.value = config.FOAM_VORTICITY_WEIGHT;
        pass.curvatureWeight.value = config.FOAM_CURVATURE_WEIGHT;
        pass.render(this.renderer, this.foam.write);
        this.foam.swap();

        // Dense foam rises slightly, feeding a small upward velocity back into
        // the flow. Off by default (FOAM_BUOYANCY === 0).
        if (config.FOAM_BUOYANCY > 0) {
            const buoyancy = this.passes.foamBuoyancy;
            buoyancy.velocity.value = this.velocity.read.texture;
            buoyancy.foam.value = this.foam.read.texture;
            buoyancy.strength.value = config.FOAM_BUOYANCY;
            buoyancy.dt.value = dt;
            buoyancy.render(this.renderer, this.velocity.write);
            this.velocity.swap();
        }
    }

    runSmoke(dt) {
        if (!config.SMOKE_ENABLED) {
            return;
        }

        // Advect the grey density field with the flow (MacCormack to limit
        // numerical dissipation so wisps stay crisp).
        const advection = this.passes.densityAdvection;
        advection.velocity.value = this.velocity.read.texture;
        advection.source.value = this.density.read.texture;
        advection.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        advection.dt.value = dt;
        advection.dissipation.value = config.SMOKE_DISSIPATION;
        advection.render(this.renderer, this.density.write);
        this.density.swap();

        // Dense smoke rises.
        if (config.SMOKE_BUOYANCY > 0) {
            const buoyancy = this.passes.smokeBuoyancy;
            buoyancy.velocity.value = this.velocity.read.texture;
            buoyancy.foam.value = this.density.read.texture;
            buoyancy.strength.value = config.SMOKE_BUOYANCY;
            buoyancy.dt.value = dt;
            buoyancy.render(this.renderer, this.velocity.write);
            this.velocity.swap();
        }

        // Self-shadow toward the light.
        const shadow = this.passes.smokeShadow;
        shadow.density.value = this.density.read.texture;
        shadow.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        shadow.lightDir.value.set(config.SMOKE_LIGHT.x, config.SMOKE_LIGHT.y);
        shadow.strength.value = config.SMOKE_SHADOW;
        shadow.render(this.renderer, this.smokeShadow);
    }

    getCompositeTarget() {
        return this.dye.write;
    }

    compositeParticles(particleSystem) {
        if (!particleSystem?.enabled || !config.RENDER_PARTICLES_IN_FX) {
            return false;
        }

        this.passes.copy.source.value = this.dye.read.texture;
        this.passes.copy.render(this.renderer, this.dye.write);
        particleSystem.render(this.dye.write);
        this.dye.swap();
        return true;
    }

    // V2 live-particle foam feedback — renders the feedback scene (foam role's
    // parallel mesh) additively into the solver foam.write target. Closes the
    // loop: foam particles spawned by solver foam now feed the foam texture
    // back, so foam persists & advects naturally with the fluid.
    compositeRoleFoamFeedback(particleSystem) {
        if (!particleSystem?.renderFeedback) return false;
        if (!config.PARTICLE_FEEDBACK_ENABLED || !config.PARTICLE_LIVE_FOAM_FEEDBACK) return false;
        // Copy current foam → write target, then accumulate feedback into it,
        // then swap so the next solver step reads the new foam.
        this.passes.copy.source.value = this.foam.read.texture;
        this.passes.copy.render(this.renderer, this.foam.write);
        const rendered = particleSystem.renderFeedback(this.foam.write);
        if (rendered) {
            this.foam.swap();
        }
        return rendered;
    }

    applyParticleFeedback(particleRequests = []) {
        if (!config.PARTICLE_FEEDBACK_ENABLED || !Array.isArray(particleRequests) || particleRequests.length === 0) {
            return;
        }

        const velocityStrength = config.PARTICLE_FEEDBACK_VELOCITY || 0;
        const dyeStrength = config.PARTICLE_FEEDBACK_DYE || 0;
        const foamStrength = config.PARTICLE_FEEDBACK_FOAM || 0;

        if (velocityStrength <= 0 && dyeStrength <= 0 && foamStrength <= 0) {
            return;
        }

        // Role-aware feedback: foam requests deposit foam, spray/spark deposit
        // velocity, all roles can deposit dye + mark splat-mask. This is the
        // closest practical equivalent to live-particle feedback without GPU
        // scatter — emitter requests stand in for live particle positions, but
        // each role's request only writes into its capability-correct channel.
        // Per-role weights — kept small so particle feedback adds *texture*
        // to the fluid (foam residue, drag wake) instead of clobbering it
        // with splat-shaped blobs.
        const ROLE_FEEDBACK = {
            foam:    { foam: 0.35, velocity: 0.04, dye: 0.0 },
            spray:   { foam: 0.08, velocity: 0.22, dye: 0.02 },
            spark:   { foam: 0.0,  velocity: 0.1,  dye: 0.0 },
            ember:   { foam: 0.0,  velocity: 0.06, dye: 0.0 },
            bubble:  { foam: 0.0,  velocity: 0.14, dye: 0.0 },
            mist:    { foam: 0.0,  velocity: 0.0,  dye: 0.0 },
            dust:    { foam: 0.0,  velocity: 0.0,  dye: 0.0 },
            ribbon:  { foam: 0.0,  velocity: 0.0,  dye: 0.0 },
            debris:  { foam: 0.0,  velocity: 0.12, dye: 0.04 },
            _legacy: { foam: 0.3,  velocity: 0.25, dye: 0.15 }
        };

        const pass = this.passes.splat;
        pass.aspectRatio.value = this.width / Math.max(this.height, 1);

        particleRequests.slice(0, 32).forEach((request) => {
            const x = request.posA?.x ?? request.x ?? 0.5;
            const y = request.posA?.y ?? request.y ?? 0.5;
            const radius = Math.max(0.0001, (request.radius ?? 0.08) * 0.18);
            const correctedRadius = this.correctRadius(radius);
            const normalForce = request.normalForce ?? request.velocityInherit ?? 0;
            const tangentForce = request.tangentForce ?? 0;

            const roleId = request.role || '_legacy';
            const rw = ROLE_FEEDBACK[roleId] || ROLE_FEEDBACK._legacy;
            const vWeight = rw.velocity * velocityStrength;
            const dWeight = rw.dye * dyeStrength;
            const fWeight = rw.foam * foamStrength;

            if (vWeight > 0) {
                pass.point.value.set(x, y);
                pass.radius.value = correctedRadius;
                pass.source.value = this.velocity.read.texture;
                // Bubbles get a vertical lift bias (positive feedback into the
                // upward column they're spawned in).
                const lift = roleId === 'bubble' ? -400 * vWeight : 0;
                pass.splatColor.value.set(tangentForce * vWeight * 900, normalForce * vWeight * 900 + lift, 0);
                pass.render(this.renderer, this.velocity.write);
                this.velocity.swap();
            }

            if (dWeight > 0) {
                const color = request.colorOverride || { r: 1, g: 1, b: 1 };
                pass.point.value.set(x, y);
                pass.radius.value = correctedRadius;
                pass.source.value = this.dye.read.texture;
                pass.splatColor.value.set(color.r * dWeight, color.g * dWeight, color.b * dWeight);
                pass.render(this.renderer, this.dye.write);
                this.dye.swap();
            }

            if (fWeight > 0) {
                pass.point.value.set(x, y);
                pass.radius.value = correctedRadius;
                pass.source.value = this.foam.read.texture;
                pass.splatColor.value.set(fWeight, 0, 0);
                pass.render(this.renderer, this.foam.write);
                this.foam.swap();
            }

            // Always mark the splat-mask so V2 particle roles can see this
            // feedback as a spawn predicate edge.
            this.markSplat(x, y, correctedRadius, 0.6);
        });
    }

    render() {
        if (window.__fluidDebugTarget && this.renderDebugTarget(window.__fluidDebugTarget)) {
            return;
        }

        if (config.RENDER_MODE === 'ocean') {
            this.renderOcean();
            return;
        }

        if (config.RENDER_MODE !== 'fluid' && this.renderDebugTarget(config.RENDER_MODE)) {
            return;
        }

        if (config.BLOOM) {
            this.applyBloom();
        } else {
            this.clearTarget(this.bloom);
        }

        if (config.SUNRAYS) {
            this.applySunrays();
        } else {
            this.clearTarget(this.sunrays);
        }

        if (!config.TRANSPARENT) {
            const color = this.passes.color;
            color.color.value.copy(normalizeBackColor(config.BACK_COLOR));
            color.alpha.value = 1;
            color.render(this.renderer, null);
        } else {
            const checkerboard = this.passes.checkerboard;
            checkerboard.aspectRatio.value = this.width / Math.max(this.height, 1);
            checkerboard.render(this.renderer, null);
        }

        const display = this.passes.display;
        display.dye.value = this.dye.read.texture;
        display.velocity.value = this.velocity.read.texture;
        display.temperature.value = this.temperature.read.texture;
        display.foam.value = this.foam.read.texture;
        display.bloom.value = this.bloom.texture;
        display.sunrays.value = this.sunrays.texture;
        display.obstacles.value = this.obstacles.read.texture;
        this.applyDisplaySettings(display);
        display.dithering.value = this.ditheringTexture;
        display.texelSize.value.set(1 / Math.max(this.canvas.width, 1), 1 / Math.max(this.canvas.height, 1));
        display.ditherScale.value.set(
            this.canvas.width / Math.max(this.ditheringTexture.image?.width || 1, 1),
            this.canvas.height / Math.max(this.ditheringTexture.image?.height || 1, 1)
        );
        display.bloomEnabled.value = config.BLOOM ? 1 : 0;
        display.sunraysEnabled.value = config.SUNRAYS ? 1 : 0;
        display.shadingEnabled.value = config.SHADING ? 1 : 0;
        display.render(this.renderer, null);

        // Beer-Lambert optical absorption — multiplicative tint over the display
        // (thick dye saturates toward the deep colour, thin fades to clear).
        if (config.ABSORPTION > 0) {
            const absorb = this.passes.absorption;
            absorb.dye.value = this.dye.read.texture;
            absorb.extinction.value.set(config.ABSORPTION_EXTINCTION.x, config.ABSORPTION_EXTINCTION.y, config.ABSORPTION_EXTINCTION.z);
            absorb.strength.value = config.ABSORPTION;
            absorb.render(this.renderer, null);
        }

        // Smoke is composited as a separate alpha-blended pass over the display
        // so the large display shader stays untouched.
        if (config.SMOKE_ENABLED) {
            const smoke = this.passes.smokeComposite;
            smoke.density.value = this.density.read.texture;
            smoke.smokeShadow.value = this.smokeShadow.texture;
            smoke.color.value.set(config.SMOKE_COLOR.r / 255, config.SMOKE_COLOR.g / 255, config.SMOKE_COLOR.b / 255);
            smoke.amount.value = config.SMOKE_AMOUNT;
            smoke.render(this.renderer, null);
        }

        // Sparkle glints on foam crests — additive overlay.
        if (config.SPARKLE_AMOUNT > 0) {
            const sparkle = this.passes.sparkle;
            sparkle.foam.value = this.foam.read.texture;
            sparkle.time.value = this.elapsedTime;
            sparkle.amount.value = config.SPARKLE_AMOUNT;
            sparkle.scale.value = config.SPARKLE_SCALE;
            sparkle.speed.value = config.SPARKLE_SPEED;
            sparkle.render(this.renderer, null);
        }

        // Optional flat RD overlay (off by default — the dye coupling above is
        // the integrated path). V channel mapped through a colour ramp.
        if (config.RD_ENABLED && config.RD_OVERLAY) {
            const rd = this.passes.reactionComposite;
            rd.source.value = this.chem.read.texture;
            rd.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
            rd.colorA.value.set(config.RD_COLOR_A.r / 255, config.RD_COLOR_A.g / 255, config.RD_COLOR_A.b / 255);
            rd.colorB.value.set(config.RD_COLOR_B.r / 255, config.RD_COLOR_B.g / 255, config.RD_COLOR_B.b / 255);
            rd.opacity.value = config.RD_OPACITY;
            rd.relief.value = config.RD_RELIEF;
            rd.glow.value = config.RD_GLOW;
            rd.render(this.renderer, null);
        }

        // White-water particle layer: rendered to an offscreen target, then
        // composited over the canvas via a FullscreenPass (additive). This
        // keeps every canvas write on the fullscreen-pass path — a direct
        // scene render to the canvas clears the fluid display.
        if (this.particles.enabled && this.particles.renderToTarget(this.particleLayer)) {
            const composite = this.passes.particleComposite;
            composite.source.value = this.particleLayer.texture;
            composite.render(this.renderer, null);
        }
    }

    renderOcean() {
        const ocean = this.passes.ocean;
        ocean.velocity.value = this.velocity.read.texture;
        ocean.foam.value = this.foam.read.texture;
        ocean.time.value = this.elapsedTime;
        ocean.aspect.value = this.width / Math.max(this.height, 1);
        ocean.texelSize.value.set(1 / this.simRes.width, 1 / this.simRes.height);
        ocean.waveScale.value = config.OCEAN_WAVE_SCALE;
        ocean.steepness.value = config.OCEAN_STEEPNESS;
        ocean.choppiness.value = config.OCEAN_CHOPPINESS;
        ocean.flow.value = config.OCEAN_FLOW;
        ocean.waterColor.value.set(config.OCEAN_WATER_COLOR.r / 255, config.OCEAN_WATER_COLOR.g / 255, config.OCEAN_WATER_COLOR.b / 255);
        ocean.deepColor.value.set(config.OCEAN_DEEP_COLOR.r / 255, config.OCEAN_DEEP_COLOR.g / 255, config.OCEAN_DEEP_COLOR.b / 255);
        ocean.skyColor.value.set(config.OCEAN_SKY_COLOR.r / 255, config.OCEAN_SKY_COLOR.g / 255, config.OCEAN_SKY_COLOR.b / 255);
        ocean.sunDir.value.set(config.OCEAN_SUN.x, config.OCEAN_SUN.y);
        ocean.fresnelPower.value = config.OCEAN_FRESNEL;
        ocean.caustics.value = config.OCEAN_CAUSTICS;
        ocean.foamAmount.value = config.OCEAN_FOAM;
        ocean.render(this.renderer, null);
    }

    applyDisplaySettings(display) {
        display.displayStyle.value = getDisplayStyleIndex(config.DISPLAY_STYLE);
        display.paletteA.value.copy(normalizeConfigColor(config.PALETTE_A));
        display.paletteB.value.copy(normalizeConfigColor(config.PALETTE_B));
        display.paletteC.value.copy(normalizeConfigColor(config.PALETTE_C));
        display.gradientScale.value = config.GRADIENT_SCALE;
        display.gradientOffset.value = config.GRADIENT_OFFSET;
        display.materialContrast.value = config.MATERIAL_CONTRAST;
        display.materialSaturation.value = config.MATERIAL_SATURATION;
        display.materialExposure.value = config.MATERIAL_EXPOSURE;
        display.outputGain.value = config.OUTPUT_GAIN;
        display.chromaticAberration.value = config.CHROMATIC_ABERRATION;
        display.lensDistortion.value = config.LENS_DISTORTION;
        display.velocityDistortion.value = config.VELOCITY_DISTORTION;
        display.refractionRatio.value = config.REFRACTION_RATIO;
        updateColorUniforms(display.colorUniforms, config);
        updateMaterialUniforms(display.materialUniforms, config);
        display.filmGrain.value = config.FILM_GRAIN;
        display.filmGrainSpeed.value = config.FILM_GRAIN_SPEED;
        display.vignette.value = config.VIGNETTE;
        display.vignetteRadius.value = config.VIGNETTE_RADIUS;
        display.motionBlur.value = config.MOTION_BLUR;
        display.anamorphicBloom.value = config.ANAMORPHIC_BLOOM;
        display.anamorphicRatio.value = config.ANAMORPHIC_RATIO;
        display.fxaaEnabled.value = config.FXAA_ENABLED ? 1 : 0;
        display.toneMapping.value = getToneMappingIndex(config.TONE_MAPPING);
        display.lift.value.setRGB(config.LIFT.r, config.LIFT.g, config.LIFT.b);
        display.gamma.value.setRGB(config.GAMMA.r, config.GAMMA.g, config.GAMMA.b);
        display.gain.value.setRGB(config.GAIN.r, config.GAIN.g, config.GAIN.b);
        display.time.value = this.elapsedTime;
    }

    applyBloom() {
        if (this.bloomFramebuffers.length < 2) {
            return;
        }

        const knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
        const prefilter = this.passes.bloomPrefilter;
        prefilter.source.value = this.dye.read.texture;
        prefilter.curve.value.set(
            config.BLOOM_THRESHOLD - knee,
            knee * 2,
            0.25 / knee
        );
        prefilter.threshold.value = config.BLOOM_THRESHOLD;
        prefilter.render(this.renderer, this.bloom);

        const bloomBlur = this.passes.bloomBlur;
        let last = this.bloom;

        for (let i = 0; i < this.bloomFramebuffers.length; i += 1) {
            const destination = this.bloomFramebuffers[i];
            bloomBlur.source.value = last.texture;
            bloomBlur.texelSize.value.set(1 / last.width, 1 / last.height);
            bloomBlur.render(this.renderer, destination);
            last = destination;
        }

        const add = this.passes.add;
        for (let i = this.bloomFramebuffers.length - 2; i >= 0; i -= 1) {
            const base = this.bloomFramebuffers[i];
            const temp = this.bloomTempFramebuffers[i];
            add.base.value = base.texture;
            add.source.value = last.texture;
            add.render(this.renderer, temp);

            this.passes.copy.source.value = temp.texture;
            this.passes.copy.render(this.renderer, base);
            last = base;
        }

        const bloomFinal = this.passes.bloomFinal;
        bloomFinal.source.value = last.texture;
        bloomFinal.texelSize.value.set(1 / last.width, 1 / last.height);
        bloomFinal.intensity.value = config.BLOOM_INTENSITY;
        bloomFinal.render(this.renderer, this.bloom);
    }

    applySunrays() {
        const mask = this.passes.sunraysMask;
        mask.source.value = this.dye.read.texture;
        mask.render(this.renderer, this.sunraysTemp);

        const sunrays = this.passes.sunrays;
        sunrays.source.value = this.sunraysTemp.texture;
        sunrays.weight.value = config.SUNRAYS_WEIGHT;
        sunrays.lightSource.value.set(config.GOD_RAY_SOURCE.x, config.GOD_RAY_SOURCE.y);
        sunrays.render(this.renderer, this.sunrays);

        this.blur(this.sunrays, this.sunraysTemp, 1);
    }

    blur(target, temp, iterations) {
        const pass = this.passes.blur;

        for (let i = 0; i < iterations; i += 1) {
            pass.source.value = target.texture;
            pass.texelSize.value.set(1 / target.width, 0);
            pass.render(this.renderer, temp);

            pass.source.value = temp.texture;
            pass.texelSize.value.set(0, 1 / target.height);
            pass.render(this.renderer, target);
        }
    }

    splat(x, y, dx, dy, color, radiusScale = config.SPLAT_RADIUS) {
        const pass = this.passes.splat;
        const radius = this.correctRadius(radiusScale / 100);

        pass.aspectRatio.value = this.width / Math.max(this.height, 1);
        pass.point.value.set(x, y);
        pass.radius.value = radius;
        pass.source.value = this.velocity.read.texture;
        pass.splatColor.value.set(dx, dy, 0);
        pass.render(this.renderer, this.velocity.write);
        this.velocity.swap();

        pass.source.value = this.dye.read.texture;
        scratchVector.set(color.r, color.g, color.b);
        pass.splatColor.value.copy(scratchVector);
        pass.render(this.renderer, this.dye.write);
        this.dye.swap();

        if (config.TEMPERATURE_AMOUNT > 0) {
            pass.source.value = this.temperature.read.texture;
            pass.splatColor.value.set(config.TEMPERATURE_SPLAT * config.TEMPERATURE_AMOUNT, 0, 0);
            pass.render(this.renderer, this.temperature.write);
            this.temperature.swap();
        }

        if (config.SMOKE_ENABLED && config.SMOKE_SPLAT > 0) {
            pass.source.value = this.density.read.texture;
            pass.splatColor.value.set(config.SMOKE_SPLAT, 0, 0);
            pass.render(this.renderer, this.density.write);
            this.density.swap();
        }

        // Splash: a fast splat deposits a burst of foam (white-water on impact).
        if (config.FOAM_AMOUNT > 0 && config.SPLASH_FOAM > 0 && Math.hypot(dx, dy) > config.SPLASH_THRESHOLD) {
            pass.source.value = this.foam.read.texture;
            pass.radius.value = radius * 1.6;
            pass.splatColor.value.set(config.SPLASH_FOAM, 0, 0);
            pass.render(this.renderer, this.foam.write);
            this.foam.swap();
            pass.radius.value = radius;
        }

        // Seed reactant V into the chem field so painting injects reaction-
        // diffusion activity (the splat adds into the g channel).
        if (config.RD_ENABLED && config.RD_SEED_ON_SPLAT && this.chem) {
            pass.source.value = this.chem.read.texture;
            pass.radius.value = radius;
            pass.splatColor.value.set(0, config.RD_SEED_AMOUNT, 0);
            pass.render(this.renderer, this.chem.write);
            this.chem.swap();
        }

        this.markSplat(x, y, radius, 1);
        this.emitParticles(x, y, dx, dy, color);
    }

    // Seed particles from a splat — the particle layer is an extension of the
    // splat: each particle inherits the splat's velocity and dye colour and is
    // then advected by the solver. Called for both pointer and emitter splats.
    emitParticles(x, y, dx, dy, color) {
        const particles = this.particles;
        if (!particles?.enabled) {
            return;
        }

        const speed = Math.hypot(dx, dy);
        const life = config.PARTICLE_LIFETIME;
        const density = Math.max(0, config.PARTICLE_DENSITY | 0);

        if (config.PARTICLE_FOAM > 0) {
            particles.emit('foam', x, y, dx, dy, Math.round(density * config.PARTICLE_FOAM), { speed: 0.03, life: life * 1.2, spread: 0.07, color });
        }
        if (config.PARTICLE_SPRAY > 0) {
            particles.emit('spray', x, y, dx, dy, Math.round(density * config.PARTICLE_SPRAY), { speed: 0.1, life, spread: 0.04, color });
        }
        if (config.PARTICLE_BUBBLE > 0) {
            particles.emit('bubble', x, y, dx, dy, Math.round(density * config.PARTICLE_BUBBLE), { speed: 0.03, life: life * 1.4, spread: 0.05, color });
        }
        if (config.PARTICLE_SPARK > 0) {
            particles.emit('spark', x, y, dx, dy, Math.round(density * config.PARTICLE_SPARK), { speed: 0.16, life: life * 0.5, spread: 0.03, color });
        }
        if (speed > config.SPLASH_THRESHOLD && config.PARTICLE_SPLASH_BURST > 0) {
            particles.emit('spray', x, y, dx, dy, config.PARTICLE_SPLASH_BURST | 0, { speed: 0.24, life, spread: 0.03, color });
        }
    }

    // Downsample the velocity field and read it back to CPU (one frame late, at
    // half cadence) so the particle layer can be advected by the solver.
    updateParticleVelocityField() {
        if (!this.particles?.enabled || this._velReadPending || this.stepCount % 2 !== 0) {
            return;
        }

        this.passes.copy.source.value = this.velocity.read.texture;
        this.passes.copy.render(this.renderer, this.velSample);

        const width = this.velSample.width;
        const height = this.velSample.height;
        this._velReadPending = true;
        this.renderer.readRenderTargetPixelsAsync(this.velSample, 0, 0, width, height)
            .then((pixels) => {
                const isHalf = pixels instanceof Uint16Array;
                if (!this._velFieldData || this._velFieldData.length !== width * height * 2) {
                    this._velFieldData = new Float32Array(width * height * 2);
                }
                const field = this._velFieldData;
                for (let i = 0; i < width * height; i += 1) {
                    const o = i * 4;
                    field[i * 2] = isHalf ? halfFloatToFloat(pixels[o]) : pixels[o];
                    field[i * 2 + 1] = isHalf ? halfFloatToFloat(pixels[o + 1]) : pixels[o + 1];
                }
                this.particles.setVelocityField(field, width, height, this.simRes.width);
            })
            .catch(() => {})
            .finally(() => {
                this._velReadPending = false;
            });
    }

    // Public — record a splat into the mask channel. Called by splat() and
    // by particle feedback writes. Amplitude in [0,1].
    markSplat(x, y, radius, amplitude = 1) {
        const pass = this.passes.splatMask;
        pass.aspectRatio.value = this.width / Math.max(this.height, 1);
        pass.point.value.set(x, y);
        pass.radius.value = radius;
        pass.amplitude.value = amplitude;
        pass.source.value = this.splatMask.read.texture;
        pass.render(this.renderer, this.splatMask.write);
        this.splatMask.swap();
    }

    splatPointer(pointer) {
        const dx = pointer.deltaX * config.SPLAT_FORCE;
        const dy = pointer.deltaY * config.SPLAT_FORCE;

        this.splat(pointer.x, pointer.y, dx, dy, pointer.color);
    }

    paintObstacle(pointer, value) {
        const pass = this.passes.obstaclePaint;
        pass.aspectRatio.value = this.width / Math.max(this.height, 1);
        pass.point.value.set(pointer.x, pointer.y);
        pass.radius.value = this.correctRadius(config.OBSTACLE_RADIUS / 100);
        pass.source.value = this.obstacles.read.texture;
        pass.value.value = value;
        pass.render(this.renderer, this.obstacles.write);
        this.obstacles.swap();

        this.applyObstacleVelocity();
        this.applyObstacleDye();
    }

    multipleSplats(amount) {
        for (let i = 0; i < amount; i += 1) {
            this.randomSplat(true);
        }
    }

    randomSplat(boostColor = false) {
        scratchColor.copy(generateColor());
        if (boostColor) {
            scratchColor.r *= 10;
            scratchColor.g *= 10;
            scratchColor.b *= 10;
        }

        this.splat(
            Math.random(),
            Math.random(),
            1000 * (Math.random() - 0.5),
            1000 * (Math.random() - 0.5),
            scratchColor
        );
    }

    correctRadius(radius) {
        const aspectRatio = this.width / Math.max(this.height, 1);
        return aspectRatio > 1 ? radius * aspectRatio : radius;
    }

    clearTarget(target) {
        const pass = this.passes.color;
        pass.color.value.setRGB(0, 0, 0);
        pass.alpha.value = 1;
        pass.render(this.renderer, target);
    }

    clearAll() {
        this.clearTarget(this.velocity.read);
        this.clearTarget(this.velocity.write);
        this.clearTarget(this.viscosity.read);
        this.clearTarget(this.viscosity.write);
        this.clearTarget(this.dye.read);
        this.clearTarget(this.dye.write);
        this.clearTarget(this.temperature.read);
        this.clearTarget(this.temperature.write);
        this.clearTarget(this.foam.read);
        this.clearTarget(this.foam.write);
        this.clearTarget(this.density.read);
        this.clearTarget(this.density.write);
        this.clearTarget(this.smokeShadow);
        this.clearTarget(this.obstacles.read);
        this.clearTarget(this.obstacles.write);
        this.clearTarget(this.pressure.read);
        this.clearTarget(this.pressure.write);
        this.clearTarget(this.divergence);
        this.clearTarget(this.curl);
        this.clearTarget(this.splatMask.read);
        this.clearTarget(this.splatMask.write);
        this.clearTarget(this.saturation.read);
        this.clearTarget(this.saturation.write);
        this.initChem();
    }

    queueStatsReadback() {
        // Adaptive substepping needs a periodic max-velocity estimate, so the
        // readback also runs (at a faster cadence) when ADAPTIVE_SUBSTEP is on,
        // even without the ?debugStats flag.
        const wantStats = this.statsEnabled;
        const wantVelocity = config.ADAPTIVE_SUBSTEP;
        const cadence = wantVelocity && !wantStats ? 6 : 60;

        if ((!wantStats && !wantVelocity) || this.statsReadPending || this.stepCount % cadence !== 0) {
            return;
        }

        this.statsReadPending = true;
        this.readStats()
            .catch(() => {
                document.documentElement.dataset.fluidStatsError = 'readback failed';
            })
            .finally(() => {
                this.statsReadPending = false;
            });
    }

    async readStats() {
        const velocityPixels = await this.renderer.readRenderTargetPixelsAsync(
            this.velocity.read,
            0,
            0,
            this.simRes.width,
            this.simRes.height
        );
        const velocityStats = getChannelStats(velocityPixels, 2);
        // Feed the adaptive-substep estimate from the larger of the two
        // velocity-channel magnitudes.
        this._maxVelocity = Math.max(velocityStats[0].absMax, velocityStats[1].absMax);

        if (!this.statsEnabled) {
            return;
        }

        const dyePixels = await this.renderer.readRenderTargetPixelsAsync(
            this.dye.read,
            0,
            0,
            Math.min(this.dyeRes.width, 256),
            Math.min(this.dyeRes.height, 256)
        );
        const dyeStats = getChannelStats(dyePixels, 3);

        document.documentElement.dataset.fluidVelocityStats = formatStats(velocityStats);
        document.documentElement.dataset.fluidDyeStats = formatStats(dyeStats);
    }

    disposeTargets() {
        this.disposeMultigridPyramid();
        this.velocity?.dispose();
        this.viscosity?.dispose();
        this.dye?.dispose();
        this.temperature?.dispose();
        this.foam?.dispose();
        this.velSample?.dispose();
        this.particleLayer?.dispose();
        this.density?.dispose();
        this.chem?.dispose();
        this.saturation?.dispose();
        this.smokeShadow?.dispose();
        this.obstacles?.dispose();
        this.pressure?.dispose();
        this.divergence?.dispose();
        this.curl?.dispose();
        this.splatMask?.dispose();
        this.bloom?.dispose();
        this.bloomFramebuffers?.forEach((target) => target.dispose());
        this.bloomTempFramebuffers?.forEach((target) => target.dispose());
        this.sunrays?.dispose();
        this.sunraysTemp?.dispose();
    }

    getStats() {
        return {
            width: this.width,
            height: this.height,
            simRes: this.simRes,
            dyeRes: this.dyeRes,
            particleTextures: {
                velocity: this.velocity?.read?.texture,
                dye: this.dye?.read?.texture,
                temperature: this.temperature?.read?.texture,
                foam: this.foam?.read?.texture,
                pressure: this.pressure?.read?.texture,
                curl: this.curl?.texture,
                divergence: this.divergence?.texture,
                splatMask: this.splatMask?.read?.texture,
                obstacles: this.obstacles?.read?.texture,
                velocityTexelSize: {
                    x: 1 / Math.max(this.simRes.width, 1),
                    y: 1 / Math.max(this.simRes.height, 1)
                }
            },
            bloomLevels: this.bloomFramebuffers.length,
            stepCount: this.stepCount,
            passCount: estimatePassCount()
        };
    }

    dispose() {
        Object.values(this.passes).forEach((pass) => pass.dispose());
        this.disposeTargets();
        this.particles?.dispose();
        this.ditheringTexture?.dispose();
    }
}

function estimatePassCount() {
    const pressureIterations = config.PRESSURE_SOLVER === 'multigrid'
        ? Math.max(4, config.MULTIGRID_LEVELS * 4)
        : config.PRESSURE_ITERATIONS;
    let count = 7 + pressureIterations;

    if (config.VISCOSITY > 0) {
        count += config.VISCOSITY_ITERATIONS + 2;
    }

    if (config.TEMPERATURE_AMOUNT > 0) {
        count += 2;
    }

    if (config.FOAM_AMOUNT > 0) {
        count += 1;
    }

    if (config.BLOOM) {
        count += Math.max(2, config.BLOOM_ITERATIONS * 2);
    }

    if (config.SUNRAYS) {
        count += 3;
    }

    return count;
}

function normalizeBackColor(color) {
    return scratchColor.setRGB(color.r / 255, color.g / 255, color.b / 255);
}

function normalizeConfigColor(color) {
    return scratchColor.setRGB(color.r / 255, color.g / 255, color.b / 255);
}

function getDisplayStyleIndex(style) {
    const styles = {
        classic: 0,
        gradient: 1,
        material: 2,
        distortion: 2,
        metallic: 3,
        neon: 4,
        thermal: 5,
        watercolor: 6,
        glass: 7
    };

    return styles[style] ?? 0;
}

function getToneMappingIndex(style) {
    const styles = {
        none: 0,
        reinhard: 1,
        aces: 2,
        uncharted2: 3,
        agx: 4
    };

    return styles[style] ?? 1;
}

function getDyeAdvectionPass(passes, method) {
    if (method === 'maccormack') {
        return passes.dyeMacCormackAdvection;
    }

    if (method === 'bfecc') {
        return passes.dyeBFECCAdvection;
    }

    if (method === 'rk4') {
        return passes.dyeRK4Advection;
    }

    return passes.dyeAdvection;
}

function wrap(value, minValue, maxValue) {
    const range = maxValue - minValue;
    return range === 0 ? minValue : ((value - minValue) % range) + minValue;
}

function getChannelStats(pixels, channels) {
    const stride = 4;
    const decodeHalf = pixels instanceof Uint16Array;
    const stats = Array.from({ length: channels }, () => ({
        min: Infinity,
        max: -Infinity,
        absMax: 0,
        meanAbs: 0
    }));
    const samples = Math.floor(pixels.length / stride);

    for (let i = 0; i < samples; i += 1) {
        const offset = i * stride;
        for (let channel = 0; channel < channels; channel += 1) {
            const rawValue = pixels[offset + channel];
            const value = decodeHalf ? halfFloatToFloat(rawValue) : rawValue;
            const stat = stats[channel];
            stat.min = Math.min(stat.min, value);
            stat.max = Math.max(stat.max, value);
            stat.absMax = Math.max(stat.absMax, Math.abs(value));
            stat.meanAbs += Math.abs(value);
        }
    }

    stats.forEach((stat) => {
        stat.meanAbs /= Math.max(samples, 1);
    });

    return stats;
}

function halfFloatToFloat(value) {
    const sign = (value & 0x8000) ? -1 : 1;
    const exponent = (value & 0x7c00) >> 10;
    const fraction = value & 0x03ff;

    if (exponent === 0) {
        return sign * 2 ** -14 * (fraction / 1024);
    }

    if (exponent === 31) {
        return fraction ? Number.NaN : sign * Infinity;
    }

    return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

function formatStats(stats) {
    return stats
        .map((stat) => `${stat.min.toFixed(4)},${stat.max.toFixed(4)},${stat.absMax.toFixed(4)},${stat.meanAbs.toFixed(4)}`)
        .join('|');
}
