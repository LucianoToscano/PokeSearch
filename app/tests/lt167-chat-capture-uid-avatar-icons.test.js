"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const read=f=>fs.readFileSync(path.join(base,f),"utf8");
const chat=read("CommunityScrapbookOnline.java");
const capture=read("CaptureSharePublisher.java");
const overlay=read("OverlayService.java"),secondary=read("SecondaryOverlayService.java");
const rules=JSON.parse(fs.readFileSync(path.join(__dirname,"../../firebase-realtime.rules.json"),"utf8")).rules;

// Capture must use exactly the same verified Firebase identity as Home chat.
// No nickname matching: it would allow a different trainer to impersonate mine.
assert.match(capture,/CommunityScrapbookOnline\.capturePublisherApp\(context\)/);
assert.match(chat,/static FirebaseApp capturePublisherApp\(Context context\)/);
assert.match(chat,/FirebaseApp basic=FirebaseStats\.ensureApp\(context\)/);
assert.match(chat,/FirebaseApp admin=FirebaseStats\.ensureChatAdminApp\(context\)/);
assert.match(chat,/if\(Controller\.verifiedAdmin\(verified\)\)return admin/);
assert.match(chat,/return basic;/);
assert.match(capture,/payload\.put\("authorUid",user\.getUid\(\)\)/);
assert.ok(!/nickname\.equals\(.*(?:mine|current)/.test(chat),"never infer author from nickname");

// The original, still signed-in anonymous session owns legacy capture posts
// on this device; never change Firebase authorUid or rewrite old messages.
assert.match(chat,/localOwnedUids\.clear\(\)/);
assert.match(chat,/localOwnedUids\.add\(currentUid\)/);
assert.match(chat,/anonymous!=null && anonymous\.isAnonymous\(\)/);
assert.match(chat,/localOwnedUids\.add\(anonymous\.getUid\(\)\)/);
assert.match(chat,/boolean mine=localOwnedUids\.contains\(uid\)/);
assert.match(chat,/outer\.setGravity\(mine\?Gravity\.END:Gravity\.START\)/);
assert.match(chat,/if\(mine\)\{imgLp\.leftMargin/);

// The avatar must follow the real session UID with an owner-only fallback;
// other people's messages never receive my face or my layout.
assert.match(chat,/Bitmap authorBitmap=ownedAvatar\(authorUid\)/);
assert.match(chat,/if\(exact!=null\|\|!localOwnedUids\.contains\(uid\)\)return exact/);
assert.match(chat,/Bitmap current=avatars\.get\(currentUid\)/);
assert.match(chat,/Bitmap image=ownedAvatar\(currentUid\)/);
assert.match(chat,/getReference\("chat\/avatars"\)\.child\(currentUid\)/);
assert.match(rules.chat.avatars["$uid"][".write"],/auth\.uid === \$uid/);

// Transparent icon chip: original mode PNG is visible with no extra
// background/square; unadorned text pills keep the old lightweight styling.
assert.match(chat,/if\(path==null\)\s+chip\.setBackground\(bg\(/);
assert.ok(!/view\.setBackground\(bg\(/.test(chat));
assert.match(chat,/addBadge\(badges,"result-icons\/modes\/StarIVRaw\.png",c\.iv,ink\)/);
assert.ok(chat.includes('addBadge(badges,icon,c.league+" #"+c.rank,ink);'));

// Privacy, immutable database rules and two independent Pokébolas preserved.
assert.match(overlay,/CaptureSharePublisher\.publish\(this,offer,/);
assert.match(secondary,/extends OverlayService/);
for(const secret of ["coords","latitude","longitude","token","reveal_code"])
 assert.ok(!capture.includes('payload.put("'+secret+'"'),"never export "+secret);
assert.equal(rules.chat.messages["$messageId"].authorUid[".validate"],
 "newData.isString() && newData.val() === auth.uid");
console.log("LT167 Capture chat identity, own side/avatar, transparent badges and security PASS");
