/**
 * types.ts — the ARTINOS registry entry shape.
 *
 * One `ArtinosModule` per reusable module, co-located with the module source as
 * `<id>.module.ts`. Mirrors the registry schema in ARTINOS-PRD §11. The control
 * schema reuses PANELFLOW's `ComponentSchema` as the canonical source (ADR-5),
 * so showcases drive PANELFLOW's auto-generated control panel directly.
 */

import type { ComponentType } from 'react';
import type { ComponentSchema } from '@artinos/panelflow';

export interface ArtinosModule {
  /** Unique, kebab-case. MUST equal `schema.id` (bridge values key on it). */
  id: string;
  /** Display name. */
  name: string;
  /** Classification: 'ui' | '3d' | 'shader' | 'effect' | 'layout' | 'material' | ... */
  category: string;
  /** What it does and when to use it. */
  description: string;
  /** Searchable keywords. */
  tags: string[];
  /** Canonical control schema (PANELFLOW). Powers the showcase's auto-panel. */
  schema: ComponentSchema;
  /** Live preview component. Reads its values from the PANELFLOW bridge by `schema.id`. */
  preview: ComponentType;
  /** Location of the owned source code, repo-relative. */
  sourcePath: string;
  /** Required packages + runtime requirements (e.g. 'webgpu'). */
  dependencies: string[];
  /** Copy-paste / install snippet. */
  usage: string;
  /** Named parameter presets: presetName -> { paramKey -> value }. */
  presets?: Record<string, Record<string, unknown>>;
  /** Related / composable module ids. */
  related?: string[];
  /** Agent-readable notes on how to use/extend the module (ARTINOS-PRD §11). */
  agentNotes: string;
  /** Known reuse patterns / prior usage. */
  reuseNotes?: string;
  /** Last verification result. */
  validation?: { build: boolean; preview: boolean; console: boolean };
  /** Versioning. */
  version: string;
  /** Freshness — ISO 8601 UTC date. */
  updatedAt: string;
}
