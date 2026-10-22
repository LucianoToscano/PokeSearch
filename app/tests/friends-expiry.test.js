"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const get = name => fs.readFileSync(name, "utf8");
const root = "app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const guard = get(root+"FriendsExpiryGuard.java");
const activity = get(root+"MainActivity.java");
const overlay = get(root+"OverlayService.java");
const gradle = get("app/build.gradle.kts");
const workflow = get(".github/workflows/distribute-friends-15days.yml");
let approved=0;
function check(label, fn){ fn(); approved++; console.log("PASS "+label); }
check("fifteen exact days from official build in UTC",()=>{
  assert.match(gradle,/friendsBuildUtcMillis!! \+ 15L \* 24 \* 60 \* 60 \* 1000/);
  assert.match(gradle,/POKE_FRIENDS_BUILD_UTC_MS/);
  assert.match(guard,/expiry - build != 15L \* 24 \* 60 \* 60 \* 1000/);
});
check("distribution only, normal remains unrestricted",()=>{
  assert.match(guard,/if \(!BuildConfig\.FRIENDS_DISTRIBUTION\) return true/);
  assert.match(gradle,/System\.getenv\("POKE_FRIENDS_DISTRIBUTION"\) == "true"/);
});
check("no reset by reinstall or app-data clearing",()=>{
  assert.match(guard,/BuildConfig\.FRIENDS_EXPIRY_UTC_MILLIS/);
  assert.match(guard,/now < build \|\| now >= expiry/);
});
check("detects basic wall-clock rollback",()=>{
  assert.match(guard,/SystemClock\.elapsedRealtime\(\)/);
  assert.match(guard,/highest - now > MAX_ROLLBACK_MILLIS/);
  assert.match(guard,/\.commit\(\)/);
});
check("Home creation, resume, overlay launch checked",()=>{
  assert.match(activity,/if \(!FriendsExpiryGuard\.isAllowed\(this\)\)/);
  assert.match(activity,/friendsExpiryHandler\.postDelayed\(friendsExpiryCheck, 15_000L\)/);
  assert.match(activity,/stopService\(new Intent\(this, OverlayService\.class\)\)/);
});
check("service creation, commands and heartbeat checked",()=>{
  assert.match(overlay,/FriendsExpiryGuard\.isAllowed\(OverlayService\.this\)/);
  assert.match(overlay,/handler\.postDelayed\(friendsExpiryCheck, 15_000L\)/);
  assert.match(overlay,/return START_NOT_STICKY/);
});
check("signature pin and minified release build",()=>{
  assert.match(gradle,/signingConfig = signingConfigs\.getByName\("persistentTestDebug"\)/);
  assert.match(gradle,/isMinifyEnabled = true/);
  assert.match(gradle,/isShrinkResources = true/);
  assert.match(gradle,/isDebuggable = false/);
});
check("APK-only artifact and no private material in output",()=>{
  assert.match(workflow,/PokeSearch-0\.51-beta\.test\.51250-Amigos-15dias\.apk/);
  assert.match(workflow,/SIGNING_CERT_SHA256\.txt/);
  assert.doesNotMatch(workflow,/git archive|Codigo-Fonte-Completo|Conteudo-Extraido-APK/);
});
check("fails closed when CI signing is absent or incorrect",()=>{
  assert.match(workflow,/POKE_TEST_KEYSTORE_B64/);
  assert.match(workflow,/Unexpected signature certificate/);
  assert.match(workflow,/POKE_TEST_SIGNING_REQUIRED: "true"/);
});
check("contains release archive and anti-debug inspection",()=>{
  assert.match(workflow,/apksigner/);
  assert.match(workflow,/application-debuggable/);
  assert.match(workflow,/unzip -t/);
});
console.log("Friends distribution: "+approved+" / "+approved+" checks passed");
