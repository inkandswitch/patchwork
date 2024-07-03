import fs from "fs";
import path from "path";
import { CommandLineArgs } from ".";
import { Repo } from "@automerge/automerge-repo";
import { FolderDoc } from "@/packages/folder";
import { FileDoc } from "../../packages/file/src/datatype";

export async function pull(
  repo: Repo,
  { automergeDocUrl, dir }: CommandLineArgs
) {
  let handle = repo.find<FolderDoc>(automergeDocUrl);
  const doc = await handle.doc();

  if (!doc) {
    console.error(`Could not find ${automergeDocUrl}: ${handle.state}`);
    process.exit(1);
  }

  // todo: handle nested folders
  await Promise.all(
    doc.docs.map(async (docLink) => {
      const handle = repo.find<FileDoc>(docLink.url);
      const fileDoc = await handle.doc();

      // todo: handle other docs that are not files
      if (docLink.type !== "file") {
        console.log(`skip ${docLink.name}`);
        return;
      }

      fs.writeFileSync(path.join(dir, fileDoc.name), fileDoc.content);
    })
  );
}
