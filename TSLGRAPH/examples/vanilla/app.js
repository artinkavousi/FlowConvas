import { mountTSLGraphEditor } from '/src/browser/index.js';

const status = document.querySelector( '#status' );
const graph = mountTSLGraphEditor( {
	container: document.querySelector( '#editor' ),
	baseUrl: '/',
	graphs: 'material',
	targetOrigin: '*'
} );

graph.whenReady().then( () => {

	status.textContent = 'Editor ready';

} );

graph.on( 'graph-changed', () => {

	status.textContent = `Graph changed ${ new Date().toLocaleTimeString() }`;

} );

document.querySelector( '#clear' ).addEventListener( 'click', async () => {

	await graph.clearGraph();
	status.textContent = 'Graph cleared';

} );

document.querySelector( '#code' ).addEventListener( 'click', async () => {

	const code = await graph.getCode();
	const materialCount = Object.keys( code?.materials || {} ).length;
	status.textContent = `Code payload ready (${ materialCount } material entries)`;

} );
