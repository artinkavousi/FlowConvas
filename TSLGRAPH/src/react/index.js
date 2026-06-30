import React from 'react';
import { resolveTSLGraphEditorUrl } from '../browser/index.js';

export function TSLGraphFrame( {
	baseUrl,
	graphs = 'material',
	targetOrigin = '*',
	params,
	title = 'TSL Graph Editor',
	allow = 'clipboard-read; clipboard-write',
	style,
	...props
} ) {

	return React.createElement( 'iframe', {
		title,
		allow,
		src: resolveTSLGraphEditorUrl( { baseUrl, graphs, targetOrigin, params } ),
		style: {
			width: '100%',
			height: '100%',
			border: 0,
			...style
		},
		...props
	} );

}
