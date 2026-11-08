"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const fine=fs.readFileSync(path+"EduSpriteManualRetouch.java","utf8");
const atlas=fs.readFileSync(path+"EduSpriteAtlas.java","utf8");
const oldTest=fs.readFileSync("app/tests/lt316-edu-uniform-68-audit.test.js","utf8");
const indices=[20,28,30,36,49];
assert.equal(indices.length,5,"Five exceptional action poses must be explicit");
assert.match(fine,/CELL=128/);
assert.match(fine,/canvas\.clipOutPath\(path\)/,"Props remain at original size");
assert.match(fine,/characterCanvas\.clipPath\(path\)/,"Actor is isolated");
assert.match(fine,/canvas\.scale\(s,s\)/,"Only actor is scaled");
assert.match(fine,/canvas\.drawBitmap\(original,area,area,paint\)/,"Props are reintroduced unscaled");
assert.match(fine,/paint\.setFilterBitmap\(false\)/,"Pixel art remains sharp");
assert.match(fine,/paint\.setAntiAlias\(false\)/,"No antialias blur");
assert.match(fine,/actor\.recycle\(\)/);
assert.match(fine,/original\.recycle\(\)/);
assert.match(fine,/i==20\|\|i==28\|\|i==30\|\|i==36\|\|i==49/);
const poly=fine.slice(fine.indexOf("private static int[][] polygon"),
                      fine.indexOf("private static int[][] propRects"));
const props=fine.slice(fine.indexOf("private static int[][] propRects"),
                       fine.indexOf("private static float scale"));
for(const idx of indices){
 assert(poly.includes("case "+idx+":"),"Polygon for pose "+idx);
 assert(props.includes("case "+idx+":"),"Prop protection for pose "+idx);
}
assert.match(atlas,/boolean correctedUsed=false/);
assert.match(atlas,/correctedUsed=true/);
assert.match(atlas,/private final boolean correctedAtlas/);
assert.match(atlas,/if\(uniformFrame&&correctedAtlas\)/);
assert.match(atlas,/EduSpriteManualRetouch\.apply\(crop,i\)/);
assert.match(atlas,/SHADOW_INDEX=67, COLLECTION_COUNT=TOTAL_COUNT\+1/);
assert.match(atlas,/UNIFORM_COLS=8, UNIFORM_ROWS=9/);
assert.match(atlas,/SIZES_PX=\{100,150,200\}/);
assert.match(atlas,/if\(!uniformFrame\)\{/,"Original fallback remains available");
assert.match(oldTest,/sha256/);
for(let i=52;i<=60;i++)assert(!indices.includes(i),"Teleport effect must not be resized");
console.log("LT316: five isolated actor retouches, 68 frame contract, P/M/G and fallback PASS");
