"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const java=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const read=name=>fs.readFileSync(path.join(java,name),"utf8");
const chat=read("CommunityScrapbookOnline.java");
const pub=read("CaptureSharePublisher.java");
const secondary=read("SecondaryOverlayService.java");
const rules=JSON.parse(fs.readFileSync(path.join(__dirname,"../../firebase-realtime.rules.json"),"utf8")).rules;

// LT167 was not able to recover historic UIDs after sign-out or reinstallation.
// Never automatically conflate two people just because their nickname is equal.
assert.match(chat,/localOwnedUids\.add\(currentUid\)/);
assert.match(chat,/linkedLegacyUids=new java\.util\.HashSet<>\(\)/);
assert.match(chat,/getStringSet\("chatVisualAliases_"\+currentUid/);
assert.match(chat,/putStringSet\("chatVisualAliases_"\+currentUid/);
assert.match(chat,/if\(uid==null\|\|!uid\.matches\(/);
assert.match(chat,/uid\.equals\(currentUid\)\|\|localOwnedUids\.contains\(uid\)/);
assert.match(chat,/setTitle\("Vincular minhas mensagens antigas"\)/);
assert.match(chat,/setItems\(labels,\(dialog,which\)->/);
assert.match(chat,/setTitle\("Estas mensagens são suas\?"\)/);
assert.match(chat,/setPositiveButton\("Sim, são minhas"/);
assert.match(chat,/setNeutralButton\("Desfazer vínculos"/);
assert.match(chat,/linkedLegacyUids\.clear\(\)/);
assert.match(chat,/boolean mine=localOwnedUids\.contains\(uid\)/);
assert.match(chat,/outer\.setGravity\(mine\?Gravity\.END:Gravity\.START\)/);
assert.match(chat,/Bitmap authorBitmap=ownedAvatar\(authorUid\)/);
assert.match(chat,/if\(exact!=null\|\|!localOwnedUids\.contains\(uid\)\)return exact/);
// Identity affects local rendering alone, never authorUid, privileges or reaction writes.
assert.match(pub,/payload\.put\("authorUid",user\.getUid\(\)\)/);
assert.match(pub,/capturePublisherApp\(context\)/);
assert.match(chat,/\.child\(messageId\)\.child\(currentUid\)/);
assert.match(chat,/getReference\("chat\/avatars"\)\.child\(currentUid\)/);
assert.match(chat,/verifiedAdmin\(FirebaseUser user\)/);
assert.match(rules.chat.messages["$messageId"].authorUid[".validate"],/newData\.val\(\) === auth\.uid/);

// The bitmap itself, not only the chip container, may contain an opaque black square.
assert.match(chat,/Bitmap original=android\.graphics\.BitmapFactory\.decodeStream\(in\)/);
assert.match(chat,/bmp=removeOpaqueIconMatte\(original\)/);
assert.match(chat,/if\(corners<3\)return bitmap/);
assert.match(chat,/pixels\[i\]=0;removed\+\+/);
assert.match(chat,/if\(removed==0\)return bitmap/);
assert.match(chat,/isDarkMattePixel\(pixels\[i-w\]\)/);
assert.match(chat,/if\(path==null\)\s+chip\.setBackground/);
assert.match(secondary,/extends OverlayService/);

console.log("LT168: explicit reversible legacy authors, current chat photo, transparent PNG mode icons, privacy PASS");
