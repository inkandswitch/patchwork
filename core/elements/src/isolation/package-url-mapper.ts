/**
 * Maps between automerge document IDs in URLs and opaque package names.
 *
 * Tool code inside the iframe sees `pkg:@patchwork--codemirror-base/dist/index.js`
 * instead of real automerge URLs. This:
 *  - Prevents automerge document IDs from leaking to untrusted code
 *  - Provides a hierarchical URL scheme for relative import resolution
 *  - Makes fetch proxy rules simple: only `pkg:` URLs get proxied
 *
 * Ported from `grjte/isolated-view` branch.
 */

import { isValidAutomergeUrl } from "@automerge/automerge-repo";

export class PackageUrlMapper {
  #counter = 0;
  #segmentToPackage = new Map<string, string>();
  #packageToSegment = new Map<string, string>();

  /**
   * Sanitize a package name for use as a URL path segment.
   * "@patchwork/folder" -> "@patchwork--folder"
   */
  #sanitizeName(name: string): string {
    return name.replace(/\//g, "--");
  }

  /**
   * Replace the automerge URL segment in a full URL with a package name.
   * If the segment hasn't been seen before, registers a new mapping.
   * Returns the URL unchanged if no automerge segment is found.
   */
  toPackageUrl(url: string, name?: string): string {
    for (const [segment, pkg] of this.#segmentToPackage) {
      const from = `/${segment}/`;
      if (url.includes(from)) {
        return url.replace(from, `/pkg:${pkg}/`);
      }
    }
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split("/").filter(Boolean);
      for (const segment of segments) {
        const decoded = decodeURIComponent(segment);
        if (isValidAutomergeUrl(decoded)) {
          const pkg = name
            ? this.#sanitizeName(name)
            : `unknown-${this.#counter++}`;
          this.#segmentToPackage.set(segment, pkg);
          this.#packageToSegment.set(pkg, segment);
          return url.replace(`/${segment}/`, `/pkg:${pkg}/`);
        }
      }
    } catch {
      // not a valid URL, return as-is
    }
    return url;
  }

  /**
   * Replace the package name in a URL with the real automerge URL segment.
   * Returns null if no package name segment is found.
   */
  toAutomergeUrl(url: string): string | null {
    for (const [pkg, segment] of this.#packageToSegment) {
      const packageSegment = `pkg:${pkg}/`;
      if (url.includes(packageSegment)) {
        return url.replace(packageSegment, `${segment}/`);
      }
    }
    return null;
  }
}
