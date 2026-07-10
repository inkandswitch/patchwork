// Aggregate bench-results/*.json into a per-arm comparison table.
// Usage: node bench-report.mjs [resultsDir]
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), "bench-results");

const runs = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

if (runs.length === 0) {
  console.error(`no results in ${dir} — run pnpm bench:ws first`);
  process.exit(1);
}

const percentile = (sorted, p) =>
  sorted.length === 0
    ? NaN
    : sorted[Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1))];

const fmt = (n) => (Number.isNaN(n) ? "  —" : String(Math.round(n)).padStart(5));

console.log(`\n${runs.length} run(s) in ${dir}\n`);
console.log("┌─────────┬──────┬───────┬──────────────────────────┬──────────────────────────┬──────────┐");
console.log("│ mode    │ runs │ edits │ drift ms p50/p95/p99/max │ propag ms p50/p95/p99/max│ wsEvents │");
console.log("├─────────┼──────┼───────┼──────────────────────────┼──────────────────────────┼──────────┤");

for (const mode of ["inline", "worker"]) {
  const arm = runs.filter((r) => r.mode === mode);
  if (arm.length === 0) continue;
  const pool = (key) => arm.flatMap((r) => r.raw?.[key] ?? []).sort((a, b) => a - b);
  const drift = pool("driftMs");
  const prop = pool("propagationMs");
  const edits = arm.reduce((n, r) => n + (r.edits ?? 0), 0);
  const events = arm.reduce((n, r) => n + (r.wsEvents?.count ?? 0), 0);
  const q = (s) => [50, 95, 99].map((p) => fmt(percentile(s, p))).join("/") + "/" + fmt(s[s.length - 1] ?? NaN);
  console.log(
    `│ ${mode.padEnd(7)} │ ${String(arm.length).padStart(4)} │ ${String(edits).padStart(5)} │ ${q(drift)} │ ${q(prop)} │ ${String(events).padStart(8)} │`
  );
}
console.log("└─────────┴──────┴───────┴──────────────────────────┴──────────────────────────┴──────────┘");

console.log("\n┌─────────┬────────────────────────────┬────────────┬──────────────────────────┐");
console.log("│ mode    │ boot cold sw/repo/render │ tab2 repo  │ sync all / per-doc p95   │");
console.log("├─────────┼────────────────────────────┼────────────┼──────────────────────────┤");
for (const mode of ["inline", "worker"]) {
  const arm = runs.filter((r) => r.mode === mode && r.boot);
  if (arm.length === 0) continue;
  const med = (vals) => {
    const s = vals.filter((v) => !Number.isNaN(v)).sort((a, b) => a - b);
    return percentile(s, 50);
  };
  const cold = ["swMs", "repoMs", "renderMs"]
    .map((k) => fmt(med(arm.map((r) => r.boot.cold?.[k] ?? NaN))))
    .join("/");
  const tab2 = fmt(med(arm.map((r) => r.boot.secondTab?.repoMs ?? NaN)));
  const syncAll = fmt(med(arm.map((r) => r.syncDocs?.allMs ?? NaN)));
  const syncP95 = fmt(med(arm.map((r) => r.syncDocs?.perDocMs?.p95 ?? NaN)));
  console.log(
    `│ ${mode.padEnd(7)} │ ${cold.padStart(24)} │ ${tab2.padStart(10)} │ ${(syncAll + " / " + syncP95).padStart(24)} │`
  );
}
console.log("└─────────┴────────────────────────────┴────────────┴──────────────────────────┘");
console.log("boot/sync cells are medians across runs; sync = fresh browser resolving the batch via the server.");
console.log(
  "\ndrift: lateness of the worker thread's 1s timer under load (in-thread keepalive hazard;\n" +
    "       expected ~equal across arms). propag: two-tab edit→visible latency during load.\n" +
    "wsEvents: worker console lines suggesting socket close/reconnect (per arm, all runs).\n"
);
