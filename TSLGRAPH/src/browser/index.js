const DEFAULT_EDITOR_ORIGIN = 'http://127.0.0.1:4177/';
const HOST_SOURCE = 'tsl-graph-host';
const EDITOR_SOURCE = 'tsl-graph-editor';

const RESPONSE_BY_COMMAND = {
	'tsl:command:get-code': 'tsl:response:get-code',
	'tsl:command:set-root-material': 'tsl:response:set-root-material',
	'tsl:command:get-graph': 'tsl:response:get-graph',
	'tsl:command:load': 'tsl:response:load',
	'tsl:command:clear-graph': 'tsl:response:clear-graph'
};

export function resolveTSLGraphEditorUrl( options = {} ) {

	const {
		baseUrl = DEFAULT_EDITOR_ORIGIN,
		graphs = 'material',
		targetOrigin = '*',
		params = {}
	} = options;

	const url = new URL( baseUrl, globalThis.location?.origin || DEFAULT_EDITOR_ORIGIN );
	url.searchParams.set( 'graphs', graphs );
	url.searchParams.set( 'targetOrigin', targetOrigin );

	for ( const [ key, value ] of Object.entries( params ) ) {

		if ( value !== undefined && value !== null ) url.searchParams.set( key, String( value ) );

	}

	return url.toString();

}

export function createTSLGraphIframe( options = {} ) {

	const {
		container,
		className = 'tslgraph-editor-frame',
		style = {},
		allow = 'clipboard-read; clipboard-write',
		title = 'TSL Graph Editor'
	} = options;

	const iframe = document.createElement( 'iframe' );
	iframe.title = title;
	iframe.className = className;
	iframe.src = resolveTSLGraphEditorUrl( options );
	iframe.allow = allow;
	iframe.style.width = '100%';
	iframe.style.height = '100%';
	iframe.style.border = '0';

	Object.assign( iframe.style, style );

	if ( container ) container.appendChild( iframe );

	return iframe;

}

export function createTSLGraphClient( iframe, options = {} ) {

	const editorOrigin = options.editorOrigin || new URL( iframe.src ).origin;
	const timeoutMs = options.timeoutMs ?? 10000;
	const pending = new Map();
	const listeners = new Map();
	let ready = false;
	let requestIndex = 0;
	let resolveReady;

	const readyPromise = new Promise( ( resolve ) => {

		resolveReady = resolve;

	} );

	function emit( type, payload ) {

		const set = listeners.get( type );
		if ( set ) {

			for ( const listener of set ) listener( payload );

		}

	}

	function onMessage( event ) {

		if ( event.origin !== editorOrigin ) return;

		const message = event.data;
		if ( ! message || message.source !== EDITOR_SOURCE || typeof message.type !== 'string' ) return;

		if ( message.type.startsWith( 'tsl:response:' ) ) {

			const waiter = pending.get( message.requestId );
			if ( ! waiter ) return;

			pending.delete( message.requestId );
			clearTimeout( waiter.timer );
			if ( message.error ) waiter.reject( new Error( message.error ) );
			else waiter.resolve( message.payload );

			return;

		}

		if ( message.type.startsWith( 'tsl:event:' ) ) {

			const type = message.type.slice( 'tsl:event:'.length );
			if ( type === 'ready' && ! ready ) {

				ready = true;
				resolveReady();

			}

			emit( type, message.payload );

		}

	}

	window.addEventListener( 'message', onMessage );

	return {
		iframe,
		get ready() {

			return ready;

		},
		whenReady() {

			return readyPromise;

		},
		on( type, listener ) {

			if ( ! listeners.has( type ) ) listeners.set( type, new Set() );
			listeners.get( type ).add( listener );
			return () => listeners.get( type )?.delete( listener );

		},
		async command( type, payload ) {

			const commandType = `tsl:command:${ type }`;
			const expectedType = RESPONSE_BY_COMMAND[ commandType ];
			if ( ! expectedType ) throw new Error( `Unsupported TSL Graph command: ${ type }` );

			await readyPromise;

			const requestId = `tslgraph-${ Date.now() }-${ ++ requestIndex }`;
			const message = { source: HOST_SOURCE, type: commandType, requestId };
			if ( payload !== undefined ) message.payload = payload;

			return new Promise( ( resolve, reject ) => {

				const timer = window.setTimeout( () => {

					pending.delete( requestId );
					reject( new Error( `TSL Graph command timed out: ${ type }` ) );

				}, timeoutMs );

				pending.set( requestId, { expectedType, resolve, reject, timer } );
				iframe.contentWindow?.postMessage( message, editorOrigin );

			} );

		},
		getCode() {

			return this.command( 'get-code' );

		},
		getGraph() {

			return this.command( 'get-graph' ).then( ( payload ) => payload?.graphData );

		},
		loadGraph( graphData ) {

			return this.command( 'load', { graphData } );

		},
		clearGraph() {

			return this.command( 'clear-graph' );

		},
		setRootMaterial( materialType ) {

			return this.command( 'set-root-material', { materialType } );

		},
		dispose() {

			window.removeEventListener( 'message', onMessage );
			for ( const waiter of pending.values() ) clearTimeout( waiter.timer );
			pending.clear();
			listeners.clear();

		}
	};

}

export function mountTSLGraphEditor( options = {} ) {

	const iframe = createTSLGraphIframe( options );
	return createTSLGraphClient( iframe, options );

}

export const TSLGRAPH_DEFAULT_EDITOR_ORIGIN = DEFAULT_EDITOR_ORIGIN;
export const TSLGRAPH_PROTOCOL = {
	HOST_SOURCE,
	EDITOR_SOURCE,
	RESPONSE_BY_COMMAND
};
