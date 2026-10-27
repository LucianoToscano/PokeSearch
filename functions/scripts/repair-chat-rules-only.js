"use strict";
/* Manual, scoped production repair: merge ONLY chat rules into the current
 * remote RTDB rules. Never deploy Functions or replace production stats rules.
 * Requires GOOGLE_APPLICATION_CREDENTIALS from the authorized CI secret.
 */
const fs=require("node:fs");
const {applicationDefault}=require("firebase-admin/app");
const DB="https://pokesearch-lt-default-rtdb.firebaseio.com/.settings/rules.json";
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
async function repair(){
 if(process.env.POKE_FIREBASE_CHAT_REPAIR!=="CHAT_RULES_ONLY")
  throw Error("Explicit scoped approval is required");
 const local=JSON.parse(fs.readFileSync("firebase-realtime.rules.json","utf8"));
 const target=local.rules?.chat;
 if(!target||target[".read"]!==false||target[".write"]!==false||
    !target.messages||!String(target.messages[".read"]).includes("auth != null"))
  throw Error("Unsafe or incomplete source chat rules");
 const creds=await applicationDefault().getAccessToken();
 const token=creds.access_token;
 if(!token)throw Error("No Firebase service token");
 const headers={Authorization:"Bearer "+token,Accept:"application/json","X-Firebase-ETag":"true"};
 const previous=await fetch(DB,{headers,redirect:"error"});
 if(previous.status!==200)throw Error("Cannot read live RTDB rules: HTTP "+previous.status);
 const tag=previous.headers.get("etag");
 if(!tag)throw Error("Live rules lacked ETag; refuse unguarded production write");
 const existing=await previous.json();
 if(!existing||typeof existing.rules!=="object"||Array.isArray(existing.rules))
  throw Error("Unexpected Firebase rules structure");
 if(existing.rules[".read"]!==false||existing.rules[".write"]!==false)
  throw Error("Global RTDB rules do not fail closed; no automated migration");
 const updated={...existing,rules:{...existing.rules,chat:target}};
 if(same(existing.rules.chat,target)){console.log("Chat rules already match; no write");return;}
 const resp=await fetch(DB,{method:"PUT",redirect:"error",
  headers:{Authorization:"Bearer "+token,"Content-Type":"application/json","If-Match":tag},
  body:JSON.stringify(updated)});
 if(resp.status!==200)throw Error("Scoped RTDB rules update rejected: HTTP "+resp.status);
 const confirm=await fetch(DB,{headers:{Authorization:"Bearer "+token,Accept:"application/json"},redirect:"error"});
 if(confirm.status!==200)throw Error("Live verification failed: HTTP "+confirm.status);
 const live=await confirm.json();
 if(!same(live.rules.chat,target))throw Error("Chat rules mismatch after write");
 for(const [key,value] of Object.entries(existing.rules)){
  if(key==="chat")continue;
  if(!same(live.rules[key],value))throw Error("Unrelated RTDB rule changed: "+key);
 }
 console.log("Chat rules installed and verified; stats and other rule sections preserved.");
 console.log("NOT a real-user chat test: verify 2 clients separately.");
}
if(require.main===module)repair().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={repair};
