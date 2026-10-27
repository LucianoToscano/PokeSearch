"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const art=require("../src/main/assets/sprite_offline.js");
const builder=read("scripts/build_sprite_bundle.py");
const pack=read("scripts/fetch_form_sprites.py");
const workflow=read("../.github/workflows/lt125-go-costumes-counts-signed-qa.yml");
const entries=pack.match(/VERIFIED = """([\s\S]*?)"""/)[1].trim().split("\n")
  .map(line=>line.trim().split(/\s+/));
assert.equal(entries.length,40);
assert.equal(new Set(entries.map(e=>e[0])).size,40);
for(const [key,sourceId,normalSHA,shinySHA] of entries){
  assert.match(normalSHA,/^[0-9a-f]{40}$/);
  assert.match(shinySHA,/^[0-9a-f]{40}$/);
  const dex=Number(key.split("-")[0]);
  const region=key.slice(String(dex).length+1);
  const form=region==="galar-zen"?"DARMANITAN_GALARIAN_ZEN":
             (dex===555?"DARMANITAN_GALARIAN_STANDARD":region.toUpperCase());
  for(const shiny of [false,true]){
    const resolved=art.resolve({number:"#"+dex,form,shiny,image:""});
    const name=key+(shiny?"-shiny":"")+".png";
    assert.equal(resolved.src,"file:///android_asset/pokemon-sprites/forms/"+name, "wrong sprite "+name);
    assert.equal(resolved.offline,true);
    assert.equal(resolved.exactForm,true);
    assert.match(resolved.original,new RegExp("/"+sourceId+"\\.png$"));
  }
}
assert.match(pack,/SOURCE_COMMIT = "d8c2fb78563e28ad7b3abe938cf6e79998d04e90"/);
assert.match(pack,/hashlib\.sha1\(b"blob "/);
assert.match(builder,/form_hashes\.update\(fetch_verified_forms\(dest\)\)/);
assert.match(workflow,/len\(report\['forms'\]\)==716/);
assert.match(workflow,/forms\/555-galar-zen-shiny\.png/);
console.log("LT125: all 80 LT116 sprites map to exact local normal/shiny assets, no unrelated base art.");
