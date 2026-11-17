"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const java=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const dock=read("app/src/main/assets/dock.html");
const detail=read("app/src/main/assets/detail.html");
const evidence=read("app/src/main/assets/result_evidence.js");

test("AUTO defaults to 3 minutes on both Pokébolas and migrates stored 3-second sentinel",()=>{
 assert.match(java,/intervalMinutes=3,menuPadDp=0/);
 assert.match(java,/if\(!pref\.getBoolean\("intervalExplicit",false\)\)/);
 assert.match(java,/intervalMinutes=3;\s*pref\.edit\(\)\.putInt\("intervalMinutes",3\)\.apply\(\)/);
 assert.match(java,/pref\.getInt\("intervalMinutes",3\)/);
 assert.match(java,/if\(intervalMinutes!=0&&intervalMinutes!=3&&intervalMinutes!=5&&/);
 assert.match(java,/private long autoRefreshDelayMs\(\)\{return Math\.max\(0L,intervalMinutes\)\*60000L;\}/);
 assert.doesNotMatch(java,/intervalMinutes=-3|intervalMinutes==-3|3000L:Math\.max\(0L,intervalMinutes\)/);
});
test("3-second AUTO is unavailable in the native bridge and in the compact menu",()=>{
 assert.match(java,/int\[\] options=\{0,3,5,10,15,20\}/);
 assert.match(java,/if\(minutes!=0&&minutes!=3&&minutes!=5&&minutes!=10&&minutes!=15&&minutes!=20\)return/);
 assert.match(dock,/for\(const value of \[3,5,10,15,20\]\)/);
 assert.match(dock,/period=\[0,3,5,10,15,20\]\.includes\(Number\(interval\)\)\?Number\(interval\):3/);
 assert.match(dock,/<span class="autoTime">3m<\/span>/);
 assert.doesNotMatch(dock,/intervalo automático de 3 segundos|Atualização a cada 3 segundos/);
});
test("Manual refresh sends a request now, independent of AUTO and local pacing",()=>{
 assert.match(dock,/function manualRefreshTap\(\)\{/);
 assert.match(dock,/Native\.refresh\(\)/);
 assert.match(java,/@JavascriptInterface public void refresh\(\)\{handler\.post\(\(\)->\{/);
 assert.match(java,/OverlayService\.this\.refresh\(true\)/);
 assert.match(java,/if\(searchInProgress\)\{\s*if\(manual\)\{/);
 assert.match(java,/handler\.removeCallbacks\(queuedRefresh\)/);
 assert.match(java,/nextScheduledSearchAtMs=0L/);
});
test("Only a provider-supplied Retry-After can schedule a provider backoff",()=>{
 assert.match(java,/if\(suggestedSeconds<1\|\|suggestedSeconds>86400\)return/);
 assert.match(java,/response\.optInt\("retryAfterSeconds",0\)/);
 assert.doesNotMatch(java,/API_RATE_BACKOFF_DEFAULT_MS|Math\.max\(wait,\(long\)suggestedSeconds/);
 assert.match(java,/if\(authorizedApiQaSelected\(\)&&!guestPublicSearch&&apiProviderBackoffUntil\(\)>0L\)/);
});
test("Pokémon card renders its actual values without five redundant provenance explanations",()=>{
 assert.doesNotMatch(detail,/psEvidenceButton|psEvidenceDetails|toggleResultEvidence|evidenceHtml/);
 assert.doesNotMatch(dock,/const evidenceTitle=evidence\?\.explanation/);
 assert.match(detail,/item\("Distância",c\.distance\)/);
 assert.match(detail,/item\("Distância",c\.distance\)/);
 assert.match(detail,/const showPct=ivVisual\?\.valid===true/);
 assert.match(detail,/const verifiedIvRank=/);
 assert.match(dock,/evidence\?\.warning&&evidence\.icon/);
 // Evidence logic is still available internally for correctness checks.
 for(const text of ["busca confirmada","IV consistente com a origem",
 "Km indisponível; nenhuma distância foi calculada",
 "Rank do encontro não confirmado","Shiny não indicado"])
 assert.ok(evidence.includes(text),text);
});
