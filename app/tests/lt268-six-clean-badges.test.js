"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const expected={
  "ps-gl-lt268.png": "f8e3d8c282806e4dcad90100763722c6cb1866ec253c1de600a9bbf66f91603c",
  "ps-ul-lt268.png": "2b2dba41fa49632b035fe0debf9136dea78d79fe37a3bed56b98a3516cef9e90",
  "ps-ml-lt268.png": "4994287c9061ecfbd3119990d7bdca7de2a0a69139c18f1216a7d8d539fcd606",
  "ps-cup-lt268.png": "55379064c3e3646dedfd7936f85b6a109769ef910175027b4e8d67b010cf5a32",
  "ps-overall-lt268.png": "2a7ceb2d32a345470fbd6bd763e2dd4ca65251040a4a1bbf292a161746bbcb87",
  "ps-raid-lt268.png": "989c5530516a33e60cfad6de6ca649e35fd7a3c3a50ebbe0a54946ef4fa612fa"
};
const html=fs.readFileSync(path.join(root,"detail.html"),"utf8");
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
const workflow=fs.readFileSync(path.join(__dirname,"../../.github/workflows/pokesearch-official-release.yml"),"utf8");
for(const [file,hash] of Object.entries(expected)){
 const b=fs.readFileSync(path.join(root,"ui-icons",file));
 assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a",file);
 assert.equal(b.readUInt32BE(16),320,file+" width");
 assert.equal(b.readUInt32BE(20),320,file+" height");
 assert.equal(b[25],6,file+" alpha channel");
 assert.equal(crypto.createHash("sha256").update(b).digest("hex"),hash,file+" exact art");
 assert.ok(workflow.includes('"'+file+'": "'+hash+'"'),"APK signer pins "+file);
 assert.ok(html.includes("ui-icons/"+file),"analysis screen shows "+file);
 assert.ok(!dock.includes("ui-icons/"+file),"Modos / Pokéballs untouched by new image");
 assert.ok(b.length<200000,"new badge is compact");
}
assert.ok(html.includes('background:url("ui-icons/ps-overall-lt268.png")'),"RG uses correct multicolor triangle");
assert.ok(html.includes('src="ui-icons/ps-raid-lt268.png"'),"Raid uses orange shield");
assert.ok(html.includes('filter:none!important'),"no halo around new league badges");
assert.ok(!html.includes('drop-shadow(0 0 1px #f5fbff)'),"glow filter removed");
for(const old of ["rank-geral-lt267.png","league-gl-bordered-lt265.png","raid-badge.png"]){
 assert.ok(fs.existsSync(path.join(root,"ui-icons",old)),"legacy resource preserved: "+old);
 assert.ok(!html.includes("ui-icons/"+old),"historical icon not used in current card");
}
const start=html.indexOf("<script>"),end=html.indexOf("</script>",start);assert.ok(start>=0&&end>start);new vm.Script(html.slice(start+8,end));
const notes=JSON.parse(fs.readFileSync(path.join(root,"release_notes.json"),"utf8"));
assert.ok(notes.releases.some(x=>x.minVersionCode===54472),"LT268 release notes included");
const req=JSON.parse(fs.readFileSync(path.join(__dirname,"../../release/official-request.json"),"utf8"));
assert.ok(req.code>=54472,"LT268 signed baseline remains supported");
assert.ok(/^v0[.]02[.][0-9]{2}-[0-9]+$/.test(req.previous_tag),"Well-formed previous release tag");
assert.ok(req.code>Number(req.previous_tag.split("-").at(-1)),
 "Official update versionCode must be strictly greater than previous official release (skipped intermediate LT versions are allowed)");
console.log("LT268 PASS: six glow-free badges, RG/Raid correct, Modos/Pokeballs untouched, signed hashes");
