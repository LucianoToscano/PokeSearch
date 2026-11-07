"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const presenter=require(path.join(assets,"pokemon_card_presentation.js"));
const metadata={
 base:{16:[["normal","flying"],[]],255:[["fire"],[]],92:[["ghost","poison"],[]]},
 forms:{"255:hisui":[["fire","rock"],[]]}
};
const keys=card=>presenter.typeKeys(card,metadata);
assert.deepEqual(keys({number:"#255",name:"Torchic"}),["fire"]);
assert.deepEqual(keys({number:"16",name:"Pidgey"}),["normal","flying"]);
assert.deepEqual(keys({number:"255",form:"HISUI"}),["fire","rock"]);
assert.deepEqual(keys({number:"255",form:"UNVERIFIED"}),[]);
assert.equal(presenter.typeEffectiveness(keys({number:"255",form:"UNVERIFIED"})),null);
const typeCount=chart=>chart.weaknesses.length+chart.resistances.length+chart.neutral.length;
const find=(chart,type)=>[...chart.weaknesses,...chart.resistances,...chart.neutral]
 .find(v=>v.type===type);
const norm=presenter.typeEffectiveness(["normal"]);
assert.equal(typeCount(norm),18);
assert.equal(find(norm,"fighting").multiplier,1.6);
assert.equal(find(norm,"ghost").multiplier,0.390625);
assert.equal(norm.weaknesses.length,1);
assert.equal(norm.resistances.length,1);
assert.equal(norm.neutral.length,16);
const torchic=presenter.typeEffectiveness(["fire"]);
assert.deepEqual(torchic.weaknesses.map(x=>x.type),["water","ground","rock"]);
assert.equal(find(torchic,"fire").multiplier,0.625);
const charizard=presenter.typeEffectiveness(["fire","flying"]);
assert.equal(typeCount(charizard),18);
assert.equal(find(charizard,"rock").multiplier,2.56);
assert.equal(find(charizard,"ground").multiplier,0.625);
assert.equal(find(charizard,"grass").multiplier,0.390625);
const gengar=presenter.typeEffectiveness(["ghost","poison"]);
assert.equal(find(gengar,"fighting").multiplier,0.244140625);
assert.equal(find(gengar,"normal").multiplier,0.390625);
const all=Object.keys(presenter.typeEffectiveness(["normal"])).includes("types");
assert.equal(all,true);
const keys18=["normal","fire","water","electric","grass","ice","fighting","poison",
 "ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"];
for(let i=0;i<keys18.length;i++){
 for(let j=i;j<keys18.length;j++){
  const types=i===j?[keys18[i]]:[keys18[i],keys18[j]];
  const chart=presenter.typeEffectiveness(types);
  assert.equal(typeCount(chart),18,types.join("/"));
  const rows=[...chart.weaknesses,...chart.resistances,...chart.neutral];
  assert.equal(new Set(rows.map(r=>r.type)).size,18,types.join("/"));
  assert.ok(rows.every(r=>r.multiplier>0));
 }
}
assert.equal(presenter.typeEffectiveness(["normal","normal"]),null);
assert.equal(presenter.typeEffectiveness(["fire","unknown"]),null);
const html=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
assert.match(html,/<section id="psTypeEffectPanel" hidden role="region"/);
assert.ok(html.includes('id="psTypeTap" type="button"'));
assert.ok(html.includes('aria-controls="psTypeEffectPanel"'));
assert.ok(html.includes('psTypeEffectData=presenter?.typeEffectiveness?.(verifiedTypes)'));
assert.ok(html.includes('psCloseTypeEffectPanel();psTypeEffectKey="";psTypeEffectData=null;'));
assert.ok(html.includes('if(keep!=="types")psCloseTypeEffectPanel();'));
assert.ok(html.includes("psTypeEffectGroup(\"Fraqueza\",\"weak\",match.weaknesses)"));
assert.ok(html.includes("psTypeEffectGroup(\"Resistência\",\"resist\",match.resistances)"));
assert.ok(html.includes("psTypeEffectGroup(\"Normais\",\"neutral\",match.neutral)"));
assert.ok(html.includes("#major .psTypeIconSet .pkTypeImg:only-child"));
assert.ok(html.includes("#major .psCpTile .statValue"));
assert.ok(html.includes('statTile("PC",c.cp,"cp")+statTile("Nv.",c.level,"level")'));
assert.ok(html.includes('h(showRaw?ivDisplay.raw:"—")'));
assert.ok(html.includes('ivVisual.percent'));
const inline=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inline);
new vm.Script(inline[1],{filename:"detail.html inline JS"});
console.log("LT297: 18 type matchups, form safety, mixed type stacking, UI split and inline syntax PASS");
