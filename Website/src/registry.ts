/**
 * registry.ts — the public website's read-only view of the ARTINOS registry (D-E).
 *
 * Reads the SAME module sources as the Studio (STUDIO/src/modules/*.module.ts) as raw
 * text via Vite's glob and parses the metadata fields. It intentionally does NOT import
 * the live preview components (those pull in Three.js / PANELFLOW) — the public gallery
 * is metadata + copy, not a runtime.
 */

export interface ModuleCard {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  dependencies: string[];
  usage: string;
  version: string;
  presets: string[];
}

const raw = import.meta.glob('../../STUDIO/src/modules/*/*.module.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function strField(src: string, field: string): string {
  const m = src.match(new RegExp(`\\b${field}:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`, 's'));
  return m ? m[2].replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"') : '';
}
function arrField(src: string, field: string): string[] {
  const m = src.match(new RegExp(`\\b${field}:\\s*\\[([^\\]]*)\\]`, 's'));
  if (!m) return [];
  return [...m[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((x) => x[1]);
}
function presetKeys(src: string): string[] {
  const m = src.match(/\bpresets:\s*\{([\s\S]*?)\n\s*\},/);
  if (!m) return [];
  return [...m[1].matchAll(/^\s*([A-Za-z0-9_]+|['"][^'"]+['"]):\s*\{/gm)].map((x) => x[1].replace(/['"]/g, ''));
}

export const MODULES: ModuleCard[] = Object.values(raw)
  .map((src) => ({
    id: strField(src, 'id'),
    name: strField(src, 'name'),
    category: strField(src, 'category'),
    description: strField(src, 'description'),
    tags: arrField(src, 'tags'),
    dependencies: arrField(src, 'dependencies'),
    usage: strField(src, 'usage'),
    version: strField(src, 'version'),
    presets: presetKeys(src),
  }))
  .filter((m) => m.id)
  .sort((a, b) => a.name.localeCompare(b.name));

export const CATEGORIES: string[] = [...new Set(MODULES.map((m) => m.category))].sort();
