"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const asset=name=>fs.readFileSync(path.join(assets,name),"utf8");
const presenter=require(path.join(assets,"pokemon_card_presentation.js"));
const translator=require(path.join(assets,"pve_moves_ptbr.js"));
const html=asset("detail.html");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,"real WebView script");
new vm.Script(script);
assert.equal(presenter.moveTypeColor("psychic"),"#f95587");
assert.equal(presenter.moveTypeColor("fighting"),"#c22e28");
assert.equal(presenter.moveTypeColor("undefined"),null,"unknown move types stay neutral");
assert.equal(translator.type("PSYCHO_CUT_FAST",true),"psychic");
assert.equal(translator.type("DYNAMIC_PUNCH",false),"fighting");
assert.equal(translator.type("COUNTER_FAST",true),"fighting");
assert.equal(translator.type("PSYCHIC",false),"psychic");
assert.equal(translator.type("UNKNOWN_MOVE",false),null);
assert.equal(translator.name("PSYCHO_CUT_FAST",true),"Corte Psíquico");
assert.equal(translator.name("DYNAMIC_PUNCH",false),"Soco Dinâmico");
const css=html.match(/#raidPanel \.psRaidMoveText\{([^}]+)\}/)?.[1]||"";
assert.match(css,/color:var\(--ps-move-type,inherit\)/);
assert.match(css,/background:transparent/);
assert.match(css,/border:0/);
assert.match(css,/padding:0/);
assert.doesNotMatch(css,/color-mix\(|background:#[0-9a-f]|border:1px/);
assert.match(html,/#panel\.needsScroll\{overflow-y:auto!important;touch-action:pan-y!important/);
const from=script.indexOf("function renderRaidPreview(){");
const to=script.indexOf("function toggleRaidDetails(){",from);
assert.ok(from>0&&to>from,"real raid preview function");
const part=script.slice(from,to);
let resizeCalls=0,listener=null,listenCount=0;
const button={dataset:{},setAttribute(){},hidden:true};
const panel={innerHTML:"",hidden:true,attrs:{},setAttribute(k,v){this.attrs[k]=v;},
  addEventListener(name,fn,capture){assert.equal(name,"toggle");assert.equal(capture,true);
   listenCount++;listener=fn;}};
const rows=[
 {name:"Mega Medicham",variant:"mega",fast:"PSYCHO_CUT_FAST",charged:"PSYCHIC",
  type:"psychic",typePt:"Psíquico",rank:63,elite:false},
 {name:"Mega Medicham",variant:"mega",fast:"COUNTER_FAST",charged:"DYNAMIC_PUNCH",
  type:"fighting",typePt:"Lutador",rank:69,elite:false},
 {name:"Medicham",variant:"normal",fast:"PSYCHO_CUT_FAST",charged:"PSYCHIC",
  type:"psychic",typePt:"Psíquico",rank:144,elite:false},
 {name:"Unknown",variant:"normal",fast:"UNKNOWN_FAST",charged:"UNKNOWN_MOVE",
  type:"psychic",typePt:"Psíquico",rank:444,elite:false}
];
const context={window:{PokeSearchMovePtBR:translator,PokeSearchCardPresentation:presenter,
 PokeSearchTypeIcons:{}},document:{getElementById(id){return id==="raidRow"?button:
 id==="raidPanel"?panel:null;}},psRaidReport:{verified:true,best:rows[0],
 rows,source:"verified"},psRaidExpanded:true,psRaidAttackPreview:null,
 h:x=>String(x??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[s])),
 psMtIconHtml:()=>"",psUpdateRaidShortcut:()=>{},
 resizeEvolutionPanel:()=>{resizeCalls++;}};
vm.runInNewContext(part+"renderRaidPreview();",context);
const rendered=panel.innerHTML;
assert.ok(rendered.includes('class="psRaidMore"'),"more ranking entries exist");
assert.ok(rendered.includes("Corte Psíquico")&&rendered.includes("Soco Dinâmico"),"verified PT-BR text");
assert.ok(rendered.includes('data-move-type="psychic" style="--ps-move-type:#f95587"'));
assert.ok(rendered.includes('data-move-type="fighting" style="--ps-move-type:#c22e28"'));
assert.ok(rendered.includes('Ágil: <span class="psRaidMoveText"'),"only the move name is colored");
assert.ok(!rendered.includes("pkMoveTyped"),"no colored chip from capture card");
const tail=rendered.slice(rendered.indexOf('Unknown'));
assert.ok(tail.includes('class="psRaidMoveText">Golpe sem tradução'),"unknown move stays neutral");
assert.equal(resizeCalls,1,"initial render resizes once");
assert.equal(listenCount,1,"listener attached once to persistent parent");
listener({target:{matches:selector=>selector===".psRaidMore"}});
assert.equal(resizeCalls,2,"expanding More remeasures card");
listener({target:{matches:selector=>selector===".psRaidMore"}});
assert.equal(resizeCalls,3,"collapsing More remeasures card");
listener({target:{matches:()=>false}});
assert.equal(resizeCalls,3,"unrelated toggles ignored");
vm.runInNewContext("renderRaidPreview();",context);
assert.equal(listenCount,1,"render refresh must not bind duplicate handlers");
assert.equal(resizeCalls,4);
console.log("LT282 PASS: verified raid colors on text only, neutral unknown, More expands and enables scroll resize");
