"use strict";
const crypto=require("node:crypto");
const {onValueCreated,onValueDeleted}=require("firebase-functions/v2/database");
const {onSchedule}=require("firebase-functions/v2/scheduler");
const {initializeApp,getApps}=require("firebase-admin/app");
const {getDatabase}=require("firebase-admin/database");
const DB_URL="https://pokesearch-lt-default-rtdb.firebaseio.com/";
if(!getApps().length)initializeApp({databaseURL:DB_URL});
const statsDatabase=()=>getDatabase(undefined,DB_URL);
const OPTIONS={instance:"pokesearch-lt-default-rtdb",region:"us-central1"};
async function applyEvent(name,delta,event){
 if(!["installCount","onlineCount"].includes(name)||![1,-1].includes(delta))
  throw Error("Unknown metric");
 if(!event||!event.id)throw Error("Missing event ID");
 const key=crypto.createHash("sha256").update(event.id).digest("hex");
 const now=Date.now(),db=statsDatabase();
 // Idempotent in the transaction; no user IDs are readable by clients.
 const r=await db.ref("stats/serverCounters").transaction(value=>{
  const data=value&&typeof value==="object"?value:{};
  const done=data.done&&typeof data.done==="object"?data.done:{};
  if(!done[key]){
   data[name]=Math.max(0,(Number.isSafeInteger(data[name])?data[name]:0)+delta);
   done[key]=now;
  }
  // At-least-once redelivery window, bounded to a month.
  for(const [id,timestamp] of Object.entries(done))
   if(timestamp<now-30*24*60*60*1000)delete done[id];
  data.done=done;
  return data;
 },undefined,false);
 const value=r.snapshot.val()||{};
 await db.ref("stats/public").update({
  installCount:Math.max(0,value.installCount||0),
  onlineCount:Math.max(0,value.onlineCount||0)
 });
}
exports.onInstallationAdded=onValueCreated({...OPTIONS,ref:"/stats/installations/{uid}"},
 event=>applyEvent("installCount",1,event));
exports.onInstallationRemoved=onValueDeleted({...OPTIONS,ref:"/stats/installations/{uid}"},
 event=>applyEvent("installCount",-1,event));
exports.onPresenceAdded=onValueCreated({...OPTIONS,ref:"/stats/online/{uid}"},
 event=>applyEvent("onlineCount",1,event));
exports.onPresenceRemoved=onValueDeleted({...OPTIONS,ref:"/stats/online/{uid}"},
 event=>applyEvent("onlineCount",-1,event));
// Periodic server-only backfill fixes missing pre-existing counts.
exports.reconcileCounters=onSchedule({
 schedule:"every 60 minutes",timeZone:"Etc/UTC",region:"us-central1"
},async()=>{
 const db=statsDatabase();
 const [installs,online]=await Promise.all([
  db.ref("stats/installations").get(),db.ref("stats/online").get()
 ]);
 const counts={installCount:installs.numChildren(),onlineCount:online.numChildren()};
 await db.ref("stats/serverCounters").transaction(previous=>({...previous,...counts}),
   undefined,false);
 await db.ref("stats/public").update(counts);
});
