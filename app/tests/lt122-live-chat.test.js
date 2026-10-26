"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const chat=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java");
const stage=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookStage1.java");
const home=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const rules=JSON.parse(read("firebase-realtime.rules.json")).rules;
let tests=0;function check(name,fn){fn();tests++;console.log("PASS LT122 "+name);}
check("single WhatsApp-like conversation, not old multi-category scrapbook",()=>{
 assert.match(chat,/Chat PokeSearch/);
 assert.match(chat,/private void addBubble/);
 assert.match(chat,/Gravity\.END:Gravity\.START/);
 assert.match(chat,/Escreva uma mensagem/);
 assert.doesNotMatch(chat,/Spinner|TABS=|KEYS=|CATEGORIES|EXEMPLOS FICTÍCIOS|scrapBubble|recados recentes/i);
 assert.match(chat,/As mensagens reais aparecem aqui/);
});
check("real-time feed via auth and bounded query; no fake posts",()=>{
 assert.match(chat,/FirebaseAuth\.getInstance/);
 assert.match(chat,/addValueEventListener\(new ValueEventListener\(\)/);
 assert.match(chat,/getReference\("chat\/messages"\)\.orderByChild\("createdAt"\)/);
 assert.match(chat,/limitToLast\(60\)/);
 assert.match(chat,/removeEventListener\(messagesListener\)/);
});
check("direct realtime write without moderation server, sender stored as authenticated UID",()=>{
 assert.match(chat,/getReference\("chat\/messages"\)\.push\(\)/);
 for(const field of ["authorUid","nickname","text","createdAt"])assert.ok(chat.includes('payload.put("'+field+'"'));
 assert.match(chat,/ServerValue\.TIMESTAMP/);
 assert.match(chat,/message\.setValue\(payload/);
 assert.doesNotMatch(chat,/getHttpsCallable|FirebaseFunctions|sendCommunityChat/i);
});
check("no global anonymous writes; immutable per-author message and strict typed fields",()=>{
 const m=rules.chat.messages;
 assert.equal(rules[".read"],false);assert.equal(rules[".write"],false);
 assert.equal(rules.chat[".read"],false);assert.equal(rules.chat[".write"],false);
 assert.match(m[".read"],/auth != null/);
 assert.match(m[".read"],/limitToLast/);
 assert.match(m["$messageId"][".write"],/auth\.uid/);
 assert.match(m["$messageId"][".write"],/!data\.exists/);
 assert.match(m["$messageId"][".write"],/newData\.exists/);
 assert.match(m["$messageId"].authorUid[".validate"],/auth\.uid/);
 assert.match(m["$messageId"].text[".validate"],/<= 240/);
 assert.match(m["$messageId"].createdAt[".validate"],/now/);
 assert.equal(m["$messageId"]["$other"][".validate"],false);
});
check("visible by default but can be hidden without touching overlays",()=>{
 assert.match(stage,/getBoolean\("communityLiveChatVisible",true\)/);
 assert.match(stage,/CommunityScrapbookOnline\.homePanel/);
 assert.match(home,/Chat ao vivo/);
 assert.match(home,/Ocultar Chat/);
 assert.match(home,/putBoolean\("communityLiveChatVisible"/);
 assert.doesNotMatch(home,/Ocultar protótipo Mural/);
});
console.log("LT122 "+tests+"/"+tests+" PASS");
