#!/usr/bin/env node
"use strict";

/**
 * Offline metadata-only index of WatWowMap/wwm-uicons.
 * NEVER downloads sprites or asserts an asset redistribution license.
 * Does not modify the user's Pokémon sprite library.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function cleanPart(input) {
  if (typeof input !== "string" || !/^[A-Za-z0-9._-]{1,128}$/.test(input)
      || input === "." || input === ".." || input.startsWith(".")) {
    throw new Error("Unsafe UICONS index entry");
  }
  return input;
}
function catalog(index, source="WatWowMap/wwm-uicons") {
  if (!index || typeof index !== "object" || Array.isArray(index)) {
    throw new Error("Expected UICONS index object");
  }
  const allowed = new Set(["png","webp"]);
  const entries = [];
  const counts = {};
  function walk(node, parts) {
    if (Array.isArray(node)) {
      for (const name of node) {
        const safe = cleanPart(name);
        const ext = safe.slice(safe.lastIndexOf(".")+1).toLowerCase();
        if (!allowed.has(ext)) continue;
        const full = [...parts,safe].join("/");
        entries.push({path:full,category:parts[0],format:ext,
          origin:source,assetRights:"review_required"});
        counts[parts[0]]=(counts[parts[0]]||0)+1;
      }
    } else if (node && typeof node === "object") {
      for (const key of Object.keys(node)) walk(node[key],[...parts,cleanPart(key)]);
    } else throw new Error("Unexpected UICONS subtree");
  }
  for (const key of Object.keys(index)) walk(index[key],[cleanPart(key)]);
  entries.sort((a,b)=>a.path.localeCompare(b.path,"en"));
  if(entries.length > 200000) throw new Error("Index too large");
  const byPath = new Set(entries.map(e=>e.path));
  if(byPath.size!==entries.length)throw new Error("Duplicate asset paths");
  return {version:1,source,generatedFrom:"index.json",containsImageBytes:false,
    licenseNote:"package.json MIT does not guarantee individual PNG/WebP asset rights",
    total:entries.length,counts,entries};
}
function generate(inputPath,outputPath) {
  const input=path.resolve(inputPath),output=path.resolve(outputPath);
  if(input===output)throw new Error("Refusing to overwrite source");
  const bytes=fs.readFileSync(input);
  if(bytes.length>10*1024*1024)throw new Error("Index too big");
  const raw=JSON.parse(bytes.toString("utf8"));
  const obj=catalog(raw);
  obj.inputSha256=crypto.createHash("sha256").update(bytes).digest("hex");
  fs.writeFileSync(output,JSON.stringify(obj,null,2)+"\n",{flag:"wx",mode:0o600});
  return {total:obj.total,categories:Object.keys(obj.counts).length};
}
if(require.main===module){
  try{
    const args=process.argv.slice(2);
    if(args.length!==2)throw new Error("Usage: node scripts/catalog-uicons-index.js input/index.json output/manifest.json");
    process.stdout.write(JSON.stringify(generate(args[0],args[1]))+"\n");
  }catch(err){process.stderr.write("Index refused: "+err.message+"\n");process.exitCode=1;}
}
module.exports={catalog,generate};
