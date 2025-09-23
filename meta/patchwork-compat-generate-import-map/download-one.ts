import { downloadRecursively } from "./generate.ts";

downloadRecursively(process.argv[2], new Set(), new Set());
