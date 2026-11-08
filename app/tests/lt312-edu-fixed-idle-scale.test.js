"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/EduSpriteAtlas.java"),"utf8");
const overlay=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/RaidDayAssistantOverlayService.java"),"utf8");
const ids=[0,1,2,3,5,6,7,8,24,25,26,27,32,33,34,35,42,62,63,64,65,66];

assert.equal(ids.length,22);
assert.match(src,/IDLE_BODY_HEIGHT=112/);
assert.match(src,/int idleSourceHeight\(int index\)/);
const start=src.indexOf("private static int idleSourceHeight");
const stop=src.indexOf("private static int idleFeetY",start);
assert.ok(start>0&&stop>start);
const section=src.slice(start,stop);
for(const id of ids){
  assert.match(section,new RegExp("\\b"+id+"\\s*:"),
    "A sprite de idle "+id+" precisa ter altura de corpo explícita");
}
assert.match(src,/float scale=\(float\)IDLE_BODY_HEIGHT\/rawHeight/);
assert.match(src,/120f-idleFeetY\(index\)\*scale/);
assert.match(src,/original\.recycle\(\)/);
assert.match(src,/canvas\.clipRect\(0,30,CELL,CELL\)/);
assert.match(src,/new Rect\(30,7,61,30\)/);
assert.match(src,/setFilterBitmap\(false\)/);
assert.match(src,/setAntiAlias\(false\)/);
assert.match(src,/crop=normalizeIdleBody\(crop,i\)/);
assert.match(src,/SIZES_PX=\{50,75,100\}/);
assert.match(src,/COUNT=62/);
assert.match(src,/TOTAL_COUNT=COUNT\+EXTRA_COUNT/);
assert.match(src,/ASSET="edu_avatar_atlas_62.webp"/);
assert.match(src,/EXTRA_ASSET="edu_avatar_extra_5.webp"/);
assert.match(src,/if\(i>=COUNT && extras==null\)i=indexForState\("parado"\)/);
assert.match(overlay,/avatarView\.setScaleType\(ImageView\.ScaleType\.FIT_CENTER\)/);
console.log("LT312 EDU: tamanho corporal fixo de 22 poses, borda alinhada e extras opcionais OK");
