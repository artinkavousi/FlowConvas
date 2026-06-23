/**
 * mcp-server.ts — ARTINOS registry as agent-callable MCP tools (FR-21, plan-completion D-C).
 *
 *   npm run mcp -w STUDIO        # stdio MCP server
 *
 * Wraps the existing file-based registry + scripts; files stay canonical (ADR-2).
 * Tools: list_modules, search_modules, get_module, scaffold_module, check_registry.
 *
 * Module metadata is parsed from each <id>.module.ts source (never runtime-imported —
 * the entries pull in browser-only PANELFLOW, same constraint as check-registry.ts).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const here = dirname(fileURLToPath(import.meta.url));
const studioRoot = resolve(here, '..');
const modulesDir = resolve(studioRoot, 'src/modules');

interface ModuleMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  dependencies: string[];
  sourcePath: string;
  usage: string;
  agentNotes: string;
  related: string[];
  presets: string[];
  version: string;
  updatedAt: string;
}

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

function loadModules(): ModuleMeta[] {
  if (!existsSync(modulesDir)) return [];
  const out: ModuleMeta[] = [];
  for (const entry of readdirSync(modulesDir)) {
    const dir = resolve(modulesDir, entry);
    if (!statSync(dir).isDirectory()) continue;
    const file = readdirSync(dir).find((f) => /\.module\.(ts|tsx)$/.test(f));
    if (!file) continue;
    const src = readFileSync(resolve(dir, file), 'utf-8');
    const id = strField(src, 'id');
    if (!id) continue;
    out.push({
      id,
      name: strField(src, 'name'),
      category: strField(src, 'category'),
      description: strField(src, 'description'),
      tags: arrField(src, 'tags'),
      dependencies: arrField(src, 'dependencies'),
      sourcePath: strField(src, 'sourcePath'),
      usage: strField(src, 'usage'),
      agentNotes: strField(src, 'agentNotes'),
      related: arrField(src, 'related'),
      presets: presetKeys(src),
      version: strField(src, 'version'),
      updatedAt: strField(src, 'updatedAt'),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function brief(m: ModuleMeta) {
  return { id: m.id, name: m.name, category: m.category, tags: m.tags, description: m.description };
}

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });

const server = new McpServer({ name: 'artinos-registry', version: '0.1.0' });

server.registerTool(
  'list_modules',
  { description: 'List all ARTINOS registry modules (brief).', inputSchema: {} },
  async () => json(loadModules().map(brief)),
);

server.registerTool(
  'search_modules',
  {
    description: 'Search ARTINOS modules by free-text query, category, and/or tag.',
    inputSchema: { query: z.string().optional(), category: z.string().optional(), tag: z.string().optional() },
  },
  async ({ query, category, tag }) => {
    const q = query?.trim().toLowerCase();
    const results = loadModules().filter((m) => {
      if (category && m.category !== category) return false;
      if (tag && !m.tags.includes(tag)) return false;
      if (q) {
        const hay = [m.name, m.description, m.category, ...m.tags].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return json(results.map(brief));
  },
);

server.registerTool(
  'get_module',
  { description: 'Get the full agent record for one module by id.', inputSchema: { id: z.string() } },
  async ({ id }) => {
    const m = loadModules().find((x) => x.id === id);
    return m ? json(m) : { content: [{ type: 'text' as const, text: `No module with id "${id}".` }], isError: true };
  },
);

server.registerTool(
  'scaffold_module',
  {
    description: 'Scaffold a new module folder (runs new-module). Fill the TODOs, then check_registry.',
    inputSchema: { id: z.string(), category: z.string().optional() },
  },
  async ({ id, category }) => {
    const args = ['run', 'new-module', '--', id];
    if (category) args.push('--category', category);
    const r = spawnSync('npm', args, { cwd: studioRoot, encoding: 'utf-8', shell: true });
    return { content: [{ type: 'text' as const, text: (r.stdout || '') + (r.stderr || '') }], isError: r.status !== 0 };
  },
);

server.registerTool(
  'check_registry',
  { description: 'Run the library-sync gate (check-registry) and return its report.', inputSchema: {} },
  async () => {
    const r = spawnSync('npm', ['run', 'check-registry'], { cwd: studioRoot, encoding: 'utf-8', shell: true });
    return { content: [{ type: 'text' as const, text: (r.stdout || '') + (r.stderr || '') }], isError: r.status !== 0 };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
// stderr is safe for logs (stdout is the JSON-RPC channel).
console.error('[artinos-mcp] ready — tools: list_modules, search_modules, get_module, scaffold_module, check_registry');
