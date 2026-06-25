import { BALL_POOL_DEFAULTS } from '../tuning/sourceTuning';

export const BALL_POOL_PRESETS = {
  'CodePen Original': { ...BALL_POOL_DEFAULTS, preset: 'codepen-original' },
  'Dense Gallery': {
    ...BALL_POOL_DEFAULTS,
    preset: 'dense-gallery',
    ballRadius: 0.34,
    fillRatio: 0.55,
    packing: 0.66,
    giIntensity: 16,
    bloomStrength: 0.32,
  },
  'Slow Glass': {
    ...BALL_POOL_DEFAULTS,
    preset: 'slow-glass',
    glassMass: 10,
    springStiffness: 280,
    springDamping: 70,
    pushStrength: 3.2,
    lightIntensity: 62,
  },
  'Low GI': {
    ...BALL_POOL_DEFAULTS,
    preset: 'low-gi',
    giIntensity: 7,
    aoIntensity: 0.35,
    ssgiSliceCount: 1,
    ssgiStepCount: 4,
    bloomStrength: 0.12,
    pixelRatio: 1,
  },
} satisfies Record<string, Record<string, unknown>>;

export function resolveBallPoolPreset(id?: string) {
  return Object.values(BALL_POOL_PRESETS).find((preset) => preset.preset === id) ?? BALL_POOL_PRESETS['CodePen Original'];
}
