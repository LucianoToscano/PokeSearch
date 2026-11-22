#!/usr/bin/env node
"use strict";

/**
 * Starts an opt-in, localhost-only test/ops gateway. The operator publishes it
 * through their own TLS reverse proxy with IP restrictions, separate secrets
 * and an explicit data-sharing agreement. Nothing is polled from game servers.
 */
const {createLocalServer} = require("../functions/authorized-spawn-gateway");
function start(env = process.env) {
  if (env.POKESEARCH_SOURCE_AUTHORIZED !== "confirmed") {
    throw new Error("POKESEARCH_SOURCE_AUTHORIZED=confirmed required after verifying provider permission");
  }
  const sourceId = env.POKESEARCH_SOURCE_ID;
  const ingestSecret = env.POKESEARCH_INGEST_SECRET;
  const readSecret = env.POKESEARCH_READ_SECRET;
  const port = Number(env.POKESEARCH_GATEWAY_PORT || "8765");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid gateway port");
  const {server} = createLocalServer({authorized: true, sourceId, ingestSecret, readSecret});
  // Never bind directly to 0.0.0.0 or publish an unauthenticated feed.
  server.listen(port, "127.0.0.1", () => {
    process.stdout.write("Authorized local gateway ready on loopback:" + port + "\n");
  });
  return server;
}
if (require.main === module) {
  try { start(); }
  catch (error) { process.stderr.write("Gateway not started: " + error.message + "\n"); process.exitCode=1; }
}
module.exports = {start};
