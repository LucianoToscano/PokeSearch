"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const sprite=require("../src/main/assets/sprite_offline.js");
const pinned=read("scripts/build_sprite_bundle.py");
const chat=read("src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java");
const card=read("src/main/java/com/lucianotoscano/pokesearchoverlay/CaptureChatCard.java");
const fmt=read("src/main/java/com/lucianotoscano/pokesearchoverlay/CaptureChatFormat.java");
const secondary=read("src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java");
for(const [dex,name] of [[25,"Pikachu"],[393,"Piplup"],[426,"Drifblim"]]){
 for(const shiny of [false,true]){
  const expected=`file:///android_asset/pokemon-sprites/costumes/${dex}-halloween-2021${shiny?"-shiny":""}.png`;
  const result=sprite.resolve({number:"#"+dex,name:name+" (Halloween 2021 Costume)",
    form:"Halloween 2021 Costume",image:"",shiny});
  assert.equal(result.src,expected,`missing exact costume for ${name}`);
  assert.equal(result.officialCostume,true);
  assert.equal(result.offline,true);
  assert.ok(pinned.includes(`"costumes/${dex}-halloween-2021${shiny?"-shiny":""}.png"`));
 }
}
// Another year and other species must NEVER use an incorrect costume or base sprite.
assert.equal(sprite.resolve({number:"#393",name:"Piplup",form:"Halloween 2022 Costume",shiny:true}).src,"");
assert.equal(sprite.resolve({number:"#426",name:"Drifblim",form:"Halloween 2021 Costume",shiny:false}).src,
 "file:///android_asset/pokemon-sprites/costumes/426-halloween-2021.png");
assert.equal(sprite.resolve({number:"#394",name:"Prinplup",form:"Halloween 2021 Costume",shiny:true}).src,"");
assert.match(fmt,/static String exactCostumeAsset\(String pokemon,boolean shiny\)/);
assert.match(fmt,/static String compactName\(String pokemon\)/);
assert.match(chat,/CaptureChatFormat\.exactCostumeAsset\(species,shiny\)/);
assert.match(chat,/dp\(activity,27\),dp\(activity,27\)/);
assert.match(chat,/lp\.rightMargin=dp\(activity,2\)/);
assert.match(chat,/body\.setSingleLine\(true\)/);
assert.match(chat,/body\.setEllipsize\(android\.text\.TextUtils\.TruncateAt\.END\)/);
assert.match(chat,/addCaptureBadges\(bubble,captureCard,mine\?clock/);
assert.match(chat,/android\.widget\.HorizontalScrollView horizontal/);
assert.match(chat,/badges\.setGravity\(Gravity\.END\|Gravity\.CENTER_VERTICAL\)/);
assert.match(chat,/if\(!c\.size\.isEmpty\(\)\)addBadge\(badges,null,c\.size,secondary\)/);
assert.match(chat,/if\(!c\.gender\.isEmpty\(\)\)/);
assert.match(chat,/line\.addView\(meta,mp\)/);
assert.ok(!chat.includes('TextView toggle=text(expandedCaptureDetails'),"no expanding capture details");
assert.ok(!chat.includes('if(structured!=null)addCaptureBadges(bubble,id'),"no extra badges row");
assert.match(card,/LT133: never send a third row/);
assert.match(secondary,/extends OverlayService/);
const stats=JSON.parse(read("../docs/POKESEARCH_LT130_FIREBASE_RULES_PRODUCAO_COMPLETAS.json")).rules;
assert.equal(stats.stats.online[".read"],"auth != null");
assert.equal(stats.premium[".write"],false);
assert.equal(stats.distribution[".write"],false);
console.log("LT133 exact pinned Halloween 2021 normal/shiny + two-line compact chat + P1/P2 and Firebase preservation PASS");
