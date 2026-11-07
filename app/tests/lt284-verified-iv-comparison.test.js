"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const rank=require(path.join(assets,"pvp_rank_explorer.js"));
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);

const gm={retrieved:"lt284-fixture",pokemon:[
 ["burmy_sandy","Burmy (Sandy)",53,83,120],
 ["wormadam_trash","Wormadam (Trash)",127,175,155]
],cpms:Array.from({length:99},(_,i)=>0.13+(i*0.007))};
const overall={gl:[[1,"Burmy (Sandy)",42]],ul:[[1,"Burmy (Sandy)",72]],
 ml:[[1,"Burmy (Sandy)",314]]};
const ivA="0/15/15",ivB="15/15/15";
const result=rank.compareIv(gm,"Burmy (Sandy)",ivA,ivB,overall);
assert.ok(Array.isArray(result)&&result.length===3);
for(const [i,league] of ["gl","ul","ml"].entries()){
 const x=result[i],rows=rank.getIvRows(gm,"Burmy (Sandy)",league);
 assert.equal(x.league,league);
 assert.equal(x.verified,true);
 assert.equal(x.a.rank,rows.find(r=>r.iv===ivA).rank);
 assert.equal(x.b.rank,rows.find(r=>r.iv===ivB).rank);
 assert.equal(x.a.cp,rows.find(r=>r.iv===ivA).cp);
 assert.equal(x.b.efficiency,rows.find(r=>r.iv===ivB).efficiency);
 assert.ok(["a","b","empate"].includes(x.better));
 assert.ok(x.overallRank>0);
 assert.ok(x.a.level>=1&&x.a.level<=50);
}
assert.ok(result[0].overallRank!==result[1].overallRank,
 "the species overall position is league-specific, never IV-derived");
const same=rank.compareIv(gm,"Burmy (Sandy)",ivA,ivA,overall);
assert.ok(same.every(x=>x.better==="empate"));
assert.equal(rank.compareIv(gm,"Burmy (Sandy)","16/0/0",ivB,overall),null);
assert.equal(rank.compareIv(gm,"Burmy","0/0/0",ivB,overall),null,
 "unsupported form cannot reuse base");
const dup={...gm,pokemon:[...gm.pokemon,["copy","Burmy (Sandy)",53,83,120]]};
assert.equal(rank.compareIv(dup,"Burmy (Sandy)",ivA,ivB,overall),null,
 "ambiguous names must fail closed");
const noOverall=rank.compareIv(gm,"Burmy (Sandy)",ivA,ivB,null);
assert.ok(noOverall.every(x=>x.verified&&x.overallRank===null));
const ambiguousOverall={...overall,gl:[[1,"Burmy (Sandy)",42],[2,"Burmy (Sandy)",50]]};
assert.equal(rank.compareIv(gm,"Burmy (Sandy)",ivA,ivB,ambiguousOverall)[0].overallRank,null);
assert.match(html,/#psMetricPanel \.psCpRankCompare\{/);
assert.ok(html.includes('id="psCpAdvanced"'));
assert.ok(html.includes('ontoggle="psCpRankToggle(this)"'));
assert.ok(html.includes('id="psCpRankCompare"'));
assert.ok(html.includes('psCpRenderRankCompare(row,iv,compare);'));
assert.ok(html.includes('Rank Classe compara IVs, não desempenho entre espécies.'));
assert.ok(html.includes('RG aparece somente com identidade confirmada. Custos de Doces/Poeira e Mega não são inferidos.'));
const begin=script.indexOf("function psCpRenderRankCompare(row,iv,compare){");
const end=script.indexOf("function psCpRankToggle(node){",begin);
assert.ok(begin>=0&&end>begin);
const segment=script.slice(begin,end);
const view={innerHTML:"",textContent:"",setAttribute(k,v){this[k]=v;}};
const advanced={open:false};let resizes=0;
const dom={getElementById:id=>id==="psCpRankCompare"?view:
 id==="psCpAdvanced"?advanced:null};
let compareCalls=0;
const win={PokeSearchRankExplorer:{compareIv(...args){compareCalls++;return rank.compareIv(...args);}},
 POKESEARCH_PVP_IV_DATA:gm,POKESEARCH_PVPOKE_OVERALL:overall};
const render=new Function("document","window","h","resizeEvolutionPanel",
 segment+"return psCpRenderRankCompare;")(dom,win,x=>String(x),()=>{resizes++});
assert.equal(render(gm.pokemon[0],[0,15,15],[15,15,15]),false,
 "collapsed editor never requests large ranking");
assert.equal(compareCalls,0);
advanced.open=true;
assert.equal(render(gm.pokemon[0],[0,15,15],[15,15,15]),true);
assert.equal(compareCalls,1);
assert.match(view.innerHTML,/Rank Classe/);
assert.match(view.innerHTML,/Burmy \(Sandy\)/);
assert.match(view.innerHTML,/GL/);
assert.match(view.innerHTML,/UL/);
assert.match(view.innerHTML,/ML/);
assert.match(view.innerHTML,/PC/);
assert.match(view.innerHTML,/Nv\./);
assert.match(view.innerHTML,/psCpRankBetter/);
assert.match(view.innerHTML,/RG #42/,"GL rank belongs to exact species");
assert.match(view.innerHTML,/RG #72/,"UL rank is independently verified");
assert.equal(resizes,1);
win.PokeSearchRankExplorer=null;
assert.equal(render(gm.pokemon[0],[0,15,15],[15,15,15]),false);
assert.equal(view.textContent,"Ranks não confirmados para esta forma ou estes IVs.");
console.log("LT284 PASS: verified A/B rank uses 4096 IV rows in three leagues, exact forms, lazy display, no invented results");
