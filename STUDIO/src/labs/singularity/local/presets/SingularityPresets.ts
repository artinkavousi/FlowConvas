import { singularitySourceDefaults } from '../tuning/sourceTuning';

export const singularityPresets = {
  'Source Original': singularitySourceDefaults,
  'Accretion Gold': {
    ...singularitySourceDefaults,
    bloomStrength: 0.45,
    rampEmission: 2.6,
    backgroundIntensity: 1.7,
  },
  'Cold Singularity': {
    ...singularitySourceDefaults,
    rampCol1: '#dbeafe',
    rampCol2: '#172554',
    rampCol3: '#000000',
    emissionColor: '#0f172a',
    rampEmission: 2.4,
    bloomStrength: 0.35,
  },
  'Low Iteration': {
    ...singularitySourceDefaults,
    iterations: 64,
    stepSize: 0.009,
    pixelRatio: 1,
    bloomStrength: 0.16,
  },
  'Event Horizon': {
    ...singularitySourceDefaults,
    originRadius: 0.085,
    rampEmission: 3.2,
    power: 0.42,
  },
} as const;
