import fs from "fs";
import path from "path";

export async function pull({ repo, dir, automergeDocUrl }) {
  let handle = repo.find(automergeDocUrl);
  const doc = await handle.doc();

  if (!doc) { 
    console.error(`Could not find ${automergeDocUrl}: ${handle.state}`);
    process.exit(1);
  }

  const recurseTree = (node, prefix) => {
    if (node.contents) {
      writeFile(node, prefix);
    } else {
      Object.entries(node).forEach(([name, node]) => {
        recurseTree(node, `${prefix}/${name}`);
      });
    }
  };

  function writeFile(node, prefix) {
    console.log(`writing ${prefix}`);
    const filePath = `${prefix}`;
    const fileContents = node.contents;

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, fileContents);
  }

  const { fileContents, ...packageJson } = doc;

  recurseTree(fileContents, dir);
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(packageJson));
}
