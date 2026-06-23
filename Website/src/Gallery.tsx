/**
 * Gallery.tsx — the public ARTINOS module gallery (read-only, copy-first).
 */

import { useMemo, useState } from 'react';
import { MODULES, CATEGORIES, type ModuleCard } from './registry';

export default function Gallery() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MODULES.filter((m) => {
      if (category && m.category !== category) return false;
      if (q) {
        const hay = [m.name, m.description, m.category, ...m.tags].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, category]);

  return (
    <div className="page">
      <header className="hero">
        <div className="brand">
          <span className="logo" />
          <h1>ARTINOS</h1>
          <span className="kicker">Module Library</span>
        </div>
        <p className="tagline">
          A growing, owned library of reusable creative modules — UI, 3D, shaders, particles, and
          post-processing. Copy-paste source, no lock-in.
        </p>
        <div className="controls">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules…"
            className="search"
          />
          <div className="chips">
            <button className={`chip ${category === null ? 'on' : ''}`} onClick={() => setCategory(null)}>
              All
            </button>
            {CATEGORIES.map((c) => (
              <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="stat">{MODULES.length} modules · {CATEGORIES.length} categories</div>
      </header>

      <main className="grid">
        {results.map((m) => (
          <Card key={m.id} module={m} />
        ))}
        {results.length === 0 && <div className="empty">No modules match your search.</div>}
      </main>

      <footer className="foot">ARTINOS · local-first creative module studio</footer>
    </div>
  );
}

function Card({ module: m }: { module: ModuleCard }) {
  const [copied, setCopied] = useState(false);
  return (
    <article className="card">
      <div className="card-head">
        <h2>{m.name}</h2>
        <span className="badge">{m.category}</span>
      </div>
      <p className="desc">{m.description}</p>
      <div className="tags">
        {m.tags.slice(0, 6).map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>
      <pre className="usage">{m.usage}</pre>
      <div className="card-foot">
        <span className="deps">{m.dependencies.join(' · ')}</span>
        <button
          className="copy"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(m.usage);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            } catch {
              /* clipboard may be blocked */
            }
          }}
        >
          {copied ? 'Copied' : 'Copy usage'}
        </button>
      </div>
    </article>
  );
}
