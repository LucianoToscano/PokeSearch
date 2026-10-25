"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const dock=read("assets/dock.html"),probe=read("assets/probe.js");
const java=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const geometry=read("java/com/lucianotoscano/pokesearchoverlay/PopupTouchGeometry.java");
const favorites=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
const between=(s,a,b)=>{const start=s.indexOf(a);assert.ok(start>=0,a);const end=s.indexOf(b,start+a.length);assert.ok(end>start,b);return s.slice(start,end)};
let passed=0,failed=0;
function check(name,test){try{test();passed++;console.log("PASS LT68 Samsung "+name)}
 catch(e){failed++;console.error("FAIL LT68 Samsung "+name,e.stack||e.message)}}
check("Modes rail uses content height, not forced 164px scrollbar",()=>{
 const section=between(dock,"function positionCascadeEditor(){","function selectedModeEntry(");
 assert.ok(section.includes("Math.ceil(rail.scrollHeight)+2"));
 assert.ok(section.includes('rail.style.overflowY=rail.scrollHeight>visibleRail?"auto":"hidden"'));
 assert.ok(dock.includes("body.popup-window.controls-window #choices.modeCascade .modeCascadeEditor"));
});
check("Mode numerical editing and user confirmation preserved",()=>{
 for(const bit of ['["attack","A","iv"','["percentMin","Min %","percent"','["glRank","#","rank"','["ulRank","#","rank"','confirm.onclick=()=>','Native.setSearchConfig(JSON.stringify(next))'])
  assert.ok(dock.includes(bit),bit);
});
check("Filter editors have one unobstructed background and icon-only actions",()=>{
 assert.ok(dock.includes("body.popup-window.controls-window #choices.filterCascade .filterCascadeEditor{"));
 assert.ok(dock.includes("background:transparent!important;border:0!important;"));
 for(const bit of ['makeDockAction("apply","Aplicar filtros")','makeDockAction("clear","Limpar filtros")','makeDockAction("cancel","Cancelar alterações")'])
  assert.ok(dock.includes(bit),bit);
});
check("Compact size, gender, 1-50 level and CP confirmation intact",()=>{
 for(const bit of ['repeat(7,23px)','repeat(3,23px)','["XXS","XS","S","M","L","XL","XXL"]','["Male","Female","Genderless"]',
 'levelMin:[1,50]','levelMax:[1,50]','numericConfirmButton(make,[minKey,maxKey],label)'])
  assert.ok(dock.includes(bit),bit);
});
check("Location has validated 0-1000km, paste and scoped actions",()=>{
 for(const bit of ['width:192px!important','slide.max="1000"','radiusField.max="1000"','Native.pasteLocationCoords()',
 'Native.setLocation(true,wantedCoords,wantedRadius)','Native.setLocation(false,"",0)'])
  assert.ok(dock.includes(bit),bit);
});
check("Independent native popup obeys touch geometry and remains anchored",()=>{
 for(const bit of ['PopupTouchGeometry.placeBeside(','PopupTouchGeometry.place(','PopupTouchGeometry.alignRail(','PopupTouchGeometry.avoidResult(','popupParams.width=b.width;popupParams.height=b.height;'])
  assert.ok(java.includes(bit),bit);
 assert.ok(geometry.includes("if(overlaps(candidate,results))continue;"));
});
check("Favorites dialog anchors to the star and lets background taps pass",()=>{
 assert.ok(dock.includes("Native.openWatchListAt(Math.round(target.left-host.left+target.width/2)"));
 assert.ok(java.includes("@JavascriptInterface public void openWatchListAt(int triggerDp,int triggerYDp)"));
 assert.ok(java.includes("showFavoritePicker(anchorX,anchorY)"));
 assert.ok(favorites.includes("int anchorX,int anchorY"));
 assert.ok(favorites.includes("lp.gravity=Gravity.TOP|Gravity.LEFT"));
 assert.ok(favorites.includes("FLAG_NOT_TOUCH_MODAL"));
 assert.ok(favorites.includes("window.setLayout(preferredWidth,"));
});
check("Disabled Get coords cannot click, user can retry after site unlocks",()=>{
 const part=between(probe,'if(action.startsWith("coords:")){','if(action.startsWith("readCoords:")){');
 assert.ok(part.includes('btn.disabled||btn.getAttribute("aria-disabled")==="true"'));
 const clickable={disabled:true,getAttribute:()=>null,closest:()=>null,click(){throw Error("clicked disabled button")}};
 const out=vm.runInNewContext('(function(){const action="coords:{}";'+part+'})()',{
  matchingCoordsCard:()=>({node:{}}),cardCoordsControls:()=>[clickable],
  text:()=> "Get coords",JSON
 });
 assert.equal(JSON.parse(out).cooldown,true);
});
check("Get coords uniquely resolves identity even after index reorder",()=>{
 const part=between(probe,"function matchingCoordsCard(query){",'if(action.startsWith("coords:")){');
 const cards=[{node:{id:0},sourceIndex:0},{node:{id:1},sourceIndex:1}];
 const ctx={cardRoots:()=>cards,parseCard:(node)=>({name:"Yamask",cp:"813",number:"#562",location:node.id===0?"Natal":"Recife"}),clean:s=>String(s).trim(),Array,Number,String};
 const match=vm.runInNewContext(part+';matchingCoordsCard({index:1,name:"Yamask",cp:"813",number:"#562",location:"Recife"})',ctx);
 assert.equal(match.node.id,1);
 const wrong=vm.runInNewContext(part+';matchingCoordsCard({index:1,name:"Yamask",cp:"813",number:"#562",location:"Natal"})',ctx);
 assert.equal(wrong.node.id,0);
 const ambiguous=vm.runInNewContext(part+';matchingCoordsCard({name:"Yamask",cp:"813",number:"#562"})',ctx);
 assert.equal(ambiguous,null);
});
check("Never read Maps coordinates globally or copy stale requests",()=>{
 const read=between(probe,'if(action.startsWith("readCoords:")){','// PL-04: resolve the actual Coords form');
 for(const bit of ["matchingCoordsCard(query)","cardCoordsControls(target)","nextLabelValue(target.node","decodeURIComponent(href)"])
  assert.ok(read.includes(bit),bit);
 assert.ok(!read.includes("elements('button,a,[role=button]')"));
 for(const bit of ["coordinateRequestToken","currentCoordinateTarget(target)","requestToken!=coordinateRequestToken","pollCoordinates(target,0,autoCopy,requestToken)"])
  assert.ok(java.includes(bit),bit);
});
check("Shiny, weather PNG theme, favorites and ten results are not removed",()=>{
 for(const bit of ['WEATHER_THEME_FILES=Object.freeze','weatherChoicePair','visual-light-menu','Native.shiny()','Native.openWatchList()'])
  assert.ok(dock.includes(bit),bit);
 assert.ok(probe.includes("if(cards.length===10)break;"));
 for(const name of ["any","boosted","sunny","rainy","partly-cloudy","cloudy","windy","snow","fog"])
  for(const theme of ["white","black"])assert.ok(fs.existsSync(path.join(root,"assets/weather-icons/v2",name+"-"+theme+".png")));
});
check("Updated JavaScript remains syntactically valid",()=>{
 new vm.Script(probe,{filename:"probe.js"});
 let count=0;
 for(const m of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
  new vm.Script(m[1],{filename:"dock-inline-"+(++count)});
 }
 assert.ok(count>0);
});
console.log("LT68 Samsung hardening: "+passed+" PASS / "+failed+" FAIL");
if(failed)process.exitCode=1;
