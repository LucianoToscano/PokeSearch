"use strict";
// E1 — personagem pixel art do próprio usuário. Animação decorativa,
// nunca prova passe, avanço de etapa nem leitura da tela do Pokémon GO.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const base=path.join(__dirname,"../src/main");
const load=p=>fs.readFileSync(path.join(base,p));
const src="java/com/lucianotoscano/pokesearchoverlay/";
const atlas=load("assets/raid_day_avatar_atlas.png");
const avatar=load(src+"RaidDayAvatarFrames.java").toString();
const service=load(src+"RaidDayAssistantOverlayService.java").toString();
const home=load(src+"MainActivity.java").toString();
const manifest=load("AndroidManifest.xml").toString();
assert.equal(atlas.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
assert.equal(atlas.readUInt32BE(16),384);
assert.equal(atlas.readUInt32BE(20),128);
assert.equal(crypto.createHash("sha256").update(atlas).digest("hex"),
  "ce23c403277703dfff67625b33aa911ef66eb7b4764c87bd9b0a8556cf066fd9");
for(const [name,idx] of Object.entries({
    IDLE_A:0,IDLE_B:1,WALK_0:2,WALK_1:3,WALK_2:4,WALK_3:5,
    RUN_0:6,RUN_1:7,WAVE:8,QUESTION:9,ALERT:10,OK:11
})){
    assert.match(avatar,new RegExp(name+"="+idx+"(?:,|;)"),name);
}
assert.match(avatar,/CELL=64, COLS=6, COUNT=12/);
assert.match(avatar,/SIZES_PX=\{50,75,100\}/);
// check exact named keys in user-facing persisted preferences
assert.match(avatar,/PREF_SIZE="raid_day_avatar_size_px"/);
assert.match(avatar,/PREF_MOTION="raid_day_avatar_motion"/);
assert.match(avatar,/opts\.inScaled=false/);
assert.match(avatar,/drawable\.setFilterBitmap\(false\)/);
assert.match(avatar,/drawable\.setAntiAlias\(false\)/);
assert.match(service,/BUBBLE_DP=48, ART_DP=45/);
assert.match(service,/Math\.max\(dp\(BUBBLE_DP\),artSize\+dp\(6\)\)/);
assert.match(service,/avatarSprites=RaidDayAvatarFrames\.load\(this\)/);
assert.match(service,/avatarView\.setImageDrawable\(avatarSprites\.frame/);
assert.match(service,/avatarSizeIndex/);
assert.match(service,/avatarSizeIndex=2,avatarAnimationTick=0/);
assert.match(service,/prefs\.getInt\(RaidDayAvatarFrames\.PREF_SIZE,100\)/);
assert.match(service,/savedAvatarSize==50\?0:savedAvatarSize==75\?1:2/);
assert.match(service,/String\[\] sizeLabels=\{"P","M","G"\}/);
assert.match(service,/prefs\.edit\(\)\.putInt\("x",bubbleParams\.x\)/);
assert.match(service,/putInt\(RaidDayAvatarFrames\.PREF_SIZE,/);
assert.match(service,/putBoolean\(RaidDayAvatarFrames\.PREF_MOTION,enabled\)/);
assert.match(service,/private void setAvatarMotion\(boolean enabled\)/);
assert.match(service,/handler\.removeCallbacks\(avatarTicker\)/);
assert.match(service,/handler\.postDelayed\(this,dragging\?180L:450L\)/);
assert.match(service,/reactAvatar\(RaidDayAvatarFrames\.QUESTION\)/);
assert.match(service,/RaidDayAvatarFrames\.ALERT/);
assert.match(service,/reactAvatar\(RaidDayAvatarFrames\.OK\)/);
assert.match(service,/reactAvatar\(RaidDayAvatarFrames\.WAVE\)/);
assert.match(service,/avatarSprites\.release\(\)/);
assert.match(service,/panelScroll=new ScrollView/);
assert.match(service,/View\.MeasureSpec\.AT_MOST/);
assert.match(service,/FLAG_NOT_FOCUSABLE/);
assert.match(service,/TYPE_APPLICATION_OVERLAY/);
assert.match(home,/RaidDayAssistantOverlayService\.loadArtwork\(this\)/);
assert.match(manifest,/android:name="\.OverlayService"/);
assert.match(manifest,/android:name="\.SecondaryOverlayService"/);
assert.match(manifest,/android:name="\.RareCandyOverlayService"/);
assert.match(manifest,/android:name="\.RaidDayAssistantOverlayService"/);
assert.doesNotMatch(service,/MediaProjectionManager|AccessibilityService|PGSharp|poke\.nianticlabs/);
console.log("LT304 avatar: original atlas, 12 poses, P/M/G physical px, animation and overlay contracts PASS");
