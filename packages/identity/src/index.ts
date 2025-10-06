import {
  AutomergeUrl,
  PeerId,
  Repo,
  StorageAdapterInterface,
} from "@automerge/automerge-repo";
import { peerIdFromSigner } from "@automerge/automerge-keyhive-network-adapter";

import { Active, createActive, loadOrCreateSigner } from "./active";
import { loadOrCreateKeyhive } from "./keyhive";
import { Event as KeyhiveEvent, Keyhive } from "@keyhive/keyhive/slim";
import { SyncServer, syncServerFromContactCard } from "./sync-server";

export * from "./active";
export * from "./doc";
export * from "./keyhive";
export * from "./sync-server";

export async function initializeKeyhive(options: {
  storage: StorageAdapterInterface;
  peerIdSuffix: string;
  eventHandler: (event: KeyhiveEvent) => void;
}): Promise<{
  active: Active;
  keyhive: Keyhive;
  peerId: PeerId;
  syncServer: SyncServer;
}> {
  const { keyPair, signer } = await loadOrCreateSigner(options.storage);
  const keyhive = await loadOrCreateKeyhive(
    options.storage,
    signer,
    options.eventHandler
  );
  const active = await createActive(keyPair, signer, keyhive);
  const peerId = peerIdFromSigner(active.signer, options.peerIdSuffix);

  // TODO: Server contact card and PeerId are currently just hardcoded for the demo
  const serverContactCardJson =
    '{"Rotate":{"payload":{"old":[73,163,230,244,111,233,153,119,133,211,134,237,111,36,52,131,22,50,54,144,150,45,227,235,128,36,33,217,190,198,55,75],"new":[109,115,204,144,178,114,182,238,113,124,4,139,249,76,220,44,128,104,194,68,187,184,82,241,94,145,104,198,159,122,186,43]},"issuer":[215,244,30,111,15,78,235,218,7,241,63,222,141,131,33,22,234,116,180,208,97,235,210,55,202,209,170,178,98,37,223,159],"signature":[178,64,85,76,51,199,196,151,129,14,191,53,127,191,34,223,97,238,95,109,118,179,152,17,205,188,204,177,116,166,147,231,192,201,48,137,19,214,180,45,108,104,34,8,14,63,115,139,215,142,4,179,233,89,150,218,174,168,107,23,8,109,228,6]}}';
  const serverPeerId = "1/Qebw9O69oH8T/ejYMhFup0tNBh69I3ytGqsmIl358=" as PeerId;

  const syncServer = await syncServerFromContactCard(
    serverContactCardJson,
    serverPeerId,
    keyhive
  );

  return {
    active,
    keyhive,
    peerId,
    syncServer,
  };
}

export async function getOrCreateAccountUrl(options: {
  active: Active;
  storage: StorageAdapterInterface;
  repo: Repo;
}) {
  let url = localStorage.getItem("patchworkAccountUrl") as
    | AutomergeUrl
    | undefined;

  if (!url) {
    const account = options.repo.create({
      id: options.active.peerId as string,
      app: {},
      rootFolderUrl: "automerge:3BZwYTmuB9yeyb4bCJ1HwL9uzLz8",
      documents: [],
    });
    localStorage.setItem("patchworkAccountUrl", account.url);
    url = account.url;
  }

  return url;
}

// // todo return storeKeyhive() from initializeKeyhive
// export function createStoreKeyhive(
//   network: KeyhiveNetworkAdapter,
//   storage: StorageAdapterInterface
// ) {
//   return async (kh: Keyhive, shouldSync: boolean = true) => {
//     await saveKeyhiveWithHash(kh, storage);
//     if (shouldSync) {
//       network.syncKeyhive(kh);
//     }
//   };
// }
