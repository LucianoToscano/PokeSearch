"use strict";
// LT200: real on-device symptom regression: API 400/422 and missing Pokémon portal.
// Proves sanitized diagnostics, never fakes successful live provider searches.
const assert=require("node:assert/strict");
const transport=require("../src/main/assets/api_browser_transport.js");
const contract=require("../src/main/assets/api_result_contract.js");
const reveal=require("../src/main/assets/api_reveal_contract.js");
const fs=require("node:fs"),path=require("node:path");
const probe=fs.readFileSync(path.join(__dirname,"../src/main/assets/probe.js"),"utf8");
const native=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const session=fs.readFileSync(path.join(__dirname,"../src/main/assets/api_android_session.js"),"utf8");
const secret="secret-jwt-and-user-location-123456789";
const common={mode:"raw",attack:15,defense:15,stamina:15};
const response=(status,body)=>({status,headers:{get:()=>null},text:async()=>JSON.stringify(body)});
function client(reply){
 let calls=0;
 const c=transport.createClient({
  fetchImpl:async()=>{calls++;return reply;},
  storage:{getItem:()=>null},siteOrigin:()=>"https://pogocoordinates.com",
  now:()=>Date.UTC(2026,9,31,13),apiContract:contract,revealContract:reveal
 });
 return {c,calls:()=>calls};
}
(async()=>{
 const t422=client(response(422,{detail:[{loc:["body","species_forms",0],
  msg:"Bad value: "+secret,input:{private:secret},type:"model_attributes_type"}]}));
 const r=await t422.c.search(common);
 assert.deepEqual(r,{ok:false,reason:"invalid-request",httpStatus:422,rejectedField:"species_forms"});
 assert.equal(t422.calls(),1,"No implicit retry or unauthorized fallback");
 assert.ok(!JSON.stringify(r).includes(secret));
 const t400=client(response(400,{detail:{message:secret}}));
 assert.deepEqual(await t400.c.search(common),{ok:false,reason:"invalid-request",httpStatus:400});
 const unknown=client(response(422,{detail:[{loc:["body","password"],msg:secret,input:secret}]}));
 assert.deepEqual(await unknown.c.search(common),{ok:false,reason:"invalid-request",httpStatus:422});
 const ambiguous=client(response(422,{detail:[
  {loc:["body","pokemon_ids"],msg:secret},{loc:["body","cp_min"],msg:secret}
 ]}));
 assert.deepEqual(await ambiguous.c.search(common),{ok:false,reason:"invalid-request",httpStatus:422});
 const tooLarge=client({status:422,headers:{get:()=>String(5000)},
  text:async()=>{throw Error("Must never read oversized response");}});
 assert.deepEqual(await tooLarge.c.search(common),{ok:false,reason:"invalid-request",httpStatus:422});
 assert.match(session,/r\.httpStatus===400\|\|r\.httpStatus===422/);
 assert.match(session,/diagnostic\.rejectedField=r\.rejectedField/);
 assert.match(native,/BugReport\.log\(this,"API_SCHEMA"/);
 assert.match(native,/case "pokemon_ids","species_forms","forms"/);
 assert.match(native,/case "center_lat","center_lng","radius_km","location"/);
 assert.match(native,/Nenhuma pesquisa alternativa nem filtro removido automaticamente/);
 assert.match(probe,/input\.__psPokemonPortalTryAt=now/);
 assert.match(probe,/now-last>=1500/);
 assert.match(probe,/input\.focus\(\)/);
 assert.match(native,/Seletor Pokémon não abriu no site/);
 console.log("PASS LT200: HTTP 400/422 schema diagnostics and Pokémon portal guard");
})().catch(e=>{console.error(e);process.exit(1);});
