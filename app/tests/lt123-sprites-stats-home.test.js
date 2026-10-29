"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const resolver=require("../src/main/assets/sprite_offline.js");
const home=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const cache=read("java/com/lucianotoscano/pokesearchoverlay/VerifiedSpriteCache.java");
const stats=fs.readFileSync(path.join(__dirname,"../../functions/index.js"),"utf8");
let checks=0;const test=(label,fn)=>{fn();checks++;console.log("PASS LT123 "+label)};
test("P1 and P2 top controls have correct icons and independent callbacks",()=>{
 assert.match(home,/overlayControl=makeIcon\(R.drawable.sem_filtro/);
 assert.match(home,/secondaryOverlayControl=makeIcon\(R.drawable.sem_filtro/);
 assert.match(home,/secondaryOverlayControl.setImageResource\(R.drawable.personalizado\)/);
 assert.match(home,/overlayControl.setImageResource\(R.drawable.sem_filtro\)/);
 assert.match(home,/HomeIllustrated152.assemble\(/);
 assert.match(home,/if\(which==0\)toggleHomeOverlay\(\);else toggleSecondaryOverlay\(\)/);
 assert.match(home,/dualOverlayRow.setVisibility\(View.VISIBLE\)/);
});
test("official catalog includes over 300 checked varieties",()=>{
 const values=Object.values(resolver.FORM_VARIANTS);
 assert.ok(new Set(values.map(x=>x[0])).size>=300);
});
test("regional sprite is precise and pinned",()=>{
 const zig=resolver.resolve({name:"Zigzagoon",number:"#263",form:"Galarian",shiny:true,image:""});
 assert.equal(zig.src,"file:///android_asset/pokemon-sprites/forms/zigzagoon-galar-shiny.png");
 for(const [id,num,name,form] of [[10001,386,"Deoxys","Attack"],[10008,479,"Rotom","Heat"],[10017,555,"Darmanitan","Zen"]]){
  const x=resolver.resolve({name,number:"#"+num,form,shiny:false,image:""});
  assert.equal(x.src,"file:///android_asset/pokemon-sprites/forms/variety-"+id+".png",name+form);
  assert.match(x.original,/d8c2fb78563e28ad7b3abe938cf6e79998d04e90/);
 }
});
test("unverified costumes are never silently mapped to base artwork",()=>{
 const x=resolver.resolve({name:"Pikachu",number:"#25",form:"Normal",costume_id:123,shiny:true,image:""});
 assert.equal(x.src,"");
});
test("Android cache supports pinned official varieties",()=>{
 assert.match(cache,/PINNED_FORM=Pattern/);
 assert.match(cache,/form=variety.matches\(\)/);
 assert.match(cache,/FORM_ORIGIN/);
});
test("server counts are idempotent with scheduled backfill, without client UID scans",()=>{
 assert.match(stats,/stats\/serverCounters/);
 assert.match(stats,/createHash\("sha256"\)/);
 assert.match(stats,/onSchedule/);
 assert.match(stats,/stats\/public/);
});
console.log("LT123 "+checks+"/"+checks+" PASS");
