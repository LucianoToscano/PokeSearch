"use strict";
// LT62: menu/result visual-state regression checks (no Android SDK required).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const tests=[];
function check(name,fn){tests.push([name,fn]);}
check("Location: active pin outer outline red, inner circle keeps neutral color",()=>{
 assert.match(dock,/\[data-key="location"\]\.selected \.quickGlyph svg>path\{\s*stroke:#ff5264!important;fill:none!important/);
 assert.match(dock,/\[data-key="location"\]\.selected \.quickGlyph svg>circle\{\s*stroke:var\(--visual-menu-fg/);
});
check("Pokémon: applied selection colors the silhouette yellow and OFF stays theme neutral",()=>{
 assert.ok(dock.includes('button.classList.toggle("pokemon-has-selection",id==="pokemon"'));
 assert.ok(dock.includes('button[data-key="pokemon"].pokemon-has-selection .quickGlyph svg'));
 assert.ok(dock.includes('color:#ffd64b!important;stroke:#ffd64b!important'));
});
check("Filters: only additional nondefault filters create count badge",()=>{
 assert.ok(dock.includes('button.classList.toggle("has-extra-filters",count>0)'));
 assert.ok(dock.includes('if(count>0)button.dataset.filterCount=String(count)'));
 assert.ok(dock.includes('else delete button.dataset.filterCount'));
 assert.ok(dock.includes('top:1px!important;right:1px!important'));
});
check("Gear rotates while searching; opening changes orientation; motion preference respected",()=>{
 assert.ok(dock.includes('#gear.busy svg{animation:gearbusy'));
 assert.ok(dock.includes('#gear[aria-expanded="true"]:not(.busy) .gear-icon{transform:rotate(90deg)}'));
 assert.ok(dock.includes('@media (prefers-reduced-motion:reduce)'));
});
check("Result Pokéball keeps independent header, central pulse and confirmed metadata",()=>{
 for(const x of ['id="resultIconStack"','id="capturePulse"','@keyframes psCapturePulse','activeSearchPhase==="searching"','id="modeIndicatorValue"','classList.toggle("long"'])assert.ok(dock.includes(x),x);
});
check("Percent interval badge uses one star band only or neutral percent art",()=>{
 const matched=dock.match(/function modePercentStarCount\(minValue,maxValue\)\{[\s\S]*?\n\}\nfunction getModeMenuIcon/);
 assert.ok(matched,"function available");
 const src=matched[0].replace(/\nfunction getModeMenuIcon$/,"");
 const sandbox={};vm.runInNewContext(src+";this.stars=modePercentStarCount",sandbox);
 for(const [min,max,expected] of [[0,0,0],[0,48,0],[51,64,1],[67,80,2],[82,98,3],[100,100,3],[0,100,-1],[50,100,-1],[60,90,-1]]){
  assert.equal(sandbox.stars(min,max),expected,`${min}-${max}`);
 }
 assert.ok(dock.includes('percent:starCount<0?"StarIVRaw.png"'));
 assert.ok(dock.includes('family==="percent"&&starCount<0?"%":""'));
});
check("LT62 screenshots: gender uses exactly four compact symbol squares; size uses seven",()=>{
 assert.match(dock,/LT62-COMPACT-REDMARKS/);
 assert.match(dock,/\.extraChipRow\[data-kind="gender"\]\{\s*grid-template-columns:repeat\(4,29px\)!important/);
 assert.match(dock,/\.extraChipRow\[data-kind="size"\]\{\s*grid-template-columns:repeat\(7,29px\)!important/);
 assert.match(dock,/\.extraChipRow \.extraChip\{[\s\S]*?width:29px!important;min-width:29px!important;max-width:29px!important/);
 assert.ok(dock.includes('["Any","Male","Female","Genderless"]'));
});
check("LT62 screenshots: mode list loses blank right column but IV/GL/UL stay cascaded",()=>{
 assert.match(dock,/\.modePanel\.modeCascade\{\s*width:54px!important;height:164px!important/);
 assert.match(dock,/\.modeCascadeRail\{\s*width:52px!important/);
 assert.ok(dock.includes('h=Math.max(h,baseHeight+164+6);'));
 for(const token of ['const tops={raw:67,percent:90,gl:113,ul:136};',
   'const offsets={raw:67,percent:90,gl:113,ul:136};',
   'left:54px!important;max-width:calc(100% - 54px)!important;'])
  assert.ok(dock.includes(token),token);
});
check("LT62 screenshots: filter numeric, size, sort and action buttons no longer stretch",()=>{
 for(const token of ['.extraNumberRow input{','width:72px!important;max-width:72px!important',
  '.extraNumberRow.extraLevel input{','width:37px!important;max-width:37px!important',
  '.modeAction.filterActions button{','flex:0 0 auto!important;width:auto!important;min-width:0!important;'])
  assert.ok(dock.includes(token),token);
});
check("LT62 screenshots: location and auto popup stay compact, with no empty footer widths",()=>{
 for(const token of ['width:min(222px,calc(100vw - 14px))!important',
  'width:min(153px,calc(100vw - 14px))!important',
  '.compactLocationActions button{','flex:0 0 auto!important;width:auto!important;min-width:0!important'])
  assert.ok(dock.includes(token),token);
});
check("LT62 screenshots: editor tabs, P/M/G and steppers use intrinsic widths",()=>{
 const editor=fs.readFileSync(path.join(__dirname,"../src/main/assets/visual_editor.js"),"utf8");
 assert.ok(editor.includes('wrap.append(title,value,range,fine)'));
 for(const token of ['.visualTabs .visualButton{','flex:0 0 auto!important;width:auto!important;min-width:68px!important',
  '.visualSlider>input[type="range"]{','.visualSlider>.visualFineTune{',
  'grid-column:2!important;grid-row:2!important','grid-template-columns:repeat(3,29px)!important'])
  assert.ok(dock.includes(token),token);
});
for(const [name,fn] of tests){fn();process.stdout.write("✓ "+name+"\n");}
process.stdout.write("LT62: "+tests.length+"/"+tests.length+" checks passed\n");
