"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const service=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const secondary=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java");
const stats=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/FirebaseStats.java");
const mural=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java");
const rules=JSON.parse(read("firebase-realtime.rules.json")).rules;
let passed=0;function test(label,fn){fn();passed++;console.log("PASS LT117 "+label);}
test("P1/P2 inherit shared implementation with independent state",()=>{
 assert.match(secondary,/extends OverlayService/);
 assert.match(service,/successfullyNotifiedGeneralSpawns/);
 assert.match(service,/queuedFavoriteAlerts/);
 assert.match(service,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
});
test("general notices commit only after accepted Android notification",()=>{
 const block=service.split("private void recordNewResults(JSONArray cards,boolean leagueConfirmed){")[1].split("// A reset request is pending")[0];
 assert.match(block,/successfullyNotifiedGeneralSpawns\.getOrDefault\(key,0L\)<=now/);
 assert.match(block,/if\(expiry<=now\)continue/);
 assert.ok(block.indexOf("successfullyNotifiedGeneralSpawns.put(firstGeneralKey,firstGeneralExpiry)")>
           block.indexOf("if(sendGeneralNotification("));
 assert.match(service,/if\(!WatchAlerts.permissionGranted\(this\)\)return false/);
});
test("ten valid favorites are queued in bounded batches",()=>{
 assert.match(service,/FAVORITE_ALERT_BATCH_SIZE=5/);
 assert.match(service,/FAVORITE_ALERT_BATCH_INTERVAL_MS=12_000L/);
 assert.match(service,/queuedFavoriteAlerts\.entrySet\(\)\.removeIf/);
 assert.match(service,/if\(!queuedFavoriteAlerts\.isEmpty\(\)\)/);
 assert.match(service,/recentFavoriteAlertExpiries\.put\(success\.key,success\.expiry\)/);
 assert.doesNotMatch(service,/if\(count\+\+>=5\)break/);
});
test("Firebase private rules protect IDs, with temporary LT125 legacy counting compatibility",()=>{
 for(const name of ["installations","online"]){
   assert.equal(rules.stats[name][".read"],false);
   assert.match(rules.stats[name]["$uid"][".read"],/auth\.uid === \$uid/);
 }
 assert.equal(rules.stats.public[".read"],"auth != null");
 assert.equal(rules.stats.public[".write"],false);
 assert.match(stats,/root\.child\("installations"\)\.addValueEventListener\(legacyCounter\(false\)\)/);
 assert.match(stats,/root\.child\("online"\)\.addValueEventListener\(legacyCounter\(true\)\)/);
 assert.match(stats,/if\(!publicInstallAvailable\)installCount=total/);
 assert.match(stats,/if\(!publicOnlineAvailable\)onlineCount=total/);
 assert.match(stats,/child\("public"\)\.child\("installCount"\)/);
 assert.match(stats,/child\("public"\)\.child\("onlineCount"\)/);
});
test("legacy scrapbook remains read-only while new live chat is separate",()=>{
 assert.equal(rules.scrapbook.posts["$postId"][".write"],false);
 assert.equal(rules.scrapbook.replies["$postId"]["$replyId"][".write"],false);
 assert.doesNotMatch(mural,/getReference\("scrapbook\/posts"\)\.push\(\)/);
 assert.match(mural,/getReference\("chat\/messages"\)\.push\(\)/);
 assert.match(mural,/message\.setValue\(payload/);
});
console.log("LT117 AUDIT REMEDIATIONS "+passed+"/"+passed+" PASS");
