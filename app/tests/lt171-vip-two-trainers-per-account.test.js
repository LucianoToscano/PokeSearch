"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const asset=fs.readFileSync(path.join(__dirname,"../src/main/assets/profile_summary.js"),"utf8");
const dir=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const main=fs.readFileSync(path.join(dir,"MainActivity.java"),"utf8");
const slots=fs.readFileSync(path.join(dir,"PogoAccountSlots.java"),"utf8");

// Provider VIP (2/2) and ordinary (1/1) accounts are parsed independently.
// Use only the visible, official profile DOM and actual 12-digit trainer codes.
function visible(s){
 return {innerText:s,textContent:s,getClientRects:()=>[1],parentElement:null};
}
function profile(count,trainers){
 const cards=trainers.map(x=>visible(x.name+" "+x.team+
   " · Level "+x.level+" Trainer code "+x.code.replace(/(\d{4})(\d{4})(\d{4})/,"$1 $2 $3")));
 const heading=visible("Pokemon GO accounts "+count+"/"+count);
 const body="Linked accounts Pokemon GO accounts "+count+"/"+count+" "+
   cards.map(x=>x.innerText).join(" ");
 const document={body:{innerText:body},querySelectorAll(selector){
  if(selector.includes("p,span"))return [heading,...cards];
  return [];
 }};
 return JSON.parse(vm.runInNewContext(asset,{document,location:{
  pathname:"/profile",origin:"https://pogocoordinates.com",href:"https://pogocoordinates.com/profile"
 }}));
}
const vip=profile(2,[
 {name:"TrainerVIPOne",team:"Mystic",level:42,code:"111122223333"},
 {name:"TrainerVIPTwo",team:"Valor",level:41,code:"444455556666"}
]);
const ordinary=profile(1,[
 {name:"TrainerOrdinary",team:"Instinct",level:36,code:"777788889999"}
]);
assert.equal(vip.ok,true);
assert.equal(vip.trainerState,"linked");
assert.equal(vip.trainers.length,2,"VIP provider account must retain BOTH verified trainers");
assert.deepEqual(vip.trainers.map(t=>t.code),["111122223333","444455556666"]);
assert.equal(ordinary.ok,true);
assert.equal(ordinary.trainers.length,1);
assert.equal(ordinary.trainers[0].code,"777788889999");
assert.ok(vip.trainers.every(t=>t.code!==ordinary.trainers[0].code),
 "provider account A cannot borrow trainer from B");
const chosen=main.slice(main.indexOf("private void choosePokeballTrainer("),
 main.indexOf("private void openLoginDialogForSlot(",main.indexOf("private void choosePokeballTrainer(")));
assert.match(chosen,/SharedPreferences prefs=PogoAccountSlots\.prefs\(this,account\)/);
assert.match(chosen,/JSONArray list/);
assert.match(chosen,/PogoAccountSlots\.hasTrainer\(this,account,code\)/);
assert.match(chosen,/int trainerNumber=codes\.size\(\)/);
assert.match(chosen,/names\.add\("Treinador "\+trainerNumber/);
assert.match(chosen,/PogoAccountSlots\.bind\(this,secondary,account,selection\[which\]\)/);
assert.match(slots,/secondary\?"pogoOverlayTrainer2":"pogoOverlayTrainer1"/);
assert.match(slots,/secondary\?"pogoOverlayAccount2":"pogoOverlayAccount1"/);
assert.match(slots,/hasTrainer\(context,account,verified\)/);
assert.match(slots,/JSONArray list=new JSONArray\(prefs\(context,slot\)\.getString\("profileTrainerList","\[\]"\)\)/);
const chooser=main.slice(main.indexOf("private void showPokeballAccountChoice("),
 main.indexOf("private void choosePokeballTrainer(",main.indexOf("private void showPokeballAccountChoice(")));
assert.match(chooser,/"Conta 1 · busca livre"/);
assert.match(chooser,/"Conta 2 · "/);
assert.match(chooser,/PogoAccountSlots\.bindAccountOnly\(this,secondary,slot\)/);
assert.doesNotMatch(chooser,/choosePokeballTrainer\(secondary,slot\)/);
console.log("LT170 VIP matrix: Account1 two verified trainers, Account2 one; P1/P2 independently assign both PASS");
