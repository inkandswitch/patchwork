#!/usr/bin/env node

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import prompts from "prompts";
import yargsParser from "yargs-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

async function getInputsInteractively(counterPackageJson) {
  const response = await prompts([
    {
      type: "text",
      name: "humanName",
      message: 'Human readable name (e.g. "Counter")',
      initial: "Counter",
    },
    {
      type: "text",
      name: "machineName",
      message: 'Machine readable name (e.g. "counter")',
      initial: (prev) => prev.toLowerCase().replace(/\s+/g, "-"),
    },
    {
      type: "text",
      name: "description",
      message: "Description",
      initial: counterPackageJson.description,
    },
  ]);

  return response;
}

function printHelp() {
  console.log(`
Usage: pnpm make-tool [options]

Options:
  --name         Human readable name (e.g. "Counter")
  --id          Machine readable name (e.g. "counter")
  --description  Tool description
  -h, --help     Show this help message

Examples:
  pnpm make-tool --name "Todo List" --description "A simple todo list tool"
  pnpm make-tool --name "Todo List" --id "todos" --description "A simple todo list tool"
  `);
}

async function main() {
  const argv = yargsParser(process.argv.slice(2), {
    string: ["name", "id", "description"],
    alias: {
      h: "help",
    },
  });

  if (argv.help) {
    printHelp();
    process.exit(0);
  }

  // Show examples from counter
  const counterPackageJson = JSON.parse(
    fs.readFileSync(
      path.join(ROOT_DIR, "packages/counter/package.json"),
      "utf-8"
    )
  );

  let humanName, machineName, description;

  // If all arguments are provided via CLI, use those
  if (argv.name) {
    humanName = argv.name;
    machineName = argv.id || humanName.toLowerCase().replace(/\s+/g, "-");
    description = argv.description || counterPackageJson.description;
  } else {
    // Otherwise, fall back to interactive mode
    const response = await getInputsInteractively(counterPackageJson);
    ({ humanName, machineName, description } = response);
  }

  if (!humanName) {
    console.error("Tool name is required");
    process.exit(1);
  }

  // Create new directory
  const newDir = path.join(ROOT_DIR, "packages", machineName);

  // Copy counter directory
  console.log(`Creating new tool in ${newDir}...`);
  fs.cpSync(path.join(ROOT_DIR, "packages/counter"), newDir, {
    recursive: true,
  });

  // Remove jacquard.json if it exists
  const jacquardPath = path.join(newDir, "jacquard.json");
  if (fs.existsSync(jacquardPath)) {
    fs.unlinkSync(jacquardPath);
  }

  // Update package.json
  const packageJsonPath = path.join(newDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  packageJson.name = `@patchwork/${machineName}`;
  packageJson.description = description;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Update index.ts
  const indexPath = path.join(newDir, "src/index.ts");
  let indexContent = fs.readFileSync(indexPath, "utf-8");

  indexContent = indexContent
    .replace(/id: "counter"/g, `id: "${machineName}"`)
    .replace(/name: "Counter"/g, `name: "${humanName}"`)
    .replace(
      /supportedDataTypes: \["counter"\]/g,
      `supportedDataTypes: ["${machineName}"]`
    );

  fs.writeFileSync(indexPath, indexContent);

  // Update datatype.ts references if they exist
  const datatypePath = path.join(newDir, "src/datatype.ts");
  if (fs.existsSync(datatypePath)) {
    let datatypeContent = fs.readFileSync(datatypePath, "utf-8");
    datatypeContent = datatypeContent
      .replace(/id: "counter"/g, `id: "${machineName}"`)
      .replace(/name: "Counter"/g, `name: "${humanName}"`);
    fs.writeFileSync(datatypePath, datatypeContent);
  }

  console.log(`
✨ Created new tool "${humanName}"!
Location: packages/${machineName}

Next steps:
1. cd packages/${machineName}
2. pnpm install (install dependencies)
3. pnpm push (push to Jacquard)
4. jacquard install --moduleUrl <your-automerge-url> (install to Patchwork)
5. Start customizing your tool!
`);
}

main().catch(console.error);
