/**
 * new-module.ts — scaffold a new ARTINOS module folder from the seed-module template.
 *
 *   npm run new-module -w STUDIO -- <kebab-id> [--category ui]
 *
 * Creates STUDIO/src/modules/<id>/{<PascalId>Preview.tsx, <id>.module.ts} matching the
 * ArtinosModule contract (id === schema.id). Fill the TODOs, then `npm run check-registry`.
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const catIdx = args.indexOf('--category');
const category = catIdx >= 0 ? args[catIdx + 1] : 'ui';

if (!id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  console.error('Usage: npm run new-module -w STUDIO -- <kebab-id> [--category ui]');
  process.exit(1);
}

const pascal = id.split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('');
const camel = pascal[0].toLowerCase() + pascal.slice(1);
const previewName = `${pascal}Preview`;
const today = new Date().toISOString().slice(0, 10);

const dir = resolve(here, '../src/modules', id);
if (existsSync(dir)) {
  console.error(`Module "${id}" already exists at ${dir}`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

const previewSrc = `/**
 * ${previewName} — live preview for the ${id} module.
 * Reads its values from the PANELFLOW bridge (keyed by the module id).
 */

import { useBridgeStore } from '@artinos/panelflow';

export default function ${previewName}() {
  // Select the raw slice and default OUTSIDE the selector (decisions ADR-13).
  const values = useBridgeStore((s) => s.componentValues['${id}']);
  const color = (values?.color as string) ?? '#2dd4bf';

  return (
    <div className="w-full h-full flex items-center justify-center p-10">
      <div className="text-sm" style={{ color }}>
        ${pascal} preview — replace with the real module.
      </div>
    </div>
  );
}
`;

const moduleSrc = `import type { ArtinosModule } from '../../registry/types';
import ${previewName} from './${previewName}';

const ${camel}Module: ArtinosModule = {
  id: '${id}',
  name: '${pascal}',
  category: '${category}',
  description: 'TODO: what it does and when to use it.',
  tags: [],
  schema: {
    id: '${id}',
    name: '${pascal}',
    category: '${category}',
    parameters: [
      { key: 'color', label: 'Color', type: 'color', default: '#2dd4bf', group: 'Appearance' },
    ],
  },
  preview: ${previewName},
  sourcePath: 'STUDIO/src/modules/${id}/${previewName}.tsx',
  dependencies: ['@artinos/panelflow'],
  usage: 'TODO: copy-paste usage snippet.',
  agentNotes: 'TODO: how to use/extend this module. Bridge id is "${id}".',
  version: '0.1.0',
  updatedAt: '${today}',
};

export default ${camel}Module;
`;

writeFileSync(resolve(dir, `${previewName}.tsx`), previewSrc);
writeFileSync(resolve(dir, `${id}.module.ts`), moduleSrc);

console.log(`Created STUDIO/src/modules/${id}/{${previewName}.tsx, ${id}.module.ts}`);
console.log('Next: fill the TODOs, then `npm run check-registry -w STUDIO`.');
