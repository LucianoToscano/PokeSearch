"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),crypto=require("node:crypto"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const app=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const tribute=read("java/com/lucianotoscano/pokesearchoverlay/CommunityTribute.java");
const policy=read("java/com/lucianotoscano/pokesearchoverlay/SupportMissionPolicy.java");
const state=read("java/com/lucianotoscano/pokesearchoverlay/SupportMissionState.java");
const paths=read("res/xml/update_file_paths.xml");
for(const [f,expected] of Object.entries({
"pokesearch_agradecimento_comunidade.webp":"e85389d5f0543b68df5561eb96db1f56ca36e3c0512bbaef8f668453ce3a8209",
"pokesearch_agradecimento_miniatura.webp":"d3e1801a7bbda5878f769a372b50b4235b87abc7f8ba6239b48e9c0993d2ef44"
})){
 const bytes=fs.readFileSync(path.join(root,"res/drawable-nodpi",f));
 assert.equal(bytes.subarray(0,4).toString("ascii"),"RIFF");
 assert.equal(bytes.subarray(8,12).toString("ascii"),"WEBP");
 assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),expected,f);
}
assert.match(app,/CommunityTribute\.homeCard\(this,homeLightMode,this::openTribute\)/);
assert.match(app,/addHomeDrawerItem\(drawer,"💙","Agradecimentos",this::openTribute\)/);
assert.match(app,/if\(tributeOverlay!=null&&homeRoot!=null\)/);
assert.match(tribute,/ZoomView extends ImageView/);
assert.match(tribute,/chip\.setMinimumHeight\(dp\(a,48\)\)/);
assert.match(tribute,/thumbnail\.setImageResource\(R\.drawable\.pokesearch_agradecimento_miniatura\)/);
assert.match(app,/shareActions\.addView\(thanks,thanksLp\)/);
assert.match(app,/shareActions\.addView\(share,shareLp\)/);
assert.doesNotMatch(app,/screen\.addView\(thanks,thanksLp\)/);
assert.doesNotMatch(tribute,/Conheça quem ajuda o PokeSearch a acontecer\./);

assert.match(tribute,/R\.drawable\.pokesearch_agradecimento_comunidade/);
assert.match(tribute,/setType\("image\/webp"\)/);
assert.match(tribute,/FileProvider\.getUriForFile/);
assert.match(tribute,/FLAG_GRANT_READ_URI_PERMISSION/);
assert.match(paths,/pokesearch_tribute/);
assert.match(policy,/REQUIRED_OPENS = 3/);
assert.match(policy,/REQUIRED_USAGE_MS = 10L \* 60L \* 1000L/);
assert.match(state,/support_mission_first_install_welcome_pending/);
assert.match(app,/maybeWelcomeMission\(\)/);
assert.match(tribute,/original da homenagem|Arte completa aprovada/i);
console.log("PASS QA 0.00.101: approved original WebPs, offline viewer, one-time welcome mission");
