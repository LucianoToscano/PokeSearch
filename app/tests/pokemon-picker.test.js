"use strict";
// SITE-POKEMON-01 synthetic DOM contract for the supplied PoGoCoordinates screenshot.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../src/main/assets/probe.js'),'utf8');
const site={open:false,foreignOpen:false,query:'',selected:['Zorua'],available:[
  '#002 Ivysaur','#003 Venusaur (Normal)','#004 Charmander',
  '#004 Charmander (Goggles 2026)','#025 Pikachu','#570 Zorua'
]};
const el=(txt='',attrs={},extra={})=>({
 innerText:txt,textContent:txt,tagName:'SPAN',children:[],parentElement:null,value:'',disabled:false,
 getClientRects:()=>[{}],querySelector:()=>null,querySelectorAll:()=>[],
 getAttribute:name=>Object.hasOwn(attrs,name)?attrs[name]:null,
 dispatchEvent:()=>true,click:()=>{},matches:selector=>selector==='input'&&extra.tagName==='INPUT',...extra
});
const trigger=el('4',{'aria-haspopup':'listbox'},{tagName:'BUTTON',click:()=>site.open=true});
const input=el('',{placeholder:'Search by name, form, or dex #'},{tagName:'INPUT',value:'',dispatchEvent(){site.query=this.value;return true;}});
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
// React mounts choices in a dedicated portal listbox, not arbitrary global <li>s.
const optionRows=()=>site.open?site.available
 .filter(label=>label.toLowerCase().includes(site.query.toLowerCase()))
 .map(label=>el(label,{},{
  tagName:'LI',querySelector:()=>null,click(){
   const clean=label.replace(/^#\d+\s+/, '');
   if(!site.selected.includes(clean))site.selected.push(clean);
   site.open=false;site.query='';input.value='';
  }
 })):[];
const unrelated=el('Sunny',{},{
 tagName:'UL',querySelectorAll:selector=>selector.includes('[role=option]')?[el('Sunny')]:[],
 contains:()=>false
});
const listbox=el('',{role:'listbox'},{
 tagName:'UL',querySelectorAll:selector=>selector.includes('[role=option]')?optionRows():[],
 contains:()=>false
});
const document={body:el(''),querySelector:()=>null,querySelectorAll(selector){
 if(selector==='span,label,strong,small,dt,div,p')return [head];
 if(selector==='label,span,div,p,strong')return [head];
 if(selector==='label,span,strong,div')return [];
 if(selector==='input:not([type=hidden])')return site.open?[input]:[];
 if(selector.includes('[role=listbox]')||selector.includes('[cmdk-list]'))
  return site.open?[listbox,...(site.foreignOpen?[unrelated]:[])]:[];
 if(selector.includes('[role=option]'))return optionRows();
 return [];
}};
const originalInputAttr=input.getAttribute;
input.getAttribute=name=>name==='aria-expanded'?(site.open?'true':'false'):originalInputAttr(name);
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
test('Empty asynchronous options stay pending until official absence is explicit',()=>{
 site.open=true;site.query='';
 let state=run('pokemonSuggest:'+JSON.stringify('MissingSpecies999'));
 assert.equal(state.pending,true);
 state=run('pokemonSuggest:'+JSON.stringify('MissingSpecies999'));
 assert.equal(state.pending,true);
 assert.notEqual(state.empty,true);
});
test('A new official query may resolve without false empty',()=>{
 assert.equal(run('pokemonSuggest:'+JSON.stringify('Venusaur')).pending,true);
 const options=run('pokemonSuggest:'+JSON.stringify('Venusaur'));
 assert.equal(options.ok,true);
 assert.ok(options.options.some(v=>v.label==='Venusaur (Normal)'));
});

test('Dex #0025 resolves the official #025 Pikachu row',()=>{
 site.open=true;site.foreignOpen=false;site.query='';
 assert.equal(run('pokemonSuggest:'+JSON.stringify('#0025')).state,'pending');
 const r=run('pokemonSuggest:'+JSON.stringify('#0025'));
 assert.equal(r.state,'ready');assert.equal(r.options.length,1);
 assert.equal(r.options[0].label,'Pikachu');assert.equal(r.options[0].dex,'025');
});
test('Unrelated dropdown stays excluded from the official Pokémon picker',()=>{
 site.open=true;site.foreignOpen=true;site.query='';
 assert.equal(run('pokemonSuggest:'+JSON.stringify('Charmander')).state,'pending');
 const r=run('pokemonSuggest:'+JSON.stringify('Charmander'));
 assert.equal(r.state,'ready');assert.equal(r.options.length,2);
 assert.ok(r.options.some(o=>o.label==='Charmander (Goggles 2026)'));
 site.foreignOpen=false;
});
test('Explicit-empty only after official portal actually renders no results',()=>{
 site.open=true;site.foreignOpen=false;site.query='';
 assert.equal(run('pokemonSuggest:'+JSON.stringify('Absent999')).state,'pending');
 let r=run('pokemonSuggest:'+JSON.stringify('Absent999'));
 assert.equal(r.state,'pending');assert.notEqual(r.empty,true);
 listbox.innerText='No results';listbox.textContent='No results';
 r=run('pokemonSuggest:'+JSON.stringify('Absent999'));
 assert.equal(r.state,'explicit-empty');assert.equal(r.empty,true);
 assert.equal(r.options.length,0);
 listbox.innerText='';listbox.textContent='';
});
test('Two matching listboxes cannot produce a guessed Pokémon result',()=>{
 site.open=true;site.foreignOpen=true;site.query='';
 unrelated.innerText='Charmander';unrelated.textContent='Charmander';
 unrelated.querySelectorAll=selector=>selector.includes('[role=option]')?[el('Charmander')]:[];
 assert.equal(run('pokemonSuggest:'+JSON.stringify('Charmander')).state,'pending');
 const r=run('pokemonSuggest:'+JSON.stringify('Charmander'));
 assert.equal(r.state,'pending');assert.notEqual(r.empty,true);
 site.foreignOpen=false;
});


test('A stale aria-controls link falls back only to the matching official portal',()=>{
 const old=input.getAttribute;
 input.getAttribute=name=>name==='aria-controls'?'old-unmounted-react-node':old(name);
 document.getElementById=()=>null;
 site.open=true;site.foreignOpen=true;site.query='';
 assert.equal(run('pokemonSuggest:'+JSON.stringify('Venusaur')).state,'pending');
 const r=run('pokemonSuggest:'+JSON.stringify('Venusaur'));
 assert.equal(r.state,'ready');
 assert.ok(r.options.some(x=>x.label==='Venusaur (Normal)'));
 input.getAttribute=old;delete document.getElementById;site.foreignOpen=false;
});
test('Official costume and regional forms preserve exact site labels',()=>{
 site.available.push('#019 Raticate (Alola)','#025 Pikachu (Copy 2019)');
 site.open=true;site.query='';
 assert.equal(run('pokemonSuggest:'+JSON.stringify('Raticate')).state,'pending');
 let r=run('pokemonSuggest:'+JSON.stringify('Raticate'));
 assert.equal(r.state,'ready');
 assert.ok(r.options.some(x=>x.label==='Raticate (Alola)'));
 assert.equal(run('pokemonSuggest:'+JSON.stringify('Pikachu')).state,'pending');
 r=run('pokemonSuggest:'+JSON.stringify('Pikachu'));
 assert.equal(r.state,'ready');
 assert.ok(r.options.some(x=>x.label==='Pikachu (Copy 2019)'));
 site.available.splice(-2);
});


test('Stale linked aria-controls cannot redirect Pokemon search into another filter',()=>{
 const oldInput=input.getAttribute,oldGet=document.getElementById;
 site.open=true;site.foreignOpen=true;site.query='';
 input.getAttribute=name=>name==='aria-controls'?'stale-weather':oldInput(name);
 document.getElementById=name=>name==='stale-weather'?unrelated:null;
 assert.equal(run('pokemonSuggest:'+JSON.stringify('Charmander')).state,'pending');
 const result=run('pokemonSuggest:'+JSON.stringify('Charmander'));
 assert.equal(result.state,'ready');
 assert.equal(result.options.length,2);
 assert.ok(result.options.every(v=>/Charmander/.test(v.label)));
 input.getAttribute=oldInput;
 if(oldGet===undefined)delete document.getElementById;else document.getElementById=oldGet;
 site.foreignOpen=false;
});
test('Official mobile picker with unique named input and no separate trigger',()=>{
 const oldRoot=root.querySelectorAll,oldParent=input.parentElement;
 site.open=true;site.foreignOpen=false;site.query='';input.value='';
 input.parentElement=root;
 root.querySelectorAll=selector=>{
  if(selector==='button,[role=combobox],input:not([type=hidden])')return [input];
  if(selector==='input:not([type=hidden])')return [input];
  if(selector==='button,[role=combobox],[aria-haspopup]')return [];
  if(selector==='button,[role=button]')return [];
  return [];
 };
 assert.equal(run('pokemonSuggest:'+JSON.stringify('Ivysaur')).state,'pending');
 const result=run('pokemonSuggest:'+JSON.stringify('Ivysaur'));
 assert.equal(result.state,'ready');
 assert.ok(result.options.some(x=>x.label==='Ivysaur'));
 input.parentElement=oldParent;root.querySelectorAll=oldRoot;
});
test('Two conflicting Pokemon search inputs are not selected by first-match guessing',()=>{
 const old=document.querySelectorAll;
 const duplicate=el('',{placeholder:'Search by name, form, or dex #'},{tagName:'INPUT'});
 site.open=true;
 document.querySelectorAll=selector=>
  selector==='input:not([type=hidden])'?[input,duplicate]:old(selector);
 const result=run('pokemonSuggest:'+JSON.stringify('Pikachu'));
 assert.notEqual(result.state,'ready');
 assert.notEqual(result.ok,true);
 document.querySelectorAll=old;
});

console.log('PokeSearch official multi-Pokemon picker: '+tested+' tests passed');
