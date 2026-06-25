/**
 * check-registry.ts — the ARTINOS library-sync gate (FR-8 / FR-20, decisions ADR-8).
 *
 *   npm run check-registry -w STUDIO
 *
 * Validates every registry entry statically (no runtime import — the entries pull in
 * PANELFLOW's browser-only graph). Preferred entries are `*.meta.ts`; legacy
 * `<id>/<id>.module.ts` entries are still accepted. Runtime files in Lab capsule
 * `modules/` folders are ignored. Checks: required fields present & non-empty,
 * id === schema.id, sourcePath resolves on disk, schema params have key/label/type/
 * default, and no duplicate ids. Prints a per-module table; exits non-zero on failure.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const modulesDir = resolve(here, '../src/modules');
const labsDir = resolve(here, '../src/labs');

const REQUIRED = [
  'id', 'name', 'category', 'description', 'tags', 'schema', 'preview',
  'sourcePath', 'dependencies', 'usage', 'agentNotes', 'version', 'updatedAt',
];
// String fields a scaffold leaves as a TODO stub — must be filled before "done".
const NO_TODO = ['description', 'usage', 'agentNotes'];

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const path = resolve(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

function isRegistryFile(file: string): boolean {
  const rel = file.slice(repoRoot.length + 1).replace(/\\/g, '/');
  if (/\.meta\.(ts|tsx)$/.test(rel)) return true;
  return /^STUDIO\/src\/(modules|labs)\/[^/]+\/[^/]+\.module\.(ts|tsx)$/.test(rel);
}

function findModuleFiles(): string[] {
  const out: string[] = [];
  for (const base of [modulesDir, labsDir]) {
    if (!existsSync(base)) continue;
    out.push(...walk(base).filter(isRegistryFile));
  }
  return out;
}

function strField(src: string, field: string): string | null {
  const m = src.match(new RegExp(`\\b${field}:\\s*["']([^"']+)["']`));
  return m ? m[1] : null;
}

const files = findModuleFiles();
const rows: { name: string; id: string; ok: boolean; problems: string[]; category: string }[] = [];
const seenIds = new Map<string, string>();

for (const file of files) {
  const rel = file.slice(repoRoot.length + 1).replace(/\\/g, '/');
  const src = readFileSync(file, 'utf-8');
  const problems: string[] = [];

  if (!/export\s+default\b/.test(src)) problems.push('no default export');
  for (const f of REQUIRED) {
    if (!new RegExp(`\\b${f}:`).test(src)) problems.push(`missing field "${f}"`);
  }
  for (const f of NO_TODO) {
    const v = strField(src, f);
    if (v !== null && (v.trim() === '' || /^TODO/i.test(v))) problems.push(`"${f}" is a stub/empty`);
  }
  if (/tags:\s*\[\s*\]/.test(src)) problems.push('"tags" is empty');

  // id === schema.id (the two id string literals: module first, schema second)
  const ids = [...src.matchAll(/\bid:\s*["']([^"']+)["']/g)].map((m) => m[1]);
  const id = ids[0] ?? '(none)';
  if (ids.length >= 2 && ids[0] !== ids[1]) problems.push(`module id "${ids[0]}" !== schema.id "${ids[1]}"`);

  // sourcePath resolves
  const sourcePath = strField(src, 'sourcePath');
  if (sourcePath && !existsSync(resolve(repoRoot, sourcePath))) problems.push(`sourcePath not found: ${sourcePath}`);

  // schema params each have key/label/type/default
  const counts = ['key', 'label', 'type', 'default'].map(
    (k) => (src.match(new RegExp(`\\b${k}:`, 'g')) || []).length,
  );
  const [k, l, t, d] = counts;
  if (k < 1) problems.push('schema has no parameters');
  else if (!(k === t && k === d && l >= k)) problems.push('a schema parameter is missing key/label/type/default');

  // duplicate id
  if (seenIds.has(id)) problems.push(`duplicate id (also in ${seenIds.get(id)})`);
  else seenIds.set(id, rel);

  rows.push({ name: rel, id, ok: problems.length === 0, problems, category: strField(src, 'category') ?? '?' });
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log('\nARTINOS registry check\n' + '─'.repeat(50));
if (rows.length === 0) console.log('No registry entries found in STUDIO/src/modules or STUDIO/src/labs.');
for (const r of rows) {
  console.log(`${r.ok ? '✓' : '✗'}  ${r.id.padEnd(18)} ${r.name}`);
  for (const p of r.problems) console.log(`     · ${p}`);
}
const failed = rows.filter((r) => !r.ok).length;
const categories = [...new Set(rows.map((r) => r.category))].sort();
console.log('─'.repeat(50));
console.log(`${rows.length} module(s) across ${categories.length} categ(${categories.join(', ')}), ${rows.length - failed} ok, ${failed} failed.`);
// Multi-domain gate (plan-completion C-13): the library should span ≥4 categories.
if (categories.length < 4) console.log(`note: only ${categories.length} categories — library not yet multi-domain (target ≥4).`);
console.log('');
process.exit(failed > 0 ? 1 : 0);
