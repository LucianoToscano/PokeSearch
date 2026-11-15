"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const prefix="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const java=x=>fs.readFileSync(prefix+x+".java","utf8");
const pulse=java("PgsAutoTapIndicator");
const picker=java("PgsAutoTargetPicker");
const service=java("PgsAutoClickService");
const menus=java("PgsAutoMenus");

// Regression: the default bare View is usually WILL_NOT_DRAW without
// background. Merely overriding onDraw() is insufficient on some devices.
assert.match(pulse,/setWillNotDraw\(false\)/);
assert.match(pulse,/new RadialGradient\(/);
assert.match(pulse,/drawCircle\(cx,cy,dp\(13\),pen\)/);
assert.match(pulse,/drawCircle\(cx,cy,dp\(25\),pen\)/);
assert.match(pulse,/drawCircle\(cx,cy,dp\(37\),pen\)/);
assert.match(pulse,/EFFECT_MS=960L/);
assert.match(pulse,/setDuration\(EFFECT_MS\)/);
assert.match(pulse,/FLAG_NOT_TOUCHABLE/);
assert.match(pulse,/FLAG_NOT_FOCUSABLE/);
assert.match(pulse,/FLAG_LAYOUT_NO_LIMITS/);
assert.match(pulse,/showTapIndicator",true/);
assert.doesNotMatch(pulse,/dispatchGesture|ACTION_CLICK|sendClick/);
// Service only calls effect if Android accepted the gesture request.
assert.match(service,/if\(tapIndicator!=null\)tapIndicator\.show\(x,y\)/);
assert.match(service,/tapIndicator\.show\(Math\.round\(size\.x\*\.5f\),Math\.round\(size\.y\*\.78f\)\)/);
assert.match(service,/void previewTapIndicator\(\)/);
assert.match(service,/Prévia visual — nenhum toque enviado ao jogo/);
assert.match(menus,/void previewTapIndicator\(\)/);
assert.match(menus,/Prévia do efeito de toque \(sem clicar no jogo\)/);
assert.match(menus,/Mostrar local do toque/);

// Picker must preserve coordinates, explicit actions and cleanup WITHOUT
// covering the map in the gray panels shown in the owner's screenshot.
assert.match(picker,/root\.setBackgroundColor\(Color\.TRANSPARENT\)/);
assert.doesNotMatch(picker,/root\.setBackgroundColor\(0x28101825\)/);
assert.doesNotMatch(picker,/bg\(0xE9213140|bg\(0xD91A2836|bg\(0xF0192736/);
assert.match(picker,/info\.setBackground\(null\)/);
assert.match(picker,/hint\.setBackground\(null\)/);
assert.match(picker,/actionIcon\(true,"Confirmar mira e salvar posição"\)/);
assert.match(picker,/actionIcon\(false,"Cancelar mira sem salvar"\)/);
assert.match(picker,/saveLp\.leftMargin=dp\(28\)/);
assert.match(picker,/cancelLp\.rightMargin=dp\(28\)/);
assert.match(picker,/root\.addView\(save,saveLp\)/);
assert.match(picker,/root\.addView\(cancel,cancelLp\)/);
assert.match(picker,/dismiss\(\);callback\.confirmed\(selectedX,selectedY,width,height\)/);
assert.match(picker,/dismiss\(\);callback\.cancelled\(\)/);
assert.match(picker,/setContentDescription\(description\)/);
assert.match(picker,/setAim\(event\.getRawX\(\),event\.getRawY\(\)\)/);
assert.match(picker,/PgsAutoTargetPicker open\(/);
console.log("LT352: visible transparent cyan ripple, optional preview, clean reticle and icon-only actions PASS");
