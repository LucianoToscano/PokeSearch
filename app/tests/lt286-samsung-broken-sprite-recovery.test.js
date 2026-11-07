"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const start=dock.indexOf("function attachSpriteFeedback(){");
const end=dock.indexOf("/* LT253: retry failed exact sprites",start);
assert.ok(start>0&&end>start,"live results sprite handler present");
const source=dock.slice(start,end);
new vm.Script(source);
assert.match(dock,/\.spriteStage:not\(\.loaded\) \.sprite\{visibility:hidden!important\}/);
assert.match(dock,/\.spriteStage\.loaded \.sprite\{visibility:visible!important\}/);
assert.match(dock,/\.spriteStage\.failed \.sprite\{display:none\}/);
assert.ok(dock.includes("stage.classList.remove(\"loaded\")"));
assert.ok(dock.includes('img.removeAttribute("src");'));
assert.ok(dock.includes("setTimeout(attachSpriteFeedback,1800)"));
assert.ok(dock.includes("setTimeout(attachSpriteFeedback,4800)"));
assert.ok(dock.includes("setTimeout(attachSpriteFeedback,14500)"));
assert.ok(dock.includes("spriteState.psSpriteRecovered"));
assert.ok(dock.includes('engine?.bundledExactForArt?.(card,art)'));
assert.ok(dock.includes('Sprite indisponível para a forma exata'));
assert.ok(!dock.includes('Imagem exata não verificada">◈'));

const art="data:image/png;base64,"+"A".repeat(64);
let now=10000,attempts=0,lookups=0;
const states=new Set(["failed"]);
const classes={contains:k=>states.has(k),add:k=>states.add(k),remove:k=>states.delete(k)};
const img={dataset:{psSpriteManaged:"1"},isConnected:true,_src:art,
 getAttribute(k){return k==="src"?this._src:"";},
 removeAttribute(k){assert.equal(k,"src");this._src="";attempts++;},
 set src(value){this._src=value;},get src(){return this._src;}};
const stage={classList:classes,querySelector(q){assert.equal(q,"img.sprite");return img;},
 closest(q){assert.equal(q,".spawn");return {getAttribute:k=>k==="data-index"?"0":null};}};
const c={name:"Meowth",number:"#52",form:"NORMAL",shiny:false};
const engine={resolve(v){assert.equal(v,c);lookups++;return {src:art,original:art};},
 bundledExactForArt(v){return v===c?art:"";}};
const context={document:{querySelectorAll(q){assert.equal(q,".spawn .spriteStage");return [stage];}},
 window:{PokeSearchOfflineSprite:engine},cards:[c],resultWindow:true,
 Date:{now:()=>now},setTimeout:()=>{},console};
const ctx=vm.createContext(context);
vm.runInContext(source+"attachSpriteFeedback();",ctx);
assert.equal(attempts,1,"retry identical verified bytes after a real error");
assert.equal(img.src,art);
assert.equal(img.dataset.psExactRetryCount,"1");
assert.equal(img.dataset.psSpriteRecovered,"1");
assert.equal(states.has("failed"),false);
states.add("failed");now+=1500;
vm.runInContext("attachSpriteFeedback()",ctx);
assert.equal(attempts,1,"cooldown prevents immediate repeated asset calls");
now+=1700;
vm.runInContext("attachSpriteFeedback()",ctx);
assert.equal(attempts,2,"second retry same verified art after cooldown");
states.add("failed");now+=5000;
vm.runInContext("attachSpriteFeedback()",ctx);
assert.equal(attempts,2,"strict two-retry limit per row");
assert.equal(img.src,art);
assert.ok(lookups>=2);

const unknown=Object.create(null);
const noExact={resolve:()=>({src:"https://unverified.example/art.png"}),
 bundledExactForArt:()=>""};
const img2={dataset:{psSpriteManaged:"1"},isConnected:true,_src:"https://unverified.example/art.png",
 getAttribute(){return this._src;},removeAttribute(){throw Error("unexpected retry");},
 set src(_v){throw Error("unexpected source");}};
const unknownStage={classList:{contains:k=>k==="failed",add(){},remove(){}},
 querySelector(){return img2;},closest(){return {getAttribute:()=>String(0)}}};
const safety={document:{querySelectorAll:()=>[unknownStage]},
 window:{PokeSearchOfflineSprite:noExact},cards:[{name:"Unverified Costume",number:"#52",costume:19}],
 Date:{now:()=>20000},setTimeout:()=>{}};
vm.runInNewContext(source+"attachSpriteFeedback();",safety);
assert.equal(img2.dataset.psExactRetryCount,undefined,
 "no unverified species/form substitution");
const bothShared=dock.includes("if(resultWindow)document.getElementById(\"spawns\").innerHTML=");
assert.equal(bothShared,true,"both independent result WebViews run the same renderer");
console.log("LT286 PASS: broken glyph hidden, exact immutable retry same src bounded, cooldown, no costume fallback, P1/P2 parity");
