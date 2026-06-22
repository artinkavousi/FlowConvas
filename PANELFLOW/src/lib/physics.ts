export interface DotGridPhysicsConfig {
  boundaryMargin: number;
  maxVelocity: number;
  baseFriction: number;
  highSpeedFriction: number;
  bounceFrictionBoost: number;
  bounceDamping: number;
  minVelocity: number;
  velocitySampleCount: number;
  momentumThreshold: number;
}

export const DEFAULT_DOTGRID_PHYSICS_CONFIG: DotGridPhysicsConfig = {
  boundaryMargin: 50,
  maxVelocity: 80,
  baseFriction: 0.92,
  highSpeedFriction: 0.85,
  bounceFrictionBoost: 0.8,
  bounceDamping: 0.6,
  minVelocity: 0.5,
  velocitySampleCount: 10,
  momentumThreshold: 2,
};
