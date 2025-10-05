declare module "virtual:patchwork/setup" {
  import type { Repo } from "@automerge/vanillajs";
  var bootstrap: () => Promise<Repo>;
  export default bootstrap;
}
