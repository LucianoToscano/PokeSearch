"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const picker=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const check=(name,fn)=>{fn();console.log("PASS LT88 R6 "+name)};
check("chosen favorite profile autosaves additions and removals",()=>{
 const code=picker.split("refresh[0]=()->{")[1]?.split("search.addTextChangedListener")[0]||"";
 assert.match(code,/getInt\("favoritePresetActiveV1",0\)/);
 assert.match(code,/if\(activeSlot>=1&&activeSlot<=3\)/);
 assert.match(code,/autoPrefs\.edit\(\)\.putString\(key,current\)\.apply\(\)/);
 assert.match(code,/WatchAlerts\.names/);
 assert.match(code,/WatchAlerts\.toggle\(activity,entry\.name\)/);
});
check("long press on a saved star clears only that slot; if active also clears visible favorites",()=>{
 assert.match(picker,/tab\.setOnLongClickListener\(v->\{/);
 assert.match(picker,/Limpar todos os favoritos do Perfil/);
 assert.match(picker,/if\(active\)edit\.putString\(WatchAlerts\.PREF_LIST,""\)/);
 assert.ok(!picker.includes("Salvar favoritos atuais no perfil"));
 assert.match(picker,/refreshProfileStars\.run\(\)/);
});
check("empty star first tap begins an opt-in auto-saved profile",()=>{
 assert.match(picker,/First tap on an unused star stores current Favorites/);
 assert.match(picker,/\.putInt\("favoritePresetActiveV1",profile\)\.apply\(\)/);
});
check("PokeAPI cache deduplicates in-flight fetches and retries failed cache",()=>{
 assert.ok(dock.includes("const SPRITE_FAILURE_RETRY_MS=30000"));
 assert.ok(dock.includes("spriteRequestCache.set(url,entry)"));
 assert.ok(dock.includes("if(!src)entry.failedAt=Date.now()"));
 assert.ok(dock.includes("spriteRequestCache.delete(item.image)"));
 assert.ok(dock.includes("spriteRequestCache.size>96"));
});
check("spawn failure retries exact provided URL; never fabricates costumes or forms",()=>{
 const sec=dock.split("function attachSpriteFeedback(){")[1]?.split("function attachLongPress(){")[0]||"";
 assert.ok(sec.includes('img.src=original'));
 assert.ok(sec.includes("},12000)"));
 assert.ok(sec.includes("img.isConnected"));
 assert.ok(sec.includes("mirrorAttempted"));
 assert.ok(sec.includes("PokeAPI/sprites"));
 assert.ok(!sec.includes("imageUrlFromDex"));
});
