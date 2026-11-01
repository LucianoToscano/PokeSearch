"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const app=path.join(__dirname,"../src/main/assets/dock.html");
const native=path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const markup=fs.readFileSync(app,"utf8");
const service=fs.readFileSync(native,"utf8");
let tests=0;
function check(name,fn){fn();tests++;console.log("PASS LT77 E2 "+name);}
function functionText(name){
  const safe=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const regex=new RegExp("function "+safe+"\\([^\\n]*\\)\\{[\\s\\S]*?\\n\\}");
  const m=markup.match(regex);
  assert.ok(m,"Missing inline function "+name);
  return m[0];
}
function layout(pref,orientation="vertical",sprite=45,count=5,screen=900){
  const window={visualPrefs:{resultGapBetween:pref,resultsOrientation:orientation}};
  const context=vm.createContext({window});
  vm.runInContext(functionText("additionalResultGapPx")+"\n"+
    functionText("computeResultLayout")+"\n"+
    "this.calculate=computeResultLayout;this.extraGap=additionalResultGapPx;",context);
  const cards=Array.from({length:count},()=>({}));
  const lines=cards.map(()=>[]);
  return {result:context.calculate(cards,sprite,screen,false,false,null,"",lines),
    gap:context.extraGap(pref)};
}
check("physical default anchor is 2px, not dp-scaled",()=>{
  assert.match(service,/ResultsSpacingPolicy\.DEFAULT_TOP_GAP_PX\+dp\(visualHeaderAfterGap\)/);
  assert.ok(!service.includes("int gap=dp(2+visualHeaderAfterGap)"));
});
check("the phantom header padding in the independent results WebView is gone",()=>{
  assert.match(markup,/body\.result-window #shell\{padding-top:0!important\}/);
  assert.ok(!markup.includes("body.result-window #shell{padding-top:var(--visual-header-y"));
});
check("no default phantom padding; explicit Editor top gap remains available",()=>{
  assert.match(markup,/body\.result-window #spawns:not\(:empty\)\{[\s\S]*?padding-top:0!important;padding-bottom:0!important;\s*margin-top:var\(--visual-top-gap,0px\)!important;/);
});
check("default spacing is zero at 25, 45 and 65 pixel sprite size",()=>{
  for(const size of [25,45,65]){
    const {result,gap}=layout(31,"vertical",size,5);
    assert.equal(gap,0);
    assert.deepEqual(Array.from(result.rows),Array(5).fill(size));
    assert.equal(result.total,size*5);
    assert.equal(result.visibleCount,5);
  }
});
check("saved Editor Visual spacing above neutral remains an intentional extra",()=>{
  for(const [pref,gap] of [[0,0],[30,0],[31,0],[32,1],[33,2],[50,19],[65,34]]){
    const result=layout(pref,"vertical",45,2);
    assert.equal(result.gap,gap);
    assert.deepEqual(Array.from(result.result.rows),[45+gap,45+gap]);
  }
});
check("horizontal result gaps are no longer the legacy 31px value",()=>{
  assert.match(markup,/--visual-result-spacing",\s*additionalResultGapPx\(vp\.resultGapBetween\)\+"px"/);
  assert.match(markup,/column-gap:var\(--visual-result-spacing,0px\)/);
  assert.match(markup,/row-gap:var\(--visual-result-spacing,0px\)/);
  assert.match(service,/int gap=ResultsSpacingPolicy\.additionalRowGapPx\(visualResultGapBetween\)/);
  assert.match(service,/gap\*\(columns-1\)\+2/);
  const result=layout(31,"horizontal",45,5);
  assert.equal(result.gap,0);
  assert.deepEqual(Array.from(result.result.rows),[45,45,45,45,45]);
});
check("10 results remain counted on short screen without hidden slots",()=>{
  const result=layout(31,"vertical",45,10,260);
  assert.equal(result.result.rows.length,10);
  assert.equal(result.result.visibleCount,10);
  assert.ok(result.result.total<=260);
});
check("dock and list use a single 16ms throttle during a drag",()=>{
  assert.match(service,/if\(now-lastDockFrameAt\[0\]>=16L\)\{\s*lastDockFrameAt\[0\]=now;\s*updateWindow\(\);/);
  assert.match(service,/\/\/ Always commit the final position for BOTH windows,[\s\S]*?updateWindow\(\);/);
  assert.ok(!service.includes("lastResultMoveAt"));
});
check("independent results grip retains its own 16ms throttle",()=>{
  assert.match(service,/if\(now-lastLayoutMoveAt\[0\]>=16L\)/);
});
check("no API transport activation, credential reads or application identity changes",()=>{
  assert.ok(!service.includes("api_browser_transport.js"));
  assert.ok(!markup.includes("api_browser_transport.js"));
  assert.ok(!service.includes("localStorage.jwt"));
});
console.log("LT77 Stage 2 results layout: "+tests+"/"+tests+" PASS");
