import { Keyhive } from "@keyhive/keyhive/slim";
import { AutomergeUrl } from "@automerge/automerge-repo/slim";
import {
  Active,
  KeyhiveEventEmitter,
  SyncServer,
} from "@automerge/automerge-repo-keyhive";

export type KeyhiveKit = {
  active: Active;
  keyhive: Keyhive;
  syncServer: SyncServer;
  accountUrl: AutomergeUrl;
  emitter: KeyhiveEventEmitter;
};
