"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const assets = path.join(__dirname, "../src/main/assets");
const iconPath = path.join(assets, "result-icons/modes/StarIVRaw.png");
const bytes = fs.readFileSync(iconPath);
assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "PNG signature");
let offset = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
let palette, transparency, image = [];
while (offset + 12 <= bytes.length) {
  const n = bytes.readUInt32BE(offset);
  const type = bytes.toString("ascii", offset + 4, offset + 8);
  const raw = bytes.subarray(offset + 8, offset + 8 + n);
  assert.ok(offset + 12 + n <= bytes.length, "intact PNG chunks");
  if (type === "IHDR") {
    width = raw.readUInt32BE(0);
    height = raw.readUInt32BE(4);
    bitDepth = raw[8];
    colorType = raw[9];
    assert.equal(raw[12], 0, "noninterlaced raster");
  } else if (type === "PLTE") palette = raw;
  else if (type === "tRNS") transparency = raw;
  else if (type === "IDAT") image.push(raw);
  else if (type === "IEND") break;
  offset += n + 12;
}
assert.ok(width >= 96 && height >= 96, "minimum crisp icon resolution");
assert.ok(width <= 1024 && height <= 1024, "avoid unnecessary oversized toolbar assets");
assert.equal(bitDepth, 8);
assert.equal(colorType, 3, "transparent, optimized indexed PNG");
assert.ok(palette && transparency && image.length, "indexed palette/alpha/IDAT required");
const compressed = zlib.inflateSync(Buffer.concat(image));
const stride = width, rgbaAlpha = new Uint8Array(width * height);
let previous = Buffer.alloc(stride), p = 0;
const paeth = (a,b,c) => {
  const v=a+b-c, da=Math.abs(v-a), db=Math.abs(v-b), dc=Math.abs(v-c);
  return da<=db&&da<=dc?a:db<=dc?b:c;
};
for (let y=0; y<height; y++) {
  const filter=compressed[p++];
  const row = Buffer.from(compressed.subarray(p,p+stride)); p+=stride;
  for (let x=0; x<stride; x++) {
    const left=x>0?row[x-1]:0, up=previous[x], upperLeft=x>0?previous[x-1]:0;
    if(filter===1) row[x]=(row[x]+left)&255;
    else if(filter===2) row[x]=(row[x]+up)&255;
    else if(filter===3) row[x]=(row[x]+Math.floor((left+up)/2))&255;
    else if(filter===4) row[x]=(row[x]+paeth(left,up,upperLeft))&255;
    else assert.equal(filter,0,"supported PNG filter");
    rgbaAlpha[y*width+x]=row[x]<transparency.length?transparency[row[x]]:255;
  }
  previous=row;
}
assert.equal(rgbaAlpha[0], 0, "top-left truly transparent");
assert.equal(rgbaAlpha[width-1], 0, "top-right truly transparent");
assert.equal(rgbaAlpha[(height-1)*width], 0, "bottom-left truly transparent");
assert.equal(rgbaAlpha[width*height-1], 0, "bottom-right truly transparent");
assert.equal(rgbaAlpha[Math.floor(height/2)*width+Math.floor(width/2)], 255,"solid logo center");
const transparent=rgbaAlpha.filter(a=>a===0).length;
const opaque=rgbaAlpha.filter(a=>a===255).length;
const softened=rgbaAlpha.filter(a=>a>0&&a<255).length;
assert.ok(transparent>width*height*.20, "no opaque black box outside the artwork");
assert.ok(opaque>width*height*.20, "preserve the visible center and rim");
assert.ok(softened>10, "anti-aliased boundaries without hard cutout");
const dock = fs.readFileSync(path.join(assets,"dock.html"),"utf8");
assert.ok(dock.includes('custom:"StarIVRaw.png"'),"IV raw menu mapping");
assert.ok(dock.includes('percent:starCount<0?"StarIVRaw.png"'),"percent range mapping");
for(const id of ["dockModeIcon","resultModeIcon","bubbleModeIcon"]){
  assert.ok(dock.includes('id="'+id+'"'),"icon view exists: "+id);
}
assert.ok(dock.includes('result-icons/modes/'),"all toolbar modes use actual PNG asset");
const java=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
assert.ok(java.includes("PokemonPicker.show("),"Favorites remains accessible");
console.log("LT212 PASS: transparent 128px IV icon, anti-alias, P1/P2 mode links, panel entry");
