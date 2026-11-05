'use strict';
const assert = require('node:assert/strict');
const {validate} = require('./official-release-request.cjs');
const request = {schema:1, enabled:true, version:'0.02.38', code:54442, label:51242, previous_tag:'v0.02.37-54441', qa_max_code:54441, release_notes:'Notas verificadas da próxima atualização oficial.'};
const latest = {tag_name:'v0.02.37-54441', draft:false, prerelease:false, assets:[]};
const notes = {releases:[{minVersionCode:54442}]};
assert.equal(validate({schema:1,enabled:false}, null, {}).needed,'false');
assert.equal(validate(request,latest,notes).tag,'v0.02.38-54442');
for (const patch of [{version:'0.2.38'},{version:'0.02.36'},{code:54441},{code:54442.1},{label:1},{qa_max_code:54442},{previous_tag:'v0.02.33-54437'},{release_notes:'x'},{enabled:'true'},{version:'0.02.38\nBAD=1'}]) {
  assert.throws(()=>validate({...request,...patch},latest,notes),JSON.stringify(patch));
}
assert.throws(()=>validate(request,{...latest,draft:true},notes));
assert.throws(()=>validate(request,{...latest,prerelease:true},notes));
assert.throws(()=>validate(request,latest,{releases:[]}));
assert.throws(()=>validate(request,{...latest,tag_name:'v0.02.39-54443'},notes));
const published={...latest,tag_name:'v0.02.38-54442',assets:[{name:'PokeSearch-v0.02.38-LT.apk',state:'uploaded',digest:'sha256:'+'a'.repeat(64)}]};
assert.equal(validate(request,published,notes).needed,'false');
assert.throws(()=>validate(request,{...published,assets:[]},notes));
console.log('Official release request validation: 18 scenarios passed');
