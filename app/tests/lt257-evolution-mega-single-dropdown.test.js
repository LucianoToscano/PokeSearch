"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const read=f=>fs.readFileSync(path.join(assets,f),"utf8");
const html=read("detail.html"),script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
const family=require(path.join(assets,"pvp_family_catalog.js"));
const win={PokeSearchPvpFamilyCatalog:family,psRankContext:null};
new Function("window",read("pvpoke-iv-gamemaster.js"))(win);
const elements={
 psCpForm:{value:"gastly"},psCpFormMenu:{open:true},
 psCpFormLabel:{innerHTML:""},psCpLevel:{value:"14.5"},
 psCpLevelValue:{textContent:""},psCpTargetCp:{value:"1500"},
 psCpSimResult:{innerHTML:"",textContent:""},
 psCpIvAA:{value:"0"},psCpIvAD:{value:"10"},psCpIvAS:{value:"10"},
 psCpIvBA:{value:"15"},psCpIvBD:{value:"15"},psCpIvBS:{value:"15"}
};
const buttons=[...Array(4)].map(()=>({dataset:{pscpForm:""},attributes:{},
 setAttribute(k,v){this.attributes[k]=v;}}));
const doc={getElementById:id=>elements[id]||null,querySelectorAll:q=>
 q===".psCpFormList button[data-pscp-form]"?buttons:[]};
const start=script.indexOf("/* LT244: zero-cost contextual stats actions.");
const end=script.indexOf("const item=(k,v)=>",start);
assert.ok(start>0&&end>start);
const unit=new Function("window","document","h","activeRankLeague","pvpFormsForLeague",
 "resizeEvolutionPanel",script.slice(start,end)+
 "return {set:v=>metricCard=v,forms:psCpVariants,controls:psCpControls,"+
 "pick:psCpPickForm,step:stepPvpCpForm,update:updatePvpCpSimulator};")(
 win,doc,String,"gl",()=>[],()=>{});
unit.set({name:"Gastly",iv:"0/10/10",ivValid:true,cp:471,level:14.5,form:"NORMAL"});
const result=unit.forms();
assert.deepEqual(result.map(r=>r[1]),["Gastly","Haunter","Gengar","Gengar (Mega)"]);
for(let i=0;i<result.length;i++)buttons[i].dataset.pscpForm=result[i][0];
const ui=unit.controls();
assert.match(ui,/id="psCpFormMenu"/);
assert.match(ui,/psCpFormList/);
assert.match(ui,/Gengar \(Normal\)/);
assert.match(ui,/Gengar \(Mega\)/);
assert.match(ui,/src="mega_evolution_icon.svg"/);
assert.ok(!ui.includes("psCpFamilyQuick"),"no duplicated quick row");
assert.ok(ui.indexOf('data-pscp-form="gengar"')<ui.indexOf('data-pscp-form="gengar_mega"'),
 "normal Gengar precedes its Mega");
assert.equal(unit.update(),true);
const base=elements.psCpSimResult.innerHTML;
assert.equal(unit.pick("haunter"),true);
const h=elements.psCpSimResult.innerHTML;
assert.equal(elements.psCpForm.value,"haunter");
assert.notEqual(base,h,"Haunter base stats recalculate PC");
assert.equal(unit.step(1),true);
assert.equal(elements.psCpForm.value,"gengar");
const normal=elements.psCpSimResult.innerHTML;
assert.equal(unit.pick("gengar_mega"),true);
assert.equal(elements.psCpForm.value,"gengar_mega");
assert.equal(elements.psCpFormMenu.open,false,"choosing a form closes the dropdown");
assert.match(elements.psCpFormLabel.innerHTML,/psCpMegaIcon/);
assert.match(elements.psCpFormLabel.innerHTML,/Gengar \(Mega\)/);
assert.notEqual(normal,elements.psCpSimResult.innerHTML,"Mega base stats recalculate PC");
assert.deepEqual([elements.psCpIvAA.value,elements.psCpIvAD.value,elements.psCpIvAS.value],
 ["0","10","10"]);
assert.deepEqual([elements.psCpIvBA.value,elements.psCpIvBD.value,elements.psCpIvBS.value],
 ["15","15","15"]);
assert.equal(unit.pick("nonexistent"),false,"cannot pick an invented form");
unit.set({name:"Gengar",iv:"15/15/15",ivValid:true,cp:3000,level:40});
assert.deepEqual(unit.forms().map(r=>r[1]),
 ["Gastly","Haunter","Gengar","Gengar (Mega)"],
 "ordering remains base→evolutions→Mega when capture is already evolved");
unit.set({name:"Charmander",iv:"15/15/15",ivValid:true,cp:100,level:10});
assert.deepEqual(unit.forms().map(r=>r[1]),
 ["Charmander","Charmeleon","Charizard","Charizard (Mega X)","Charizard (Mega Y)"]);
console.log("LT257 PASS: Gastly→Haunter→Gengar Normal/Mega sorted dropdown, distinct PC, icon, no duplicate controls, IV preserved");
