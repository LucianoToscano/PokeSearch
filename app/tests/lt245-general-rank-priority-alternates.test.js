"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
const a=script.indexOf("function closePvpRankAlternates(){");
const b=script.indexOf("window.showEvolutionDetails=payload=>",a);
assert.ok(a>=0&&b>a,"full compact rank + alternates helper present");
const make=tag=>({
 tag,dataset:{},attrs:{},style:{},className:"",children:[],textContent:"",
 hidden:false,
 setAttribute(k,v){this.attrs[k]=String(v);},
 appendChild(child){this.children.push(child);this.textContent+=child.textContent||"";},
 replaceChildren(){this.children=[];this.textContent="";},
 querySelector(sel){return this.children.find(x=>sel===".psRankMore"&&x.className==="psRankMore")||null;}
});
const line=make("div"),panel=make("div");panel.hidden=true;
const document={getElementById(id){
 if(id==="rankLine")return line;
 if(id==="psRankAlternates")return panel;
 throw Error("Unexpected element "+id);
},createElement:make};
const events=[];
const open=(e,button)=>{
 e?.preventDefault?.();e?.stopPropagation?.();
 const d=button.dataset;events.push({kind:d.psKind,name:d.psName,
  rank:Number(d.psRank),league:d.psLeague});return true;
};
let resize=0;
const moduleObj=new Function("document","window","activeRankLeague",
 "currentRankSpecies","openPvpRankExplorer","renderRankOneMoves","resizeEvolutionPanel",
 script.slice(a,b)+"return {update:updateVisiblePvPRank,toggle:togglePvpRankAlternates,close:closePvpRankAlternates};")(
 document,{}, "gl","Litwick",open,()=>{},()=>{resize++});
const gl=(evolutions,other={})=>({
 name:"Litwick",searchLeague:"gl",searchRankLimit:null,leagues:[
 {league:"gl",own:{rank:1087},evolutions,...other},
 {league:"ul",own:{rank:900},evolutions:[]},
 {league:"ml",own:{rank:900},evolutions:[]}
]});
const ch={name:"Chandelure",rank:1,overallRank:808,eligible:true};
const la={name:"Lampent",rank:1,overallRank:519,eligible:true};
assert.equal(moduleObj.update(gl([ch,la])),true);
assert.equal(line.children.find(x=>x.className==="psCompactSpecies").textContent,"↳ Lampent",
 "the better confirmed species RG, not array order, determines promoted evolution");
const classButton=line.children.find(x=>x.className==="psCompactIv psRankOpen psLeagueIv");
const primary=line.children.find(x=>x.className==="psCompactOverall psRankOpen");
const more=line.children.find(x=>x.className==="psRankMore");
assert.equal(primary.textContent,"RG #519");
assert.equal(classButton.textContent,"GL IV #1");
assert.equal(more,undefined,"no fifth chip: alternatives are reached through Análise PvP");
assert.equal(line.attrs["data-alternatives"],"1");
assert.equal(primary.dataset.psName,"Lampent");
assert.equal(primary.dataset.psRank,"519");
assert.equal(classButton.dataset.psKind,"class");
assert.equal(classButton.dataset.psName,"Lampent");
assert.ok(line.children.filter(x=>x.className==="psCompactOverall psRankOpen").length===1);
assert.equal(primary.onclick({preventDefault(){},stopPropagation(){}}),true);
assert.equal(classButton.onclick({preventDefault(){},stopPropagation(){}}),true);
assert.deepEqual(events.slice(0,2),[
 {kind:"overall",name:"Lampent",rank:519,league:"gl"},
 {kind:"class",name:"Lampent",rank:1,league:"gl"}
]);
const mockMore=make("button");
assert.equal(moduleObj.toggle({preventDefault(){},stopPropagation(){}},mockMore,[ch],"gl"),true);
assert.equal(panel.hidden,false);
assert.equal(panel.children.length,1);
assert.equal(panel.children[0].children[0].textContent,"↳ Chandelure");
const altRg=panel.children[0].children[1],altIv=panel.children[0].children[2];
assert.equal(altRg.textContent,"RG #808");
assert.equal(altIv.textContent,"IV #1");
altRg.onclick({preventDefault(){},stopPropagation(){}});
altIv.onclick({preventDefault(){},stopPropagation(){}});
assert.deepEqual(events.slice(2),[
 {kind:"overall",name:"Chandelure",rank:808,league:"gl"},
 {kind:"class",name:"Chandelure",rank:1,league:"gl"}
]);
assert.equal(moduleObj.toggle({preventDefault(){},stopPropagation(){}},mockMore,[ch],"gl"),true);
assert.equal(panel.hidden,true);
assert.equal(panel.hidden,true,"alternate panel closes without reintroducing a fifth control");
assert.ok(resize>0);
const quality=gl([{...ch,rank:380,overallRank:1},la]);
assert.equal(moduleObj.update(quality),true);
assert.equal(line.children.find(x=>x.className==="psCompactSpecies").textContent,"↳ Lampent",
 "a lower species RG must not promote a bad IV Class #380");
assert.equal(line.children.filter(x=>x.className==="psRankMore").length,0);
const noRg=gl([{...ch,overallRank:null},{...la,rank:2,overallRank:null}]);
assert.equal(moduleObj.update(noRg),true);
assert.equal(line.children.find(x=>x.className==="psCompactSpecies").textContent,"↳ Chandelure",
 "without confirmed RG fall back to original IV rank");
assert.equal(line.children.find(x=>x.className==="psCompactOverall psRankOpen").textContent,"RG —");
const strict=gl([{...ch,rank:1,overallRank:808},{...la,rank:2,overallRank:1}]);
strict.searchRankLimit=1;
assert.equal(moduleObj.update(strict),true);
assert.equal(line.children.find(x=>x.className==="psCompactSpecies").textContent,"↳ Chandelure",
 "Top 1 query must not select the better RG at IV Class #2");
const present=gl([{...ch,rank:1,overallRank:808}],{});
present.leagues[0].own={name:"Litwick",rank:1,overallRank:25};
assert.equal(moduleObj.update(present),true);
assert.equal(line.children.find(x=>x.className==="psCompactSpecies").textContent,"Atual");
assert.equal(line.children.find(x=>x.className==="psCompactOverall psRankOpen").textContent,"RG #25");
const ref=gl([],{comparisons:[{name:"Costume Reference",rank:1,overallRank:1,referenceOnly:true}]});
assert.equal(moduleObj.update(ref),true,"reference-only result can still be displayed as IV projection");
assert.ok(line.children.some(x=>x.className==="psCompactSpecies"&&x.textContent.includes("↳ Costume Reference")));
assert.equal(line.children.find(x=>x.className==="psCompactOverall psRankOpen").textContent,"RG —",
 "reference-only projection gets disabled neutral RG placeholder, not a false ranking");
assert.ok(html.includes('id="psRankAlternates" hidden'));
assert.ok(html.includes('panel.hidden=false;button?.setAttribute?.("aria-expanded","true")'));
assert.ok(html.includes("orderEvolutionRows?.("),
 "expanded analysis uses evolution stage order, not the separate RG recommendation");
assert.ok(html.includes("...orderedEntries,...orderedReferences,...megas"),
 "Mega projections follow ordinary evolution stages in the expanded panel");
const secondary=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
assert.ok(secondary.includes("extends OverlayService"),
 "both balls share the same PvP card and overlay code");
const insights=require("../src/main/assets/pvp_rank_insights.js");
const badgeRows=insights.topBadges([{league:"gl",own:{rank:900},
 evolutions:[ch,la]}],5);
assert.equal(badgeRows[0].name,"Lampent");
assert.equal(badgeRows[0].overallRank,519);
assert.equal(badgeRows[1].name,"Chandelure");
const mega=insights.topBadges([{league:"gl",megas:[{name:"Mega Gengar",
 rank:1,overallRank:1,megaProjection:true,referenceOnly:true}]}],5);
assert.equal(mega[0].overallRank,null,"Mega projection cannot claim a verified GBL species RG");
const teddi=gl([
 {name:"Ursaluna",rank:1,overallRank:163,eligible:true},
 {name:"Ursaring",rank:10,overallRank:415,eligible:true}
]);
teddi.name="Teddiursa";teddi.leagues[0].own={rank:812,overallRank:360};
assert.equal(moduleObj.update(teddi),true);
assert.equal(line.children.find(x=>x.className==="psCompactSpecies").textContent,"↳ Ursaluna");
assert.equal(line.children.find(x=>x.className==="psCompactOverall psRankOpen").textContent,"RG #163",
 "Ursaluna verified RG must appear on compact card, not only expanded analysis");
assert.equal(line.children.find(x=>x.className==="psCompactIv psRankOpen psLeagueIv").textContent,"GL IV #1");
assert.equal(line.attrs["data-alternatives"],"1","extra forms are found in the PvP analysis, not a fifth chip");
console.log("LT245: RG first among good IVs, class fallback, strict Top filter, +N comparison, P1/P2 PASS");
