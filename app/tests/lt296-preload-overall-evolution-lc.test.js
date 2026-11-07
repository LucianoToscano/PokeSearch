"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const read=name=>fs.readFileSync(path.join(assets,name),"utf8");
const files=["pvp_rank_explorer.js","pvp_rank_moves.js","pvp_evolution_moves_ui.js",
 "sprite_offline.js","pvpoke-little-ranks.js"];
for(const file of files)new vm.Script(read(file),{filename:file});
const html=read("detail.html");
assert.ok(html.includes('<script src="pvpoke-little-ranks.js"></script>'));
assert.ok(html.includes("PokeSearchEvolutionMoves?.prime?.()"));
assert.ok(html.includes("#psLeagueClose{display:none!important}"));
assert.ok(html.includes("Rank Raides"));
const w={};
new Function("window",read("pvpoke-overall-ranks.js"))(w);
new Function("window",read("pvpoke-little-ranks.js"))(w);
assert.equal(w.POKESEARCH_PVPOKE_OVERALL.lc.length,528);
const explorer=require("../src/main/assets/pvp_rank_explorer.js");
assert.equal(explorer.getOverallRows(w.POKESEARCH_PVPOKE_OVERALL,"lc")[0].name,"Wynaut");
assert.equal(explorer.getOverallRows(w.POKESEARCH_PVPOKE_OVERALL,"lc")[0].rank,1);
assert.equal(explorer.getIvRows(null,"Bulbasaur","lc"),null);
assert.equal(typeof explorer.switchOverallSpecies,"function");
const sprite=require("../src/main/assets/sprite_offline.js");
assert.match(sprite.rankSprite("Squirtle"),/7\.png$/);
assert.match(sprite.rankSprite("Wartortle"),/8\.png$/);
assert.match(sprite.rankSprite("Blastoise"),/9\.png$/);
assert.equal(sprite.rankSprite("Squirtle (Shadow)"),"");
const rows=["Squirtle","Wartortle","Blastoise"].map(name=>{
 const button={dataset:{psLeague:"gl",psName:name,psMega:"false"},
  setAttribute(){},title:""};
 return {button,querySelector(sel){return sel===".evoMovesAction"?button:null;}};
});
const fake={document:{querySelectorAll(){return rows;}},PokeSearchPvpRankMoves:{
 getStatus:async(league,name)=>({verified:true,mt:name==="Blastoise"?"elite":"normal"})
}};
new Function("window",read("pvp_evolution_moves_ui.js"))(fake);
fake.PokeSearchEvolutionMoves.setScope("lt296");
assert.equal(fake.PokeSearchEvolutionMoves.prime(),true);
(async()=>{
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(rows[0].button.dataset.psMt,"normal");
 assert.equal(rows[1].button.dataset.psMt,"normal");
 assert.equal(rows[2].button.dataset.psMt,"elite");
 const move={name:"Planta Mortal",type:"grass",status:"elite",localeVerified:true};
 const html=fake.PokeSearchEvolutionMoves.render("Venusaur","gl",false,false,{
  fast:{name:"Chicote de Vinha",type:"grass",status:"normal",localeVerified:true},
  charged:[move]});
 assert.ok(html.includes("mt-carregada-elite-lt265.png"));
 assert.ok(!html.includes(">Elite</small>"));
 console.log("LT296: LC, IV scope, exact sprites, MT preload and Elite Charged icon OK");
})().catch(error=>{console.error(error);process.exitCode=1;});
