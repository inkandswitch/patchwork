export interface HandoffRequest {
  url: string;
  headers: Record<string, string>;
  method: string;
  destination: RequestDestination;
  referrer: string;
}

export interface HandoffResponse {
  body?: string | Uint8Array<ArrayBuffer> | ReadableStream;
  /** defaults to 200 */
  status?: number;
  headers?: [string, string][] | Record<string, string>;
  cache?: boolean;
}

export interface HandoffRequestMessage {
  id: number;
  type: "request";
  /** the current name of the service worker cache */
  cachename: string;
  request: HandoffRequest;
}

export interface HandoffResponseMessage {
  id: number;
  type: "response";
  response: HandoffResponse;
}

export type HandoffHandler = (
  href: string,
  request: HandoffRequest
) => Promise<HandoffResponse | void | string | Uint8Array<ArrayBuffer>>;

export type SetupServiceWorkerOptions = {
  /**
   * The public path to the service worker file.
   * Defaults to `/service-worker.js`
   */
  path?: string;
};
