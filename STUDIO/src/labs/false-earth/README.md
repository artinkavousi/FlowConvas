# False Earth Lab

Mode B ARTINOS Lab capsule for `momentchan/false-earth`.

The Lab runs from local snapshot modules under `modules/` so it remains portable and copy-pasteable.
Canonical reusable modules live under `STUDIO/src/modules/`; snapshot provenance is recorded in
`local/tuning/provenance.ts`.

Current composition layers:
- TSL GPU grass terrain.
- Procedural star shell based on the source `Stars` background.
- Source-derived VAT lifecycle rose proxy layer.
- Cosmic beam and shockwave layer.
- Third-person astronaut navigation layer.
- Source ambient and grass footstep audio through a local Web Audio adapter.
- Beam-impact audio triggered from the cosmic beam hit events.

Known deviation: the raw VAT rose mesh shader path remains available in the canonical module but is
disabled in the Lab composition with `renderVatMesh=false` because it produced WebGPU shader-module
validation errors when stacked into the layered Lab. The verified lifecycle proxy keeps the rose growth
timing visible while preserving a clean runtime gate.
