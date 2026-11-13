"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const service=fs.readFileSync(base+"RaidDayAssistantOverlayService.java","utf8");
const atlas=fs.readFileSync(base+"EduSpriteAtlas.java","utf8");
const block=service.match(/private static final String\[\] EDU_IDLE_ROTATION=\{([\s\S]*?)\};/);
assert.ok(block,"Rotação de idle existente");
const names=[...block[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(names,["pokebola_gesto","caminhada_frente","caminhada_direita","caminhada_esquerda","edu_jogando","edu_shiny","edu_armadura_mewtwo","edu_armadura_mewtwo_shiny"],"Todas as oito sequências devem continuar disponíveis");
for(const disallowed of ["pokebola_gesto","caminhada_frente","edu_jogando","edu_shiny","edu_armadura_mewtwo","edu_armadura_mewtwo_shiny"]){
 assert.ok(names.includes(disallowed),"Animação reativada após normalização de geometria: "+disallowed);
 assert.ok(atlas.includes('case "'+disallowed+'":'),"Ação/contexto preservado no atlas: "+disallowed);
}
assert.match(service,/if\(!visible\)return eduIdleFrame\(now\)/);
assert.match(service,/eduIdleNextAt=now\+5800L/);
assert.match(service,/now-eduLastInteractionAt<6500L/);
assert.match(atlas,/case 42: return 0; \/\/ parado/);
assert.match(atlas,/case "edu_sombria": case "ansioso": return SHADOW_INDEX;/);
console.log("Edu LT331/LT332 QA: reverter idle lateral, 68 quadros e estados especiais preservados");
