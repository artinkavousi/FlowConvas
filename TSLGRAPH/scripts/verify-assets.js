import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tslGraphStaticRoot } from '../src/node.js';

const chunkPattern = /(?:\/_next\/|static\/)chunks\/([A-Za-z0-9_.-]+\.(?:js|css))/g;
const filesToScan = [
	join( tslGraphStaticRoot, 'index.html' ),
	join( tslGraphStaticRoot, '_next', 'static', 'chunks', 'acf504f0cb50aa51.js' )
];

const referenced = new Set();

for ( const file of filesToScan ) {

	const text = readFileSync( file, 'utf8' );
	for ( const match of text.matchAll( chunkPattern ) ) referenced.add( match[ 1 ] );

}

const missing = [ ...referenced ].filter( ( file ) => ! existsSync( join( tslGraphStaticRoot, '_next', 'static', 'chunks', file ) ) );

if ( missing.length > 0 ) {

	console.error( `Missing ${ missing.length } TSL Graph chunk(s):` );
	for ( const file of missing ) console.error( `- ${ file }` );
	process.exit( 1 );

}

console.log( `TSL Graph asset check passed: ${ referenced.size } referenced chunks present.` );
