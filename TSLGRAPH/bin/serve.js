#!/usr/bin/env node
import { startTSLGraphEditorServer } from '../src/node.js';

function readArg( name, fallback ) {

	const index = process.argv.indexOf( `--${ name }` );
	if ( index === - 1 ) return fallback;

	return process.argv[ index + 1 ] || fallback;

}

const host = readArg( 'host', '127.0.0.1' );
const port = Number( readArg( 'port', process.env.PORT || '4177' ) );

const handle = await startTSLGraphEditorServer( { host, port } );

console.log( `TSL Graph editor serving ${ handle.root }` );
console.log( `Editor: ${ handle.editorUrl }` );
console.log( `Demo:   ${ handle.demoUrl }` );
