"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../src/main");
const candy=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java"),"utf8");
const slots=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/PogoAccountSlots.java"),"utf8");
const probe=fs.readFileSync(path.join(root,"assets/rare_candy_probe.js"),"utf8");

function check(label,assertion){assertion();console.log("PASS LT205 "+label);}
check("account choice is optional, source follows P1 only",()=>{
 assert.match(slots,/putInt\(secondary\?"pogoOverlayAccount2":"pogoOverlayAccount1",account\)/);
 assert.match(candy,/registerOnSharedPreferenceChangeListener\(candyAccountListener\)/);
 assert.match(candy,/if\("pogoOverlayAccount1"\.equals\(key\)&&!destroyed\)/);
 assert.match(candy,/int selected=PogoAccountSlots\.assigned\(this,false\)/);
 assert.match(candy,/if\(selected==sourceAccount\)return;/);
 assert.match(candy,/sourceAccount=account;/);
 assert.match(candy,/unregisterOnSharedPreferenceChangeListener\(candyAccountListener\)/);
});
check("new WebView profile is isolated and does not carry a previous result",()=>{
 assert.match(candy,/\+\+generation;\s*ready=false;setCandyBusy\(false\);pendingManualRefresh=false;/);
 assert.match(candy,/cards\.clear\(\);render\(\);/);
 assert.match(candy,/WebView old=site;site=null;\s*old\.stopLoading\(\);/);
 assert.match(candy,/old\.destroy\(\);\s*setStatus\("Conta "/);
 assert.match(candy,/if\(!destroyed&&view==site&&isAllowedUrl\(url\)\)/);
 assert.match(candy,/if\(destroyed\|\|view!=site\)return;/);
 assert.match(candy,/if\(v==site&&request\.isForMainFrame\(\)&&!destroyed\)/);

 assert.match(candy,/PogoAccountSlots\.attach\(site,account\)/);
});
check("429 is diagnosed and Retry-After is respected without server bypass",()=>{
 assert.match(candy,/blockedUntil=SystemClock\.elapsedRealtime\(\)\+retry\*1000L/);
 assert.match(candy,/if\(now<blockedUntil\)/);
 assert.match(candy,/setStatus\(providerWaitLabel\(\)\)/);
 assert.match(candy,/if\(cards\.isEmpty\(\)&&now<blockedUntil&&status!=null\)/);
 assert.match(candy,/if\(pendingManualRefresh&&!busy&&ready&&\s*isOfficialSearch\(\)&&now>=blockedUntil\)/);
 // Viewing cards must not enqueue a second API call while the first is busy.
 const open=candy.slice(candy.indexOf("private void toggleResults()"),candy.indexOf("/** Candy toolbar"));
 assert.doesNotMatch(open,/refresh\(true\)/);

 assert.match(candy,/Math\.min\(86400,response\.optInt\("retry_after",60\)\)/);
 assert.match(probe,/if\(response\.status===429&&retry===0\)retry=60/);
 assert.match(probe,/response\.headers\.get\("Retry-After"\)/);
});
check("candy remains independent of shiny, trainer, and game collection cooldown",()=>{
 assert.match(probe,/rare-candy\/search/);
 assert.doesNotMatch(probe,/shiny_only|shiny_account|trainer_id/);
 assert.match(candy,/CandyCooldownPolicy\.remainingSeconds\(/);
 assert.match(candy,/providerWaitLabel\(\)/);
});
console.log("LT205 4/4 PASS");
