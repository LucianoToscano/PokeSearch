"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const base="app/src/main/";
const java=n=>fs.readFileSync(base+"java/com/lucianotoscano/pokesearchoverlay/"+n+".java","utf8");
const menu=java("PgsAutoMenus");
const detector=java("PgsAutoIconDetector");
const service=java("PgsAutoClickService");
const pulse=java("PgsAutoTapIndicator");
const xml=fs.readFileSync(base+"res/xml/pgs_auto_accessibility_config.xml","utf8");
const store=java("PgsAutoTemplateStore");
// Real Samsung evidence: number EditText baseline was cut and contextual
// text overlapped checkbox because of fixed 24dp height.
assert.match(menu,/edit\.setIncludeFontPadding\(false\)/);
assert.match(menu,/edit\.setPadding\(dp\(3\),0,dp\(3\),0\)/);
assert.match(menu,/row\.addView\(edit,new LinearLayout\.LayoutParams\(dp\(49\),dp\(38\)\)\)/);
assert.match(menu,/root\.addView\(row,margined\(-1,dp\(42\),3\)\)/);
assert.match(menu,/root\.addView\(apply,margined\(-1,dp\(36\),4\)\)/);
assert.match(menu,/mount\(root,190,182\)/);
assert.match(menu,/inherited\.setMaxLines\(2\)/);
assert.match(menu,/root\.addView\(inherited,margined\(-1,-2,4\)\)/);
assert.match(menu,/mount\(root,220,218\)/);
assert.match(menu,/root\.measure\(View\.MeasureSpec\.makeMeasureSpec\(width,View\.MeasureSpec\.EXACTLY\)/);
assert.match(menu,/opened\.post\(\(\)->/);
assert.match(menu,/PgsAutoMenuStyle\.read\(context\)\.tileStroke\(\)/);
// Detection: transparent mask is not black background; color consistency
// and edge-feed ROI prevent random map texture matching selected sprite.
assert.match(detector,/Color\.alpha\(pixel\)<112/);
assert.match(detector,/insideFeed\(x\+t\.width\/2,y\+t\.height\/2,w,h\)/);
assert.match(detector,/if\(!insideFeed\(x\+t\.width\/2,y\+t\.height\/2,w,h\)\)continue/);
assert.match(detector,/colorCompatible\(raw,w,bx,by,t\)/);
assert.match(detector,/int validModelCount=0/);
assert.match(detector,/int templateCount\(\)\{return validModelCount;\}/);
assert.match(detector,/int selectedModelCount\(\)\{return modelCount;\}/);
assert.match(detector,/float\[\] scales=/);
assert.match(detector,/private static float correlation\(/);
// Safety: don't use stale foreground cache when the service's own overlay
// is above game; inspect active/focused application windows, fail closed.
assert.match(xml,/flagRetrieveInteractiveWindows/);
assert.match(service,/getWindows\(\)/);
assert.match(service,/AccessibilityWindowInfo\.TYPE_APPLICATION/);
assert.match(service,/!w\.isActive\(\)&&!w\.isFocused\(\)/);
assert.match(service,/activePackage/);
assert.doesNotMatch(service,/return isGamePackage\(foreground\);/);
// Menu tile may stay visible; own popup with selected sprites must not be
// scanned or tapped. Require same sample ID twice before gesture.
assert.match(menu,/boolean hasPanel\(\)\{return panel!=null;\}/);
assert.match(service,/quickMenus\.hasPanel\(\)/);
assert.match(service,/m\.id\.equals\(candidate\.id\)/);
assert.match(service,/SPRITE NÃO RECONHECIDA · RELENDO/);
assert.match(service,/modelos úteis/);
assert.match(service,/Gesto do feed/);
assert.match(service,/dispatchGesture\(gesture,new GestureResultCallback\(\)/);
// User-driven preview has no gesture; see best candidate at correct pixel.
assert.match(menu,/void previewSprites\(\)/);
assert.match(menu,/actions\.previewSprites\(\)/);
assert.match(service,/@Override public void previewSprites\(\)\{preview\(\);\}/);
const preview=service.slice(service.indexOf("private void preview(){"),service.indexOf("private void scanAndTap(){"));
assert.ok(preview.length>100);
assert.match(preview,/tapIndicator\.show\(/);
assert.match(preview,/Prévia sem toque/);
assert.doesNotMatch(preview,/dispatchGesture\(/);
assert.match(pulse,/drawCircle\(cx,cy,dp\(7f\),pen\)/);
assert.match(pulse,/FLAG_NOT_TOUCHABLE/);
assert.match(pulse,/EFFECT_MS=960L/);
// No regression: templates are saved but not deleted by checkbox changes.
assert.match(store,/MAX_SAMPLES = 50/);
assert.match(store,/referenceWidth/);
assert.match(store,/referenceHeight/);
assert.match(service,/holdForPassengerPrompt\(\)/);
console.log("LT353: menu measurement, feed-only matching, transparency, focused windows, preview and safety PASS");
