"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);
new vm.Script(inline);
const from=inline.indexOf("const psVerifiedMoveIcons=new Map()");
const to=inline.indexOf("/* LT245: small",from);
assert.ok(from>0&&to>from,"verified icon state and compact fallback are present");
const cards={};
const line={dataset:{league:"gl"},textContent:"GL IV #1 ↳ Houndstone",children:[],
 appendChild(v){this.children.push(v);},};
const pop={hidden:true,textContent:"",innerHTML:""};
const doc={
 getElementById(k){if(k==="rankLine")return line;if(k==="movesPopover")return pop;
 throw Error("Unexpected "+k);},
 createElement(tag){return {tag,type:"",textContent:"",title:"",className:"",isConnected:true,
 style:{},attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},dataset:{}}}
};
let card="Houndstone",identity="card-A",lookups=0;
const simple={fast:{name:"Mordida",type:"dark",status:"normal"},
 charged:[{name:"Bola Sombria",type:"ghost",status:"normal"},
 {name:"Caninos Psíquicos",type:"psychic",status:"normal"}]};
const legacy={fast:{name:"Garra Sombria",type:"ghost",status:"normal"},
 charged:[{name:"Bola Sombria",type:"ghost",status:"normal"},
 {name:"Golpe legado",type:"ghost",status:"elite"}]};
const possible={availableOnly:true,
 fastMoves:[{name:"Brasa",type:"fire",status:"normal"},{name:"Abismar",type:"ghost",status:"normal"}],
 chargedMoves:["Ataque de Chamas","Rajada de Chamas","Onda de Calor","Fogo Místico"].map(name=>({
 name,type:"fire",status:"normal"}))};
const win={psRankContext:{leagues:[]},PokeSearchPvpRankMoves:{
 lookup:async(league,species)=>{lookups++;assert.equal(league,"gl");
 if(species==="Houndstone")return simple;
 if(species==="Litwick")return possible;
 if(species==="Greninja")return legacy;
 return null;}
}};
let resize=0;
const render=new Function("document","window","watchName","h","resizeEvolutionPanel",
 "getIdentity","getSpecies","getCardMoves","getLeague",
 inline.slice(from,to).replace(/detailIdentity/g,"getIdentity()")
  .replace(/currentRankSpecies/g,"getSpecies()")
  .replace(/currentCardMoves/g,"getCardMoves()")
  .replace(/activeRankLeague/g,"getLeague()")+
 "return renderRankOneMoves;")(
 doc,win,"Houndstone",s=>String(s),()=>{resize++;},
 ()=>identity,()=>card,()=>"Lick / Shadow Ball",()=> "gl");
async function test(){
 render();assert.equal(line.children.at(-1).textContent,"🗡");
 const first=line.children.at(-1);
 await first.onclick();
 assert.equal(pop.hidden,false);
 assert.equal(first.textContent,"🗡","no legacy -> verified dagger");
 assert.ok(pop.innerHTML.includes("Conjunto sem golpes legados"));
 await first.onclick();assert.equal(pop.hidden,true);
 render();
 assert.equal(line.children.at(-1).textContent,"🗡","verified icon survives rerender and collapse");
 assert.ok(line.children.at(-1).title.includes("sem golpe legado"));
 identity="card-B";card="Litwick";line.textContent="GL IV #1 Atual";
 render();const litwick=line.children.at(-1);
 assert.equal(litwick.textContent,"🗡","other species must start neutral without legacy assertion");
 await litwick.onclick();
 assert.ok(pop.innerHTML.includes("Sem conjunto PvP recomendado"));
 assert.ok(pop.innerHTML.includes('<details class="psAvailableMoveDetails">'),
  "full learnable-move pool must remain collapsed");
 assert.ok(pop.innerHTML.includes("Ver 6 golpes possíveis"));
 assert.ok(pop.innerHTML.includes("Fogo Místico"));
 assert.ok(!pop.innerHTML.includes("Ataques Recomendados:"));
 assert.equal(litwick.textContent,"🗡","unranked moves retain neutral action");
 identity="card-C";card="Greninja";line.textContent="GL IV #1 Atual";
 render();const greninja=line.children.at(-1);
 await greninja.onclick();assert.equal(greninja.textContent,"⚔️");
 assert.ok(pop.innerHTML.includes("Pelo menos um golpe legado"));
 render();assert.ok(line.children.at(-1).title.includes("exige pelo menos um"));
 identity="card-D";card="Unknown";line.textContent="GL IV #1 Atual";
 render();const unknown=line.children.at(-1);await unknown.onclick();
 assert.equal(unknown.textContent,"🗡");
 assert.ok(pop.innerHTML.includes("Sem recomendação PvPoke"));
 assert.ok(lookups>=4&&resize>=4);
 assert.match(html,/#movesPopover \.psAvailableMoveDetails\{[^}]*border-top/);
 console.log("LT248 PASS: no-legacy 🗡 persists, legacy ⚔ persists, unknown neutral, collapsed learnset, no hidden network requests");
}
test().catch(e=>{console.error(e);process.exitCode=1;});
