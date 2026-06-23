/**
 * registry.ts — the ARTINOS reusable-block registry.
 *
 * Modules are discovered at runtime from their co-located `<id>.module.ts` files
 * via Vite's `import.meta.glob` (ADR-6). No codegen, no DB — files are the source
 * of truth. Search/filter/lookup power the gallery and showcase.
 */

import type { ArtinosModule } from './types';

// Eagerly import every module entry. Each file default-exports an ArtinosModule.
const modules = import.meta.glob<{ default: ArtinosModule }>(
  '../modules/*/*.module.{ts,tsx}',
  { eager: true },
);

function buildRegistry(): ArtinosModule[] {
  const seen = new Set<string>();
  const out: ArtinosModule[] = [];

  for (const [path, mod] of Object.entries(modules)) {
    const entry = mod?.default;
    if (!entry) {
      console.warn(`[ARTINOS registry] ${path} has no default export — skipped.`);
      continue;
    }
    if (entry.id !== entry.schema.id) {
      console.warn(
        `[ARTINOS registry] ${path}: module id "${entry.id}" !== schema.id "${entry.schema.id}".`,
      );
    }
    if (seen.has(entry.id)) {
      console.warn(`[ARTINOS registry] duplicate module id "${entry.id}" (${path}) — skipped.`);
      continue;
    }
    seen.add(entry.id);
    out.push(entry);
  }

  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export const REGISTRY: ArtinosModule[] = buildRegistry();

// Expose every module as a node on the PANELFLOW graph canvas (FR-9, ADR via D-A).
// Lazy import avoids pulling the graph into non-graph code paths at module init.
import { registerModuleNodes } from './module-to-node';
registerModuleNodes(REGISTRY);

export function getModule(id: string): ArtinosModule | undefined {
  return REGISTRY.find((m) => m.id === id);
}

export function listCategories(): string[] {
  return Array.from(new Set(REGISTRY.map((m) => m.category))).sort();
}

export function searchModules(q: { query?: string; category?: string; tag?: string } = {}): ArtinosModule[] {
  const query = q.query?.trim().toLowerCase();
  return REGISTRY.filter((m) => {
    if (q.category && m.category !== q.category) return false;
    if (q.tag && !m.tags.includes(q.tag)) return false;
    if (query) {
      const haystack = [m.name, m.description, m.category, ...m.tags].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
