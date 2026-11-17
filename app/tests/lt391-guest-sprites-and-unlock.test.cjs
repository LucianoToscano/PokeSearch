"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=x=>fs.readFileSync(path.join(root,x),"utf8");
const probe=read("app/src/main/assets/probe.js");
const dock=read("app/src/main/assets/dock.html");
const detail=read("app/src/main/assets/detail.html");
const sprite=require("../src/main/assets/sprite_offline.js");

test("visitor collector recognizes all five cards including rate limited cards without Get coords and LOCATION",()=>{
 const source=probe.slice(probe.indexOf("function cardRoots(){"),probe.indexOf("// Submission-scoped result evidence."));
 assert.match(source,/const anchors=elements/);
 assert.doesNotMatch(source,/\/\\bLOCATION\\b/);
 const encountered=[],headings=[],actions=[];
 for(let i=0;i<5;i++){
   const dex=[580,129,540,21,712][i],name=["Ducklett","Magikarp","Sewaddle","Spearow","Bergmite"][i];
   const article={tagName:"ARTICLE",innerText:name+"\n#"+dex+" · Female · M\nIV 100% (15/15/15)\nCP 907\nDESPAWN 59:13\n"+(i===4?"Rate limited":"Get coords"),ordinal:i, parentElement:null,
     getClientRects(){return [1]},matches(){return false},
     compareDocumentPosition(o){return this.ordinal<o.ordinal?4:2}};
   const h={tagName:"H3",innerText:name,parentElement:article,getClientRects(){return [1]}};
   const meta={tagName:"SPAN",innerText:"#"+dex+" · Female · M",parentElement:article,getClientRects(){return [1]}};
   headings.push(h,meta);encountered.push(article);
   if(i<2)actions.push({tagName:"BUTTON",innerText:i===0?"Get coords":"Open in Maps",parentElement:article,getClientRects(){return [1]}});
 }
 const query=selector=>selector.startsWith("button,a")?actions:headings;
 const visit=node=>!!node?.getClientRects()?.length;
 const text=node=>String(node?.innerText||"").trim();
 const collector=new Function("elements","vis","text",source+"\nreturn cardRoots();");
 const cards=collector(query,visit,text);
 assert.equal(cards.length,5,"show all visible visitor encounters, not just revealable rows");
 assert.deepEqual(cards.map(c=>c.sourceIndex),[0,1,2,3,4]);
 assert.deepEqual(cards.map(c=>c.node),encountered);
});

test("provider visitor count 'Showing 5 results' triggers incomplete-list retry, not a fake one-result completion",()=>{
 assert.match(probe,/Showing\\s\+\\(\\d\+\\)\\s\+\\(\\?:spawns\\?\\|results\\)/);
 assert.match(probe,/const siteIncomplete=expectedVisible>found.length/);
 assert.match(probe,/const expectedVisible=siteCount>0\?Math\.min\(siteCount,100\):0/);
});

test("Ducklett #580 and Magikarp #129 share exact local image in results and detail",()=>{
 for(const [dex,name] of [[580,"Ducklett"],[129,"Magikarp"]]){
   const image="https://example.org/temporary-lazy-thumbnail.png";
   for(const shiny of [false,true]){
     const card={number:"#"+dex,name,shiny,form:"",image,imageFromSite:true};
     const result=sprite.resolve(card);
     assert.equal(result.src,"file:///android_asset/pokemon-sprites/"+(shiny?"shiny/":"base/")+dex+".png");
   }
   const unknown=sprite.resolve({number:"#"+dex,name,form:"UNKNOWN_COSTUME",image:""});
   assert.notEqual(unknown.src,"file:///android_asset/pokemon-sprites/base/"+dex+".png");
 }
 assert.match(dock,/PokeSearchOfflineSprite\.resolve\(c\)/);
 assert.match(detail,/PokeSearchOfflineSprite\.resolve\(c\)/);
 assert.match(probe,/knownVisitorNames=\{129:"Magikarp",580:"Ducklett"\}/);
 assert.match(probe,/if\(altKey&&\/\[A-Z\]\/\.test\(altKey\)&&!byName\)return false/);
});

test("guest unlock action is a compact integrated transparent lock +5",()=>{
 assert.match(dock,/<button id="guestUnlock" type="button" hidden/);
 assert.match(dock,/onclick="Native\.openGuestLogin\(\)"/);
 assert.match(dock,/background:transparent!important;color:#cfdfec!important/);
 assert.match(dock,/<text x="18" y="19">\+5<\/text><\/svg><\/button>/);
 assert.doesNotMatch(dock,/<span>\+5<\/span><\/button>/);
 assert.match(dock,/guestLimited&&cards\.length>0&&!resultsStale/);
});
