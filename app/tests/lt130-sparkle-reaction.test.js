"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const file=p=>fs.readFileSync(path.join(root,p),"utf8");
const ui=file("src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java");
const code=JSON.parse(file("../firebase-realtime.rules.json")).rules;
const published=JSON.parse(file("../docs/POKESEARCH_LT130_FIREBASE_RULES_PRODUCAO_COMPLETAS.json")).rules;
const existing=JSON.parse(file("../docs/POKESEARCH_LT127_REGRAS_CHAT_FOTOS_EXEMPLO_PRODUCAO.json")).rules;
const allowed=["❤️","👍","🎉","✨️"];
assert.match(ui,/for\(String emoji:new String\[\]\{"❤️","👍","🎉","✨️"\}\)/);
for(const option of allowed)assert.ok(ui.includes('"'+option+'".equals(emoji)'));
assert.match(ui,/child\(messageId\)\.child\(currentUid\)/);
assert.match(ui,/emoji\.equals\(prior\)\?null:emoji/);
for(const ruleSet of [code,published]){
 const r=ruleSet.chat.reactions;
 const check=r["$messageId"]["$uid"][".validate"];
 for(const option of allowed)assert.ok(check.includes("newData.val() === '"+option+"'"),"reaction not allowed "+option);
 assert.equal(r[".read"],"auth != null");
 assert.match(r["$messageId"]["$uid"][".write"],/auth\.uid === \$uid/);
 assert.match(r["$messageId"]["$uid"][".write"],/root\.child\('chat\/messages'\)\.child\(\$messageId\)\.exists\(\)/);
 assert.equal(ruleSet.chat.messages[".indexOn"][0],"createdAt");
 assert.equal(ruleSet.chat.avatars[".read"],"auth != null");
}
for(const name of ["online","installations"])assert.deepEqual(published.stats[name],existing.stats[name],"stats not retained: "+name);
assert.deepEqual(published.premium,{".read":false,".write":false});
assert.deepEqual(published.distribution,{".read":false,".write":false});
assert.equal(published[".read"],false);assert.equal(published[".write"],false);
assert.equal(allowed[3],String.fromCodePoint(0x2728,0xfe0f),"preserve sparkle variation selector");
console.log("LT130 four emojis + permissions + production stats/premium/distribution preserved: PASS");
