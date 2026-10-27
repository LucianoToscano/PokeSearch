"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const s=require("../src/main/assets/sprite_offline.js");
const code=fs.readFileSync(path.join(root,"src/main/java/com/lucianotoscano/pokesearchoverlay/FirebaseStats.java"),"utf8");
const build=fs.readFileSync(path.join(root,"scripts/build_sprite_bundle.py"),"utf8");
const dock=fs.readFileSync(path.join(root,"src/main/assets/dock.html"),"utf8");
const fn=fs.readFileSync(path.join(root,"../functions/index.js"),"utf8");
let n=0;const check=(name,cb)=>{cb();++n;console.log("PASS LT125 "+name)};
check("Goggles 2026: exact normal/Shiny for 4 5 6",()=>{
 for(const dex of [4,5,6]){
  for(const shiny of [false,true]){
   const art=s.resolve({number:"#"+dex,form:"GOGGLES_2026",shiny,image:""});
   assert.equal(art.officialCostume,true);
   assert.equal(art.src,"file:///android_asset/pokemon-sprites/costumes/"+dex+"-goggles-2026"+(shiny?"-shiny":"")+".png");
  }
 }
});
check("Copy 2019: species-specific normal art and no fake shiny",()=>{
 for(const dex of [3,6,9]){
  const art=s.resolve({number:"#"+dex,form:"COPY_2019",image:""});
  assert.equal(art.officialCostume,true);assert.match(art.src,/costumes\/(?:3|6|9)-copy-2019.png$/);
  const unknown=s.resolve({number:"#"+dex,form:"COPY_2019",shiny:true,image:""});
  assert.equal(unknown.src,"");assert.equal(unknown.missingExact,true);
 }
 const female=s.resolve({number:"#3",form:"VENUSAUR_COPY_2019",gender:"FEMALE"});
 assert.match(female.src,/3-copy-2019-female.png$/);
});
check("unrecognized costume/form never borrows base art",()=>{
 assert.equal(s.resolve({number:"#4",name:"Charmander",form:"GOFEST_OTHER_HAT",image:""}).src,"");
 assert.equal(s.resolve({number:"#25",name:"Pikachu",form:"GOGGLES_2026",image:""}).src,"");
});
check("pin immutable upstream binary identity and package 10 PNGs",()=>{
 assert.match(build,/COSTUME_SOURCE_COMMIT = "c2a686eb08ace6e890d8fe3d2134c76988db87b5"/);
 assert.match(build,/hashlib\.sha1/);
 assert.match(build,/costume_hashes/);
 assert.match(build,/verified_png\(image\)/);
 assert.equal((build.match(/"costumes\/[a-z0-9-]+\.png": \(/g)||[]).length,10);
});
check("picker handles costumes, shared details cards retain resolver",()=>{
 assert.match(dock,/art\.officialCostume/);
 assert.match(dock,/\(\?:forms\|costumes\)/);
});
check("legacy realtime count fallback is explicitly secondary to server aggregate",()=>{
 assert.match(code,/root\.child\("online"\)\.addValueEventListener\(legacyCounter\(true\)\)/);
 assert.match(code,/root\.child\("installations"\)\.addValueEventListener\(legacyCounter\(false\)\)/);
 assert.match(code,/if\(!publicOnlineAvailable\)onlineCount=total/);
 assert.match(code,/if\(!publicInstallAvailable\)installCount=total/);
 assert.match(code,/onlineCount=publicOnlineAvailable\?checked:legacyOnlineCount/);
 assert.match(code,/onCancelled\(DatabaseError error\)/);
});
check("backend uses explicit Firebase RTDB instance and real server reconciliation",()=>{
 assert.match(fn,/statsDatabase=\(\)=>getDatabase\(undefined,DB_URL\)/);
 assert.match(fn,/stats\/serverCounters/);
 assert.match(fn,/reconcileCounters/);
});
console.log("LT125 "+n+"/"+n+" PASS");
