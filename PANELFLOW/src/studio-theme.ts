// studio-theme.ts — ARTINOS design tokens.
// Seeded from PANELFLOW(UI) `tokens/tokens.ts` (the `-GridDot` bug fixed → `gridDot`).
// Phase 1 replaces/extends this with the full ported tokens.css + figma round-trip.

export const THEME = {
  bg: '#0a0a0a',
  surface: '#171717',
  surfaceRaised: '#262626',
  surfaceOverlay: 'rgba(0, 0, 0, 0.4)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderSoft: 'rgba(255, 255, 255, 0.05)',
  text: '#ffffff',
  textMuted: '#737373',
  textSoft: 'rgba(255, 255, 255, 0.45)',
  accent: '#2dd4bf',
  accentDim: 'rgba(45, 212, 191, 0.20)',
  accentGlow: 'rgba(20, 184, 166, 0.60)',
  success: '#4ade80',
  info: '#2563eb',
  gridDot: 'rgba(255, 255, 255, 0.10)',
} as const;

export type ThemeKey = keyof typeof THEME;

/** Map a token name to its CSS variable reference, e.g. token('accent') → 'var(--accent)'. */
export const token = (name: ThemeKey): string => `var(--${name})`;

/** Inject the tokens as CSS variables + a minimal reset. Idempotent. */
export function injectTheme(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('artinos-theme')) return;
  const vars = Object.entries(THEME)
    .map(([k, v]) => `--${k}: ${v};`)
    .join('\n  ');
  const style = document.createElement('style');
  style.id = 'artinos-theme';
  style.textContent = `:root {\n  ${vars}\n}
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; margin: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font: 13px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }`;
  document.head.appendChild(style);
}
