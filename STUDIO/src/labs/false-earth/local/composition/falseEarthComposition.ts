export const falseEarthComposition = {
  mode: 'Mode B Lab Capsule',
  rendererModel: 'Layered WebGPU canvases using local module snapshots',
  layers: [
    'TSL GPU grass terrain base',
    'Local procedural star shell in the base scene',
    'VAT lifecycle rose proxy overlay',
    'Cosmic beam and shockwave overlay',
    'Follow, FPV, and detached astronaut navigation overlay',
    'Local Web Audio ambience, event-driven beam hits, and grass footsteps',
  ],
  sourceIdentity:
    'Playable astronaut on a dark alien grass field with cosmic beam impacts and source-derived vegetation/wind timing.',
  panelBridgeId: 'false-earth',
  deviations: [
    'Leva controls are mapped to PANELFLOW schema controls.',
    'The Lab uses snapshot module engines instead of the source R3F Canvas/global store shell.',
    'Raw VAT rose mesh rendering is disabled in the Lab composition until the WebGPU VAT shader path is stable; the source-derived lifecycle proxy remains active.',
    'Audio is mapped to a local Web Audio engine instead of the source R3F AudioListener/global store; beam hits are triggered from the cosmic module event surface.',
  ],
} as const;
