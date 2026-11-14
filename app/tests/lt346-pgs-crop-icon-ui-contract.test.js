"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const java=n=>fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/"+n+".java","utf8");
const ui=java("PgsAutoClickService"),crop=java("PgsAutoCropSelection"),slider=java("PgsAutoCropSizeSlider");
assert.doesNotMatch(ui,/for\(int ref:new int\[\]\{24,32,44\}\)/);
assert.doesNotMatch(ui,/setText\("Recorte 32 px"\)|setText\("Fundo plano \(beta\)/);
assert.match(ui,/new PgsAutoCropSizeSlider\(this,32,crop::setReferencePx\)/);
assert.match(ui,/String\[\] icons=\{"icone_quadrado\.png"/);
assert.match(ui,/cropIcon\("confirmar_branco.webp"/);
assert.match(ui,/cropIcon\("cancelar_branco.webp"/);
assert.match(ui,/removeFlatBackground\[0\]=!removeFlatBackground\[0\]/);
assert.match(ui,/icone_background_on\.png/);
assert.match(ui,/icone_background_off\.webp/);
assert.match(ui,/setOnLongClickListener/);
assert.match(ui,/selectedBitmapRect\(\)/);
assert.match(ui,/PgsAutoTemplateStore\.saveSample/);
assert.match(crop,/enum Mode \{SQUARE,HORIZONTAL,VERTICAL,FREE\}/);
assert.match(crop,/drawMagnifier\(canvas\)/);
assert.match(crop,/private float minimumSide\(\)/);
assert.doesNotMatch(crop,/Math\.max\(12f\*density\(\),referencePx/);
assert.match(slider,/case MotionEvent\.ACTION_MOVE/);
assert.match(slider,/performAccessibilityAction/);
for(const name of ["confirmar_branco.webp","cancelar_branco.webp",
 "icone_vertical.png","icone_quadrado.png","icone_livre.png",
 "aumentar_diminuir_movimento.webp","aumentar_diminuir_repouso.webp",
 "icone_background_on.png","icone_background_off.webp"])
 assert.ok(fs.statSync("app/src/main/assets/pgs-crop/"+name).size>100);
console.log("LT346 icon controls, slider, lupa, preview and safety PASS");
