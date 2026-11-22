"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {spawnSync} = require("node:child_process");

const converter = path.resolve(__dirname, "../scripts/normalize-authorized-spawns.js");
const NOW = Date.parse("2026-11-22T16:00:00Z");
function fixture(dir) {
  const input = path.join(dir, "source.json");
  const output = path.join(dir, "output.json");
  fs.writeFileSync(input, JSON.stringify({
    type: "pokemon",
    message: {
      pokemon_id: 25, encounter_id: "safe_test_123",
      latitude: -6.15, longitude: -35.21,
      disappear_time: NOW + 600000,
      individual_attack: 15, individual_defense: 15, individual_stamina: 15
    }
  }));
  return {input, output};
}
function run(args) {
  return spawnSync(process.execPath, [converter, ...args], {encoding: "utf8"});
}
test("CLI converts authorized offline JSON to RocketMap schema", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pokesearch-feed-"));
  try {
    const {input, output} = fixture(dir);
    const result = run(["--authorized", "--source", "my_scanner", "--input", input,
      "--output", output, "--now-ms", String(NOW)]);
    assert.equal(result.status, 0, result.stderr);
    const json = JSON.parse(fs.readFileSync(output, "utf8"));
    assert.equal(json.pokemons.length, 1);
    assert.equal(json.pokemons[0].disappear_time, NOW + 600000);
    assert.equal(json.pokemons[0].source_id, "my_scanner");
    assert.equal(JSON.parse(result.stdout).accepted, 1);
  } finally {fs.rmSync(dir, {recursive: true, force: true});}
});

test("CLI refuses unapproved export and does not write output", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pokesearch-feed-"));
  try {
    const {input, output} = fixture(dir);
    const result = run(["--source", "my_scanner", "--input", input, "--output", output,
      "--now-ms", String(NOW)]);
    assert.notEqual(result.status, 0);
    assert.equal(fs.existsSync(output), false);
    assert.match(result.stderr, /authorized/);
  } finally {fs.rmSync(dir, {recursive: true, force: true});}
});

test("CLI refuses to overwrite an existing export", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pokesearch-feed-"));
  try {
    const {input, output} = fixture(dir);
    fs.writeFileSync(output, "keep-me");
    const result = run(["--authorized", "--source", "my_scanner", "--input", input,
      "--output", output, "--now-ms", String(NOW)]);
    assert.notEqual(result.status, 0);
    assert.equal(fs.readFileSync(output, "utf8"), "keep-me");
  } finally {fs.rmSync(dir, {recursive: true, force: true});}
});
