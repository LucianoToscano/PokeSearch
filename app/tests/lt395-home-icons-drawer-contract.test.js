"use strict";
// LT395: original artwork, optical margins and working drawer routes.
// Tests the code/asset contract; physical Android QA remains separate.
const assert=require("node:assert/strict");
const fs=require("node:fs"),crypto=require("node:crypto"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const main=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const asset=fs.readFileSync(path.join(root,"assets/home-user-icons-atlas.png"));
assert.equal(asset.readUInt32BE(16),1024);
assert.equal(asset.readUInt32BE(20),1024);
assert.equal(crypto.createHash("sha256").update(asset).digest("hex"),
  "abdebce91043c4576fcedf3e64f63492a9e18f5d600246090a5032f6d54976af",
  "Reviewed image contains only re-framed original Quests and Community");
assert.match(main,/if\(index==6\)/);
assert.match(main,/artwork\.setPadding\(d\(6\),d\(2\),d\(6\),d\(3\)\)/);
assert.match(main,/index==3\|\|index==13\|\|index==15/);
assert.match(main,/artwork\.setPadding\(d\(3\),d\(2\),d\(3\),d\(2\)\)/);
assert.match(main,/artwork\.setImageTintList\(null\)/);
assert.match(main,/artwork\.clearColorFilter\(\)/);
assert.doesNotMatch(main,/muted\.setSaturation\(\.20f\)/);
assert.match(main,/index==0\|\|index==1\|\|index==3/);
assert.match(main,/title\.setIncludeFontPadding\(false\)/);
assert.match(main,/for\(int line=0;line<4;line\+\+\)/);
assert.match(main,/for\(int col=0;col<4;col\+\+\)/);
assert.match(main,/showHomeDrawerPage\(accountPage\?"account":"main"\)/);
for(const group of ["PRINCIPAL","AJUDA E ATUALIZAÇÕES","MAIS","BACKUP LOCAL",
  "APLICATIVO","ESTATÍSTICAS","VÍNCULOS"])assert.ok(main.includes('addHomeDrawerGroup(drawer,"'+group+'")'),group);
for(const route of ["this::showHomeAccountMenu","this::openPicker",
 "this::showPreferencesDialog","this::showSavedPgsFilters",
 "this::showQuickGuide","this::showBugReportDialog",
 "this::exportHomeData","this::importHomeData",
 "this::sharePokeSearch","this::openTribute"]){
 assert.ok(main.includes(route),route);
}
assert.match(main,/addHomeDrawerItem\(drawer,"▣","Dados e backup"/);
assert.match(main,/addHomeDrawerItem\(drawer,"ⓘ","Sobre o aplicativo"/);
assert.match(main,/showCommunityHomeOptions\(\)/);
assert.match(main,/new String\[\]\{"Abrir Chat","Ocultar Chat","Fórum \(em preparação\)"\}/);
assert.match(main,/transparency\.setOnClickListener\(v->showHomeTransparencyDialog\(\)\)/);
const mainPage=main.split('}else{\n            addHomeDrawerGroup(drawer,"PRINCIPAL");')[1]?.split('homeRoot.addView(layer')[0]||"";
assert.ok(mainPage.length>300);
assert.doesNotMatch(mainPage,/addHomeDrawerItem\(drawer,"[^"]+","Mostrar Chat"/);
assert.doesNotMatch(mainPage,/addHomeDrawerItem\(drawer,"[^"]+","Importar dados"/);
assert.doesNotMatch(mainPage,/addHomeDrawerItem\(drawer,"[^"]+","Transparência dos fundos"/);
assert.doesNotMatch(mainPage,/FirebaseStats\.bind/);
console.log("PASS LT395: original Quests/Community, aligned grid, grouped drawer and preserved routes");
