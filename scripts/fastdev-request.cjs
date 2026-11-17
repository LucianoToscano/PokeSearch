"use strict";
// An opt-in preview request is a source-controlled commit, not a release request.
// No secrets, release signing, version bump or public APK can be triggered here.
const fs = require("node:fs");
const MODES = new Set(["fast", "visual", "java-check", "apk-preview"]);
function validate(data) {
  if (!data || data.schema !== 1 || !MODES.has(data.mode) ||
      typeof data.request_id !== "string" ||
      !/^[a-zA-Z0-9_.-]{1,80}$/.test(data.request_id))
    throw Error("Invalid FastDev request schema/mode/request_id");
  return data.mode;
}
function main() {
  const source = process.argv[2] || "fastdev/preview-request.json";
  const mode = validate(JSON.parse(fs.readFileSync(source,"utf8")));
  process.stdout.write(mode);
}
module.exports = {validate, MODES};
if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode=1; }
}
