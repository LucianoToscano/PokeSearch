"use strict";
/* LT295 Samsung: the little 30dp Card sprite must have a readable opaque
 * footprint; PvP attacks must belong to EACH row's exact evolution/league.
 */
const assert=require("node:assert/strict"),fs=require("node:fs"),
 path=require("node:path"),vm=require("node:vm");
const dir=path.join(__dirname,"../src/main/assets");
const detail=fs.readFileSync(path.join(dir,"detail.html"),"utf8");
const scaler=fs.readFileSync(path.join(dir,"sprite_visual_scale.js"),"utf8");
const moves=fs.readFileSync(path.join(dir,"pvp_evolution_moves_ui.js"),"utf8");
const java=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
new vm.Script(scaler);new vm.Script(moves);
assert.match(detail,/src="pvp_evolution_moves_ui\.js"/);
assert.match(detail,/onclick="toggleEvolutionMoves\(event,this\)"/);
assert.match(detail,/data-ps-name="'\+h\(name\)/);
assert.match(detail,/data-ps-league="'\+h\(psLeague\)/);
assert.match(detail,/data-ps-mega="'\+String\(isMega\)/);
assert.match(detail,/class="evoMoveDetails" hidden role="region"/);
assert.match(detail,/PokeSearchEvolutionMoves\?\.setScope\?\.\(detailIdentity\)/);
assert.match(detail,/PokeSearchEvolutionMoves\?\.restore\?\.\(\)/);
assert.match(detail,/#evolutions\.psPerEvoMoves #psLeagueMoves\{display:none!important\}/);
assert.match(detail,/PokeSearchSpriteScale\?\.applyDetail\?\.\(/);
assert.match(detail,/PokeSearchSpriteScale\?\.resetDetail\?\.\(img\)/);
assert.match(scaler,/const DETAIL_VISIBLE_TARGET=\.87/);
assert.match(scaler,/requestDetailSpriteSilhouette\(url,token\)/);
assert.match(scaler,/root\.PokeSearchSpriteScale=Object\.freeze\(\{[^}]+applyDetail,resetDetail,onDetailNativeBounds\}/);
assert.match(java,/@JavascriptInterface public boolean requestDetailSpriteSilhouette\(/);
assert.match(java,/if\(stopped\|\|detailPanel==null\|\|!detailLoaded\)return;/);
assert.match(java,/js\(detailPanel,detailLoaded,response\)/);
assert.match(java,/requestToken\.matches\("psd\[1-9\]\[0-9\]\{0,8\}"\)/);
assert.doesNotMatch(moves,/requestCoords|PoGoCoordinates|userToken|Authorization/);
const pixels=new Uint8ClampedArray(96*96*4);
const rect={left:38,right:57,top:30,bottom:67};
for(let y=rect.top;y<=rect.bottom;y++)for(let x=rect.left;x<=rect.right;x++)
 pixels[(y*96+x)*4+3]=255;
function imageEnv(tainted,native){
 const props={},requests=[];
 const img={src:"https://pogocoordinates.com/sprites/charmander.png",
  currentSrc:"https://pogocoordinates.com/sprites/charmander.png",
  naturalWidth:256,naturalHeight:256,clientWidth:30,isConnected:true,
  dataset:{},style:{setProperty(k,v){props[k]=String(v);}}};
 const env={window:{Native:native?{requestDetailSpriteSilhouette(url,token){
  requests.push({url,token});return true;}}:undefined},
 document:{createElement:()=>({getContext:()=>({clearRect(){},drawImage(){},
  getImageData(){if(tainted)throw new Error("SecurityError");return {data:pixels};}
 })})}};
 vm.runInNewContext(scaler,env);
 return {img,props,requests,scale:env.window.PokeSearchSpriteScale};
}
const occ=Math.max((rect.right-rect.left+1)/96,(rect.bottom-rect.top+1)/96);
let v=imageEnv(false,false);
assert.equal(v.scale.applyDetail(v.img,null,false),true);
let fill=Number(v.props["--ps-alpha-scale"])*occ;
assert.ok(fill>=.85&&fill<=.90,"readable detail 30dp silhouette 87%");
v.scale.resetDetail(v.img);
assert.equal(v.props["--ps-alpha-scale"],"1");
v=imageEnv(true,true);
assert.equal(v.scale.applyDetail(v.img,null,true),true);
assert.equal(v.requests.length,1);
assert.equal(v.scale.onDetailNativeBounds(v.requests[0].token,
 v.img.src,rect),true);
fill=Number(v.props["--ps-alpha-scale"])*occ;
assert.ok(fill>=.85&&fill<=.90,"native alpha corrects detail after CORS denial");
assert.equal(v.scale.onDetailNativeBounds(v.requests[0].token,
 v.img.src,rect),false,"single-use callback");
v=imageEnv(true,false);
assert.equal(v.scale.applyDetail(v.img,null,false),false);
assert.equal(v.props["--ps-alpha-scale"],"1","no fabricated scaling when unreadable");
function row(name,league="gl",mega=false,reference=false){
 const slot={hidden:true,innerHTML:""};
 const attrs={};
 const button={dataset:{psName:name,psLeague:league,psMega:String(mega),
  psReference:String(reference),psMt:"unknown"},title:"Ver golpes",
  closest:()=>obj,setAttribute(k,v){attrs[k]=v;}};
 const css=new Set();
 const obj={querySelector(s){
   return s===".evoMoveDetails"?slot:s===".evoMovesAction"?button:null;},
   classList:{add(k){css.add(k);},remove(k){css.delete(k);}}};
 return {obj,button,slot,attrs,css};
}
const charmander=row("Charmander"),charmeleon=row("Charmeleon"),
 charizard=row("Charizard"),mega=row("Charizard (Mega)", "ul",true,true);
const rows=[charmander,charmeleon,charizard,mega];
const calls=[];
const sample={
 fast:{name:"Brasa",type:"fire",status:"normal",localeVerified:true},
 charged:[
  {name:"Rajada de Chamas",type:"fire",status:"elite",localeVerified:true},
  {name:"Garra de Dragão",type:"dragon",status:"normal",localeVerified:true}],
 recommended:true};
const context={window:{
 document:{querySelectorAll:()=>rows.map(r=>r.obj),
  getElementById:()=>({hidden:true})},
 resizeEvolutionPanel(){},
 PokeSearchPvpRankMoves:{
  lookup:async(league,name)=>{calls.push({league,name,mega:false});return sample;},
  lookupMega:async(league,name)=>{calls.push({league,name,mega:true});
   return {...sample,megaRecommendation:true};}
 }
}};
vm.runInNewContext(moves,context);
const api=context.window.PokeSearchEvolutionMoves;
assert.equal(typeof api.open,"function");
api.setScope("capture-1");
(async()=>{
 await api.open(null,charmeleon.button);
 assert.deepEqual(calls[0],{league:"gl",name:"Charmeleon",mega:false});
 assert.match(charmeleon.slot.innerHTML,/Charmeleon/);
 assert.match(charmeleon.slot.innerHTML,/Brasa/);
 assert.match(charmeleon.slot.innerHTML,/Rajada de Chamas/);
 assert.equal(charmeleon.button.dataset.psMt,"elite");
 assert.equal(charizard.slot.hidden,true);
 await api.open(null,charizard.button);
 assert.deepEqual(calls[1],{league:"gl",name:"Charizard",mega:false});
 assert.equal(charmeleon.slot.hidden,true,"one species panel at a time");
 assert.match(charizard.slot.innerHTML,/Charizard/);
 assert.doesNotMatch(charizard.slot.innerHTML,/Charmeleon/);
 await api.open(null,mega.button);
 assert.deepEqual(calls[2],{league:"ul",name:"Charizard (Mega)",mega:true});
 assert.match(mega.slot.innerHTML,/Megaedição/);
 assert.match(mega.slot.innerHTML,/Projeção teórica/);
 api.setScope("capture-2");
 assert.equal(mega.slot.hidden,false,"stale content remains until DOM is replaced");
 const legacyOnly=api.render("Quilava","gl",false,false,{
  fast:{name:"Golpe Antigo",type:"fire",status:"legacy",localeVerified:true},
  charged:[{name:"Brasa",type:"fire",status:"normal",localeVerified:true}]});
 assert.match(legacyOnly,/Legado/);
 const noMeta=api.render("Forma Incerta","gl",false,true,{
  availableOnly:true,fastMoves:[],chargedMoves:[]});
 assert.match(noMeta,/nenhum conjunto PvP recomendado/);
 assert.doesNotMatch(noMeta,/Ágil:/);
 console.log("LT295 PASS: 30dp card 87pct alpha, native detail bridge, exact per-evolution/league PvP attack buttons, translated moves, source honesty");
})().catch(e=>{console.error(e);process.exitCode=1;});
