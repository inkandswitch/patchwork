import { Keyhive } from "@keyhive/keyhive/slim";
import { AutomergeUrl } from "@automerge/automerge-repo/slim";
import {
  Active,
  SyncServer,
} from "@automerge/automerge-keyhive-network-adapter";

export type KeyhiveKit = {
  active: Active;
  keyhive: Keyhive;
  syncServer: SyncServer;
  accountUrl: AutomergeUrl;
};
