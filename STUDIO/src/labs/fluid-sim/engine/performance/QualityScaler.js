import { config } from '../config.js';

export const qualityProfiles = {
    low: {
        label: 'Low',
        SIM_RESOLUTION: 64,
        DYE_RESOLUTION: 256,
        BLOOM_RESOLUTION: 128,
        BLOOM_ITERATIONS: 5,
        SUNRAYS_RESOLUTION: 128,
        PARTICLE_MAX_COUNT: 5000,
        PARTICLE_SPAWN_RATE: 120,
        RD_SUBSTEPS: 4
    },
    medium: {
        label: 'Medium',
        SIM_RESOLUTION: 96,
        DYE_RESOLUTION: 512,
        BLOOM_RESOLUTION: 196,
        BLOOM_ITERATIONS: 6,
        SUNRAYS_RESOLUTION: 160,
        PARTICLE_MAX_COUNT: 20000,
        PARTICLE_SPAWN_RATE: 350,
        RD_SUBSTEPS: 8
    },
    high: {
        label: 'High',
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1024,
        BLOOM_RESOLUTION: 256,
        BLOOM_ITERATIONS: 8,
        SUNRAYS_RESOLUTION: 196,
        PARTICLE_MAX_COUNT: 50000,
        PARTICLE_SPAWN_RATE: 750,
        RD_SUBSTEPS: 14
    },
    ultra: {
        label: 'Ultra',
        SIM_RESOLUTION: 192,
        DYE_RESOLUTION: 1024,
        BLOOM_RESOLUTION: 320,
        BLOOM_ITERATIONS: 8,
        SUNRAYS_RESOLUTION: 256,
        PARTICLE_MAX_COUNT: 100000,
        PARTICLE_SPAWN_RATE: 1400,
        RD_SUBSTEPS: 20
    }
};

const profileOrder = ['low', 'medium', 'high', 'ultra'];

export class QualityScaler {
    constructor({ simulation }) {
        this.simulation = simulation;
        this.samples = [];
        this.cooldown = 0;
        this.status = 'manual';
        this.currentProfile = normalizeProfile(config.QUALITY_PROFILE);
        this.applyProfile(this.currentProfile, { forceResize: false, reason: 'initial' });
    }

    update(dt) {
        const frameMs = dt * 1000;
        this.samples.push(frameMs);
        if (this.samples.length > 120) {
            this.samples.shift();
        }

        this.cooldown = Math.max(0, this.cooldown - dt);

        if (!config.AUTO_QUALITY) {
            this.status = 'manual';
            this.publish();
            return;
        }

        if (this.samples.length < 45 || this.cooldown > 0) {
            this.status = `watching ${this.currentProfile}`;
            this.publish();
            return;
        }

        const targetMs = 1000 / Math.max(config.FPS_TARGET, 1);
        const averageMs = average(this.samples);
        const currentIndex = profileOrder.indexOf(this.currentProfile);
        const shouldDrop = averageMs > targetMs * 1.32 && currentIndex > 0;
        const shouldRaise = averageMs < targetMs * 0.78 && currentIndex < profileOrder.length - 1;

        if (shouldDrop) {
            this.applyProfile(profileOrder[currentIndex - 1], { forceResize: true, reason: 'downshift' });
            this.cooldown = 4.5;
            this.samples.length = 0;
            return;
        }

        if (shouldRaise) {
            this.applyProfile(profileOrder[currentIndex + 1], { forceResize: true, reason: 'upshift' });
            this.cooldown = 7.5;
            this.samples.length = 0;
            return;
        }

        this.status = `holding ${this.currentProfile}`;
        this.publish();
    }

    setProfile(profile, { forceResize = true } = {}) {
        this.applyProfile(profile, { forceResize, reason: 'manual' });
        this.samples.length = 0;
        this.cooldown = 2;
    }

    getState() {
        return {
            profile: this.currentProfile,
            status: this.status,
            frameMs: average(this.samples)
        };
    }

    applyProfile(profile, { forceResize, reason }) {
        const normalized = normalizeProfile(profile);
        const values = qualityProfiles[normalized];

        Object.entries(values).forEach(([key, value]) => {
            if (key !== 'label') {
                config[key] = value;
            }
        });

        this.currentProfile = normalized;
        config.QUALITY_PROFILE = normalized;
        this.status = reason === 'manual' ? `manual ${normalized}` : `${reason} ${normalized}`;
        this.publish();

        if (forceResize) {
            this.simulation.resize(true);
        }
    }

    publish() {
        config.QUALITY_STATUS = this.status;
        document.documentElement.dataset.fluidQualityProfile = this.currentProfile;
        document.documentElement.dataset.fluidQualityStatus = this.status;
    }
}

export function createQualityProfileOptions() {
    return Object.fromEntries(
        Object.entries(qualityProfiles).map(([id, profile]) => [profile.label, id])
    );
}

function normalizeProfile(profile) {
    return Object.hasOwn(qualityProfiles, profile) ? profile : 'high';
}

function average(values) {
    if (values.length === 0) {
        return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
