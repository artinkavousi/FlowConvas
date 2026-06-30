import assert from 'node:assert/strict';
import { createTSLGraphIframe, mountTSLGraphEditor, resolveTSLGraphEditorUrl } from '../src/browser/index.js';
import { createTSLGraphEditorServer, createTSLGraphStaticHandler, tslGraphStaticRoot } from '../src/node/index.js';

assert.equal( resolveTSLGraphEditorUrl( { baseUrl: 'http://127.0.0.1:4177/' } ), 'http://127.0.0.1:4177/?graphs=material&targetOrigin=*' );
assert.equal( typeof createTSLGraphIframe, 'function' );
assert.equal( typeof mountTSLGraphEditor, 'function' );
assert.equal( typeof createTSLGraphStaticHandler, 'function' );
assert.equal( typeof createTSLGraphEditorServer, 'function' );
assert.ok( tslGraphStaticRoot.includes( 'TSLGRAPH' ) );

console.log( 'TSL Graph package API check passed.' );
