# ARTINOS MCP Server

Agent-callable tool endpoints over the ARTINOS registry (PRD FR-21, plan-completion D-C).
The server **wraps the existing file-based registry + scripts** — files stay the source of
truth (ADR-2). No database, no network, no new persistence.

## Run

```bash
npm run mcp -w STUDIO     # stdio MCP server (JSON-RPC over stdin/stdout)
```

Logs go to **stderr**; **stdout** is the JSON-RPC channel — never print to stdout.

## Register with an MCP client

Add to your client's MCP config (e.g. Claude Code / Desktop `mcpServers`):

```json
{
  "mcpServers": {
    "artinos": {
      "command": "npm",
      "args": ["run", "mcp", "-w", "STUDIO"],
      "cwd": "G:/CODE2026/.PROJECTS/ARTINOS"
    }
  }
}
```

## Tools

| Tool | Input | Returns |
|------|-------|---------|
| `list_modules` | — | brief record per module: `{ id, name, category, tags, description }` |
| `search_modules` | `{ query?, category?, tag? }` | filtered brief records |
| `get_module` | `{ id }` | full agent record: deps, sourcePath, usage, agentNotes, presets, related, version |
| `scaffold_module` | `{ id, category? }` | runs `new-module`, returns its output (fill TODOs, then `check_registry`) |
| `check_registry` | — | runs the library-sync gate, returns the pass/fail table |

## How module metadata is read

Module entries (`src/modules/<id>/<id>.module.ts`) import browser-only PANELFLOW preview
components, so they **cannot be runtime-imported in Node** — the same constraint as
`check-registry.ts`. The server parses the needed fields (id, name, category, description,
tags, dependencies, usage, agentNotes, presets, related, version) directly from source.

## Typical agent flow

1. `search_modules { query: "particles" }` → find reuse candidates (reuse-first, PRD §15).
2. `get_module { id }` → read `usage` + `agentNotes` to use/extend without opening source.
3. `scaffold_module { id, category }` → only if nothing reusable exists.
4. `check_registry` → gate the result before calling it done.
