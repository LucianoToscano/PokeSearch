"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const detail=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const dock=fs.readFileSync(path.join(assets,"dock.html"),"utf8");
for(const x of detail.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
 new vm.Script(x[1]);
for(const x of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
 new vm.Script(x[1]);
// Real cause of duplicated 🔵: old CSS generated a dot before the new
// class-ranking chip. The LAST override must disable it for ALL leagues.
assert.match(detail,/#rankLine::before,#rankLine\[data-league\]::before\{\s*display:none!important;content:none!important/);
assert.match(detail,/#rankLine,#rankLine\[data-league\]\{[\s\S]*?border:0!important;[\s\S]*?background:transparent!important/);
assert.ok(detail.includes("#rankLine .psLeagueIv,#rankLine .psCompactSpecies,"));
assert.ok(detail.includes("border:1px solid #a8bfda85!important"));
assert.ok(detail.includes("font:750 11px/1.15"),"readable >=11px labels");
assert.ok(detail.includes("#rankLine .psMovesAction{box-sizing:border-box!important"));
assert.ok(detail.includes("#rankLine .psCompactOverall:disabled"),"RG placeholder visible but not clickable");
assert.ok(detail.includes('badge.textContent=hasVerifiedOverall?"RG #"+best.overallRank:"RG —"'));
assert.ok(detail.includes('badge.disabled=true;badge.setAttribute?.("aria-disabled","true")'));
assert.ok(!detail.includes('rankLine.appendChild(more);'),"do not add a fifth +N button to the strip");
assert.ok(detail.includes('nameChip.title+=" · "+otherChoices.length+'),
 "other candidates remain in existing PvP analysis");
assert.ok(detail.includes('iv.textContent=label+" IV #"+best.rank'));
assert.ok(detail.includes('nameChip.onclick=event=>openPvpAnalysisForSpecies(event,nameChip)'));
assert.ok(detail.includes('badge.onclick=event=>openPvpRankExplorer(event,badge)'));
assert.ok(detail.includes('btn.onclick=async()=>'),"⚔️/⚡ remains independent");
for(const badge of ['gl:"ui-icons/ps-gl-lt268.png"','ul:"ui-icons/ps-ul-lt268.png"','ml:"ui-icons/ps-ml-lt268.png"'])assert.ok(detail.includes(badge));
assert.ok(detail.includes('emblem.src="ui-icons/mega-symbol.png"'));
// Zero must remain visible when the provider reports no cards. If the
// numeric badge is enabled, it appears ON the Pokébola; if disabled, under
// the icon, never two copies or an invisible absolute-positioned number.
assert.ok(dock.includes('empty.style.display=emptyResult&&(!resultWindow||!resultDisplayOptions.count)?'));
assert.ok(dock.includes('empty.textContent=emptyResult&&'));
assert.match(dock,/body\.result-window #empty\{display:block;margin:0 auto;width:var\(--dock\)/);
assert.ok(dock.includes('count.textContent=resultDisplayOptions.count?String(cards.length):""'));
assert.ok(dock.includes('body.result-window.results-collapsed #spawns,'));
assert.ok(!dock.includes('body.result-window #empty{display:none!important'));
console.log("LT250 PASS: 3 outlined chips + separate sword, no doubled league dot, readable texts, zero visible without duplication on P1/P2");
