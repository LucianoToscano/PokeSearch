"use strict";
// LT378: owner-requested Home cleanup + explicit-start Auto Hunt + release link.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const main=fs.readFileSync(root+"MainActivity.java","utf8");
const pgs=fs.readFileSync(root+"PgsAutoClickService.java","utf8");
const watch=fs.readFileSync(root+"PgsAutoWatchSettings.java","utf8");
const home=main.split("private FrameLayout buildHome(){")[1]
  .split("private Button homeAuthButton(",1)[0];
assert.ok(home,"Home build section is present");
assert.match(home,/brand\.setImageResource\(R\.drawable\.ps_home_brand_transparent\)/);
assert.doesNotMatch(home,/ps_home_official_wordmark|brandSubtitle|brandTitle|homeWatchStatus/);
assert.match(home,/PremiumAccess\.controlled\(\)\)brand\.setOnLongClickListener/);
assert.doesNotMatch(home,/homeText\("POKÉMON GO"/);
assert.doesNotMatch(main,/homeWatchStatus/);
assert.match(main,/TextView footer=homeText\("PokeSearch v"\+BuildConfig\.VERSION_NAME\+" LT"/);
assert.doesNotMatch(home,/PoGoCoordinates \/search/);
assert.match(home,/footer\.setOnClickListener\(v->\{/);
assert.match(home,/Uri\.parse\("https:\/\/github\.com\/LucianoToscano\/PokeSearch\/releases\/tag\/"\+officialTag\)/);
assert.match(home,/String officialTag="v"\+BuildConfig\.VERSION_NAME\+"-"\+BuildConfig\.VERSION_CODE/);
assert.match(home,/startActivity\(new Intent\(Intent\.ACTION_VIEW,uri\)\)/);
assert.match(watch,/static void setEnabled\(Context context,boolean enabled\)/);
const connected=pgs.split("@Override public void onServiceConnected() {")[1]
  .split("@Override public void onAccessibilityEvent(",1)[0];
assert.ok(connected,"Accessibility connect section exists");
assert.match(connected,/PgsAutoWatchSettings\.setEnabled\(this,false\)/);
assert.match(connected,/boolean freshTap=tappedAt>0L&&now>=tappedAt&&now-tappedAt<=120000L/);
assert.match(connected,/armedByHome=startup\.getBoolean\("armFromHome",false\)&&freshTap/);
assert.match(connected,/startup\.edit\(\)\.putBoolean\("armFromHome",false\)/);
assert.match(connected,/if\(armedByHome\)\{\s*\/\/ Only a recent deliberate Home tap may display\/start the search\.\s*showBubble\(\)/);
assert.doesNotMatch(connected.split("if(armedByHome)")[0],/\bshowBubble\(\)|\bstartWatchOnly\(\)|queueTeachingWhenReady\(\)/);
assert.match(main,/putLong\("armFromHomeAtMs",System\.currentTimeMillis\(\)\)/);
assert.match(pgs,/putLong\("armFromHomeAtMs",System\.currentTimeMillis\(\)\)/);
assert.match(pgs,/else if\(isGameVisible\(\)&&bubble!=null&&/);
assert.match(pgs,/public static boolean isOverlayVisible\(\)/);
assert.match(pgs,/live!=null&&live\.bubble!=null/);
console.log("LT378 PASS: clean Home, clickable version, Auto Hunt starts OFF until fresh explicit tap");
