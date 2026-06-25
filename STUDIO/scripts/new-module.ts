/**
 * new-module.ts — scaffold a self-contained ARTINOS reusable module.
 *
 *   npm run new-module -w STUDIO -- <kebab-id> [--category physics/fluid]
 *
 * Creates the preferred ARTINOS module shape:
 *   STUDIO/src/modules/<category-path>/<PascalId>.module.tsx
 *   STUDIO/src/modules/<category-path>/<PascalId>.showcase.tsx
 *   STUDIO/src/modules/<category-path>/<PascalId>.meta.ts
 *
 * Fill the TODOs, then run `npm run check-registry -w STUDIO`.
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const id = positional[0];
const catIdx = args.indexOf('--category');
const category = catIdx >= 0 ? args[catIdx + 1] : positional[1] ?? 'ui';

if (!id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  console.error('Usage: npm run new-module -w STUDIO -- <kebab-id> [--category physics/fluid]');
  process.exit(1);
}

if (!/^[a-z0-9]+([-/][a-z0-9]+)*$/.test(category)) {
  console.error('Category must be a slash path such as "ui", "webgpu", or "physics/fluid".');
  process.exit(1);
}

const pascal = id.split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('');
const camel = pascal[0].toLowerCase() + pascal.slice(1);
const moduleName = `${pascal}Module`;
const showcaseName = `${pascal}Showcase`;
const today = new Date().toISOString().slice(0, 10);
const categoryPath = category.replace(/-/g, '-');

const dir = resolve(here, '../src/modules', categoryPath);
const modulePath = resolve(dir, `${pascal}.module.tsx`);
const showcasePath = resolve(dir, `${pascal}.showcase.tsx`);
const metaPath = resolve(dir, `${pascal}.meta.ts`);
const registryTypesPath = resolve(here, '../src/registry/types');
const metaDir = dirname(metaPath);
let registryImport = relative(metaDir, registryTypesPath).replace(/\\/g, '/');
if (!registryImport.startsWith('.')) registryImport = `./${registryImport}`;

if (existsSync(modulePath) || existsSync(showcasePath) || existsSync(metaPath)) {
  console.error(`Module "${id}" already exists in ${dir}`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

const moduleSrc = `/**
 * ARTINOS Module: ${pascal}
 * Category: ${category}
 * Dependencies: @artinos/panelflow, react
 * Reusable as: TODO describe the reusable system and where it can be reused.
 */

export type ${pascal}Config = {
  color: string;
};

export const ${camel}Defaults: ${pascal}Config = {
  color: '#2dd4bf',
};

export function ${moduleName}({ color = ${camel}Defaults.color }: Partial<${pascal}Config>) {
  return (
    <div className="flex h-full w-full items-center justify-center p-10">
      <div className="text-sm" style={{ color }}>
        ${pascal} module — replace with the real reusable system.
      </div>
    </div>
  );
}
`;

const showcaseSrc = `/**
 * ${showcaseName} — bridge-driven live showcase for ${pascal}.
 */

import { useBridgeStore } from '@artinos/panelflow';
import { ${moduleName}, ${camel}Defaults } from './${pascal}.module';

const BRIDGE_ID = '${id}';

export default function ${showcaseName}() {
  // Select the raw slice and default OUTSIDE the selector (decisions ADR-13).
  const values = useBridgeStore((s) => s.componentValues[BRIDGE_ID]);
  const color = (values?.color as string) ?? ${camel}Defaults.color;

  return <${moduleName} color={color} />;
}
`;

const metaSrc = `import type { ArtinosModule } from '${registryImport}';
import ${showcaseName} from './${pascal}.showcase';

const ${camel}Meta: ArtinosModule = {
  id: '${id}',
  name: '${pascal}',
  category: '${category}',
  description: 'TODO: what reusable system this module owns and when to use it.',
  tags: [],
  schema: {
    id: '${id}',
    name: '${pascal}',
    category: '${category}',
    parameters: [
      { key: 'color', label: 'Color', type: 'color', default: '#2dd4bf', group: 'Appearance' },
    ],
  },
  preview: ${showcaseName},
  sourcePath: 'STUDIO/src/modules/${categoryPath}/${pascal}.module.tsx',
  dependencies: ['@artinos/panelflow', 'react'],
  usage: "import { ${moduleName} } from './modules/${categoryPath}/${pascal}.module';\\n\\n<${moduleName} color=\\"#2dd4bf\\" />",
  agentNotes: 'TODO: explain how to use/extend this self-contained module without opening the source. Bridge id is "${id}".',
  version: '0.1.0',
  updatedAt: '${today}',
};

export default ${camel}Meta;
`;

writeFileSync(modulePath, moduleSrc);
writeFileSync(showcasePath, showcaseSrc);
writeFileSync(metaPath, metaSrc);

console.log(`Created STUDIO/src/modules/${categoryPath}/{${pascal}.module.tsx, ${pascal}.showcase.tsx, ${pascal}.meta.ts}`);
console.log('Next: fill the TODOs, then `npm run check-registry -w STUDIO`.');
