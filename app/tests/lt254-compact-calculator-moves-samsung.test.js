"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(base,"detail.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
const css=html.split("/* LT254: real Samsung screenshots")[1]?.split("</style>")[0]||"";
assert.ok(css.includes("grid-template-columns:minmax(0,1fr)!important"),
 "A/B inputs must be vertically stacked inside the same 200dp glass panel");
assert.ok(css.includes("grid-template-columns:32px minmax(0,1fr) 24px!important"),
 "A/B IVs must form two small horizontal rows and a reset action");
assert.ok(css.includes("min-width:42px!important"),
 "level slider must not collapse under stepper buttons");
assert.ok(css.includes("grid-template-columns:40px minmax(0,1fr) 10px!important"),
 "recommended move names must have their own non-wrapping label column");
assert.ok(html.includes('row("C"+(i+1),m)'),
 "abbreviate Carregado 1/2 rather than splitting long titles");
assert.ok(script.includes('btn.textContent=prior?.icon||"⚡"'));
assert.ok(script.includes('btn.textContent=hasLegacy?"⚔️":"⚡"'));
assert.ok(script.includes('if(complete){'));
assert.ok(script.includes('move.status==="elite"||move.status==="legacy"'),
 "a confirmed legacy move remains necessary for crossed swords");
assert.ok(!script.includes('<div class="psMoveLegend">Capturados: '),
 "captured moves already appear in base card; never repeat in recommended panel");
assert.ok(script.includes('title="Restaurar IV capturado"'));
assert.ok(script.includes('<details class="psCpSimExtra"><summary>Comparar 0% e 100%'),
 "optional extreme reference rows must be collapsed by default");
assert.ok(script.includes("const delta=compared?compared.cp-current.cp:0"),
 "B minus A is positive when compared spread has higher CP");
assert.ok(script.includes('Diferença B − A'));
assert.ok(script.includes("⚪ LC 500")&&script.includes("🔵 GL 1500")&&script.includes("🟡 UL 2500"));
assert.ok(html.includes('class="psMetricFoot"')||script.includes('psMetricFoot'),
 "PvP projection disclaimer must remain visible");

// Exercise the shipping math using offline Game Master, not a guessed CP.
const gm={};new Function("window",fs.readFileSync(path.join(base,"pvpoke-iv-gamemaster.js"),"utf8"))(gm);
const a=script.indexOf("/* LT244: zero-cost contextual stats actions."),b=script.indexOf("const item=(k,v)=>",a);
assert.ok(a>0&&b>a);
const docElements={psCpSimResult:{innerHTML:"",textContent:""},
 psCpLevel:{value:"22"},psCpForm:{value:"diglett"},
 psCpLevelValue:{textContent:""},psCpTargetCp:{value:"1500"}};
const doc={getElementById:k=>docElements[k]||null};
const fn=new Function("window","document","h","resizeEvolutionPanel","activeRankLeague",
 "pvpFormsForLeague",script.slice(a,b)+"return {set:x=>metricCard=x,update:updatePvpCpSimulator};")(
 gm,doc,String,()=>{},"gl",()=>[]);
fn.set({name:"Diglett",iv:"0/15/13",cp:369,level:22,ivValid:true});
gm.psRankContext={name:"Diglett",leagues:[{league:"gl",own:{rank:1}},
 {league:"ul"},{league:"ml"}]};
assert.equal(fn.update(),true);
assert.match(docElements.psCpSimResult.innerHTML,/IV A 0\/15\/13/);
assert.match(docElements.psCpSimResult.innerHTML,/IV B 15\/15\/15/);
assert.match(docElements.psCpSimResult.innerHTML,/Diferença B − A/);
assert.match(docElements.psCpSimResult.innerHTML,/ΔPC \+/,
 "the default B 15/15/15 must exceed A 0/15/13 for the same Diglett level");
const p=docElements.psCpSimResult.innerHTML;
const extra=p.indexOf('<details class="psCpSimExtra">');
assert.ok(extra>0&&p.indexOf("IV 0/0/0")>extra&&p.indexOf("IV 15/15/15")>extra);
console.log("LT254 PASS: Diglett B−A CP, compact IV A/B, non-clipped level control, neutral vs legacy, C1/C2 and source safety");
