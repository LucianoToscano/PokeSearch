"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const visual=require("../src/main/assets/despawn_visual.js");
const cases=[
 [901,"good",false],
 [900,"warning",false],
 [600,"warning",false],
 [301,"warning",false],
 [300,"pink",false],
 [240,"pink",false],
 [121,"pink",false],
 [120,"critical",false],
 [61,"critical",false],
 [60,"critical",true],
 [59.001,"critical",true],
 [1,"critical",true],
 [0,"critical",false]
];
for(const [sec,tone,pulse] of cases){
 const got=visual.state(sec);
 assert.equal(got.tone,tone,"tone "+sec);
 assert.equal(got.pulse,pulse,"pulse "+sec);
}
assert.equal(visual.state(NaN).tone,"unknown");
assert.equal(visual.state(-1).tone,"unknown");
// Boundaries should never leave gaps even when an expiry has a fractional second.
for(let sec=0;sec<=1800;sec+=.37){
 const result=visual.state(sec);
 assert.ok(["good","warning","pink","critical"].includes(result.tone));
 assert.equal(result.pulse,result.seconds>0&&result.seconds<=60);
}
const html=fs.readFileSync(path.join(root,"detail.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
new vm.Script(script);
assert.ok(html.includes('<script src="despawn_visual.js"></script>'));
assert.ok(script.includes("window.PokeSearchDespawnVisual?.state(remaining)"));
assert.ok(script.includes('e.className=state.tone+(state.pulse?" pulse":"")'));
assert.ok(html.includes('#timer.pink{color:#ffa4cb}'));
assert.ok(html.includes('#timer.critical{color:#ff6575}'));
assert.ok(html.includes('#timer.warning{color:#f3c276}'));
assert.ok(html.includes('#timer.good{color:#9ce5b9}'));
assert.ok(html.includes('#headerActions #timer.pulse .timerClock{animation:psDespawnGentlePulse'));
assert.ok(html.includes('@media(prefers-reduced-motion:reduce)'));
assert.ok(!html.includes('#panel.pulse'),'whole card must not pulse');
// Preserve photo, full name, exact Drive icons; size is compact in the top subtitle.
assert.ok(html.includes('#nameLine b{flex:0 1 auto;min-width:0;max-width:100%}'));
assert.ok(html.includes('pokemon_type_icons.js'));
assert.ok(script.includes('[h(c.number),gender].filter(Boolean)'),"dex+sex grouped");
assert.ok(script.includes('[c.size,c.form].filter(Boolean)'),"size and form grouped");
assert.ok(!script.includes('item("Tamanho",c.size)'),"size must not add an extra row");
assert.ok(script.includes('item("Distância",c.distance)'));
assert.ok(html.includes('#headerActions #timer{display:inline-flex;align-items:center;'),"clock stays small in status row");
assert.ok(html.includes('id="timeRemaining"'),"clock value anchored to a fixed-width icon");
assert.ok(html.includes('id="dexGender" class="metaPair"'));
assert.ok(html.includes('id="sizeForm" class="metaPair"'));
assert.ok(script.includes('statTile("PC",c.cp)+statTile("Nv.",c.level)'));
assert.ok(script.includes('h(showRaw?raw:"—")'));
assert.ok(script.includes('rankLine.textContent=c.rank?'));
// Copy feedback must follow successful native clipboard confirmation.
assert.ok(script.includes('const didCopy=message.startsWith("✓")'));
assert.ok(script.includes('window.copyVisualUntil>Date.now()?"  ✓":""'));
assert.ok(script.includes('const seq=window.copyVisualGeneration=(Number(window.copyVisualGeneration)||0)+1'));
assert.ok(script.includes('if(window.copyVisualGeneration!==seq||String(currentCoords||"")!==copyIdentity)return'));
assert.ok(script.includes('if(seq!==coordsRequestSeq||!coordsPending)return'));
assert.ok(script.includes('Native.copyCoords(currentCoords);return;'));
// Card size automatically tracks content; no permanent blank placeholder.
assert.ok(script.includes('const height=Math.ceil(panel.scrollHeight)+3'),"QA22 measures content before native resize");
assert.ok(html.includes('#panel{height:auto;min-height:0'));
assert.ok(html.includes('window.offerCaptureShare=sourceIndex=>'));
console.log("LT145 Despawn QA6 threshold/pulse/accessibility and all six refinements PASS");
