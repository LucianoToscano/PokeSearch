"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const assets=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const svg=fs.readFileSync(path.join(assets,"mega_evolution_icon.svg"),"utf8");
const advanced=fs.readFileSync(path.join(assets,"pvp_rank_advanced_ui.js"),"utf8");
const start=html.indexOf("function evolutionRow(x,first){");
const end=html.indexOf("// Compact rank shown",start);
assert.ok(start>=0&&end>start);
const row=new Function("window","h",html.slice(start,end)+"return evolutionRow;")(
 {psRankRenderLeague:"gl",PokeSearchIVDisplay:{colorForEfficiency:()=>"#84cd9f"}},
 value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;"));
const mega=row({name:"Mega Charizard X",rank:1,megaProjection:true,referenceOnly:true,
 level:20.5,cp:1499,statProductPct:"100,00"},false);
assert.equal((mega.match(/mega_evolution_icon\.svg/g)||[]).length,1);
assert.ok(mega.includes("Mega Charizard X"));
assert.ok(mega.includes('evoSummary'));
assert.ok(mega.includes('evoStatsRow'));
assert.ok(mega.indexOf('evoStatsRow')>mega.indexOf('evoSummary'));
assert.ok(mega.indexOf("TOP 1 MEGA")>mega.indexOf("evoStatsRow"));
assert.ok(mega.indexOf("100,00%")>mega.indexOf("evoStatsRow"));
assert.ok(!mega.slice(mega.indexOf("evoSummary"),mega.indexOf("evoStatsRow")).includes("evoMegaTop"),
 "badge must not squeeze name in same flex row");
const base=row({name:"Charizard",rank:14,cp:1498,level:25,statProductPct:"99,00"},true);
assert.ok(!base.includes("mega_evolution_icon.svg"));
assert.ok(!base.includes("TOP 1 MEGA"));
const style=html.match(/<style>([\s\S]*?)<\/style>/)?.[1]||html;
assert.ok(/\.evoLine \.evoWho\{[^}]*white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere/.test(html),
 "species text must wrap instead of ellipsis");
assert.ok(/\.evoLine \.evoStatsRow\{display:flex;flex-wrap:wrap;/.test(html),
 "compact stats row must wrap rather than clip");
assert.ok(html.includes(".psMegaMark{display:inline-block;width:11px;height:11px"),"mark cannot increase row height");
assert.ok(!html.includes("evoWho .evoMark:has("),":has unsupported in older WebView");
assert.ok(!advanced.includes('class="psaMegaIcon"'),"no duplicate mark in comparison");
assert.ok(!html.includes('class="evoMegaTop"><img'),"no duplicate mark in TOP 1 badge");
assert.ok(!html.includes('psTopPvpTag"><img'),"no alert badge icon");
assert.ok(svg.includes('data:image/png;base64,'));
assert.ok(svg.includes('viewBox="6 6 52 52"'));
console.log("LT242: exact Mega emblem once, full name, compact wrapping, original ranking unchanged PASS");
