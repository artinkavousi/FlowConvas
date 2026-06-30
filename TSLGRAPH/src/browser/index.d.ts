export type TSLGraphEditorUrlOptions = {
  baseUrl?: string;
  graphs?: string;
  targetOrigin?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
};

export type TSLGraphIframeOptions = TSLGraphEditorUrlOptions & {
  container?: HTMLElement;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  allow?: string;
  title?: string;
};

export type TSLGraphClientOptions = {
  editorOrigin?: string;
  timeoutMs?: number;
};

export type TSLGraphClient = {
  iframe: HTMLIFrameElement;
  readonly ready: boolean;
  whenReady(): Promise<void>;
  on(type: string, listener: (payload: unknown) => void): () => void;
  command(type: string, payload?: unknown): Promise<unknown>;
  getCode(): Promise<unknown>;
  getGraph(): Promise<unknown>;
  loadGraph(graphData: unknown): Promise<unknown>;
  clearGraph(): Promise<unknown>;
  setRootMaterial(materialType: string): Promise<unknown>;
  dispose(): void;
};

export declare const TSLGRAPH_DEFAULT_EDITOR_ORIGIN: string;
export declare const TSLGRAPH_PROTOCOL: {
  HOST_SOURCE: string;
  EDITOR_SOURCE: string;
  RESPONSE_BY_COMMAND: Record<string, string>;
};

export declare function resolveTSLGraphEditorUrl(options?: TSLGraphEditorUrlOptions): string;
export declare function createTSLGraphIframe(options?: TSLGraphIframeOptions): HTMLIFrameElement;
export declare function createTSLGraphClient(iframe: HTMLIFrameElement, options?: TSLGraphClientOptions): TSLGraphClient;
export declare function mountTSLGraphEditor(options?: TSLGraphIframeOptions & TSLGraphClientOptions): TSLGraphClient;
