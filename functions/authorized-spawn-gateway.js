"use strict";

/**
 * A local-only, explicitly authorized Golbat/RocketMap webhook bridge.
 * - No outbound HTTP, scanner, Niantic/PGSharp access or provider scraping.
 * - Requires separate secrets for writers/readers; intended behind an operator
 *   controlled TLS reverse proxy and firewall, NEVER exposed on the public net.
 * - Only known, unexpired, validated Pokémon observations are served.
 * - In-memory cache: restarts deliberately discard results.
 */
const http = require("node:http");
const crypto = require("node:crypto");
const {normalizeWebhookBatch, toRocketMapRawData, MAX_BODY_BYTES} =
  require("./spawn-observation-normalizer");

const MAX_ENTRIES = 4000;
const MAX_RESPONSE = 2000;

function safeSecret(actual, expected) {
  if (typeof actual !== "string" || typeof expected !== "string" || !expected) return false;
  const a = Buffer.from(actual, "utf8"), b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
function checkConfig(o) {
  if (!o || o.authorized !== true) throw new Error("Provider authorization must be verified by operator");
  if (typeof o.sourceId !== "string" || !/^[A-Za-z0-9_-]{3,64}$/.test(o.sourceId)) {
    throw new Error("Invalid sourceId");
  }
  if (typeof o.ingestSecret !== "string" || o.ingestSecret.length < 24
      || typeof o.readSecret !== "string" || o.readSecret.length < 24
      || o.ingestSecret === o.readSecret) throw new Error("Two distinct strong secrets required");
  if (o.now !== undefined && typeof o.now !== "function") throw new Error("Invalid clock");
}
function boundsFromUrl(url) {
  const p = url.searchParams;
  const keys = ["swLat", "swLng", "neLat", "neLng"];
  if (keys.some(k => !p.has(k) || !/^-?(?:\d+)(?:\.\d+)?$/.test(p.get(k)))) return null;
  const [swLat, swLng, neLat, neLng] = keys.map(k => Number(p.get(k)));
  if (![swLat, swLng, neLat, neLng].every(Number.isFinite) ||
      swLat < -90 || neLat > 90 || swLng < -180 || neLng > 180 ||
      swLat > neLat || swLng > neLng) return null;
  return {swLat, swLng, neLat, neLng};
}
function optionalNumber(params, name, lo, hi) {
  if (!params.has(name)) return null;
  const raw = params.get(name);
  if (!/^(?:\d+)(?:\.\d+)?$/.test(raw)) return NaN;
  const n = Number(raw);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : NaN;
}
function respond(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(payload));
}

function makeGateway(options) {
  checkConfig(options);
  const now = options.now || Date.now;
  const entries = new Map();
  let acceptedTotal = 0;

  function prune() {
    const stamp = now();
    for (const [key, row] of entries) if (row.expiresAtMs <= stamp) entries.delete(key);
    if (entries.size > MAX_ENTRIES) {
      const oldest = [...entries].sort((a,b) =>
        a[1].expiresAtMs - b[1].expiresAtMs || a[0].localeCompare(b[0]));
      for (let i=0;i<oldest.length - MAX_ENTRIES;i++) entries.delete(oldest[i][0]);
    }
  }

  async function handler(req, res) {
    let url;
    try { url = new URL(req.url, "http://localhost"); }
    catch (_) { respond(res, 400, {error: "invalid_path"}); return; }
    if (url.pathname === "/health" && req.method === "GET") {
      respond(res, 200, {status: "configured", sourceId: options.sourceId});
      return;
    }
    if (url.pathname === "/webhook/golbat" && req.method === "POST") {
      if (!safeSecret(req.headers["x-source-secret"], options.ingestSecret)) {
        respond(res, 401, {error: "unauthorized_source"}); return;
      }
      if (!(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
        respond(res, 415, {error: "json_required"}); return;
      }
      const chunks = [];
      let total = 0;
      try {
        for await (const chunk of req) {
          total += chunk.length;
          if (total > MAX_BODY_BYTES) {
            respond(res, 413, {error: "payload_too_large"}); return;
          }
          chunks.push(chunk);
        }
        const batch = normalizeWebhookBatch(Buffer.concat(chunks), {
          sourceId: options.sourceId, authorized: true, nowMs: now()
        });
        for (const row of batch.entries) {
          // Golbat may emit multiple updates for an encounter. Keep the latest
          // valid observation; don't lose complete IVs on a later NoIV update.
          const key = row.sourceId + ":" + row.encounterId;
          const old = entries.get(key);
          if (old && old.ivAttack !== null && row.ivAttack === null) {
            row.ivAttack = old.ivAttack;
            row.ivDefense = old.ivDefense;
            row.ivStamina = old.ivStamina;
            row.ivPercent = old.ivPercent;
          }
          entries.set(key, row);
        }
        acceptedTotal += batch.accepted;
        prune();
        respond(res, 202, {accepted: batch.accepted, rejected: batch.rejected,
          reasons: batch.reasons, cached: entries.size});
      } catch (err) {
        // Do not send provider data or stack traces to the client.
        respond(res, 400, {error: "invalid_webhook_payload"});
      }
      return;
    }
    if (url.pathname === "/raw_data" && req.method === "GET") {
      if (!safeSecret(req.headers["x-feed-secret"], options.readSecret)) {
        respond(res, 401, {error: "unauthorized_reader"}); return;
      }
      const bounds = boundsFromUrl(url);
      if (!bounds) { respond(res, 400, {error: "invalid_viewport"}); return; }
      const pokemonId = optionalNumber(url.searchParams, "pokemon_id", 1, 1025);
      const ivMin = optionalNumber(url.searchParams, "iv_min", 0, 100);
      const cpMin = optionalNumber(url.searchParams, "cp_min", 0, 20000);
      const levelMin = optionalNumber(url.searchParams, "level_min", 1, 55);
      if ([pokemonId,ivMin,cpMin,levelMin].some(v => Number.isNaN(v))) {
        respond(res, 400, {error: "invalid_filters"}); return;
      }
      prune();
      const filtered = [];
      if (url.searchParams.get("pokemon") !== "false") {
        for (const row of entries.values()) {
          if (row.latitude < bounds.swLat || row.latitude > bounds.neLat ||
              row.longitude < bounds.swLng || row.longitude > bounds.neLng) continue;
          if (pokemonId !== null && row.pokemonId !== pokemonId) continue;
          if (ivMin !== null && (row.ivPercent === null || row.ivPercent < ivMin)) continue;
          if (cpMin !== null && (row.cp === null || row.cp < cpMin)) continue;
          if (levelMin !== null && (row.level === null || row.level < levelMin)) continue;
          filtered.push(row);
        }
      }
      filtered.sort((a,b)=>a.expiresAtMs-b.expiresAtMs || a.encounterId.localeCompare(b.encounterId));
      const payload = toRocketMapRawData({entries: filtered.slice(0, MAX_RESPONSE)});
      // Existing PGBR RocketMap reader expects gyms:{} for a raid query.
      payload.gyms = {};
      respond(res, 200, payload);
      return;
    }
    respond(res, 404, {error: "not_found"});
  }

  return {handler, statistics:() => {
    prune();
    return {cached: entries.size, acceptedTotal};
  }};
}

function createLocalServer(config) {
  const {handler, statistics} = makeGateway(config);
  return {server: http.createServer((req,res) => {
    handler(req,res).catch(() => {if (!res.headersSent) respond(res, 500, {error:"internal_error"});});
  }), statistics};
}

module.exports = {makeGateway, createLocalServer, boundsFromUrl, safeSecret};
