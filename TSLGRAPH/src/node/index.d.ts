import type { IncomingMessage, Server, ServerResponse } from 'node:http';

export declare const tslGraphPackageRoot: string;
export declare const tslGraphStaticRoot: string;
export declare const tslGraphExampleRoot: string;

export type TSLGraphStaticHandlerOptions = {
  root?: string;
  exampleRoot?: string;
  cacheControl?: string;
};

export type TSLGraphServerOptions = {
  host?: string;
  port?: number;
  root?: string;
  exampleRoot?: string;
};

export type TSLGraphServerHandle = {
  server: Server;
  host: string;
  port: number;
  origin: string;
  editorUrl: string;
  demoUrl: string;
  root: string;
  exampleRoot: string;
  rootUrl: string;
};

export declare function createTSLGraphStaticHandler(options?: TSLGraphStaticHandlerOptions): (request: IncomingMessage, response: ServerResponse) => void;
export declare function createTSLGraphEditorServer(options?: TSLGraphStaticHandlerOptions): Server;
export declare function startTSLGraphEditorServer(options?: TSLGraphServerOptions): Promise<TSLGraphServerHandle>;
