"use strict";
// SITE-POKEMON-01 synthetic DOM contract for the supplied PoGoCoordinates screenshot.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../src/main/assets/probe.js'),'utf8');
const site={open:false,query:'',explicitEmpty:false,selected:['Zorua'],available:[
  '#002 Ivysaur','#003 Venusaur (Normal)','#004 Charmander',
  '#004 Charmander (Goggles 2026)','#570 Zorua'
]};
const el=(txt='',attrs={},extra={})=>({
 innerText:txt,textContent:txt,tagName:'SPAN',children:[],parentElement:null,value:'',disabled:false,
 getClientRects:()=>[{}],querySelector:()=>null,querySelectorAll:()=>[],
 getAttribute:name=>Object.hasOwn(attrs,name)?attrs[name]:null,
 dispatchEvent:()=>true,click:()=>{},matches:selector=>selector==='input'&&extra.tagName==='INPUT',...extra
});
const trigger=el('4',{'aria-haspopup':'listbox','aria-controls':'pokemon-picker-list'},{tagName:'BUTTON',click:()=>site.open=true});
const input=el('',{placeholder:'Search by name, form, or dex #','aria-controls':'pokemon-picker-list'},{tagName:'INPUT',value:'',dispatchEvent(){site.query=this.value;return true;}});
const officialPopup=el('',{role:'listbox'},{tagName:'DIV',id:'pokemon-picker-list'});
officialPopup.querySelectorAll=selector=>{
 if(selector.includes('[cmdk-empty]'))return site.explicitEmpty?[el('No results found',{role:'status'})]:[];
 if(!selector.includes('[role=option]'))return [];
 return site.open?site.available.filter(label=>label.toLowerCase().includes(site.query.toLowerCase())).map(label=>el(label,{}, {
   tagName:'LI',parentElement:officialPopup,querySelector:()=>null,click(){
    const clean=label.replace(/^#\d+\s+/, '');
    if(!site.selected.includes(clean))site.selected.push(clean);
    site.open=false;site.query='';input.value='';
   }
 })):[];
};
const head=el('Pokemon');
const root=el('Pokemon');head.parentElement=root;
root.querySelectorAll=selector=>{
 if(selector==='button,[role=combobox],input:not([type=hidden])')return [trigger,...(site.open?[input]:[])];
 if(selector==='button,[role=combobox],[aria-haspopup]')return [trigger];
 if(selector==='button,[role=button]')return [trigger,...site.selected.map(name=>{
    const parent=el(name+' ×');
    const remove=el('×',{}, {tagName:'BUTTON',parentElement:parent,click:()=>{site.selected=site.selected.filter(v=>v!==name);}});
    return remove;
 })];
 return [];
};
const document={body:el(''),getElementById:id=>site.open&&id==='pokemon-picker-list'?officialPopup:null,querySelector:()=>null,querySelectorAll(selector){
 if(selector==='span,label,strong,small,dt,div,p')return [head];
 if(selector==='label,span,div,p,strong')return [head];
 if(selector==='label,span,strong,div')return [];
 if(selector==='input:not([type=hidden])')return site.open?[input]:[];
 if(selector.includes('[role=option]'))return [el('#004 Charmander (Wrong Popup)',{}, {tagName:'LI',click(){throw new Error('UNRELATED POPUP CLICK');}})];
 return [];
}};
const HTMLInputElement={prototype:{}};
Object.defineProperty(HTMLInputElement.prototype,'value',{set(v){this.value=String(v)}});
const HTMLTextAreaElement={prototype:{}};
Object.defineProperty(HTMLTextAreaElement.prototype,'value',{set(v){this.value=String(v)}});
class Event{constructor(type){this.type=type}}
function run(action,config={}){
 const code=source.replace('__ACTION__',JSON.stringify(action))
  .replace('__MODE__',JSON.stringify('raw')).replace('__SHINY__','false')
  .replace('__FILTERS__',JSON.stringify({attack:15,defense:15,stamina:15,glRank:1,ulRank:1,percentMin:0,percentMax:100,...config}));
 return JSON.parse(vm.runInNewContext(code,{document,window:{},location:{pathname:'/search',hostname:'pogocoordinates.com'},HTMLInputElement,HTMLTextAreaElement,Event}));
}
let tested=0;
function test(name,fn){fn();tested++;}
test('Open official token picker without clicking search',()=>{
 const r=run('pokemonSuggest:'+JSON.stringify(''));
 assert.equal(r.pending,true);assert.equal(site.open,true);
});
test('Search is driven by official site option list, not a fabricated catalog',()=>{
 assert.equal(run('pokemonSuggest:'+JSON.stringify('Charmander')).pending,true);
 const r=run('pokemonSuggest:'+JSON.stringify('Charmander'));
 assert.equal(r.ok,true);assert.equal(r.options.length,2);
 assert.ok(r.options.some(x=>x.label==='Charmander (Goggles 2026)'));
 assert.ok(r.options.some(x=>x.label==='Charmander'));
});
test('Unconfirmed species selection is rejected',()=>{
 assert.equal(run('verifyExtras',{pokemonSelections:['Ivysaur']}).ok,false);
});
test('Multiple species and exact event form are applied via site, not a free-text input',()=>{
 const config={pokemonSelections:['Ivysaur','Charmander (Goggles 2026)']};
 let done=false;
 for(let i=0;i<20;i++){
  const r=run('configureExtras',config);
  if(r.ok){done=true;break;}
  assert.equal(r.pending,true,JSON.stringify(r));
 }
 assert.equal(done,true);
 assert.deepEqual([...site.selected].sort(),['Ivysaur','Charmander (Goggles 2026)'].sort());
 assert.equal(run('verifyExtras',config).ok,true);
});
test('Generic Charmander is not interchangeable with Goggles 2026 form',()=>{
 assert.equal(run('verifyExtras',{pokemonSelections:['Charmander','Ivysaur']}).ok,false);
});
test('Empty selection clears only when there was a previous filter',()=>{
 const config={pokemonSelections:[],clearExtraKeys:['pokemonSelections']};
 for(let i=0;i<10;i++){const r=run('configureExtras',config);if(r.ok)break;}
 assert.equal(site.selected.length,0);
 assert.equal(run('verifyExtras',config).ok,true);
});
test('Neutral unconfigured Pokémon picker does not block other search filters',()=>{
 site.open=false;
 assert.equal(run('verifyExtras',{pokemonSelections:[]}).ok,true);
});
test('Missing official results is pending until the site displays an explicit empty state',()=>{
 site.open=true;site.explicitEmpty=false;
 run('pokemonSuggest:'+JSON.stringify('TotallyUnavailableSpeciesXYZ'));
 const pending=run('pokemonSuggest:'+JSON.stringify('TotallyUnavailableSpeciesXYZ'));
 assert.equal(pending.ok,false);assert.equal(pending.pending,true);
 assert.equal(pending.stage,'waiting-options');
 site.explicitEmpty=true;
 const empty=run('pokemonSuggest:'+JSON.stringify('TotallyUnavailableSpeciesXYZ'));
 assert.equal(empty.ok,true);assert.equal(empty.explicitEmpty,true);
 assert.equal(empty.options.length,0);
 site.explicitEmpty=false;
});
test('Global unrelated option cannot replace an official portal result',()=>{
 site.open=true;site.query='';input.value='';
 const result=run('pokemonSuggest:'+JSON.stringify('Charmander'));
 assert.equal(result.pending,true);
 const ready=run('pokemonSuggest:'+JSON.stringify('Charmander'));
 assert.equal(ready.ok,true);
 assert.ok(ready.options.some(v=>v.label==='Charmander (Goggles 2026)'));
 assert.ok(!ready.options.some(v=>v.label.includes('Wrong Popup')));
});
test('A popup with no bound controls is never accepted as an official list',()=>{
 site.open=false;
 const waiting=run('pokemonSuggest:'+JSON.stringify('Charmander'));
 assert.equal(waiting.pending,true);
 assert.equal(waiting.stage,'opening');
});
console.log('PokeSearch official multi-Pokemon picker: '+tested+' tests passed');
