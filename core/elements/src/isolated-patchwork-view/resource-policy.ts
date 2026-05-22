/**
 * Resource policy interface for controlling which URLs a tool can
 * fetch/load through the capnweb RPC channel.
 */

/** Policy that gates HostApi.loadModuleSource() and HostApi.fetchResource(). */
export interface ResourcePolicy {
  /** Can this tool fetch/load this URL? */
  canFetch(url: string): boolean;
}

/** Allows all requests. Default until per-tool policies are configured. */
export class AllowAllPolicy implements ResourcePolicy {
  canFetch(): boolean {
    return true;
  }
}
