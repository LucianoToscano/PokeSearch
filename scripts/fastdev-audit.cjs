"use strict";
// Read-only CI inventory; heuristic repetition report, never auto-delete workflows.
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const folder = ".github/workflows";
const names = fs.readdirSync(folder).filter(n => /\.ya?ml$/.test(n)).sort();
const references = new Map();
for (const name of names) {
  const text = fs.readFileSync(path.join(folder, name), "utf8");
  const suites = new Set([...text.matchAll(/\bnode\s+(app\/tests\/[\w./-]+\.test\.js)\b/g)]
    .map(match => match[1]));
  for (const suite of suites) {
    if (!references.has(suite)) references.set(suite, []);
    references.get(suite).push(name);
  }
}
const duplicates = [...references.entries()].filter(([, users]) => users.length > 1)
  .sort((a,b) => b[1].length - a[1].length).slice(0,20)
  .map(([suite, workflows]) => ({suite, workflows:workflows.length}));
const report = {
  commit: cp.execFileSync("git", ["rev-parse","HEAD"], {encoding:"utf8"}).trim(),
  workflows: names.length,
  nodeTestFiles: fs.readdirSync("app/tests").filter(n => n.endsWith(".test.js")).length,
  explicitNodeSuites: references.size,
  explicitlyRepeatedSuites: [...references.values()].filter(x => x.length > 1).length,
  topRepeated: duplicates,
  caveat: "Heuristic explicit node <test> references only; excludes loops and inherited reusable workflows."
};
console.log("FASTDEV_INVENTORY="+JSON.stringify(report));
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    "\n### CI inventory (read-only)\n" +
    "- Workflow YAML files: " + report.workflows + "\n" +
    "- Node .test.js files: " + report.nodeTestFiles + "\n" +
    "- Explicit Node test names in YAML: " + report.explicitNodeSuites + "\n" +
    "- Explicitly repeated across workflows: " + report.explicitlyRepeatedSuites + "\n" +
    "- Historical workflows preserved; full review required before any removal.\n");
}
