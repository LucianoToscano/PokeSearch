"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const detail=fs.readFileSync(path.join(root,"assets/detail.html"),"utf8");
const activity=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const secondary=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
const importer=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/PgsFilterImport.java"),"utf8");
const manifest=fs.readFileSync(path.join(root,"AndroidManifest.xml"),"utf8");
for(const x of detail.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
 new vm.Script(x[1]);
// The screenshot: the verified 🗡 reverts to ⚔️ whenever a detail card re-renders.
assert.ok(detail.includes("const psVerifiedMoveIcons=new Map()"));
assert.ok(detail.includes("const statusKey=league+"));
assert.ok(detail.includes("const prior=psVerifiedMoveIcons.get(statusKey)"));
assert.ok(detail.includes("psVerifiedMoveIcons.set(statusKey"));
assert.ok(detail.includes('btn.textContent=hasLegacy?"⚔️":"🗡"'));
assert.ok(detail.includes('btn.textContent=prior?.icon||"🗡"'));
assert.ok(detail.includes('btn.title=prior?.title'));
// Fallback-only Litwick is not an optimized PvP moveset, and must not fill
// the overlay card with 6–20 move rows unless the user expands the details.
assert.ok(detail.includes("Sem conjunto PvP recomendado"));
assert.ok(detail.includes('<details class="psAvailableMoveDetails">'));
assert.ok(detail.includes("Ver '+total+"));
assert.ok(detail.includes("Movimentos do Game Master")===false,
 "never label the possible move pool as a ranked move recommendation");
assert.match(detail,/#movesPopover \.psAvailableMoveList\{max-height:130px/);
// Local sanitized JSON is selected by the user; no private PGSharp .dat or
// tokens/cookies are bundled or sent to GitHub.
assert.match(importer,/SCHEMA="pokesearch_analysis_only_not_directly_importable"/);
assert.match(importer,/BATCH_SIZE=50/);
assert.match(importer,/if\(batch<0\|\|batch>=parts\)/);
assert.ok(importer.includes('new JSONArray()'));
assert.ok(importer.includes('if(aMin!=aMax||dMin!=dMax||sMin!=sMax)'));
assert.ok(importer.includes('Filtro Shiny exige validação'));
assert.ok(importer.includes('Critério de "+key+" ainda não mapeado'));
assert.ok(importer.includes('"clearPokemonSelection",values.isEmpty()'));
assert.ok(importer.includes('"levelMin",low==1?"":String.valueOf(low)'));
assert.ok(importer.includes('"levelMax",high==50?"":String.valueOf(high)'));
assert.ok(importer.includes('"includePreviousEvolutions",false'));
assert.ok(!importer.includes("HttpURLConnection"));
assert.ok(!importer.includes("getSharedPreferences"));
assert.ok(!importer.includes(".dat\""));
assert.ok(activity.includes("showSavedPgsFilters"));
assert.ok(activity.includes("PgsFilterImport.PRIVATE_FILE,MODE_PRIVATE"));
assert.ok(activity.includes('PgsFilterImport.SCHEMA.equals(backup.optString("catalog_type",""))'));
assert.ok(activity.includes('addHomeDrawerItem(drawer,"◇","Filtros PGSharp"'));
assert.ok(activity.includes('new AlertDialog.Builder(this).setTitle("Filtros PGSharp'));
// The target overlay must be explicit; never broadcast filter settings
// to both Pokébolas or enable notifications simply because PGS had notif.
assert.ok(activity.includes('SecondaryOverlayService.class:OverlayService.class'));
assert.ok(activity.includes('!running'));
assert.ok(service.includes('if(PgsFilterImport.ACTION.equals(action))'));
assert.ok(service.includes('change.put("selections",selected)'));
assert.ok(service.includes('bridge.setPokemonSelections(change.toString())'));
assert.ok(service.includes('bridge.setSearchConfig(payload)'));
assert.ok(service.includes('extra.put("pokemonFilterEnabled",true)'));
assert.ok(secondary.includes("extends OverlayService"));
assert.match(manifest,/service android:name="\.OverlayService" android:exported="false"/);
assert.match(manifest,/service android:name="\.SecondaryOverlayService" android:exported="false"/);
console.log("LT248: verified icon persistence, compact fallback, local PGS importer, no silent filter loss, P1/P2 isolation PASS");
