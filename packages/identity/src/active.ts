import type {
  PeerId,
  StorageAdapterInterface,
} from "@automerge/automerge-repo";
import { Individual, Keyhive, Signer } from "@keyhive/keyhive/slim";
import { peerIdFromSigner } from "@automerge/automerge-keyhive-network-adapter";

const ACTIVE_DB_KEY: string = "active-key-pair-2";

async function serializeKeyPair(keyPair: CryptoKeyPair): Promise<Uint8Array> {
  const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const stringified = JSON.stringify({ publicKey, privateKey });
  return new TextEncoder().encode(stringified);
}

async function deserializeKeyPair(bytes: Uint8Array): Promise<CryptoKeyPair> {
  const decoded = new TextDecoder().decode(bytes);
  const { publicKey: publicKeyStr, privateKey: privateKeyStr } =
    JSON.parse(decoded);
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    publicKeyStr,
    "Ed25519",
    true,
    publicKeyStr.key_ops
  );
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateKeyStr,
    "Ed25519",
    true,
    privateKeyStr.key_ops
  );
  return { publicKey, privateKey };
}

export type Active = {
  keyPair: CryptoKeyPair;
  peerId: PeerId;
  individual: Individual;
  contactCard: string;
  signer: Signer;
};

export async function loadOrCreateSigner(db: StorageAdapterInterface): Promise<{
  keyPair: CryptoKeyPair;
  signer: Signer;
}> {
  let keyPair: CryptoKeyPair;
  let signer: Signer;

  const maybeKeyPairBytes = await db.load([ACTIVE_DB_KEY]);
  if (maybeKeyPairBytes) {
    keyPair = await deserializeKeyPair(maybeKeyPairBytes);
    signer = await Signer.webCryptoSigner(keyPair);
  } else {
    try {
      keyPair = await crypto.subtle.generateKey(
        {
          name: "Ed25519",
        },
        true,
        ["sign", "verify"]
      );
      signer = await Signer.webCryptoSigner(keyPair);
      await storeActiveKeyPair(keyPair, db);
    } catch (error) {
      console.error("Error creating signer: ", error);
      throw error;
    }
  }
  return {
    keyPair: keyPair,
    signer: signer,
  };
}

export async function createActive(
  keyPair: CryptoKeyPair,
  signer: Signer,
  keyhive: Keyhive
): Promise<Active> {
  const contactCard = await keyhive.contactCard();
  // FIXME: We can now just get this off of Keyhive. Do we need it here anymore?
  const individual: Individual = keyhive.individual;
  const peerId = peerIdFromSigner(signer);
  return {
    keyPair: keyPair,
    peerId: peerId,
    signer: signer,
    individual: individual,
    contactCard: contactCard.toJson(),
  };
}

export async function storeActiveKeyPair(
  keyPair: CryptoKeyPair,
  db: StorageAdapterInterface
): Promise<void> {
  db.save([ACTIVE_DB_KEY], await serializeKeyPair(keyPair));
}
