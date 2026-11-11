"use strict";
// LT329: keep detail-card type badges exactly 15x15 in both type layouts.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const base=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(base,"detail.html"),"utf8");
const selector="/#major .psTypeIconSet";
for(const suffix of [" .pkTypeImg"," .pkTypeImg:only-child"]){
 const quoted="#major .psTypeIconSet"+suffix;
 const start=html.indexOf(quoted+"{");
 assert.ok(start>=0,"missing type icon CSS: "+quoted);
 const css=html.slice(start+quoted.length+1,html.indexOf("}",start));
 for(const prop of ["width","height","max-width"]){
  assert.match(css,new RegExp("(?:^|;)"+prop+":15px!important(?:;|$)"),quoted+" "+prop);
 }
 assert.match(css,/flex:0 0 15px!important(?:;|$)/,quoted+" flex basis");
 assert.doesNotMatch(css,/16px/,"no old 16px in card type badges");
}
assert.match(html,/#major \.psTypeIconSet\{[^}]*gap:2px!important/,"preserve 2px gap");
assert.match(html,/#major \.psTypeIconSet\{[^}]*justify-content:center/,"preserve center alignment");
assert.match(html,/<span class="psTypeIconSet">/,"retain existing card renderer");
const p2=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
assert.match(p2,/extends OverlayService/,"P2 uses the same detail.html card");
console.log("PASS LT329: type icons 15x15, 2px gap, centered, single/double, shared P1/P2");
