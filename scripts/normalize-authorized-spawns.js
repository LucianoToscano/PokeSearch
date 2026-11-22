#!/usr/bin/env node
"use strict";

/**
 * Manual offline converter for a webhook JSON export from a provider the user
 * is permitted to consume. Does not perform HTTP requests or alter the app.
 *
 * Example:
 * node scripts/normalize-authorized-spawns.js --authorized \
 *   --source my-scanner --input spawns.json --output rocketmap.json
 */
const fs = require("node:fs");
const path = require("node:path");
const {normalizeWebhookBatch, toRocketMapRawData, MAX_BODY_BYTES} =
  require("../functions/spawn-observation-normalizer");

function options(argv) {
  const names = new Set(["--source", "--input", "--output", "--format", "--now-ms"]);
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--authorized") {
      if (out.authorized) throw new Error("Duplicate --authorized");
      out.authorized = true;
      continue;
    }
    if (!names.has(flag)) throw new Error("Unknown or unsupported option: " + flag);
    if (Object.prototype.hasOwnProperty.call(out, flag)) throw new Error("Duplicate flag: " + flag);
    if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) throw new Error("Missing value for " + flag);
    out[flag] = argv[++i];
  }
  if (!out.authorized) throw new Error("Explicit --authorized confirmation is required");
  if (!out["--source"] || !out["--input"] || !out["--output"]) {
    throw new Error("Require --source, --input, and --output");
  }
  if (out["--format"] && !["rocketmap", "normalized"].includes(out["--format"])) {
    throw new Error("Unsupported output format");
  }
  return out;
}

function main(argv) {
  const args = options(argv);
  const inputPath = path.resolve(args["--input"]);
  const outputPath = path.resolve(args["--output"]);
  if (inputPath === outputPath) throw new Error("Source and output paths must differ");
  const stat = fs.statSync(inputPath);
  if (!stat.isFile() || stat.size > MAX_BODY_BYTES) throw new Error("Input file is too large or not a file");
  const contents = fs.readFileSync(inputPath);
  const result = normalizeWebhookBatch(contents, {
    authorized: true,
    sourceId: args["--source"],
    ...(args["--now-ms"] ? {nowMs: Number(args["--now-ms"])} : {})
  });
  const output = args["--format"] === "normalized" ? result : toRocketMapRawData(result);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n", {flag: "wx", mode: 0o600});
  process.stdout.write(JSON.stringify({
    received: result.inspected,
    accepted: result.accepted,
    rejected: result.rejected,
    format: args["--format"] || "rocketmap"
  }) + "\n");
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (err) { process.stderr.write("Conversion refused: " + err.message + "\n"); process.exitCode = 1; }
}

module.exports = {main, options};
