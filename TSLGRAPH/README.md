# TSLGRAPH

Reusable local package for running the TSL Graph editor as a self-contained tool.

## Structure

```txt
TSLGRAPH/
  static/             vendored standalone editor runtime
  src/browser/        iframe URL helpers and postMessage client
  src/node/           static handler and local server helpers
  src/react/          optional React iframe component
  three-inspector/    Three.js inspector extension bridge
  examples/vanilla/   package dev/example project
  bin/serve.js        CLI server
```

The editor runtime is a static snapshot, but the integration layer is normal reusable package code.

## Develop

```bash
npm run dev -w TSLGRAPH
```

Open:

```txt
http://127.0.0.1:4177/?graphs=material&targetOrigin=*
http://127.0.0.1:4177/demo/
```

## Browser Embed

```js
import { mountTSLGraphEditor } from '@artinos/tslgraph-editor/browser';

const graph = mountTSLGraphEditor({
  container: document.querySelector('#graph'),
  baseUrl: 'http://127.0.0.1:4177/',
  graphs: 'material',
  targetOrigin: '*'
});

await graph.whenReady();
const code = await graph.getCode();
```

## Three Inspector Integration

```js
import { TSLGraphEditor } from '@artinos/tslgraph-editor/three-inspector';

const graph = new TSLGraphEditor({
  editorUrl: 'http://127.0.0.1:4177/'
});
```

## Node Server Integration

```js
import { createTSLGraphStaticHandler } from '@artinos/tslgraph-editor/node';

const handler = createTSLGraphStaticHandler();
```

For host apps, the safest integration is to run this editor on its own local origin and iframe it. The captured Next/Turbopack runtime expects root-level `/_next/...` assets.

## Verify

```bash
npm run verify -w TSLGRAPH
npm run pack:dry -w TSLGRAPH
```

The editor app is a static snapshot. Refresh `static/` from the upstream standalone editor when you intentionally want upstream changes.
