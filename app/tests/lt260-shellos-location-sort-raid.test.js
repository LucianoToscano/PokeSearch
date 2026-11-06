"use strict";
/* LT260: Shellos/Gastrodon exact sea art must be present IN the release,
 * and clearing location must persist Despawn without deleting other filters. */
const assert=require("node:assert/strict"),fs=require("node:fs"),
 path=require("node:path"),vm=require("node:vm");
const app=path.join(__dirname,"../src/main");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const sprite=require("../src/main/assets/sprite_offline.js");
const uri="file:///android_asset/pokemon-sprites/";
const names=["Shellos","Gastrodon"];
const all=[];
for(const [i,dex] of [422,423].entries()){
 const name=names[i];
 for(const shiny of [false,true]){
  const sea={name,number:"#"+dex,form:"East Sea",shiny,
   costume_id:0,image:""};
  const stem="pm"+dex+".fEAST_SEA."+(shiny?"s.":"")+"icon.png";
  const expected=uri+"costumes/"+stem;
  const pinned=sprite.resolve(sea);
  assert.equal(pinned.src,expected,"East Sea must use shipped exact art");
  assert.equal(pinned.offline,true);
  assert.equal(pinned.exactForm,true);
  assert.equal(sprite.resolve({...sea,form:"EAST_SEA"}).src,expected);
  assert.equal(sprite.resolve({...sea,image:"https://site.test/preview.png",
   imageFromSite:true}).src,expected,"the brittle site URL must not hide bundled Sea art");
  const west={...sea,form:"West Sea"};
  assert.equal(sprite.resolve(west).src,
   uri+(shiny?"shiny/":"base/")+dex+".png",
   "West Sea is the verified default and must remain unchanged");
  assert.equal(sprite.resolve({...west,image:"https://site.test/west.png",
   imageFromSite:true}).src,"https://site.test/west.png",
   "keep verified West Sea provider path for backward compatibility");
  assert.notEqual(sprite.resolve({...sea,form:"unknown"}).src,
   uri+"base/"+dex+".png","unverified variant cannot become West Sea");
  assert.equal(sprite.resolve({...sea,costume_id:9}).src,"",
   "do not convert costume to ordinary regional form");
 }
 for(const form of ["EAST","WEST"]){
  for(const shiny of [false,true]){
   const name="pm"+dex+".f"+form+"_SEA."+(shiny?"s.":"")+"icon.png";
   all.push(name);
  }
 }
}
const manifest=read("app/src/main/assets/go-exact-sprites.tsv");
const generator=read("app/scripts/build_sprite_bundle.py");
const policy=read(".github/workflows/pokesearch-official-release.yml");
const paired=all.map(name=>{
 const match=manifest.split("\n").find(line=>line.startsWith(name+"\t"));
 assert.ok(match,"verified GO sprite is not in source manifest: "+name);
 const sha=match.split("\t")[1];
 assert.match(sha,/^[a-f0-9]{40}$/);
 assert.ok(generator.includes('"costumes/'+name+'": ("'+name+'", "'+sha+'")'),
  "build script must pin exact Git blob: "+name);
 assert.ok(policy.includes('"'+name+'"'),
  "signed release must block if this exact Sea image missing: "+name);
 return name;
});
assert.equal(paired.length,8);
const java=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const beginning=java.indexOf("private boolean persistLocationToggleSort(boolean enabled,boolean repairInvalidDistance)");
const ending=java.indexOf("@JavascriptInterface public void setLocation(",beginning);
assert.ok(beginning>=0&&ending>beginning);
const policyBody=java.slice(beginning,ending);
for(const contract of [
 'new JSONObject(extraFiltersJson)',
 '"Distance (nearest)"',
 'filters.put("sortBy",wanted)',
 'filters.optJSONArray("clearExtraKeys")',
 'extraFiltersJson=filters.toString()',
 'putString("extraFiltersJson",extraFiltersJson)'
 ])assert.ok(policyBody.includes(contract),"persisted sort policy missing: "+contract);
assert.ok(!policyBody.includes('filters=new JSONObject()'),
 "must preserve other filter fields instead of replacing the JSON object");
const setter=java.slice(ending,ending+2500);
assert.ok(setter.includes('final boolean toggled=locationEnabled!=enabled;'));
assert.ok(setter.includes('persistLocationToggleSort(enabled,false)'),
 "location transition must apply the automatic default");
assert.ok(setter.includes('(!enabled&&persistLocationToggleSort(false,true))'),
 "repeated remove only repairs stale invalid Distance, not a manual sort");
assert.ok(setter.indexOf('persistLocationToggleSort(enabled,false)')<
 setter.indexOf('if(locationEnabled==enabled&&'),"correct before early return");
const dock=read("app/src/main/assets/dock.html");
assert.ok(dock.includes('if(!locationEnabled){\n  if(searchSettings.sortBy==="Distance (nearest)")'));
assert.ok(dock.includes('modeDraft.sortBy="Despawn (longest)"'));
const detail=read("app/src/main/assets/detail.html");
assert.ok(detail.includes("Módulo PvE indisponível nesta instalação"),
 "Raid button should still appear when remote script fails");
assert.ok(detail.includes('if(changed||document.getElementById("raidRow")?.hidden)loadRaidBeforeCapture(c);'),
 "Raid button must recover on rerender");
const script=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
console.log("LT260 PASS: 8 pinned Sea PNGs, East/West/Shiny identity, release asset gate, instant Distance→Despawn and Raid fallback");
