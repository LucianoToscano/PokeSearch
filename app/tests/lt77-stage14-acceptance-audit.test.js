"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const checklist=fs.readFileSync(path.join(root,"../docs/LT77_CHECKLIST_ACEITACAO.md"),"utf8");
const gradle=read("build.gradle.kts"),rules=read("proguard-rules.pro");
const service=read("src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const dock=read("src/main/assets/dock.html");
const router=read("src/main/assets/api_integration_router.js");
let passed=0;function check(name,fn){fn();passed++;console.log("PASS LT77 Stage14 "+name);}
check("acceptance status separates CI from Samsung",()=>{
 assert.ok(checklist.includes("homologação física Samsung NÃO executada"));
 assert.ok(checklist.includes("[ ] integração Android"));
 assert.ok(checklist.includes("LT77 não pode ser declarada homologada"));
});
check("release identity and R8 unchanged",()=>{
 assert.ok(gradle.includes('applicationId = "com.lucianotoscano.pokesearch"'));
 assert.ok(gradle.includes('namespace = "com.lucianotoscano.pokesearchoverlay"'));
 assert.ok(gradle.includes("isMinifyEnabled = true"));
 assert.ok(rules.includes("@android.webkit.JavascriptInterface <methods>;"));
});
check("one ten-card collector and original spacing",()=>{
 assert.ok(dock.includes("ResultsSpacingPolicy")||service.includes("ResultsSpacingPolicy.DEFAULT_TOP_GAP_PX"));
 assert.ok(dock.includes("computeResultLayout("));
});
check("API remains disconnected and disabled by default",()=>{
 assert.ok(router.includes("const USE_AUTHORIZED_API=false"));
 assert.ok(!service.includes("api_integration_router.js"));
 assert.ok(!service.includes("PokeSearchApiRouter"));
});
check("cleanup fields are valid owner members and callbacks guarded",()=>{
 const destroy=service.split("@Override public void onDestroy(){")[1]?.split("@Override public IBinder onBind")[0]||"";
 assert.ok(destroy.includes("++coordinateRequestToken;"));
 assert.ok(!destroy.includes("++formOptionsSequence;"));
 assert.ok(!destroy.includes("++pokemonSuggestionSequence;"));
 assert.ok(destroy.includes("handler.removeCallbacksAndMessages(null)"));
});
check("historical risky areas remain explicitly open",()=>{
 for(const text of ["Weather aplica no site","Pesquisa API autenticada renderizada no WebView",
 "Arraste e busca sem memory leaks","ProGuard preserva"])assert.ok(checklist.includes(text),text);
});
console.log("LT77 Stage14 "+passed+"/"+passed+" PASS");
