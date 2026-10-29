"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);new vm.Script(script);
const css=html.slice(html.indexOf("/* LT148: native card"));
assert.ok(css.includes('#rankLine::before{content:"▥";'),"no favorite star on rank");
assert.ok(!css.includes('#rankLine.isSite'),"unverified site rank has no badge style");
assert.ok(css.includes('#major .statHeading,#major .statValue{position:relative;top:1px}'),"1px lower text, not whole cards");
assert.ok(html.includes('#major .statTile{height:23px;min-height:23px;max-height:23px;'),"height unchanged");
assert.ok(script.includes('c.ivRankSource==="explicit-species-iv"&&showRaw'),"verified species IV only");
assert.ok(script.includes('league.toUpperCase()+" · IV #"+ivValue'),"IV rank includes league and scope");
assert.ok(!script.includes('Rank do site #'),"ambiguous site rank must not be visible");
assert.ok(script.includes('never show it as a verified IV/PvP rank'),"unlabeled provider rank is ignored");
assert.ok(!script.includes('rankLine.textContent=c.rank?"Rank "+String(c.rank):""'),"unlabeled rank gone");
assert.ok(script.includes('if(!rows.length&&!own)continue;'),"own analysis allowed without evolution");
assert.ok(script.includes('if(!count&&!ownCount){'),"no fabricated analysis");
assert.ok(script.includes('Ranking indisponível para esta forma.'),"clear status instead of blank card");
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
 return {text:ctx.rankOut,title:span.title,hidden:span.hidden};
}
const tests=[
 [{ivRank:1,ivRankLeague:"gl",ivRankSource:"explicit-species-iv",rank:"14"},true,"GL · IV #1"],
 [{ivRank:2,ivRankLeague:"ul",ivRankSource:"explicit-species-iv",rank:"1"},true,"UL · IV #2"],
 [{rank:"1"},false,""],
 [{ivRank:1,ivRankLeague:"gl",ivRankSource:"other",rank:"7"},true,""],
 [{ivRank:1,ivRankLeague:"gl",ivRankSource:"explicit-species-iv",rank:"1"},false,""],
 [{ivRank:1,ivRankLeague:"ml",ivRankSource:"explicit-species-iv",rank:"1"},true,""],
 [{rank:""},false,""],[{rank:"0"},false,""]];
for(const [c,raw,expected] of tests){
 const result=rank(c,raw);
 assert.equal(result.text,expected);
 assert.equal(result.hidden,!expected,"only verified PvP IV ranks show badge");
}
assert.equal(rank({rank:"1"},false).title,"","unverified rank has no tooltip");
assert.ok(rank({ivRank:1,ivRankLeague:"gl",ivRankSource:"explicit-species-iv"},true).title.includes("Ranking dos IVs"));
console.log("LT148 verified-only PvP IV rank and centered IV/PC/Nv text PASS");
