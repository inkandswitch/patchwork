/**
 * Node.js Ed25519 signer with file-based persistence.
 *
 * Uses Node.js crypto.subtle (available in Node 18+) for Ed25519 signing,
 * with the signing key persisted to a JSON file on disk.
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

// Import PeerId type from subduction module (will be set at runtime)
type PeerIdType = { new (bytes: Uint8Array): any };
let PeerId: PeerIdType | null = null;

export function setPeerIdConstructor(ctor: PeerIdType): void {
  PeerId = ctor;
}

interface StoredKey {
  privateKeyJwk: crypto.JsonWebKey;
  publicKeyBytes: number[];
}

const KEY_FILENAME = "signing-key.json";

/**
 * Ed25519 signer that stores keys in a JSON file.
 *
 * Implements the signer interface expected by Subduction:
 * - peerId(): PeerId
 * - sign(message: Uint8Array): Promise<Uint8Array>
 * - verifyingKey(): Uint8Array
 */
export class NodeFSSigner {
  #privateKey: crypto.webcrypto.CryptoKey;
  #publicKeyBytes: Uint8Array;

  private constructor(
    privateKey: crypto.webcrypto.CryptoKey,
    publicKeyBytes: Uint8Array
  ) {
    this.#privateKey = privateKey;
    this.#publicKeyBytes = publicKeyBytes;
  }

  /**
   * Set up the signer, loading an existing key from disk or generating a new one.
   */
  static async setup(storageDir: string): Promise<NodeFSSigner> {
    const keyPath = path.join(storageDir, KEY_FILENAME);

    // Ensure storage directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    if (fs.existsSync(keyPath)) {
      // Load existing key
      const stored: StoredKey = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      const privateKey = await crypto.subtle.importKey(
        "jwk",
        stored.privateKeyJwk,
        { name: "Ed25519" },
        false,
        ["sign"]
      );
      const publicKeyBytes = new Uint8Array(stored.publicKeyBytes);
      return new NodeFSSigner(privateKey, publicKeyBytes);
    }

    // Generate new key pair
    const keyPair = (await crypto.subtle.generateKey("Ed25519", true, [
      "sign",
      "verify",
    ])) as crypto.webcrypto.CryptoKeyPair;

    // Export private key as JWK for storage
    const privateKeyJwk = (await crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey
    )) as crypto.JsonWebKey;

    // Export public key as raw bytes
    const publicKeyRaw = await crypto.subtle.exportKey(
      "raw",
      keyPair.publicKey
    );
    const publicKeyBytes = new Uint8Array(publicKeyRaw);

    // Persist to disk
    const stored: StoredKey = {
      privateKeyJwk,
      publicKeyBytes: Array.from(publicKeyBytes),
    };
    fs.writeFileSync(keyPath, JSON.stringify(stored, null, 2));

    // Re-import private key as non-extractable for security
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      privateKeyJwk,
      { name: "Ed25519" },
      false,
      ["sign"]
    );

    return new NodeFSSigner(privateKey, publicKeyBytes);
  }

  /**
   * Get the peer ID derived from this signer's verifying key.
   */
  peerId(): any {
    if (!PeerId) {
      throw new Error(
        "PeerId constructor not set. Call setPeerIdConstructor() first."
      );
    }
    return new PeerId(this.#publicKeyBytes);
  }

  /**
   * Sign a message and return the 64-byte Ed25519 signature.
   */
  async sign(message: Uint8Array): Promise<Uint8Array> {
    const signature = await crypto.subtle.sign(
      "Ed25519",
      this.#privateKey,
      message
    );
    return new Uint8Array(signature);
  }

  /**
   * Get the 32-byte Ed25519 verifying (public) key.
   */
  verifyingKey(): Uint8Array {
    return this.#publicKeyBytes;
  }
}
