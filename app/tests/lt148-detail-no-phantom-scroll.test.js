"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const java=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);new vm.Script(script);
const styles=html.slice(html.indexOf("/* LT148:"));
assert.ok(styles.includes("#panel{max-height:100vh;max-width:100%;margin:0}"),"no 6px phantom clip");
assert.ok(script.includes("const clipped=panel.scrollHeight>panel.clientHeight+3;"),"measure after resize");
assert.ok(script.includes('panel.classList.toggle("needsScroll",clipped);'),"scroll only on real overflow");
assert.ok(script.includes('if(!clipped)panel.scrollTop=0;'),"stale small scroll reset");
assert.ok(script.includes("const height=Math.ceil(panel.scrollHeight)+3;"),"native measured intrinsic card");
assert.ok(java.includes("detailParams.height=dp(detailHeight);moveDetail();"),"native resizes actual overlay");
assert.ok(java.includes("Math.min(520,available)"),"oversized evolutions can scroll");
assert.ok(html.includes('#major .statTile{height:23px;min-height:23px;max-height:23px;'),"stat sizes unchanged");
assert.ok(html.includes('#coordRow #coords:not(.hasCoords):not(.isPending){'),"red coordinates");
assert.ok(html.includes('#artColumn.gengarSprite.gengarHalloween #img'),"costume art unchanged");
assert.ok(html.includes('<span class="despawnLabel">Despawn</span>'),"clock preserved");
assert.ok(html.includes('class="sexChip"')&&html.includes('class="sizeChip"'),"sex and size preserved");
// Run the real resize function with a simulated asynchronous native viewport.
const part=script.slice(script.indexOf("function resizeEvolutionPanel(){"),script.indexOf("function toggleEvolutionDetails(){"));
assert.ok(part.startsWith("function resizeEvolutionPanel(){"));
let nativeRequested=0,scrollHeight=208,clientHeight=208,scrollTop=4;const flags={};
const panel={get scrollHeight(){return scrollHeight;},get clientHeight(){return clientHeight;},
get scrollTop(){return scrollTop;},set scrollTop(x){scrollTop=x;},
classList:{toggle(k,v){flags[k]=v;}}};
const context={document:{getElementById(id){assert.equal(id,"panel");return panel;}},
Native:{resizeDetail(x){nativeRequested=x;clientHeight=scrollHeight+3;}},
requestAnimationFrame(cb){cb();},setTimeout(cb){cb();}};
vm.runInNewContext(part+"resizeEvolutionPanel();",context);
assert.equal(nativeRequested,211);
assert.equal(flags.needsScroll,false,"ordinary card never needs scrolling");
assert.equal(scrollTop,0,"small retained offset is discarded");
scrollHeight=610;clientHeight=505;scrollTop=0;
context.Native.resizeDetail=(x)=>{nativeRequested=x;/* Android height capped */};
vm.runInNewContext("resizeEvolutionPanel();",context);
assert.equal(nativeRequested,613);
assert.equal(flags.needsScroll,true,"genuinely tall content remains scrollable");
console.log("LT148 detail: native/CSS height agrees, top/bottom 6px drag fixed PASS");
