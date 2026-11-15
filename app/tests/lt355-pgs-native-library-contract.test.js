"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const java=n=>fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/"+n+".java","utf8");
const manifest=JSON.parse(fs.readFileSync("app/src/main/assets/pgs-native/manifest.json","utf8"));
const native=java("PgsAutoNativeModels"),store=java("PgsAutoTemplateStore"),
  menu=java("PgsAutoMenus"),service=java("PgsAutoClickService"),
  detector=java("PgsAutoIconDetector"),geometry=java("PgsAutoScreenGeometry"),
  region=java("PgsAutoScanRegionPolicy");
assert.equal(manifest.schema,1);assert.equal(manifest.provider,"pgsharp");
assert.equal(manifest.providerVersion,"0.435.2");
assert.deepEqual(manifest.entries,[],"no unlicensed/unverified PGS sprites shipped");
assert.match(native,/device-verified/);assert.match(native,/redistribution-approved/);
assert.match(native,/MessageDigest\.getInstance\("SHA-256"\)/);
assert.match(native,/options\.outWidth==width&&options\.outHeight==height/);
assert.match(native,/compatibleVersion\.equals\(installedVersion\(context\)\)/);
assert.match(store,/for\(Model nativeModel:PgsAutoNativeModels\.available\(c,PgsAutoCatalog\.selected\(c\)\)\)/);
assert.match(store,/if\(m\.builtIn\)continue/);
assert.match(store,/if\(m\.id\.equals\(id\)&&!m\.builtIn\)m\.enabled=enabled/);
assert.match(store,/int refWidth,int refHeight\) throws IOException/);
assert.match(store,/Bitmap\.createScaledBitmap\(image,refWidth,refHeight,true\)/);
assert.match(store,/new Model\(originalId,name\.trim\(\),file,enabled,false,refWidth,refHeight\)/);
assert.match(menu,/Nativa · /); // LT356 mantém identificação e adiciona forma/variante
assert.match(menu,/if\(!model\.builtIn\)/);
assert.match(menu,/captura necessária/);
assert.match(menu,/List<PgsAutoTemplateStore.Model> models=speciesModels;/);
assert.match(detector,/nativeModel=model\.builtIn/);
assert.match(region,/width>=height\?\.34f:\.28f/);
assert.match(detector,/PgsAutoScanRegionPolicy\.inside\(hostProfile,sidebarSide/);
assert.match(service,/PgsAutoScreenGeometry\.map\(/);
assert.match(service,/LT355 estágio PREVIA_SEM_GESTO/);
assert.match(service,/LT355 estágio GEOMETRIA_INVALIDA/);
assert.match(service,/if\(holdForPassengerPrompt\(\)\)/);
const preview=service.slice(service.indexOf("private void preview(){"),service.indexOf("private void scanAndTap(){"));
assert.doesNotMatch(preview,/\bdispatchGesture\s*\(/);
assert.match(geometry,/return null/);
console.log("LT355 native catalog, safe source precedence, restore, preview, geometry PASS");
