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
assert.doesNotMatch(home,/brand\.setImageResource\(R\.drawable\.ps_home_brand_transparent\)/);
assert.doesNotMatch(home,/ps_home_official_wordmark|brandSubtitle|brandTitle|homeWatchStatus/);
assert.match(home,/PremiumAccess\.controlled\(\)\)menu\.setOnLongClickListener/);
assert.doesNotMatch(home,/homeText\("POKÉMON GO"/);
assert.doesNotMatch(main,/homeWatchStatus/);
assert.match(main,/TextView footer=homeText\("PokeSearch v"\+BuildConfig\.VERSION_NAME\+/);
assert.match(main,/BuildConfig\.FASTDEV_PREVIEW\?"":" LT"/);
assert.doesNotMatch(home,/PoGoCoordinates \/search/);
assert.ok(home.includes("footer.setOnClickListener(v->ReleaseNotes.showHistory(this));"));
assert.ok(!home.includes("github.com/LucianoToscano/PokeSearch/releases/tag/"));
assert.ok(home.includes("Novidades e o histórico de atualizações do PokeSearch"));
assert.ok(main.includes('addHomeDrawerItem(drawer,"✦","Novidades",()->ReleaseNotes.showHistory(this))'));
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
