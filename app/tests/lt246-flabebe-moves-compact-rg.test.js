"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main/assets"),art=require("../src/main/assets/sprite_offline.js");
const colors=["RED","YELLOW","BLUE","ORANGE","WHITE"];
const goSha={
 "pm669.fRED.icon.png":"ab0f6fb4ed07592ea0f557d573de4480c34f64ba",
 "pm669.fRED.s.icon.png":"9456422a8350bb68cf6242a8b401614cfd5b5b35",
 "pm669.fYELLOW.icon.png":"5b0b366c3aecdec905ee293a64d7be68f02180ff",
 "pm669.fYELLOW.s.icon.png":"e428ff904a8e363de14b7abcd5c2cc3c440f0d81",
 "pm669.fBLUE.icon.png":"c686a769f47e54a2600203cf61bdf4b4f2172fc8",
 "pm669.fBLUE.s.icon.png":"ce0400b4c5a96123704570eded7015ed98b6e27c",
 "pm669.fORANGE.icon.png":"07c57adf382d42a4b91a0ed12bfb4326ed142cd7",
 "pm669.fORANGE.s.icon.png":"8d2cba757d5ddf2228112e3a9fc93107d31f1173",
 "pm669.fWHITE.icon.png":"76a6f538ba673644fb9f724c6751360fd4aafcf0",
 "pm669.fWHITE.s.icon.png":"981165d6f2e4902062bf91d7ffcf6257bf696251"
};
for(const color of colors)for(const shiny of [false,true]){
 const file="pm669.f"+color+(shiny?".s":"")+".icon.png";
 const content=fs.readFileSync(path.join(base,"pokemon-sprites/costumes",file));
 assert.equal(content.subarray(0,8).toString("hex"),"89504e470d0a1a0a","valid PNG "+file);
 const blob=crypto.createHash("sha1").update(Buffer.from("blob "+content.length+"\0"))
  .update(content).digest("hex");
 assert.equal(blob,goSha[file],"original pinned Pokémon GO bytes for "+file);
 const chosen=art.resolve({name:"Flabébé",number:"#669",form:color,shiny});
 assert.equal(chosen.src,"file:///android_asset/pokemon-sprites/costumes/"+file,"exact variant bundled");
 assert.equal(chosen.offline,true);
 assert.equal(chosen.goExact,true);
 assert.notEqual(chosen.src,art.resolve({name:"Flabébé",number:"#669",form:colors[(colors.indexOf(color)+1)%colors.length],shiny}).src);
}
const detail=fs.readFileSync(path.join(base,"detail.html"),"utf8"),
dock=fs.readFileSync(path.join(base,"dock.html"),"utf8");
for(const script of detail.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
 new vm.Script(script[1]);
assert.ok(detail.includes('recommendation.availableOnly===true'));
assert.ok(detail.includes('Sem recomendação PvPoke'));
assert.ok(detail.includes('Sem conjunto PvP recomendado'));
assert.ok(detail.includes('psAvailableMoveDetails'),"possible-move pools are closed by default");
assert.ok(detail.includes('psVerifiedMoveIcons'),"verified sword does not reset when card rerenders");
assert.ok(detail.includes("currentCardMoves"),"captured moves remain visible with no remote source");
assert.ok(dock.includes('engine?.bundledExactForArt?.(card,art)'));
assert.ok(dock.includes('const nativeArt=window.PokeSearchOfflineSprite?.bundledExactForArt?.(c,art)'));
const insights=require("../src/main/assets/pvp_rank_moves.js");
const gm={
 pokemon:[{speciesId:"rattata",speciesName:"Rattata",
  fastMoves:["TACKLE","QUICK_ATTACK"],chargedMoves:["DIG","HYPER_FANG"],
  eliteMoves:["HYPER_FANG"],legacyMoves:[]}],
 moves:[{moveId:"TACKLE",name:"Tackle"},{moveId:"QUICK_ATTACK",name:"Quick Attack"},
        {moveId:"DIG",name:"Dig"},{moveId:"HYPER_FANG",name:"Hyper Fang"}]};
const possible=insights.fromAvailable(gm,"gl","Rattata");
assert.ok(possible);
assert.equal(possible.availableOnly,true);
assert.equal(possible.recommended,false);
assert.equal(possible.fastMoves[0].id,"TACKLE");
assert.equal(possible.chargedMoves[1].status,"elite");
assert.equal(insights.fromData([],gm,"gl","Rattata"),null,"no invented PvPoke recommendations");
const local=insights.localizedMoves(possible,[
 {proto:"TACKLE_FAST",moveId:100,type:1},
 {proto:"QUICK_ATTACK_FAST",moveId:101,type:1},
 {proto:"DIG",moveId:102,type:5},
 {proto:"HYPER_FANG",moveId:103,type:1}
],{
 move_100:"Investida",move_101:"Ataque Rápido",move_102:"Cavar",move_103:"Hiperpresa"
});
assert.equal(local.fastMoves[0].name,"Investida");
assert.equal(local.fastMoves[0].type,"normal");
assert.equal(local.chargedMoves[0].name,"Cavar");
assert.equal(local.chargedMoves[0].type,"ground");
assert.equal(local.chargedMoves[1].status,"elite");
const missingTranslation=insights.localizedMoves(possible,[],{});
assert.equal(missingTranslation.fastMoves.length,0,"no fake English translations");
assert.equal(missingTranslation.chargedMoves.length,0);
const snippet=detail.slice(detail.indexOf("function updateVisiblePvPRank(payload){"),
 detail.indexOf("window.showEvolutionDetails=payload=>"));
assert.ok(snippet.includes("withOverall"),"RG-primary logic still present");
assert.ok(snippet.includes('badge.textContent=hasVerifiedOverall?"RG #"+best.overallRank:"RG —"'),
 "verified RG is shown while unverified forms get a neutral, disabled RG placeholder");
assert.ok(snippet.includes('iv.textContent=label+" IV #"+best.rank'));
assert.ok(detail.includes('badge.dataset.psKind="overall"'),
 "RG button must open the independently verified species ranking");
const secondary=fs.readFileSync(path.join(base,"../java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
assert.ok(secondary.includes("extends OverlayService"),"P1 and P2 use one verified asset resolver");
console.log("LT246: exact 10 color/shiny PNGs, safe Rattata attacks, separate RG+IV, P1/P2 PASS");
