"use strict";
const {initializeApp,getApps}=require("firebase-admin/app");
const {getDatabase}=require("firebase-admin/database");
const DB_URL="https://pokesearch-lt-default-rtdb.firebaseio.com/";
async function reconcile(){
 if(!getApps().length)initializeApp({databaseURL:DB_URL});
 const db=getDatabase(undefined,DB_URL);
 const [installed,online]=await Promise.all([
   db.ref("stats/installations").get(),
   db.ref("stats/online").get()
 ]);
 const counts={installCount:installed.numChildren(),onlineCount:online.numChildren()};
 // Server/admin counts are derived from actual database records only.
 await db.ref("stats/serverCounters").transaction(previous=>({
   ...(previous&&typeof previous==="object"?previous:{}),...counts
 }),undefined,false);
 await db.ref("stats/public").update(counts);
 const check=(await db.ref("stats/public").get()).val()||{};
 if(check.installCount!==counts.installCount||check.onlineCount!==counts.onlineCount)
  throw Error("Public aggregate verification failed");
 console.log("PokeSearch public Firebase aggregate reconciled:",JSON.stringify(counts));
}
if(require.main===module)reconcile().catch(e=>{console.error("Reconciliation failed:",e.message);process.exitCode=1;});
module.exports={reconcile};
