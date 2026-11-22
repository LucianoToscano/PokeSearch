"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {normalizeWebhookBatch, toRocketMapRawData, MAX_EVENTS} =
  require("./spawn-observation-normalizer");

const NOW = Date.parse("2026-11-22T16:00:00.000Z");
const opts = {sourceId: "authorized_scanner", authorized: true, nowMs: NOW};
const base = () => ({
  pokemon_id: 25,
  encounter_id: "12345678901234567890",
  latitude: -6.15,
  longitude: -35.21,
  disappear_time: Math.floor((NOW + 600000) / 1000),
  individual_attack: 15,
  individual_defense: 15,
  individual_stamina: 15,
  cp: 860,
  level: 30
});

test("requires explicit authorization and configured provenance", () => {
  assert.throws(() => normalizeWebhookBatch({pokemons: [base()]}, {sourceId: "a"}), /authorization/i);
  assert.throws(() => normalizeWebhookBatch({pokemons: [base()]}, {...opts, sourceId: "../secret"}), /sourceId/);
});

test("normalizes a single RocketMap pokemon webhook and preserves 100 IV", () => {
  const result = normalizeWebhookBatch({type: "pokemon", message: base()}, opts);
  assert.equal(result.accepted, 1);
  assert.equal(result.entries[0].ivPercent, 100);
  assert.equal(result.entries[0].sourceId, "authorized_scanner");
  assert.equal(result.entries[0].encounterId, "12345678901234567890");
  assert.equal(result.entries[0].expiresAtMs, NOW + 600000);
  assert.equal(result.entries[0].receivedAtMs, NOW);
  assert.equal(Object.hasOwn(result.entries[0], "shiny"), false);
});

test("omits unknown fields rather than inventing zero IV", () => {
  const {individual_attack, individual_defense, individual_stamina, cp, level, ...row} = base();
  const normalized = normalizeWebhookBatch({pokemons: [row]}, opts);
  const entry = normalized.entries[0];
  assert.equal(entry.ivPercent, null);
  assert.equal(entry.cp, null);
  assert.equal(entry.level, null);
  assert.equal(toRocketMapRawData(normalized).pokemons[0].individual_attack, undefined);
});

test("does not transmit a claimed IV without components into a RocketMap IV claim", () => {
  const row = base();
  delete row.individual_attack;
  delete row.individual_defense;
  delete row.individual_stamina;
  row.iv_percent = 100;
  const normalized = normalizeWebhookBatch({pokemons: [row]}, opts);
  assert.equal(normalized.entries[0].ivPercent, 100);
  assert.equal(Object.hasOwn(toRocketMapRawData(normalized).pokemons[0], "individual_attack"), false);
});

test("rejects conflicting IV data instead of trusting a claimed 100", () => {
  const row = {...base(), individual_attack: 1, iv_percent: 100};
  const x = normalizeWebhookBatch({pokemons: [row]}, opts);
  assert.equal(x.accepted, 0);
  assert.equal(x.reasons.conflicting_iv, 1);
});

test("expired, future and missing expiry never become encounters", () => {
  const expired = {...base(), encounter_id: "expired", disappear_time: Math.floor((NOW - 1000) / 1000)};
  const future = {...base(), encounter_id: "future", disappear_time: NOW + 9 * 3600000};
  const missing = {...base(), encounter_id: "missing"};
  delete missing.disappear_time;
  const x = normalizeWebhookBatch({pokemons: [expired, future, missing]}, opts);
  assert.equal(x.accepted, 0);
  assert.equal(x.reasons.expired, 1);
  assert.equal(x.reasons.missing_or_invalid_expiry, 2);
});

test("rejects NaN, non-numeric and null island coordinates", () => {
  const rows = [
    {...base(), encounter_id: "bad1", latitude: "NaN"},
    {...base(), encounter_id: "bad2", latitude: 99},
    {...base(), encounter_id: "bad3", latitude: 0, longitude: 0},
    {...base(), encounter_id: "bad4", longitude: ""}
  ];
  const x = normalizeWebhookBatch({pokemons: rows}, opts);
  assert.equal(x.accepted, 0);
  assert.equal(x.reasons.invalid_identity_or_coordinates, 4);
});

test("rejects unsafe numeric encounter ID instead of rounding", () => {
  const x = normalizeWebhookBatch({pokemons: [{...base(), encounter_id: 12345678901234567890}]}, opts);
  assert.equal(x.accepted, 0);
});

test("bounded batch, deduplicates and counts excluded unsupported event", () => {
  const rows = [
    {type: "pokemon", message: base()},
    {type: "pokemon", message: base()},
    {type: "raid", message: base()}
  ];
  const x = normalizeWebhookBatch(rows, opts);
  assert.equal(x.accepted, 1);
  assert.equal(x.reasons.duplicate, 1);
  assert.equal(x.reasons.unsupported_event, 1);
  assert.equal(x.rejected, 2);
  assert.equal(x.inspected, 3);
  const big = Array.from({length: MAX_EVENTS + 5}, () => ({type: "raid", message: {}}));
  const b = normalizeWebhookBatch(big, opts);
  assert.equal(b.inspected, MAX_EVENTS);
  assert.equal(b.reasons.over_limit, 5);
});

test("invalid JSON and too-large responses are rejected before processing", () => {
  assert.throws(() => normalizeWebhookBatch("{bad json", opts), /Malformed JSON/);
  assert.throws(() => normalizeWebhookBatch("x".repeat(524289), opts), /size limit/);
  assert.throws(() => normalizeWebhookBatch({something_else: []}, opts), /envelope/);
});

test("accepts explicit ISO UTC expiry but rejects ambiguous timezone", () => {
  const good = {...base(), disappear_time: "2026-11-22T16:10:00Z"};
  const bad = {...base(), encounter_id: "bad", disappear_time: "2026-11-22T16:10:00"};
  const x = normalizeWebhookBatch({pokemons: [good, bad]}, opts);
  assert.equal(x.accepted, 1);
  assert.equal(x.reasons.missing_or_invalid_expiry, 1);
});

test("produces schema compatible with existing PGBR RocketMap parser", () => {
  const normalized = normalizeWebhookBatch({pokemons: [base()]}, opts);
  const json = toRocketMapRawData(normalized);
  assert.equal(json.pokemons[0].disappear_time, NOW + 600000);
  assert.equal(json.pokemons[0].individual_defense, 15);
  assert.equal(json.pokemons[0].source_id, "authorized_scanner");
  assert.equal(json.pokemons[0].latitude, -6.15);
});

test("no network, secrets, unapproved providers or fake live claims", () => {
  const fs = require("node:fs");
  const source = fs.readFileSync(require.resolve("./spawn-observation-normalizer"), "utf8");
  assert.doesNotMatch(source, /https?:\/\//);
  assert.doesNotMatch(source, /(?:fetch\(|https\.request|http\.request|XMLHttpRequest|Authorization:)\s*/);
});
