"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const visual=require("../src/main/assets/iv_display.js");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);new vm.Script(script);

const check=(raw,incoming,percent,color,derived)=>{
 const got=visual.fromCard({iv:raw,ivPercent:incoming});
 assert.equal(got.valid,true,raw);
 assert.equal(got.percent,percent,raw);
 assert.equal(got.color,color,raw);
 assert.equal(got.derived,derived,raw);
};
// Real Samsung screenshots: Kricketot shows 60, Squirtle omitted source
// percentage even though its raw IV triple is complete (1/15/13).
check("0/15/12","60",60,"#28C76F",false);
check("1/15/13","",64,"#28C76F",true);
check("15/15/15","100",100,"#F04B70",false);
check("0/0/0",null,0,"#00CFE8",true);
check("0/0/1",undefined,2,"#B8BEC8",true);
check("14/15/15",null,98,"#C084FC",true);
check("12/12/12",null,80,"#388BFF",true);
check("10/10/10",null,67,"#28C76F",true);
// Every sum is one of exactly 46 representable, rounded values. No
// missing 50, 79, 90, or 99 should ever be assigned a palette color.
const percentages=new Set();
for(let sum=0;sum<=45;sum++){
 const atk=Math.min(sum,15),def=Math.min(Math.max(sum-atk,0),15);
 const sta=sum-atk-def;
 const raw=[atk,def,sta].join("/");
 const got=visual.fromCard({iv:raw});
 assert.equal(got.valid,true,raw);
 assert.equal(got.percent,Math.round(sum*100/45));
 assert.ok(got.color);
 percentages.add(got.percent);
}
assert.equal(percentages.size,46);
for(const impossible of [1,3,5,6,8,10,50,79,90,99])assert.equal(visual.colorFor(impossible),"");

// Never invent raw values from a percentage, fake a conflicting percentage,
// or show a misleading color for malformed/missing provider data.
for(const data of [
 {iv:"",ivPercent:"100"},
 {iv:"16/15/15",ivPercent:"100"},
 {iv:"1/15/13",ivPercent:"60"},
 {iv:"1/15/13",ivPercent:"banana"},
 {iv:"1/15/13",ivPercent:"63"},
 {iv:"1/15/13",ivPercent:"64.4"},
 {iv:"1/15/13",ivPercent:"064"},
 {iv:"0/0/0",ivPercent:"100"}
]){
 const got=visual.fromCard(data);
 assert.equal(got.valid,false,JSON.stringify(data));
 assert.equal(got.percent,null);
 assert.equal(got.color,"");
}
// The original layout is unchanged: IV% stays in top-right, types in
// top-left, and the approved color applies identically to IV and IV%.
assert.ok(html.includes('<script src="iv_display.js"></script>'));
assert.ok(script.includes('window.PokeSearchIVDisplay?.fromCard?.(c)'));
assert.ok(script.includes("h(ivDisplay.percent)+'%</span>'"));
assert.ok(script.includes("h(showRaw?ivDisplay.raw:\"—\")"));
assert.ok(html.includes('#major .ivTile .statValue.red,#major .ivTile .ivPercent{color:var(--ps-iv-color,#bac6d4)}'));
assert.ok(html.includes('style="--ps-iv-color:'));
console.log("IV percentage 46 valid values, screenshot regression, matched colors, no speculative IV PASS");
