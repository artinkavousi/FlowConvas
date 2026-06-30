import type { CSSProperties, IframeHTMLAttributes } from 'react';
import type { TSLGraphEditorUrlOptions } from '../browser/index.js';

export type TSLGraphFrameProps = Omit<IframeHTMLAttributes<HTMLIFrameElement>, 'src'> & TSLGraphEditorUrlOptions & {
  style?: CSSProperties;
};

export declare function TSLGraphFrame(props: TSLGraphFrameProps): JSX.Element;
