// these are the types for the file at ./template/client/setup.ts
// todo generate this at build time with correct type instead of array with `|undefined`?
declare module "virtual:patchwork/setup" {
  import type { Repo } from "@automerge/vanillajs";
  import { type KeyhiveKit } from "@patchwork/identity";
  var bootstrap: () => Promise<{
    repo: Repo;
    active?: Active;
    keyhive?: Keyhive;
    syncServer?: SyncServer;
    accountUrl?: AutomergeUrl;
  }>;
  export default bootstrap;
}
