"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const sessionFactory=require("../src/main/assets/api_android_session.js");
const contract=require("../src/main/assets/api_result_contract.js");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function take(session,ticket){
 for(let tries=0;tries<8;tries++){
  await flush();
  const output=session.take(ticket);
  if(!output.pending)return output;
 }
 throw Error("Catalog mock did not settle");
}
async function run(){
 const forms=Array.from({length:333},(_,i)=>"Form "+String(i+1).padStart(3,"0"));
 const session=sessionFactory.createSession({
  siteOrigin:()=>"https://pogocoordinates.com",
  catalog:{getCatalog:async()=>({ok:true,forms,catalogSpeciesForms:[
   {pokemon_id:19,form_id:0,species_name:"Rattata",form_name:"Rattata"}
  ]}),dispose(){}},
  transport:{search:async()=>({ok:false,reason:"unavailable"}),
   reveal:async()=>({ok:false,reason:"unavailable"}),dispose(){}}
 });
 assert.equal(session.startForms(1,"").pending,true);
 const catalog=await take(session,1);
 assert.equal(catalog.ok,true);
 assert.equal(catalog.options.length,333,"Never silently drop the last 133 forms");
 assert.equal(catalog.options[332],"Form 333");
 assert.equal(session.startForms(2,"333").pending,true);
 const filtered=await take(session,2);
 assert.deepEqual(filtered.options,["Form 333"]);
 assert.doesNotMatch(JSON.stringify(catalog),/jwt|reveal_code/i);
 session.dispose();
 console.log("PASS LT86 full 333-form catalog and targeted lookup (mock)");

 assert.match(dock,/levelMin:\[1,50\],levelMax:\[1,50\]/);
 assert.match(dock,/input\.max=level\?"50":"99999"/);
 assert.match(dock,/formListVisibleCount=60/);
 assert.match(dock,/formListVisibleCount\+60/);
 assert.match(dock,/Mostrar mais formas/);
 assert.doesNotMatch(dock,/Usar opções observadas no site/);
 console.log("PASS LT86 level selector and visible form pagination");

 const accepted=contract.buildPayload({mode:"percent",
   levelMin:"50",levelMax:"50",percentMin:"100",percentMax:"100"});
 assert.equal(accepted.ok,true,JSON.stringify(accepted));
 assert.equal(accepted.payload.level_min,50);
 assert.equal(accepted.payload.level_max,50);
 assert.equal(contract.buildPayload({mode:"percent",levelMin:"51"}).ok,false);
 console.log("PASS LT86 level 50 sent, level 51 rejected");
}
run().catch(e=>{console.error(e);process.exitCode=1;});
