"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const transport=require("../src/main/assets/api_browser_transport.js");
const contract=require("../src/main/assets/api_result_contract.js");
const reveal=require("../src/main/assets/api_reveal_contract.js");
const root=path.join(__dirname,"../src/main");
const native=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const session=fs.readFileSync(path.join(root,"assets/api_android_session.js"),"utf8");
const profile=fs.readFileSync(path.join(root,"assets/profile_summary.js"),"utf8");
const confidential="SECRET-TOKEN-EXAMPLE-DO-NOT-LOG";
const site="https://pogocoordinates.com",api="https://coordinates-api.pokemongopro.com";
const ok=body=>({status:200,headers:{get:()=>null},text:async()=>JSON.stringify(body)});
const error=(status,body)=>({status,headers:{get:()=>null},text:async()=>JSON.stringify(body)});
const linked={active:true,trainer_code:"000011112222",trainer_name:"Trainer_One",team_name:"Mystic",level:46};
function make(routes,token="head.payload.signature"){
 const calls=[];
 const client=transport.createClient({
  fetchImpl:async(url,options)=>{
   calls.push({path:new URL(url).pathname,verb:options.method,
    authenticated:typeof options.headers.Authorization==="string"&&
      options.headers.Authorization.startsWith("Bearer "),
    contentType:options.headers["Content-Type"]||null});
   const response=routes[new URL(url).pathname];
   if(!response)return error(404,{detail:"not-found "+confidential});
   return response;
  },
  storage:{getItem:()=>token,removeItem:()=>{}},
  siteOrigin:()=>site,now:()=>Date.UTC(2026,9,31),
  apiContract:contract,revealContract:reveal
 });
 return {client,calls};
}
(async()=>{
 let x=make({"/users/me":ok({trainers:[linked]})});
 let result=await x.client.accountStatus();
 assert.equal(result.auth,"authenticated");
 assert.equal(result.trainerState,"linked");
 assert.deepEqual(result.trainers,[{code:"000011112222",name:"Trainer_One",team:"Mystic",level:"46"}]);
 assert.deepEqual(x.calls.map(c=>c.path),["/users/me"]);
 assert.equal(x.calls[0].authenticated,true);
 assert.equal(x.calls[0].contentType,null,"GET must not send arbitrary JSON");
 x.client.dispose();

 x=make({"/users/me":ok({email:confidential,trainers:[]}),
         "/trainer":ok({trainers:[linked]})});
 result=await x.client.accountStatus();
 assert.equal(result.trainerState,"linked","second read-only source recovers linked trainer");
 assert.deepEqual(x.calls.map(c=>c.path),["/users/me","/trainer"]);
 assert.ok(!JSON.stringify(result).includes(confidential));
 x.client.dispose();

 x=make({"/users/me":ok({trainers:[]}),"/trainer":ok({trainers:[]})});
 result=await x.client.accountStatus();
 assert.equal(result.trainerState,"unknown","Empty list does not prove a permanent unlink");
 assert.deepEqual(result.trainers,[]);
 x.client.dispose();

 x=make({"/users/me":ok({trainers:[{...linked,active:false}]}),
         "/trainer":ok({trainers:[]})});
 assert.equal((await x.client.accountStatus()).trainerState,"unknown",
   "Inactive entries do not prove a linked trainer");
 x.client.dispose();

 x=make({"/users/me":error(401,{detail:confidential}),"/trainer":ok({trainers:[linked]})});
 result=await x.client.accountStatus();
 assert.equal(result.auth,"login-required");
 assert.deepEqual(x.calls.map(c=>c.path),["/users/me"],"No bypass after 401");
 x.client.dispose();

 x=make({"/users/me":ok({trainers:[{...linked,trainer_code:confidential}]}),
         "/trainer":ok({trainers:[]})});
 result=await x.client.accountStatus();
 assert.equal(result.trainerState,"unknown","Invalid trainer code is never trusted");
 assert.ok(!JSON.stringify(result).includes(confidential));
 x.client.dispose();

 x=make({"/search":error(422,{detail:[
  {loc:["header","authorization"],msg:confidential,input:confidential}]})});
 const bad=await x.client.search({mode:"raw",attack:15,defense:15,stamina:15});
 assert.deepEqual(bad,{ok:false,reason:"invalid-request",httpStatus:422,
  endpoint:"search",rejectedPart:"header",rejectedField:"authorization"});
 assert.deepEqual(x.calls.map(c=>c.path),["/search"]);
 assert.equal(x.calls[0].contentType,"application/json");
 assert.equal(x.calls[0].authenticated,true);
 assert.ok(!JSON.stringify(bad).includes(confidential));
 x.client.dispose();

 x=make({"/search":error(422,{detail:[
  {loc:["body","radius_km"],msg:confidential,input:confidential}]})});
 const radius=await x.client.search({mode:"raw",attack:15,defense:15,stamina:15});
 assert.equal(radius.rejectedField,"radius_km");
 assert.equal(radius.rejectedPart,"body");
 assert.ok(!JSON.stringify(radius).includes(confidential));
 x.client.dispose();

 assert.match(native,/recoverOfficialTrainerFromAccountApi\(view,generation\)/);
 assert.match(native,/AuthorizedApiCollector reader=new AuthorizedApiCollector/);
 assert.match(native,/profileTrainerState","linked"/);
 assert.match(service,/method=POST path=\/search HTTP=/);
 assert.match(service,/case "authorization" -> "Autenticação"/);
 assert.match(session,/diagnostic\.rejectedPart=r\.rejectedPart/);
 assert.ok(!profile.includes('accounts.*?\\bLink my account\\b'));
 const sources=[native,service,session,transport.createClient.toString()];
 assert.ok(!sources.some(s=>s.includes('"/trainer/confirm"')),"No auto confirmation or unlink");
 console.log("PASS LT203: account read-only verification, 422 safe diagnostics, P1/P2 isolation");
})().catch(e=>{console.error(e);process.exitCode=1});
