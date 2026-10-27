"use strict";
const assert=require("node:assert/strict");
const {LEASE_MS,claimBinding,transferBinding,releaseBinding,
  adminDisconnectBinding,adminAllowTransferBinding,sessionState}
  =require("../premium-device-state.cjs");
const A="a".repeat(64),B="b".repeat(64),C="c".repeat(64);
const create=(hash,name,now)=>({hash,name,now});
let checks=0;
function test(name,fn){fn();checks++;console.log("PASS "+name);}
test("First login binds one installation",()=>{
 const b=claimBinding(null,create(A,"Galaxy",100000));
 assert.equal(b.deviceHash,A);assert.equal(b.boundAt,100000);
 assert.equal(b.sessionExpiresAt,100000+LEASE_MS);
});
const a=claimBinding(null,create(A,"Galaxy",100000));
test("Same installation renews the server session",()=>{
 const b=claimBinding(a,create(A,"Galaxy",140000));
 assert.equal(b.deviceHash,A);assert.equal(b.boundAt,100000);
 assert.equal(b.sessionExpiresAt,140000+LEASE_MS);
});
test("Second phone cannot silently take over",()=>{
 assert.equal(claimBinding(a,create(B,"Moto",140000)),undefined);
});
test("Reject transfer leaves old device unchanged",()=>{
 const current=a;
 assert.equal(claimBinding(current,create(B,"Moto",140000)),undefined);
 assert.equal(current.deviceHash,A);
});
const transferred=transferBinding(a,create(B,"Moto",140000));
test("Explicit transfer changes authorized phone",()=>{
 assert.equal(transferred.deviceHash,B);
 assert.equal(transferred.switchedAt,140000);
});
test("Old device denied after transfer",()=>{
 assert.equal(claimBinding(transferred,create(A,"Galaxy",150000)),undefined);
 assert.equal(claimBinding(transferred,create(C,"Tablet",150000)),undefined);
});
test("Repeated transfer by current phone is idempotent",()=>{
 const same=transferBinding(transferred,create(B,"Moto",150000));
 assert.equal(same.deviceHash,B);assert.equal(same.switchedAt,140000);
});
test("Fast repeated transfers are throttled",()=>{
 assert.equal(transferBinding(transferred,create(C,"Tablet",155000)),undefined);
});
test("Legitimate phone transfer works after cooldown",()=>{
 assert.equal(transferBinding(transferred,create(C,"Tablet",200001)).deviceHash,C);
});
test("Old phone logout cannot disconnect the new owner",()=>{
 assert.equal(releaseBinding(transferred,{hash:A,now:180000}),undefined);
 assert.equal(transferred.deviceHash,B);
});
test("Active-device logout releases only its own P2 session",()=>{
 const released=releaseBinding(transferred,{hash:B,now:180000});
 assert.equal(released.deviceHash,"");assert.equal(released.sessionExpiresAt,0);
 assert.equal(sessionState(released,180001),"unbound");
 assert.equal(claimBinding(released,create(C,"Tablet",180010)).deviceHash,C);
});
test("Offline and expired lease states are visible to admin",()=>{
 assert.equal(sessionState(transferred,140001),"active");
 assert.equal(sessionState(transferred,140000+LEASE_MS+1),"idle");
});
test("Admin remote disconnect preserves caller's license state externally",()=>{
 const released=adminDisconnectBinding(transferred,{now:180000});
 assert.equal(released.deviceHash,"");
 assert.equal(adminDisconnectBinding(released,{now:181000}),undefined);
});
test("Admin may lift handover cooldown without disconnect",()=>{
 const unlocked=adminAllowTransferBinding(transferred);
 assert.equal(unlocked.deviceHash,B);assert.equal(unlocked.switchedAt,0);
 assert.equal(transferBinding(unlocked,create(C,"Tablet",150000)).deviceHash,C);
});
test("Admin release has no effect on never-bound installation",()=>{
 assert.equal(adminAllowTransferBinding({deviceHash:A,switchedAt:0}),undefined);
});
console.log("PASS "+checks+" atomic device session test cases");
