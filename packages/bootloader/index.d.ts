// these are the types for the file at ./template/client/setup.ts
// todo generate this at build time with correct type instead of array with `|undefined`?
declare module "virtual:patchwork/setup" {
  import type { Repo } from "@automerge/vanillajs";
  import type { initializeKeyhive } from "@automerge/automerge-repo-keyhive";
  export type AutomergeRepoKeyhive = Awaited<
    ReturnType<typeof initializeKeyhive>
  >;
  var bootstrap: () => Promise<{
    repo: Repo;
    hive?: AutomergeRepoKeyhive;
  }>;
  export default bootstrap;
}
