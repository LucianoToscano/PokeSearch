"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);new vm.Script(script);
const css=html.slice(html.indexOf("/* LT148: native card"));
assert.ok(css.includes('#rankLine::before{content:"▥";'),"no favorite star on rank");
assert.ok(css.includes('#rankLine.isSite{border-color:#ffffff30;'),"unknown scope neutral, not gold");
assert.ok(css.includes('#major .statHeading,#major .statValue{position:relative;top:1px}'),"1px lower text, not whole cards");
assert.ok(html.includes('#major .statTile{height:23px;min-height:23px;max-height:23px;'),"height unchanged");
assert.ok(script.includes('c.ivRankSource==="explicit-species-iv"&&showRaw'),"verified species IV only");
assert.ok(script.includes('IV "+league.toUpperCase()+" #"+ivValue'),"IV rank includes league");
assert.ok(script.includes('rankFromSite?"Rank do site #"+siteRank:""'),"generic site rank explicitly scoped");
assert.ok(script.includes('não há confirmação se é ranking geral, de espécie ou de IVs.'),"site rank disclaimer");
assert.ok(!script.includes('rankLine.textContent=c.rank?"Rank "+String(c.rank):""'),"unlabeled rank gone");
assert.ok(script.includes('if(!rows.length&&!own)continue;'),"own analysis allowed without evolution");
assert.ok(script.includes('if(!count&&!ownCount){outer.hidden=true;return false;}'),"no fabricated analysis");
assert.ok(script.includes('"Análise IV PvP · "+ownCount+" ligas"'),"own-only analyses accurately named");
assert.ok(html.includes('Math.ceil(panel.scrollHeight)+3'),"no phantom-scroll regression");
const start=script.indexOf(' const rankLine=document.getElementById("rankLine");');
const end=script.indexOf(' const movesHtml=presenter?',start);
assert.ok(start>0&&end>start);
const rankJs=script.slice(start,end);
function rank(c,showRaw){
 const span={textContent:"",hidden:true,title:"",classList:{toggle(){}}};
 const ctx={document:{getElementById(id){assert.equal(id,"rankLine");return span;}},c,showRaw};
 vm.runInNewContext(rankJs+";this.rankOut=rankLine.textContent;",ctx);
 return {text:ctx.rankOut,title:span.title};
}
const tests=[
 [{ivRank:1,ivRankLeague:"gl",ivRankSource:"explicit-species-iv",rank:"14"},true,"IV GL #1"],
 [{ivRank:2,ivRankLeague:"ul",ivRankSource:"explicit-species-iv",rank:"1"},true,"IV UL #2"],
 [{rank:"1"},false,"Rank do site #1"],
 [{ivRank:1,ivRankLeague:"gl",ivRankSource:"other",rank:"7"},true,"Rank do site #7"],
 [{rank:""},false,""],[{rank:"0"},false,""]];
for(const [c,raw,expected] of tests)assert.equal(rank(c,raw).text,expected);
assert.ok(rank({rank:"1"},false).title.includes("não há confirmação"));
console.log("LT148 rank provenance, ranking glyph and 1px IV/PC/Nv baseline PASS");
