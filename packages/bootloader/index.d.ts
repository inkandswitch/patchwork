declare module "virtual:patchwork/setup" {
  import type { Repo } from "@automerge/vanillajs";
  import { initializeKeyhive } from "@patchwork/identity";
  var bootstrap: () => Promise<
    [Repo, ReturnType<typeof initializeKeyhive> | undefined]
  >;
  export default bootstrap;
}
