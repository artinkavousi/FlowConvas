import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const tslGraphPackageRoot = fileURLToPath( new URL( '../../', import.meta.url ) );
export const tslGraphStaticRoot = fileURLToPath( new URL( '../../static/', import.meta.url ) );
export const tslGraphExampleRoot = fileURLToPath( new URL( '../../examples/vanilla/', import.meta.url ) );

const MIME_TYPES = new Map( [
	[ '.html', 'text/html; charset=utf-8' ],
	[ '.js', 'text/javascript; charset=utf-8' ],
	[ '.mjs', 'text/javascript; charset=utf-8' ],
	[ '.css', 'text/css; charset=utf-8' ],
	[ '.json', 'application/json; charset=utf-8' ],
	[ '.ico', 'image/x-icon' ],
	[ '.svg', 'image/svg+xml' ],
	[ '.png', 'image/png' ],
	[ '.jpg', 'image/jpeg' ],
	[ '.jpeg', 'image/jpeg' ],
	[ '.webp', 'image/webp' ],
	[ '.woff2', 'font/woff2' ],
	[ '.wasm', 'application/wasm' ]
] );

const BROWSER_SAFETY_SHIM = `<script>(()=>{const ignored="Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'";window.addEventListener("error",e=>{if(String(e.message||"").includes(ignored)){e.preventDefault();e.stopImmediatePropagation()}},true);window.addEventListener("unhandledrejection",e=>{if(String(e.reason?.message||e.reason||"").includes(ignored)){e.preventDefault();e.stopImmediatePropagation()}},true);const proto=window.MutationObserver&&window.MutationObserver.prototype;if(!proto||proto.__tslgraphPatched)return;const observe=proto.observe;proto.observe=function(target,options){if(!(target instanceof Node))return;return observe.call(this,target,options)};proto.__tslgraphPatched=true;})();</script>`;

function normalizeRequestPath( requestPath ) {

	const pathname = decodeURIComponent( requestPath.split( '?' )[ 0 ] || '/' );
	return pathname.endsWith( '/' ) ? `${ pathname }index.html` : pathname;

}

function resolveInside( root, requestPath ) {

	const target = resolve( root, `.${ normalize( requestPath ) }` );
	const rel = relative( root, target );

	if ( rel.startsWith( '..' ) || rel.includes( `..${ sep }` ) || rel === '..' ) return null;

	return target;

}

function sendFile( response, target, cacheControl ) {

	const extension = extname( target ).toLowerCase();

	if ( extension === '.html' ) {

		const html = readFileSync( target, 'utf8' );
		const patchedHtml = html.includes( BROWSER_SAFETY_SHIM ) ? html : html.replace( '<head>', `<head>${ BROWSER_SAFETY_SHIM }` );

		response.writeHead( 200, {
			'content-type': MIME_TYPES.get( extension ),
			'cache-control': cacheControl,
			'access-control-allow-origin': '*',
			'cross-origin-resource-policy': 'cross-origin'
		} );
		response.end( patchedHtml );
		return;

	}

	response.writeHead( 200, {
		'content-type': MIME_TYPES.get( extension ) || 'application/octet-stream',
		'cache-control': cacheControl,
		'access-control-allow-origin': '*',
		'cross-origin-resource-policy': 'cross-origin'
	} );

	createReadStream( target ).pipe( response );

}

function sendNotFound( response ) {

	response.writeHead( 404, {
		'content-type': 'text/plain; charset=utf-8',
		'access-control-allow-origin': '*'
	} );
	response.end( 'Not found' );

}

export function createTSLGraphStaticHandler( options = {} ) {

	const root = resolve( options.root || tslGraphStaticRoot );
	const exampleRoot = resolve( options.exampleRoot || tslGraphExampleRoot );
	const cacheControl = options.cacheControl || 'no-store';

	return function handleTSLGraphRequest( request, response ) {

		const url = new URL( request.url || '/', 'http://127.0.0.1' );
		const pathname = url.pathname;

		if ( pathname === '/demo' || pathname.startsWith( '/demo/' ) ) {

			const demoPath = pathname === '/demo' ? '/index.html' : normalizeRequestPath( pathname.slice( '/demo'.length ) );
			const demoTarget = resolveInside( exampleRoot, demoPath );

			if ( demoTarget && existsSync( demoTarget ) && statSync( demoTarget ).isFile() ) {

				sendFile( response, demoTarget, cacheControl );
				return;

			}

			sendNotFound( response );
			return;

		}

		if ( pathname.startsWith( '/src/' ) ) {

			const sourceTarget = resolveInside( tslGraphPackageRoot, normalizeRequestPath( pathname ) );

			if ( sourceTarget && existsSync( sourceTarget ) && statSync( sourceTarget ).isFile() ) {

				sendFile( response, sourceTarget, cacheControl );
				return;

			}

			sendNotFound( response );
			return;

		}

		const staticPath = pathname === '/' || pathname === '/editor/standalone' || pathname === '/editor/standalone/' || pathname === '/tsl-graph-editor'
			? '/index.html'
			: normalizeRequestPath( pathname );

		const target = resolveInside( root, staticPath );

		if ( ! target || ! existsSync( target ) || ! statSync( target ).isFile() ) {

			sendNotFound( response );
			return;

		}

		sendFile( response, target, cacheControl );

	};

}

export function createTSLGraphEditorServer( options = {} ) {

	return createServer( createTSLGraphStaticHandler( options ) );

}

export function startTSLGraphEditorServer( options = {} ) {

	const {
		host = '127.0.0.1',
		port = 4177,
		root = tslGraphStaticRoot,
		exampleRoot = tslGraphExampleRoot
	} = options;

	const server = createTSLGraphEditorServer( { root, exampleRoot } );

	return new Promise( ( resolveServer, rejectServer ) => {

		server.once( 'error', rejectServer );
		server.listen( port, host, () => {

			server.off( 'error', rejectServer );
			resolveServer( {
				server,
				host,
				port,
				origin: `http://${ host }:${ port }/`,
				editorUrl: `http://${ host }:${ port }/?graphs=material&targetOrigin=*`,
				demoUrl: `http://${ host }:${ port }/demo/`,
				root,
				exampleRoot,
				rootUrl: pathToFileURL( join( root, 'index.html' ) ).toString()
			} );

		} );

	} );

}
