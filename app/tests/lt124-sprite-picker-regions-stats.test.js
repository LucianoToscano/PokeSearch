"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const dir=path.resolve(__dirname,"../src/main");
const sprites=require("../src/main/assets/sprite_offline.js");
const dock=fs.readFileSync(path.join(dir,"assets/dock.html"),"utf8");
const stats=fs.readFileSync(path.join(dir,"java/com/lucianotoscano/pokesearchoverlay/FirebaseStats.java"),"utf8");
const home=fs.readFileSync(path.join(dir,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
let count=0;function check(name,fn){fn();count++;console.log("PASS LT124 "+name);}
check("exact Galarian Zen and Standard Darmanitan variants",()=>{
 for(const [form,id] of [["DARMANITAN_GALARIAN_STANDARD",10177],["DARMANITAN_GALARIAN_ZEN",10178]]){
  const art=sprites.resolve({number:"#555",name:"Darmanitan",form,shiny:false,image:""});
  assert.equal(art.officialForm,true,form);
  const exactLocal=form.endsWith("ZEN")?"555-galar-zen.png":"555-galar.png";
  assert.equal(art.src,"file:///android_asset/pokemon-sprites/forms/"+exactLocal,form);
  assert.ok(art.original.endsWith("/"+id+".png"),form);
 }
});
check("Squawkabilly all four colours and their alternate labels preserve exact GO Shiny art",()=>{
 for(const [form,color] of [["White","WHITE"],["Squawkabilly White","WHITE"],
  ["Yellow","YELLOW"],["Blue","BLUE"],["Green Plumage","GREEN"]]){
  const art=sprites.resolve({number:"#931",name:"Squawkabilly",form,shiny:true,image:""});
  const file="pm931.f"+color+".s.icon.png";
  assert.equal(art.officialForm,true,form);
  assert.equal(art.src,"file:///android_asset/pokemon-sprites/costumes/"+file,form);
  assert.ok(art.original.endsWith("/"+file),form);
 }
});
check("GO 2026 Goggles and 2019 Copy now use exact offline icons",()=>{
 const goggles=sprites.resolve({number:"#4",name:"Charmander",form:"CHARMANDER_GOGGLES_2026",image:""});
 assert.equal(goggles.src,"file:///android_asset/pokemon-sprites/costumes/4-goggles-2026.png");
 const clone=sprites.resolve({number:"#6",name:"Charizard",form:"CHARIZARD_COPY_2019",image:""});
 assert.equal(clone.src,"file:///android_asset/pokemon-sprites/costumes/6-copy-2019.png");
 assert.equal(sprites.resolve({number:"#6",name:"Charizard",form:"CHARIZARD_COPY_2019",shiny:true,image:""}).src,"");
});
check("search picker reuses exact form resolver instead of base sprites for costumes",()=>{
 assert.match(dock,/function exactSuggestionSprite\(item\)/);
 assert.match(dock,/function pooledExactSprite\(url\)/);
 assert.match(dock,/exactSource\?pooledExactSprite\(exactSource\):pooledBaseSprite\(item.image\)/);
 assert.match(dock,/COPY\|GOGGLES\|COSTUME/);
 assert.match(dock,/list\.scrollTop=0/);
});
check("both Pokeball ON/OFF asset controls preserved",()=>{
 assert.match(home,/secondaryOverlayControl=makeIcon\(R\.drawable\.sem_filtro/);
 assert.match(home,/R\.drawable\.personalizado:R\.drawable\.sem_filtro/);
});
check("Firebase recoverable init failures still retain unknown counters",()=>{
 assert.match(stats,/initialized=false;render\(\)/);
 assert.match(stats,/FirebaseApp\.getInstance\("PokeSearchStats"\)/);
 assert.match(stats,/onlineCount<0\?"—"/);
});
console.log("LT124 "+count+"/"+count+" PASS");
