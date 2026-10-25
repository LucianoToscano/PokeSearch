"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main"),probe=fs.readFileSync(path.join(root,"assets/probe.js"),"utf8");
const java=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
function fragment(a,b){const i=probe.indexOf(a),j=probe.indexOf(b,i);assert(i>=0&&j>i);return probe.slice(i,j)}
const match=fragment("function matchingCoordsCard(query){","\nfunction cardCoordsControls(card){");
const read=fragment('if(action.startsWith("readCoords:")){','// PL-04: resolve the actual Coords form');
const identity={index:0,name:"Swablu",number:"#333",cp:"494",location:"Ostend, West Flanders, Belgium",iv:"15/15/15",gender:"♀",level:"21"};
let cards=[];
const pick=vm.runInNewContext("(function(){"+match+";return matchingCoordsCard;})()",{cardRoots:()=>cards,parseCard:c=>c.entry,clean:s=>String(s||"").trim()});
const card=(sourceIndex,overrides={})=>({sourceIndex,node:{entry:{...identity,...overrides}}});
let count=0;function check(name,fn){fn();count++;console.log("PASS LT80 "+name)}
check("complete Swablu fingerprint resolves",()=>{cards=[card(0)];assert.equal(pick(identity),cards[0])});
check("different IV on duplicate species CP city disambiguates",()=>{cards=[card(0,{iv:"14/15/15"}),card(1)];assert.equal(pick(identity),cards[1])});
check("two fully identical Swablu remain ambiguous and blocked",()=>{cards=[card(0),card(1)];assert.equal(pick(identity),null)});
check("changed location / level / gender always rejected",()=>{for(const changes of [{location:"Antwerp"},{level:"20"},{gender:"♂"}]){cards=[card(0,changes)];assert.equal(pick(identity),null)}});
check("reordering cannot bypass missing complete fingerprint",()=>{cards=[card(1)];assert.equal(pick({...identity,location:""}),null)});
check("React temporarily hides Get coords, then restores precise card",()=>{let present=false;
const run=()=>JSON.parse(vm.runInNewContext("(function(){"+read+"})()",{action:"readCoords:"+JSON.stringify(identity),JSON,
matchingCoordsCard:()=>present?{node:{}}:null,cardCoordsControls:()=>[{getAttribute:()=>""}],text:()=>"Open in Maps",
nextLabelValue:()=>"51.230,-3.015"}));
let first=run();assert.equal(first.ok,false);assert.equal(first.pending,true);
present=true;let after=run();assert.equal(after.ok,true);assert.equal(after.coords,"51.230,-3.015");
});
check("bounded retries and no unrelated Map links or unsafe clipboard",()=>{assert.match(java,/result\.optBoolean\("pending",false\)\&\&attempt<9/);
for(const fld of ["iv","gender","level"])assert.ok(java.includes('query.put("'+fld+'",target.optString("'+fld+'",""))'));
assert.ok(java.includes("nenhuma coordenada copiada"));assert.ok(!read.includes("document.querySelector("))});
console.log("LT80 "+count+"/"+count+" PASS");
