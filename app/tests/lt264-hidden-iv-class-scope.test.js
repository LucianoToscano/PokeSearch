"use strict";
/* LT264: a verified IV Class #1 is NOT a cross-species GBL rank #1.
 * Hidden rank strips must not reserve height on the real Android cards. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const read=p=>fs.readFileSync(path.join(assets,p),"utf8");
const detail=read("detail.html"),explorerText=read("pvp_rank_explorer.js");
const windowMock={};
new Function("window",read("pvpoke-iv-gamemaster.js"))(windowMock);
const explorer=require("../src/main/assets/pvp_rank_explorer.js");
const gm=windowMock.POKESEARCH_PVP_IV_DATA;
const ranked=(name,iv)=>{
 const all=explorer.getIvRows(gm,name,"gl");
 assert.equal(all?.length,4096,"GM must verify all IV combinations of "+name);
 return all.find(x=>x.iv===iv);
};
// These little species cannot reach 1500 CP at level 50. Their hundo has
// the best IV STAT PRODUCT, but it is not GL Rank Geral #1.
assert.deepEqual(
 ["Mareep","Sandshrew"].map(x=>{
  const r=ranked(x,"15/15/15");
  assert.equal(r.rank,1,"the species IV class ranking is genuinely #1");
  assert.equal(r.level,50);
  assert.ok(r.cp<1500);
  return r.cp;
 }),[1120,1426]);
const bird=ranked("Squawkabilly","15/15/15");
assert.equal(bird.rank,927,"hundo bird is NOT IV #1 in Great League");
assert.ok(bird.cp<=1500);
assert.ok(detail.includes('rankLine.hidden=!verifiedIvRank'));
assert.ok(detail.includes('rankLine.removeAttribute("data-league")'),
 "hidden unverified rank must remove the empty data-league attribute");
const flex=detail.lastIndexOf("#rankLine,#rankLine[data-league]");
const collapse=detail.lastIndexOf("#rankLine[hidden],#rankLine[data-league][hidden]");
assert.ok(collapse>flex,"CSS [hidden] rule must come after the strong !important flex override");
const hiddenCss=detail.slice(collapse,collapse+265);
assert.match(hiddenCss,/display:none!important/);
assert.match(hiddenCss,/min-height:0!important/);
assert.match(hiddenCss,/height:0!important/);
assert.match(hiddenCss,/margin:0!important/);
assert.ok(detail.includes("Rank Classe IV #"),
 "compact chip must say Class and not imply all-Pokemon rank");
assert.ok(explorerText.includes("Posição entre 4.096 IVs de "),
 "ranking explorer must explain the species-only scope");
assert.ok(explorerText.includes("' — não é o Rank Geral da '+safe(LIGAS[s.league])"),
 "explorer must explicitly distinguish species from GBL ranking");
assert.ok(explorerText.includes("s.kind===\"class\"?"),
 "only class ranking should get the species-IV disclaimer");
assert.ok(!detail.includes('button.textContent="🏆 Raid'));
assert.ok(detail.includes("ui-icons/ps-raid-lt268.png"));
assert.ok(detail.includes("ui-icons/mt-unknown.png"));
new vm.Script(detail.match(/<script>([\s\S]*?)<\/script>/)?.[1]);
new vm.Script(explorerText);
console.log("LT264 PASS: hidden GL row truly collapses, Mareep/Sandshrew IV #1 is species-only; Squawkabilly hundo #927, real rank & Raid intact");
