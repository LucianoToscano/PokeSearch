"use strict";
// FastDev is an advisory, incremental smoke lane. It never replaces the
// complete protected QA/signing gates required for official ARK releases.
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const BASIC = [
  "app/tests/probe-smoke.test.js",
  "app/tests/overlay-ux.test.js",
  "app/tests/signing-contract.test.js"
];
const OVERLAY = [
  "app/tests/overlay-ux.test.js",
  "app/tests/visual-editor.test.js",
  "app/tests/lt62-menu-visual-states.test.js",
  "app/tests/lt112-dual-overlay-parity.test.js"
];
const PROBE = [
  "app/tests/probe-smoke.test.js",
  "app/tests/location-probe.test.js",
  "app/tests/lt200-api-dom-failures.test.js"
];
const LOGIN = [
  "app/tests/login-entry.test.js",
  "app/tests/lt204-login-optional-shiny-paused.test.js"
];

function plan(changedFiles) {
  const files = [...new Set(changedFiles.map(f => f.replace(/\\/g, "/").trim()).filter(Boolean))];
  if (!files.length) return {mode:"smoke", files, tests:BASIC, fullQaRequired:true};
  const selected = new Set();
  let broad = false;
  let code = false;
  for (const file of files) {
    if (file.startsWith("docs/") || file.endsWith(".md") || file === "AGENTS.md") continue;
    code = true;
    if (file === "scripts/fastdev.cjs" || file === "scripts/fastdev.test.cjs" ||
        file === ".github/workflows/pokesearch-fastdev.yml") continue;
    if (/^app\/tests\/[^/]+\.test\.js$/.test(file)) {
      selected.add(file);
    } else if (file === "app/src/main/assets/dock.html" ||
               file === "app/src/main/assets/overlay.html") {
      OVERLAY.forEach(t => selected.add(t));
    } else if (file === "app/src/main/assets/detail.html") {
      selected.add("app/tests/overlay-ux.test.js");
      selected.add("app/tests/lt253-smart-pvp-calculator-cache-layout.test.js");
    } else if (file === "app/src/main/assets/probe.js") {
      PROBE.forEach(t => selected.add(t));
    } else if (file === "app/src/main/assets/login_entry.js" ||
               file === "app/src/main/assets/shiny_login.js") {
      LOGIN.forEach(t => selected.add(t));
    } else if (file === "app/src/main/assets/release_notes.json") {
      selected.add("app/tests/lt83-home-release-notes.test.js");
    } else if (file === "scripts/test_ota_builder.py") {
      selected.add("app/tests/lt203-ota-installer-handoff.test.js");
    } else {
      // Native sources, manifest, Gradle, sprites, unknown paths, release
      // requests: do NOT mistake a narrow test selection for coverage.
      broad = true;
    }
  }
  if (broad) BASIC.forEach(t => selected.add(t));
  if (code && selected.size === 0) BASIC.forEach(t => selected.add(t));
  return {
    mode: broad ? "broad-smoke" : code ? "targeted" : "documentation",
    files,
    tests:[...selected].sort(),
    fullQaRequired:true
  };
}

function changedFromGit(base) {
  const output = cp.execFileSync("git", ["diff", "--name-only", base + "...HEAD"], {
    encoding:"utf8", maxBuffer:8*1024*1024
  });
  return output.split(/\r?\n/).filter(Boolean);
}

function main(args) {
  const baseIndex = args.indexOf("--base");
  const filesIndex = args.indexOf("--files");
  if (baseIndex !== -1 && !args[baseIndex+1]) throw Error("--base needs a git ref");
  if (filesIndex !== -1 && !args[filesIndex+1]) throw Error("--files needs comma-separated paths");
  if (baseIndex === -1 && filesIndex === -1)
    throw Error("Specify --base <ref> or --files <comma-separated paths>");
  const files = filesIndex !== -1
    ? args[filesIndex+1].split(",")
    : changedFromGit(args[baseIndex+1]);
  const chosen = plan(files);
  console.log("FASTDEV_PLAN=" + JSON.stringify(chosen));
  const t0 = Date.now();
  if (!args.includes("--dry-run")) {
    for (const test of chosen.tests) {
      if (!fs.existsSync(test)) throw Error("Required smoke test missing: " + test);
      console.log("FASTDEV_TEST=" + test);
      cp.execFileSync(process.execPath, [test], {stdio:"inherit"});
    }
  }
  const seconds = ((Date.now()-t0)/1000).toFixed(2);
  console.log("FASTDEV_SECONDS=" + seconds);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      "\n### FastDev — advisory, not official QA\n" +
      "- Mode: " + chosen.mode + "\n" +
      "- Source files: " + chosen.files.length + "\n" +
      "- Selected tests: " + chosen.tests.length + "\n" +
      "- Test execution: " + seconds + "s\n" +
      "- Complete PR gates + protected ARK still mandatory for release.\n");
  }
  return chosen;
}

module.exports = {plan, changedFromGit, main};
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error("FASTDEV_FAILED:",error.message); process.exitCode=1; }
}
