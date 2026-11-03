'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const art=require(path.join(root,'src/main/assets/sprite_offline.js'));
const from=dir=>fs.readFileSync(path.join(root,dir),'utf8');
const dock=from('src/main/assets/dock.html');
const detail=from('src/main/assets/detail.html');
const builder=from('scripts/build_sprite_bundle.py');
const LOCAL='file:///android_asset/pokemon-sprites/';
const cases=[
 [{number:'#722',name:'Rowlet',costume_id:79},'pm722.cFALL_2024.icon.png'],
 [{number:'#722',name:'Rowlet',costume_id:79,shiny:true},'pm722.cFALL_2024.s.icon.png'],
 [{number:'#656',name:'Froakie',costume_id:79},'pm656.cFALL_2024.icon.png'],
 [{number:'#656',name:'Froakie',costume_id:79,shiny:true},'pm656.cFALL_2024.s.icon.png'],
 [{number:'#25',name:'Pikachu',form_id:3379,shiny:true,gender:'female'},'pm25.fHALLOWEEN_2026.g2.s.icon.png'],
 [{number:'#41',name:'Zubat',form_id:3362},'pm41.fHALLOWEEN_2026_01.icon.png'],
 [{number:'#854',name:'Sinistea',form_id:3365},'pm854.fP_HALLOWEEN_2026_01.icon.png'],
 [{number:'#854',name:'Sinistea',form_id:3366,shiny:true},'pm854.fA_HALLOWEEN_2026_01.s.icon.png'],
 [{number:'#393',name:'Piplup',costume_id:49},'pm393.cHALLOWEEN_2021_NOEVOLVE.icon.png'],
 [{number:'#426',name:'Drifblim',costume_id:49,shiny:true},'pm426.cHALLOWEEN_2021_NOEVOLVE.s.icon.png'],
 [{number:'#94',name:'Gengar',costume_id:71},'pm94.cFALL_2023_NOEVOLVE.icon.png'],
 [{number:'#714',name:'Noibat',costume_id:85},'pm714.cHALLOWEEN_2025.icon.png'],
];
for(const [card,file] of cases){
 const sprite=art.resolve(card);
 assert.equal(sprite.src,LOCAL+'costumes/'+file,JSON.stringify(card));
 assert.equal(sprite.exactCostume,true,'No fake base for costumes');
}
for(const dex of [722,656,422,353]){
 const name={722:'Rowlet',656:'Froakie',422:'Shellos',353:'Shuppet'}[dex];
 const base=art.resolve({dex,name,form:'NORMAL'});
 assert.equal(base.src,LOCAL+'base/'+dex+'.png','Dex alias must work '+name);
 assert.equal(art.verifiedBase({dex,name,form:'NORMAL'}),true);
}
assert.equal(art.verifiedBase({dex:722,name:'Rowlet',costume_id:79}),false,
 'Never borrow plain Rowlet for costumed Rowlet');
assert.equal(art.verifiedBase({dex:656,name:'Froakie',form:'GALARIAN'}),false,
 'Unknown form must not borrow base');
assert.match(dock,/bundledExactForArt/);
assert.doesNotMatch(dock,/toLocaleUpperCase\(\)\|\|"·"/);
assert.match(detail,/className="psRankLabel"/);
assert.match(detail,/\.psRankLabel\{display:block/);
assert.match(detail,/\.psMovesAction/);
assert.match(detail,/#coordRow #coords\.hasCoords\{/);
assert.match(detail,/text-align:center!important/);
for(const file of ['pm656.cFALL_2024.icon.png','pm656.cFALL_2024.s.icon.png','pm722.cFALL_2024.icon.png','pm722.cFALL_2024.s.icon.png']){
 assert.ok(builder.includes('"costumes/'+file+'"'),'Missing pinned build asset '+file);
}
console.log('LT233 Halloween fallback and PvP icons: '+(cases.length+24)+' checks PASS');
