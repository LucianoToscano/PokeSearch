"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const app=path.resolve(__dirname,"../src/main");
const res=path.join(app,"res/drawable-nodpi");
const sources=path.resolve(__dirname,"../artwork-originals/branding");
const names=["ps_home_background_light","ps_home_background_dark",
 "ps_home_brand_transparent","ps_home_official_wordmark",
 "ps_team_mystic","ps_team_valor","ps_team_instinct","ps_team_neutral",
 "support_pikachu_coin"];
for(const name of names){
 const webp=path.join(res,name+".webp"),png=path.join(res,name+".png");
 assert(fs.existsSync(webp)||fs.existsSync(png),name+": source absent");
 if(fs.existsSync(webp)){
  const b=fs.readFileSync(webp);
  assert.equal(b.toString("ascii",0,4),"RIFF");
  assert.equal(b.toString("ascii",8,12),"WEBP");
  assert(!fs.existsSync(png),name+": duplicated PNG would inflate APK");
 }
}
const branding=["PokeSearchLogoShinyBlueEffectAll.png","PokeSearchLogoShinyBlueEffect.png",
 "PokeSearchLogoShiny.png","PokeSearchName.png"];
const bundled=branding.filter(name=>fs.existsSync(path.join(app,"assets/branding",name)));
const archived=branding.filter(name=>fs.existsSync(path.join(sources,name)));
assert(bundled.length===4||archived.length===4);
if(archived.length===4)assert.equal(bundled.length,0,"no runtime branding originals should be packed");
console.log("LT186 original brand sources retained; runtime WebP with no duplicates: PASS");
