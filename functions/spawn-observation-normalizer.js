"use strict";

/**
 * Pure, offline webhook-to-observation adapter.
 *
 * It does not query Pokémon GO, PGSharp, Moonani or any other service, and does
 * not run a webhook listener. Operators must separately verify authorization.
 * Suitable for a future server-side, opt-in feed ingestion service.
 */
const MAX_BODY_BYTES = 512 * 1024;
const MAX_EVENTS = 500;
const MAX_FUTURE_MS = 6 * 60 * 60 * 1000;

function numeric(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string" && /^-?(?:\d+)(?:\.\d+)?$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

function integer(value, min, max) {
  const n = numeric(value);
  return Number.isSafeInteger(n) && n >= min && n <= max ? n : null;
}

function timeMillis(value) {
  if (typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value)) {
    if (!/(?:Z|[+-]\d\d:\d\d)$/.test(value)) return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const valueNumber = numeric(value);
  if (!Number.isSafeInteger(valueNumber)) return null;
  if (valueNumber >= 1_000_000_000_000 && valueNumber < 10_000_000_000_000) return valueNumber;
  if (valueNumber >= 1_000_000_000 && valueNumber < 10_000_000_000) return valueNumber * 1000;
  return null;
}

function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 &&
    !(latitude === 0 && longitude === 0);
}

function safeEncounterId(value) {
  // JSON numbers above the safe integer limit can corrupt encounter IDs.
  if (typeof value === "number" && !Number.isSafeInteger(value)) return "";
  if (typeof value !== "string" && typeof value !== "number") return "";
  const str = String(value).trim();
  return /^[A-Za-z0-9:_-]{1,96}$/.test(str) ? str : "";
}

function eventRow(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (Object.prototype.hasOwnProperty.call(raw, "type")) {
    if (raw.type !== "pokemon") return null;
    return raw.message && typeof raw.message === "object" && !Array.isArray(raw.message)
      ? raw.message : null;
  }
  return raw;
}

function extractEvents(input) {
  if (Array.isArray(input)) return input;
  if (!input || typeof input !== "object") return null;
  if (Array.isArray(input.pokemons)) return input.pokemons;
  if (Array.isArray(input.events)) return input.events;
  if (input.type === "pokemon" && input.message) return [input];
  return null;
}

function normalizeOne(raw, sourceId, nowMs) {
  const row = eventRow(raw);
  if (!row) return {error: "unsupported_event"};
  const pokemonId = integer(row.pokemon_id ?? row.pokemonId, 1, 1025);
  const encounterId = safeEncounterId(row.encounter_id ?? row.encounterId);
  const latitude = numeric(row.latitude ?? row.lat);
  const longitude = numeric(row.longitude ?? row.lon ?? row.lng);
  if (!pokemonId || !encounterId || !validCoordinates(latitude, longitude)) {
    return {error: "invalid_identity_or_coordinates"};
  }
  const expiresAtMs = timeMillis(row.disappear_time ?? row.despawn_at ?? row.despawnAt);
  if (expiresAtMs === null || expiresAtMs - nowMs > MAX_FUTURE_MS) {
    return {error: "missing_or_invalid_expiry"};
  }
  if (expiresAtMs <= nowMs) return {error: "expired"};

  const ivAttack = integer(row.individual_attack ?? row.iv_attack, 0, 15);
  const ivDefense = integer(row.individual_defense ?? row.iv_defense, 0, 15);
  const ivStamina = integer(row.individual_stamina ?? row.iv_stamina, 0, 15);
  const fullIv = ivAttack !== null && ivDefense !== null && ivStamina !== null;
  const calculatedIv = fullIv ? Math.round(((ivAttack + ivDefense + ivStamina) / 45) * 10000) / 100 : null;
  const claimedIv = integer(row.iv_percent ?? row.iv, 0, 100);
  if (fullIv && claimedIv !== null && Math.abs(claimedIv - calculatedIv) > 0.6) {
    return {error: "conflicting_iv"};
  }
  const cp = integer(row.cp, 0, 20000);
  const levelNumber = numeric(row.level);
  const level = Number.isFinite(levelNumber) && levelNumber >= 1 && levelNumber <= 55 &&
      levelNumber * 2 === Math.floor(levelNumber * 2) ? levelNumber : null;
  const form = integer(row.form, 0, 99999);
  const gender = integer(row.gender, 0, 3);
  return {
    entry: {
      sourceId,
      observationType: "pokemon",
      encounterId,
      pokemonId,
      latitude,
      longitude,
      receivedAtMs: nowMs,
      expiresAtMs,
      ivAttack,
      ivDefense,
      ivStamina,
      ivPercent: fullIv ? calculatedIv : claimedIv,
      cp,
      level,
      form,
      gender
      // Intentionally no shiny flag or PvP rank: neither can be inferred from this payload.
    }
  };
}

/**
 * Authorization is an explicit precondition, not a guess based on a URL.
 * The function never performs a network request.
 */
function normalizeWebhookBatch(input, options = {}) {
  if (options.authorized !== true) throw new Error("Source authorization must be explicitly confirmed");
  const sourceId = options.sourceId;
  if (typeof sourceId !== "string" || !/^[A-Za-z0-9_-]{3,64}$/.test(sourceId)) {
    throw new Error("A safe, configured sourceId is required");
  }
  const nowMs = options.nowMs === undefined ? Date.now() : options.nowMs;
  if (!Number.isSafeInteger(nowMs) || nowMs <= 0) throw new Error("Invalid received timestamp");

  let payload = input;
  if (typeof input === "string" || Buffer.isBuffer(input)) {
    if (Buffer.byteLength(input, "utf8") > MAX_BODY_BYTES) throw new Error("Payload exceeds size limit");
    try { payload = JSON.parse(input.toString()); }
    catch (_) { throw new Error("Malformed JSON payload"); }
  }
  const events = extractEvents(payload);
  if (!events) throw new Error("Unknown webhook envelope");
  const seen = new Set();
  const entries = [];
  const reasons = Object.create(null);
  const count = Math.min(events.length, MAX_EVENTS);
  for (let i = 0; i < count; i++) {
    const result = normalizeOne(events[i], sourceId, nowMs);
    if (result.error) { reasons[result.error] = (reasons[result.error] || 0) + 1; continue; }
    const key = result.entry.encounterId;
    if (seen.has(key)) { reasons.duplicate = (reasons.duplicate || 0) + 1; continue; }
    seen.add(key);
    entries.push(result.entry);
  }
  if (events.length > MAX_EVENTS) reasons.over_limit = events.length - MAX_EVENTS;
  entries.sort((a, b) => a.expiresAtMs - b.expiresAtMs || a.encounterId.localeCompare(b.encounterId));
  return {
    sourceId,
    receivedAtMs: nowMs,
    inspected: count,
    accepted: entries.length,
    rejected: Object.values(reasons).reduce((sum, n) => sum + n, 0),
    reasons,
    entries
  };
}

/**
 * Adapts the normalized rows into the already-supported RocketMap /raw_data
 * shape consumed by PGBR. This is JSON data only; no listener or credential.
 */
function toRocketMapRawData(normalized) {
  if (!normalized || !Array.isArray(normalized.entries)) throw new Error("Invalid normalized observations");
  return {
    pokemons: normalized.entries.map(e => {
      const p = {
        pokemon_id: e.pokemonId,
        encounter_id: e.encounterId,
        latitude: e.latitude,
        longitude: e.longitude,
        disappear_time: e.expiresAtMs,
        source_id: e.sourceId
      };
      if (e.cp !== null) p.cp = e.cp;
      if (e.level !== null) p.level = e.level;
      if (e.form !== null) p.form = e.form;
      if (e.gender !== null) p.gender = e.gender;
      if (e.ivAttack !== null && e.ivDefense !== null && e.ivStamina !== null) {
        p.individual_attack = e.ivAttack;
        p.individual_defense = e.ivDefense;
        p.individual_stamina = e.ivStamina;
      }
      return p;
    })
  };
}

module.exports = {
  MAX_BODY_BYTES,
  MAX_EVENTS,
  normalizeWebhookBatch,
  toRocketMapRawData
};
