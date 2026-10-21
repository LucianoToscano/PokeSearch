(function(){
"use strict";
const action=__ACTION__,mode=__MODE__,shinyOnly=__SHINY__,filters=__FILTERS__;
const clean=s=>String(s??"").replace(/\u00a0/g," ").replace(/[ \t]+/g," ").trim();
const text=e=>clean(e&&(e.innerText||e.textContent)||"");
const elements=s=>Array.from(document.querySelectorAll(s));
const vis=e=>!!(e&&e.getClientRects().length);
const labels=(root,pattern)=>Array.from(root.querySelectorAll("span,label,strong,small,dt,div,p")).filter(e=>vis(e)&&pattern.test(text(e))&&text(e).length<50).sort((a,b)=>text(a).length-text(b).length);
function oneButton(label){
 const re=new RegExp("^\\s*"+label+"\\s*$","i");
 return elements("button,[role=button]").find(b=>vis(b)&&re.test(text(b)))||null;
}
function click(label){let e=oneButton(label);if(e){e.click();return true;}return false;}
function valueInput(input,value){
 if(!input)return false;
 try{
 const proto=input.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
 Object.getOwnPropertyDescriptor(proto,"value").set.call(input,String(value));
 input.dispatchEvent(new Event("input",{bubbles:true}));
 input.dispatchEvent(new Event("change",{bubbles:true}));
 return true;
 }catch(_){return false;}
}
function field(label){
 const re=new RegExp("^"+label+"$","i");
 const found=elements("label,span,div,p,strong").filter(e=>vis(e)&&re.test(text(e))&&e.children.length<3);
 for(const el of found){
  let p=el.parentElement;
  for(let i=0;i<5&&p;p=p.parentElement,i++){
   const controls=Array.from(p.querySelectorAll('input:not([type=hidden]),select,[role=combobox],button[aria-haspopup]')).filter(vis);
   if(controls.length===1)return controls[0];
  }
 }
 return null;
}
function inputNear(label){const e=field(label);return e&&e.matches("input")?e:null;}
let transientPending=false;
function activeOptionPopup(control){
 const ids=[control?.getAttribute?.("aria-controls"),control?.getAttribute?.("aria-owns")].filter(Boolean);
 for(const id of ids){
  const popup=document.getElementById?.(id);
  if(popup&&vis(popup))return popup;
 }
 const open=elements('[role=listbox],[role=menu],[cmdk-list],[data-radix-menu-content]').filter(vis);
 return open.length===1?open[0]:null;
}
function optionElements(control){
 const scope=control?activeOptionPopup(control):null;
 const selector='[role=option],[role=menuitemradio],[data-slot="select-item"],[data-radix-collection-item],option';
 if(control&&!scope)return [];
 return (scope?Array.from(scope.querySelectorAll(selector)):elements(selector)).filter(vis);
}
function findOption(want,control){return optionElements(control).find(o=>text(o).toLowerCase()===String(want).toLowerCase())||null;}
function choice(label,want){
 const e=field(label);
 if(!e)return false;
 if(e.tagName==="SELECT"){
  const opt=Array.from(e.options).find(o=>text(o).toLowerCase()===want.toLowerCase());
  if(!opt)return false;
  e.value=opt.value;e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));
  return true;
 }
 if(text(e).toLowerCase()===want.toLowerCase())return true;
 // React/Radix menus render asynchronously: read an already-open option before toggling.
 let opt=findOption(want,e);
 if(opt){opt.click();return true;}
 if(e.disabled)return false;
 if(e.getAttribute("aria-expanded")!=="true")e.click();
 transientPending=true;
 return false;
}
function readChoice(label){
 const e=field(label);
 if(!e)return null;
 if(e.tagName==="SELECT")return text(e.selectedOptions[0]);
 return text(e);
}
function tab(label){
 const b=oneButton(label);
 if(!b)return false;
 if(b.getAttribute("aria-selected")==="true"||b.getAttribute("data-state")==="active")return true;
 b.click();return true;
}
// React mounts a different field group AFTER the tab click. Only return
// configured once its selected state and the requested inputs are available.
function ensureModeTab(label,controlsReady){
 const b=oneButton(label);
 if(!b)return {ok:false,pending:true,reason:"Aguardando aba "+label};
 const selected=b.getAttribute("aria-selected"),state=b.getAttribute("data-state"),pressed=b.getAttribute("aria-pressed");
 if(selected==="true"||state==="active"||pressed==="true")
  return controlsReady?{ok:true}:{ok:false,pending:true,reason:"Aguardando campos "+label};
 if(selected!==null||state!==null||pressed!==null){
  if(!b.disabled)b.click();
  return {ok:false,pending:true,reason:"Alternando para "+label};
 }
 // Older site widgets have no aria state. Visible, mode-specific fields
 // are the only safe readiness signal; otherwise request a render cycle.
 if(controlsReady)return {ok:true};
 if(!b.disabled)b.click();
 return {ok:false,pending:true,reason:"Aguardando campos "+label};
}
function prepareCoreFilters(){
 const league=mode==="gl"||mode==="ul";
 const main=league?"PvP":"Stats",mainButton=oneButton(main);
 if(!mainButton)return {ok:false,pending:true,reason:"Aguardando aba "+main};
 const selected=mainButton.getAttribute("aria-selected"),state=mainButton.getAttribute("data-state");
 if((selected!==null||state!==null)&&selected!=="true"&&state!=="active"){
  if(!mainButton.disabled)mainButton.click();
  return {ok:false,pending:true,reason:"Alternando para "+main};
 }
 if(league){
  if(!inputNear("Top ranking")||!field("League"))
   return {ok:false,pending:true,reason:"Aguardando filtros PvP"};
  return {ok:true};
 }
 const isRaw=mode==="raw"||mode==="iv";
 if(isRaw){
  const rawTab=oneButton("Raw IV");
  if(rawTab)return ensureModeTab("Raw IV",rawIVInputs().length===3||rawIVInputs().length===6);
  if(rawIsHundo())return ensureModeTab("% IV",percentageIVInputs().length===2);
  return {ok:false,pending:true,reason:"Aba Raw IV indisponível para IV personalizado"};
 }
 return ensureModeTab("% IV",percentageIVInputs().length===2);
}
function currentMode(){
 if(field("Top ranking"))return "gl";
 if(elements("input").some(e=>e.value==="15")&&labels(document,/^Raw IV$/i).length)return "iv";
 return null;
}
function shinyControl(){
 const lab=elements("label,span,strong,div").filter(e=>vis(e)&&/^\s*(?:✨\s*)?Shiny only\s*$/i.test(text(e))).sort((a,b)=>a.querySelectorAll("*").length-b.querySelectorAll("*").length)[0];
 if(!lab)return null;
 for(let p=lab,i=0;p&&i<5;p=p.parentElement,i++){
  const controls=Array.from(p.querySelectorAll('input[type=checkbox],[role=switch],[role=checkbox],button[aria-checked],button[role=switch],button[data-state]'));
  const named=controls.filter(x=>/shiny/i.test(x.getAttribute('aria-label')||'')||/shiny/i.test(x.id||''));
  if(named.length===1)return named[0];
  if(controls.length===1)return controls[0];
  const toggle=p.querySelector('button[data-state],button[aria-pressed]');
  if(toggle)return toggle;
 }
 return null;
}
function readShiny(){
 const sw=shinyControl();if(!sw)return null;
 if(sw.matches('input[type=checkbox]'))return sw.checked;
 if(sw.getAttribute("aria-checked")!==null)return sw.getAttribute("aria-checked")==="true";
 if(sw.getAttribute("aria-pressed")!==null)return sw.getAttribute("aria-pressed")==="true";
 if(sw.getAttribute("data-state")!==null)return ["checked","on","true"].includes(sw.getAttribute("data-state"));
 return null;
}
function setShiny(want){
 const sw=shinyControl();
 if(!sw)return want
  ?{ok:false,controlFound:false,reason:"Shiny indisponível; autenticação ou vínculo necessário"}
  :{ok:true,controlFound:false,changed:false,siteShiny:null};
 const before=readShiny();
 if(before===want)return {ok:true,controlFound:true,changed:false,siteShiny:before};
 if(before===null||sw.disabled)return {ok:false,controlFound:true,reason:"Estado do Shiny não identificável"};
 sw.click();return {ok:true,controlFound:true,changed:true,siteShiny:readShiny()};
}
function inputsByIvGroup(count){
 const matches=labels(document,/^IV$/i);
 for(const label of matches){
  for(let p=label.parentElement,depth=0;p&&depth<5;p=p.parentElement,depth++){
   const inputs=Array.from(p.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio])')).filter(vis);
   // Stay inside the IV group: avoid accidentally setting CP and Level.
   if(inputs.length===count)return inputs;
   if(inputs.length>6)break;
  }
 }
 return [];
}
function rawIVInputs(){return inputsByIvGroup(3).length?inputsByIvGroup(3):inputsByIvGroup(6);}
function percentageIVInputs(){return inputsByIvGroup(2);}
function set100Percent(){
 const fields=percentageIVInputs();
 return fields.length===2&&applyNumbersOneAtATime(fields,[100,100],0,100);
}
function configuredRank(){return mode==="ul"?filters.ulRank:filters.glRank;}
// IV form shown by PoGoCoordinates: A / D / S in three adjacent inputs.
// Attribute labels (A,D,S or full stat names) take precedence if available.
function ivStatFor(value){
 const v=clean(value).replace(/[_-]/g," ");
 if(!v)return -1;
 const rx=[/^(?:a|attack|atk|ataque)$/i,/^(?:d|defense|defence|def|defesa)$/i,/^(?:s|stamina|sta|hp|vida)$/i];
 const names=[/\b(?:attack|atk|ataque)\b/i,/\b(?:defense|defence|def|defesa)\b/i,/\b(?:stamina|sta|hp|vida)\b/i];
 const m=names.map((re,i)=>re.test(v)||rx[i].test(v)?i:-1).filter(i=>i>=0);
 return m.length===1?m[0]:-1;
}
function ivInputStat(input){
 const attrs=["aria-label","name","id","placeholder"].map(k=>input.getAttribute(k)||"").filter(Boolean);
 for(const a of attrs){const stat=ivStatFor(a);if(stat>=0)return stat;}
 const id=input.getAttribute("id")||"";
 if(id){
  const lab=elements("label[for]").find(e=>e.getAttribute("for")===id);
  if(lab){const stat=ivStatFor(text(lab));if(stat>=0)return stat;}
 }
 const labelled=input.getAttribute("aria-labelledby")||"";
 if(labelled){
  const ids=labelled.split(/\s+/);
  for(const id of ids){
   const label=elements("[id]").find(e=>e.getAttribute("id")===id);
   if(label){const stat=ivStatFor(text(label));if(stat>=0)return stat;}
  }
 }
 // The narrow wrapper of one/two controls can label the stat. Do not
 // promote ancestor groups that include CP, Level or all three IV stats.
 for(let p=input.parentElement,d=0;p&&d<4;p=p.parentElement,d++){
  const local=Array.from(p.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio])')).filter(vis);
  if(local.length>2)break;
  const stat=ivStatFor(text(p));if(stat>=0)return stat;
 }
 return -1;
}
function rawValues(){
 const values=[filters.attack,filters.defense,filters.stamina];
 if(!values.every(v=>Number.isInteger(v)&&v>=0&&v<=15))return null;
 const inputs=rawIVInputs();
 if(inputs.length!==3&&inputs.length!==6)return null;
 const mapped=inputs.map(ivInputStat);
 if(inputs.length===3){
  // Site's three-input Raw IV card is ordered A/D/S, proven by screenshots.
  // Use that order only when *none* of its controls claims another label.
  if(mapped.every(v=>v<0))return {inputs,values};
  if(mapped.every(v=>v>=0)&&[0,1,2].every(v=>mapped.filter(x=>x===v).length===1))
   return {inputs,values:mapped.map(v=>values[v])};
  return null;
 }
 if(mapped.every(v=>v>=0)&&[0,1,2].every(v=>mapped.filter(x=>x===v).length===2))
  return {inputs,values:mapped.map(v=>values[v])};
 // Six anonymous min/max fields are safe only for all-equal triples.
 if(mapped.every(v=>v<0)&&values.every(v=>v===values[0]))
  return {inputs,values:inputs.map(()=>values[0])};
 return null;
}
function confirmedNumber(input,want,min,max){
 if(!input)return false;
 const val=String(input.value??"").trim();
 // Number("") equals 0; that must NEVER verify a blank Raw IV input.
 if(!/^(?:0|[1-9]\d*)$/.test(val))return false;
 const number=Number(val);
 return Number.isInteger(number)&&number>=min&&number<=max&&number===want;
}
function applyNumbersOneAtATime(inputs,values,min,max){
 if(inputs.length!==values.length)return false;
 for(let i=0;i<inputs.length;i++){
  const target=values[i],input=inputs[i];
  if(!Number.isInteger(target)||target<min||target>max)return false;
  if(confirmedNumber(input,target,min,max))continue;
  if(!vis(input)||input.disabled||input.readOnly)return false;
  // Native value setter + input/change events mirrors an actual typed value.
  // React may re-render after each event: advance ONE field per JS roundtrip.
  if(!valueInput(input,target))return false;
  transientPending=true;
  return false;
 }
 return true;
}
function rawIsHundo(){
 return filters.attack===15&&filters.defense===15&&filters.stamina===15;
}
function applyRaw(){
 const group=rawValues();
 if(group)return applyNumbersOneAtATime(group.inputs,group.values,0,15);
 // Only a Hundo can safely fall back to % IV 100/100, and only if
 // the site's Raw IV tab is missing. Never change tabs mid-configuration.
 return rawIsHundo()&&!oneButton("Raw IV")&&set100Percent();
}
function verifyRaw(){
 const group=rawValues();
 if(group&&group.inputs.every((input,i)=>confirmedNumber(input,group.values[i],0,15)))return true;
 if(!rawIsHundo()||oneButton("Raw IV"))return false;
 const percent=percentageIVInputs();
 return percent.length===2&&percent.every(input=>confirmedNumber(input,100,0,100));
}
// Defense-in-depth: the UI and Android bridge reject unattainable IV values,
// and the site automation independently verifies the same 46-value domain.
const ATTAINABLE_IV_PERCENTAGES=Array.from({length:46},(_,sum)=>Math.round(sum*100/45));
function validPercentRange(){
 return Number.isInteger(filters.percentMin)&&Number.isInteger(filters.percentMax)&&
  ATTAINABLE_IV_PERCENTAGES.includes(filters.percentMin)&&
  ATTAINABLE_IV_PERCENTAGES.includes(filters.percentMax)&&
  filters.percentMin<=filters.percentMax;
}
function applyPercent(){
 if(!validPercentRange())return false;
 const inputs=percentageIVInputs();
 return inputs.length===2&&applyNumbersOneAtATime(inputs,[filters.percentMin,filters.percentMax],0,100);
}
function verifyPercent(){
 if(!validPercentRange())return false;
 const inputs=percentageIVInputs();
 return inputs.length===2&&confirmedNumber(inputs[0],filters.percentMin,0,100)&&confirmedNumber(inputs[1],filters.percentMax,0,100);
}
function applyIv(){
 // Legacy perfect-IV option, kept for compatibility with older saved modes.
 const group=rawValues();
 if(group)return applyNumbersOneAtATime(group.inputs,group.inputs.map(()=>15),0,15);
 return !oneButton("Raw IV")&&set100Percent();
}
function applyLeague(){
 const rank=inputNear("Top ranking"),want=configuredRank();
 if(!rank)return false;
 if(!confirmedNumber(rank,want,1,50)){
  if(!valueInput(rank,want))return false;
  transientPending=true;
  return false;
 }
 return choice("League",mode==="ul"?"Ultra League":"Great League")&&
  choice("Include previous evolutions",filters.includePreviousEvolutions===false?"No":"Yes");
}
function checkCore(){
 const currentShiny=readShiny();
 if(currentShiny!==shinyOnly && !(shinyOnly===false&&currentShiny===null))
  return {ok:false,reason:"Shiny não confirmado",shiny:currentShiny};
 if(mode==="iv"){
  const ins=rawIVInputs();
  if((ins.length===3||ins.length===6)&&ins.every(x=>confirmedNumber(x,15,0,15)))return {ok:true};
  const pc=percentageIVInputs();
  if(pc.length===2&&pc.every(x=>confirmedNumber(x,100,0,100)))return {ok:true};
  return {ok:false,reason:"IV100: Raw IV 15/15/15 ou % IV 100/100 não confirmados"};
 }
 // A verified input in a different tab is not proof of the selected mode.
 const target=mode==="raw"?"Raw IV":mode==="percent"?"% IV":null;
 if(target){
  const button=oneButton(target);
  if(button&&(button.getAttribute("aria-selected")!==null||button.getAttribute("data-state")!==null)&&
    button.getAttribute("aria-selected")!=="true"&&button.getAttribute("data-state")!=="active")
   return {ok:false,reason:"Aba "+target+" não selecionada"};
 }
 if(mode==="raw")return {ok:verifyRaw(),reason:"Raw IV A/D/S não confirmado no site"};
 if(mode==="percent")return {ok:verifyPercent(),reason:"IV% Min/Max não confirmados no site"};
 const rank=inputNear("Top ranking");
 const league=readChoice("League"),prior=readChoice("Include previous evolutions");
 if(!rank||Number(rank.value)!==configuredRank()||
    league!==(mode==="ul"?"Ultra League":"Great League")||prior!==(filters.includePreviousEvolutions===false?"No":"Yes"))
  return {ok:false,reason:"Filtro da liga e Top ranking não confirmados",rank:rank?rank.value:null,league,prior};
 return {ok:true};
}

// SITE-POKEMON-01: PoGoCoordinates uses a multiple-species/form token picker.
// A Pokemon's exact form label is NOT a free-text single-species search.
function normalizePokemonLabel(value){
 return clean(value).replace(/^#\s*\d{1,4}\s+/,'').replace(/[\s×✕✓✔]+$/,'').trim();
}
function pokemonPickerRoot(){
 const heads=labels(document,/^Pok[eé]mon$/i);
 for(const head of heads){
  for(let p=head.parentElement,depth=0;p&&depth<6;p=p.parentElement,depth++){
   const all=text(p);
   if(all.length>2800||/\b(?:Sort by|Filter by|Despawn|Weather)\b/i.test(all))break;
   const btns=p.querySelectorAll('button,[role=combobox],input:not([type=hidden])');
   if(btns.length&&p!==document.body)return p;
  }
 }
 return null;
}
function pokemonPickerInput(){
 return elements('input:not([type=hidden])').find(e=>vis(e)&&
  /search by name, form, or dex|search.*(?:pok[eé]mon|form|dex)/i.test(
   (e.getAttribute('placeholder')||'')+' '+(e.getAttribute('aria-label')||'')))||null;
}
function pokemonPickerButton(root){
 if(!root)return null;
 return Array.from(root.querySelectorAll('button,[role=combobox],[aria-haspopup]'))
  .find(e=>vis(e)&&(/pok[eé]mon/i.test(String(e.getAttribute('aria-label')||''))||
    e.getAttribute('aria-haspopup')||e.getAttribute('role')==='combobox'||
    /(?:any pok[eé]mon|\b\d+\b)/i.test(text(e))))||null;
}
function pokemonSelectedChips(){
 const root=pokemonPickerRoot();if(!root)return null;
 const selected=[];
 const buttons=Array.from(root.querySelectorAll('button,[role=button]')).filter(vis);
 for(const b of buttons){
  const aria=String(b.getAttribute('aria-label')||'');
  const isRemove=/\b(?:remove|remover|delete)\b/i.test(aria)||/^[×✕x]$/.test(text(b));
  if(!isRemove||!b.parentElement)continue;
  const raw=aria.match(/(?:remove|remover|delete)\s+(.+)/i)?.[1]||text(b.parentElement);
  const label=normalizePokemonLabel(raw);
  if(!label||label.length>100||!/\p{L}/u.test(label)||
   /^(?:pok[eé]mon|any|clear|remove|limpar|search)$/i.test(label))continue;
  if(!selected.some(v=>v.label.toLowerCase()===label.toLowerCase()))selected.push({label,remove:b});
 }
 return selected;
}
function pokemonPickerOptions(){
 const input=pokemonPickerInput();if(!input)return [];
 const trigger=pokemonPickerButton(pokemonPickerRoot());
 const popup=activeOptionPopup(input)||activeOptionPopup(trigger);
 const selector='[role=option],[role=listbox] [role=checkbox],[cmdk-item],[data-radix-collection-item],[role=listbox] button,[role=listbox] li,li';
 const declared=!!(input.getAttribute('aria-controls')||trigger?.getAttribute?.('aria-controls'));
 const candidates=(popup?Array.from(popup.querySelectorAll(selector)):declared?[]:elements(selector)).filter(vis);
 return candidates.map(e=>{
  const raw=text(e),label=normalizePokemonLabel(raw);
  const dex=(raw.match(/#\s*(\d{1,4})/)||[])[1]||'';
  const img=e.querySelector('img[src]'),image=img?String(img.src||''):'';
  return {label,dex,image:/^https:\/\//.test(image)?image:'',node:e};
 }).filter(item=>item.label&&item.label.length<=90&&
  !/^(?:any pok[eé]mon|clear|search|close|no results|loading)$/i.test(item.label))
  .filter((item,i,all)=>all.findIndex(v=>v.label.toLowerCase()===item.label.toLowerCase())===i)
  .slice(0,35);
}
function pokemonSuggestion(query){
 const root=pokemonPickerRoot();
 if(!root)return {ok:false,reason:'Filtro Pokémon não localizado no site'};
 let input=pokemonPickerInput();
 if(!input){
  const button=pokemonPickerButton(root);
  if(!button)return {ok:false,reason:'Seletor Pokémon não disponível no site'};
  button.click();
  return {ok:false,pending:true,reason:'Abrindo opções oficiais'};
 }
 const originalQuery=String(query||'').slice(0,65);
 const wanted=originalQuery.replace(/^#0+(\d{1,4})$/,'#$1');
 if(String(input.value||'')!==wanted){
  if(!valueInput(input,wanted))return {ok:false,reason:'Busca Pokémon indisponível'};
  return {ok:false,pending:true,reason:'Aguardando opções do site'};
 }
 const chips=pokemonSelectedChips();
 const options=pokemonPickerOptions().map(({label,dex,image})=>({label,dex,image}));
 if(!options.length){
  const popup=activeOptionPopup(input)||activeOptionPopup(pokemonPickerButton(root));
  // Absence of items during React hydration is NOT an official empty response.
  const explicitEmpty=!!originalQuery.trim()&&!!popup&&
   /(?:no (?:results|pok[eé]mon|matches) found|no results|nenhum(?:a|s)? (?:resultado|pok[eé]mon))/i.test(text(popup));
  if(!explicitEmpty)return {ok:false,pending:true,query:originalQuery,
   reason:'Aguardando opções oficiais do PoGoCoordinates'};
  return {ok:true,empty:true,query:originalQuery,options:[],
   selected:chips?chips.map(c=>c.label):[],source:'PoGoCoordinates'};
 }
 return {ok:true,query:originalQuery,options,
  selected:chips?chips.map(c=>c.label):[],source:'PoGoCoordinates'};
}
if(action.startsWith('pokemonSuggest:')){
 try{return JSON.stringify(pokemonSuggestion(JSON.parse(action.slice('pokemonSuggest:'.length))));}
 catch(_){return JSON.stringify({ok:false,reason:'Consulta de Pokémon inválida'});}
}
function pokemonListSelection(verb){
 const raw=filters.pokemonSelections;
 if(!Array.isArray(raw))return {ok:true,pending:false};
 const wanted=[...new Set(raw.map(normalizePokemonLabel).filter(Boolean))];
 const needClear=Array.isArray(filters.clearExtraKeys)&&
  (filters.clearExtraKeys.includes('pokemonSelections')||filters.clearExtraKeys.includes('pokemon'));
 if(wanted.length===0&&!needClear)return {ok:true,pending:false};
 const selected=pokemonSelectedChips();
 if(!selected)return {ok:false,pending:false,reason:'Cartões selecionados do site não encontrados'};
 const missing=wanted.filter(name=>!selected.some(x=>x.label.toLowerCase()===name.toLowerCase()));
 const extra=selected.filter(x=>!wanted.some(name=>name.toLowerCase()===x.label.toLowerCase()));
 if(!missing.length&&!extra.length)return {ok:true,pending:false};
 if(verb!=='apply')return {ok:false,pending:false,reason:'Seleção de espécies ou formas diferente da solicitada'};
 if(extra.length){extra[0].remove.click();return {ok:false,pending:true,reason:'Removendo outra espécie ou forma'};}
 const result=pokemonSuggestion(missing[0]);
 if(!result.ok)return {ok:false,pending:!!result.pending,reason:result.reason||'Filtro Pokémon indisponível'};
 const candidate=pokemonPickerOptions().find(x=>x.label.toLowerCase()===missing[0].toLowerCase());
 if(!candidate)return {ok:false,pending:true,reason:'Aguardando espécie/forma no seletor oficial: '+missing[0]};
 candidate.node.click();
 return {ok:false,pending:true,reason:'Aplicando espécie/forma no site'};
}

const EXTRA_LABELS={sortBy:"Sort by",pokemon:"Pokemon",form:"Form",size:"Size",gender:"Gender",weather:"Weather"};
function extraControl(label){
 const e=field(label);if(e)return e;
 const rx=label==="Pokemon"?/pok[eé]mon/i:new RegExp(label,"i");
 return elements('input:not([type=hidden]),select,[role=combobox],button[aria-haspopup]')
  .find(x=>vis(x)&&rx.test((x.getAttribute("placeholder")||"")+" "+(x.getAttribute("aria-label")||"")))||null;
}
function siteOptions(key){
 const control=extraControl(EXTRA_LABELS[key]);
 if(!control)return {ok:false,pending:false,options:[]};
 if(control.matches("select"))
  return {ok:true,pending:false,options:[...control.options].map(text).map(clean).filter(Boolean).slice(0,80)};
 const popup=activeOptionPopup(control);
 if(!popup)return {ok:false,pending:true,options:[]};
 return {ok:true,pending:false,
  options:[...new Set(optionElements(control).map(text).map(clean).filter(x=>x&&x.length<100))].slice(0,80)};
}
function describeChoice(label){
 const e=extraControl(label);
 if(!e)return {present:false,options:[],reason:"Campo indisponível no site"};
 const options=e.matches("select")?Array.from(e.options).map(text):[];
 return {present:true,disabled:!!e.disabled,
   value:clean(e.matches("input")?e.value:e.matches("select")?text(e.selectedOptions[0]):text(e)),
   options:[...new Set(options.map(clean).filter(Boolean))].slice(0,80)};
}
function extraValue(key){
 const e=extraControl(EXTRA_LABELS[key]);if(!e)return null;
 return clean(e.matches("input")?e.value:e.matches("select")?text(e.selectedOptions[0]):text(e));
}
function isNeutral(v){
 return !v||/^(?:any(?:\s+[\p{L}\s]*)?|all(?:\s+[\p{L}\s]*)?|todos?|qualquer(?:\s+[\p{L}\s]*)?|select(?:\s+[\p{L}\s]*)?|choose(?:\s+[\p{L}\s]*)?)$/iu.test(v);
}
function extraSelect(key,want){
 const label=EXTRA_LABELS[key],e=extraControl(label);
 if(!e)return false; // Explicitly requested selection/reset requires an observable site control.
 const actual=extraValue(key);
 if(!want){
  if(isNeutral(actual))return true;
  if(e.matches("input"))return valueInput(e,"");
  // Reset prior active filter when user switches back to Any.
  const opt=optionElements(e).find(o=>isNeutral(text(o)));
  if(opt){opt.click();return true;}
  if(e.disabled)return false;
  if(e.getAttribute("aria-expanded")!=="true")e.click();
  transientPending=true;
  return false;
 }
 if(e.disabled)return false;
 if(actual&&actual.toLowerCase()===want.toLowerCase())return true;
 if(e.matches("input"))return valueInput(e,want);
 if(e.matches("select"))return choice(label,want);
 const opt=findOption(want,e);
 if(opt){opt.click();transientPending=true;return false;} // React state must settle before later filters
 if(e.getAttribute("aria-expanded")!=="true")e.click();
 transientPending=true;
 return false;
}
function extraMatches(key,want){
 const v=extraValue(key);
 if(v===null)return false; // Cannot prove reset/selection without the live control.
 if(!want)return isNeutral(v);
 return v.toLowerCase()===clean(want).toLowerCase();
}
if(action.startsWith("openFilterOptions:")){
 const key=action.split(":")[1],label=EXTRA_LABELS[key],e=label?extraControl(label):null;
 if(!e||e.disabled||e.matches("input")||e.matches("select"))return JSON.stringify({ok:false,key});
 if(e.getAttribute("aria-expanded")!=="true")e.click();
 return JSON.stringify({ok:true,key});
}
if(action.startsWith("readFilterOptions:")){
 const key=action.split(":")[1],label=EXTRA_LABELS[key];
 return JSON.stringify(label?{key,...siteOptions(key)}:{ok:false,key,options:[]});
}
if(action.startsWith("closeFilterOptions:")){
 const key=action.split(":")[1],label=EXTRA_LABELS[key],e=label?extraControl(label):null;
 if(e&&e.getAttribute("aria-expanded")==="true"){
  try{e.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));}
  catch(_){}
  if(e.getAttribute("aria-expanded")==="true")e.click();
 }
 return JSON.stringify({ok:true,key});
}
function rangeInputs(label){
 const matching=labels(document,new RegExp("^"+label+"$","i"));
 for(const node of matching)for(let p=node.parentElement,depth=0;p&&depth<4;p=p.parentElement,depth++){
  const ins=Array.from(p.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio])')).filter(vis);
  if(ins.length===2)return ins;
  if(ins.length>6)break;
 }
 return [];
}
function extraNumberField(key){
 if(key==="minPvpCp")return inputNear("Min CP");
 const cp=key==="cpMin"||key==="cpMax",pair=rangeInputs(cp?"CP":"Level");
 return pair.length===2?pair[key.endsWith("Min")?0:1]:null;
}
function extraNumberKeys(){
 return ["gl","ul"].includes(mode)?["minPvpCp"]:["cpMin","cpMax","levelMin","levelMax"];
}
// Only EXPLICITLY REQUESTED optional criteria may block a search. A site
// title, generic Pokemon picker or decorated "Any" must not become mandatory.
function extras(action){
 transientPending=false;
 const failed=[];
 const resetKeys=Array.isArray(filters.clearExtraKeys)?filters.clearExtraKeys:[];
 const pokemon=pokemonListSelection(action);
 if(!pokemon.ok)return {ok:false,pending:!!pokemon.pending,reason:pokemon.reason||'Seleção Pokémon não confirmada'};
 for(const key of Object.keys(EXTRA_LABELS)){
  if(key==="pokemon"&&Array.isArray(filters.pokemonSelections))continue;
  const want=String(filters[key]||"").trim();
  // Blank means no optional restriction; it is not a request to discover a
  // dropdown. Only a tracked transition from a prior filter needs clearing.
  if(!want&&!resetKeys.includes(key))continue;
  const ok=action==="apply"?extraSelect(key,want):extraMatches(key,want);
  if(!ok)failed.push(key);
  if(transientPending)break; // one portal dropdown at a time
 }
 if(!transientPending)for(const key of extraNumberKeys()){
  const want=String(filters[key]||"").trim(),input=extraNumberField(key);
  if(!want&&!resetKeys.includes(key))continue;
  if(!input){failed.push(key);continue;} // Includes explicitly requested numeric resets.
  const current=String(input.value||"").trim();
   if(current===want)continue;
   if(action!=="apply"){failed.push(key);continue;}
   if(!valueInput(input,want)){failed.push(key);continue;}
   transientPending=true;failed.push(key);break;
 }
 return {ok:failed.length===0,pending:action==="apply"&&transientPending,reason:"Filtros adicionais: "+failed.join(", ")};
}
function currentCoreControlsVisible(){
 if(mode==="percent")return percentageIVInputs().length===2;
 if(mode==="raw"||mode==="iv")return rawIVInputs().length>0||percentageIVInputs().length===2;
 return !!inputNear("Top ranking")||!!field("League");
}
// A result page can collapse the form after Search. A visible disagreement
// must still invalidate results, but an absent control is not a disagreement.
function visibleExtrasMismatch(){
 const resetKeys=Array.isArray(filters.clearExtraKeys)?filters.clearExtraKeys:[];
 for(const key of Object.keys(EXTRA_LABELS)){
  if(key==="pokemon"&&Array.isArray(filters.pokemonSelections))continue;
  const want=String(filters[key]||"").trim();
  if(!want&&!resetKeys.includes(key))continue;
  const control=extraControl(EXTRA_LABELS[key]);
  if(control&&!extraMatches(key,want))return key;
 }
 for(const key of extraNumberKeys()){
  const want=String(filters[key]||"").trim();
  if(!want&&!resetKeys.includes(key))continue;
  const input=extraNumberField(key);
  if(input&&String(input.value||"").trim()!==want)return key;
 }
 return "";
}
function check(){const base=checkCore();return base.ok?extras("verify"):base;}
function resultCriteria(){
 const base=checkCore(),ext=base.ok?extras("verify"):{ok:false,reason:base.reason};
 if(base.ok&&ext.ok)return {ok:true,source:"live-form",reason:"Filtros confirmados no formulário"};
 const coreVisible=currentCoreControlsVisible(),mismatch=visibleExtrasMismatch();
 if(filters._preSubmitVerified&&!mismatch&&(!coreVisible||base.ok)){
  return {ok:true,source:"pre-submit-confirmed",reason:"Formulário oculto após envio; filtros confirmados antes da busca"};
 }
 return {ok:false,source:"not-confirmed",
  reason:mismatch?"Campo divergente: "+mismatch:coreVisible?(ext.reason||base.reason):"Formulário ausente sem confirmação prévia"};
}
// Isolated diagnostics used by smoke tests; no Search is submitted.
if(action==="configureExtras")return JSON.stringify(extras("apply"));
if(action==="verifyExtras")return JSON.stringify(extras("verify"));
if(action==="describeFilters"){
 const options={};
 for(const [key,label] of Object.entries(EXTRA_LABELS))options[key]=describeChoice(label);
 return JSON.stringify({ok:true,options});
}

function cardRoots(){
 const btns=elements("button,[role=button]").filter(e=>vis(e)&&/^(?:Get coords|Open in Maps)$/i.test(text(e)));
 return btns.slice(0,10).map((b,i)=>{
  let node=b,chosen=b.parentElement;
  for(let depth=0;depth<10&&node;depth++,node=node.parentElement){
   const t=text(node);
   if(/\bLOCATION\b/i.test(t)&&/\bDESPAWN\b/i.test(t)&&/\bCP\b/i.test(t)&&t.length<2500){chosen=node;break;}
  }
  return {node:chosen,sourceIndex:i};
 });
}
function nextLabelValue(root,label){
 const re=new RegExp("^"+label+"$","i");
 const c=Array.from(root.querySelectorAll("span,div,p,small,label,dt")).filter(e=>re.test(text(e))&&text(e).length<18).sort((a,b)=>text(a).length-text(b).length);
 for(const x of c){
  if(x.nextElementSibling){
   const s=text(x.nextElementSibling);
   if(s&&s.length<80&&!re.test(s))return s;
  }
  const p=x.parentElement;
  if(p&&p.children.length<8){
   const s=text(p).replace(new RegExp("^"+label+"\\s*:?\\s*","i"),"");
   if(s&&s!==text(p)&&s.length<80)return s;
  }
 }
 return "";
}
function parseCard(box,sourceIndex){
 const body=text(box),lines=body.split(/\n+/).map(clean).filter(Boolean);
 const ivMatch=body.match(/(\d{1,3})\s*%\s*[\(（]\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*[\)）]/);
 const raw=ivMatch?[ivMatch[2],ivMatch[3],ivMatch[4]].join("/"):
    ((body.match(/(?:^|[^\d])(\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{1,2})(?:[^\d]|$)/)||[])[1]||"").replace(/\s/g,"");
 const labeledPct=(body.match(/(?:^|\n)\s*IV\s*:?\s*(\d{1,3})\s*%/i)||[])[1]||"";
 const percent=ivMatch?ivMatch[1]:(raw?String(Math.round(raw.split("/").map(Number).reduce((a,b)=>a+b,0)/45*100)):labeledPct);
 const val=(label,re)=>{let candidate=nextLabelValue(box,label);let m=candidate.match(re);if(m)return m[1];
     m=body.match(new RegExp("(?:^|\\n)\\s*"+label+"\\s*:?\\s*([0-9.]+)","im"));return m?m[1]:"";};
 const heading=box.querySelector("h2,h3,h4,h5,[class*=font-semibold],[class*=font-bold]");
 let title=heading?text(heading):"";
 if(!title||title.length>85||/^(?:CP|IV|LVL)$/i.test(title)){
  title=lines.find(s=>/^[\p{L}\p{N} _'.\-♀♂()✨]+$/u.test(s)&&!/(?:^CP$|^IV$|^LVL$|LOCATION|DESPAWN|Get coords)/i.test(s)&&s.length<45)||"Pokémon";
 }
 const meta=lines.find(s=>/#\s*\d{1,4}\b/.test(s))||"";
 const size=((meta.match(/(?:^|[\s·])(?:XXS|XS|XXL|XL|M)(?=$|[\s·])/i)||[])[0]||"").trim();
 const move=lines.find(s=>/\s\/\s/.test(s)&&!/\d+\s*\/\s*\d+\s*\/\s*\d+/.test(s))||"";
 const loc=nextLabelValue(box,"LOCATION")||(body.match(/\bLOCATION\s*\n?\s*([^\n]+?)(?=\n|DESPAWN|$)/i)||[])[1]||"";
 const desp=nextLabelValue(box,"DESPAWN")||(body.match(/\bDESPAWN\s*(\d{1,2}:\d{2})/i)||[])[1]||"";
 // PL-LOC-INFO: only use the distance explicitly printed inside this card.
 // Never derive distance from device GPS or the user's saved coordinates.
 const distanceMatch=body.match(/(?:^|\n)\s*(\d+(?:[.,]\d+)?)\s*(km|m|mi)\s+(?:away|de\s+dist[âa]ncia)\b/im);
 const distance=distanceMatch?distanceMatch[1]+" "+distanceMatch[2]:"";
 // The site's LOCATION container can include its own separate distance line.
 // Strip it from the place name so Location and Distance can be toggled independently.
 const place=clean(loc).replace(/\s*\d+(?:[.,]\d+)?\s*(?:km|m|mi)\s+(?:away|de\s+dist[âa]ncia)\s*$/i,"").trim();
 const candidates=Array.from(box.querySelectorAll("img[src]")).filter(e=>/^https?:/.test(e.src)||e.src.startsWith("data:image/"));
 const image=candidates.sort((a,b)=>{
  const score=e=>{
   const alt=String(e.alt||"").toLowerCase(),src=String(e.src||"").toLowerCase();
   const name=String(title||"").replace(/✨/g,"").trim().toLowerCase();
   return (name&&alt.includes(name)?80:0)+(/pokemon|pok[eé]mon|sprite|pogo|pokeapi/.test(src)?18:0)+
    (/sprite|pokemon|pok[eé]mon/.test(alt)?12:0)+
    (e.naturalWidth>0&&e.naturalWidth===e.naturalHeight?7:0)-
    (/logo|avatar|icon-user|profile/.test(src)?35:0);
  };
  return score(b)-score(a);
 })[0];
 const rankMatch=body.match(/\b(?:PvP\s*)?(?:Rank|Ranking|Rk)\s*#?\s*(\d+)\b/i);
 // Species-specific IV rank is NOT the Top-N search filter and is not
 // PvPoke's cross-species performance rank. Require a labeled card value.
 const explicitSpeciesIvRank=body.match(/(?:^|\n)\s*(?:(PvP|GL|UL)\s+)?(?:IV\s+Rank|Rank\s+(?:de\s+)?IV|Stat\s+Product\s+Rank)\s*[:#]?\s*(\d{1,4})\b/im);
 const rankLeagueHint=String(explicitSpeciesIvRank?.[1]||"").toLowerCase();
 const evidence=verifiedCardIv({iv:raw,ivPercent:percent});
 const ivRankValue=explicitSpeciesIvRank?Number(explicitSpeciesIvRank[2]):0;
 const ivRankValid=Number.isInteger(ivRankValue)&&ivRankValue>=1&&ivRankValue<=4096&&
  evidence?.percent!==null&&evidence?.percent!==undefined&&
  (mode==="gl"||mode==="ul")&&
  (rankLeagueHint!=="gl"&&rankLeagueHint!=="ul"||rankLeagueHint===mode);
 const isShiny=/✨/.test(title);
 return {
  sourceIndex,name:title.replace(/✨/g,"").trim(),image:image?image.src:"",
  number:(meta.match(/#\d{1,4}/)||[])[0]||"",
  gender:/\bFemale\b|♀/i.test(meta)?"♀":/\bMale\b|♂/i.test(meta)?"♂":"",
  size:size,moves:move,location:place,distance,despawn:(desp.match(/\d{1,2}:\d{2}/)||[])[0]||"",
  cp:val("CP",/(\d{1,5})/),level:val("(?:LVL|Level)",/([\d.]+)/),
  iv:raw,ivPercent:percent,rank:rankMatch?rankMatch[1]:"",
  ivRank:ivRankValid?ivRankValue:null,
  ivRankSource:ivRankValid?"explicit-species-iv":"",
  ivRankLeague:ivRankValid?mode:"",
  shiny:isShiny,form:(title.match(/\(([^)]+)\)/)||[])[1]||""
 };
}
// IV is evidence about THIS card, not merely proof that Search had a filter.
const POSSIBLE_IV_PERCENT=new Set(Array.from({length:46},(_,sum)=>Math.round(sum*100/45)));
function verifiedCardIv(card){
 const raw=String(card.iv||"").trim(),pct=String(card.ivPercent||"").trim();
 let computed=null;
 if(raw){
  if(!/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(raw))return null;
  computed=Math.round(raw.split("/").map(Number).reduce((sum,n)=>sum+n,0)*100/45);
 }
 if(pct){
  if(!/^(?:0|[1-9][0-9]?|100)$/.test(pct))return null;
  const observed=Number(pct);
  if(!POSSIBLE_IV_PERCENT.has(observed)||(computed!==null&&computed!==observed))return null;
  computed=observed;
 }
 return {raw,percent:computed};
}
function collect(){
 const found=cardRoots().map(item=>parseCard(item.node,item.sourceIndex));
 const confirmation=resultCriteria();
 const siteCriteria=confirmation.ok;
 const rankLimit=configuredRank();
 const isLeague=mode==="gl"||mode==="ul";
 const matches=x=>{
  if(isLeague)return !x.rank||(Number(x.rank)>=1&&Number(x.rank)<=rankLimit);
  const evidence=verifiedCardIv(x);
  if(!evidence||evidence.percent===null)return false;
  if(mode==="iv")return evidence.percent===100;
  if(mode==="raw"){
   const target=[filters.attack,filters.defense,filters.stamina].join("/");
   return evidence.raw!==""&&evidence.raw===target;
  }
  if(mode==="percent")
   return evidence.percent>=filters.percentMin&&evidence.percent<=filters.percentMax;
  return false;
 };
  const wantedSpecies=Array.isArray(filters.pokemonSelections)?filters.pokemonSelections.map(normalizePokemonLabel):[];
  const requestedSpecies=x=>{
   if(!wantedSpecies.length)return true;
   const name=normalizePokemonLabel(x.name),form=clean(x.form);
   const observed=form&&!name.toLowerCase().includes('('+form.toLowerCase()+')')?name+' ('+form+')':name;
   return wantedSpecies.some(label=>{
    const query=label.toLowerCase(),seen=observed.toLowerCase();
    return seen===query||(seen.endsWith(' (normal)')&&seen.slice(0,-9)===query);
   });
  };
  const valid=siteCriteria?found.filter(x=>matches(x)&&requestedSpecies(x)).map(x=>{
  if(isLeague&&!x.rank)return {...x,rank:"",rankLimit,rankSource:"verified-site-filter"};
  return x;
 }):[];
 const uncertain=!siteCriteria||found.some(x=>!matches(x));
 const unverifiedIv=isLeague?0:found.filter(x=>{const evidence=verifiedCardIv(x);return !evidence||evidence.percent===null;}).length;
 const t=text(document.body);
 const loading=!!document.querySelector('[aria-busy="true"],[role="progressbar"]')||
   !!oneButton("Searching")||!!oneButton("Loading");
 const emptyMessage=/\b(?:no results found|no results|nenhum resultado|sem resultados)\b/i;
 const regions=elements('main section,[role=region],[data-testid*=result],[aria-label*=result]').filter(vis);
 const explicitEmpty=found.length===0&&regions.some(region=>{
  const body=text(region);
  return body.length<500&&emptyMessage.test(body)&&
   !region.querySelector('[role=listbox],[cmdk-list],[role=dialog]');
 });
 const siteCount=Number((t.match(/\bShowing\s+(\d+)\s+spawns?\b/i)||[])[1]||0);
 const parseFailure=siteCount>0&&found.length===0;
 return JSON.stringify({ok:true,cards:valid,found:found.length,unverifiedIv,siteCount,parseFailure,uncertain,loading,explicitEmpty,
  criteriaConfirmed:siteCriteria,criteriaReason:confirmation.reason,confirmationSource:confirmation.source,
  leagueConfirmed:isLeague&&siteCriteria,siteShiny:readShiny()});
}
if(action==="collect")return collect();
if(action.startsWith("coords:")){
 const index=Number(action.slice(7));
 const card=cardRoots().find(c=>c.sourceIndex===index);
 const btn=card&&Array.from(card.node.querySelectorAll("button,[role=button]")).find(e=>vis(e)&&/^Get coords$/i.test(text(e)));
 if(!btn){
  const opened=card&&Array.from(card.node.querySelectorAll("button,a,[role=button]")).some(e=>vis(e)&&/^Open in Maps$/i.test(text(e)));
  return JSON.stringify({ok:!!opened,status:opened?"Coordenadas já abertas":"Botão Get coords não localizado"});
 }
 btn.click();
 return JSON.stringify({ok:true,status:"Solicitando coordenadas no site"});
}
if(action.startsWith("readCoords:")){
 const query=JSON.parse(action.slice("readCoords:".length));
 const latlong=/(-?\d{1,2}(?:\.\d{1,12})?)\s*[,;]\s*(-?\d{1,3}(?:\.\d{1,12})?)/g;
 function coordinate(s){
  for(const m of String(s||"").matchAll(latlong)){
   const lat=Number(m[1]),lon=Number(m[2]);
   if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)return m[1]+","+m[2];
  }
  return "";
 }
 // The website replaces Get coords with "Open in Maps" and puts coordinates beneath.
 const buttons=elements('button,a,[role=button]').filter(x=>vis(x)&&/Open in Maps|Get coords/i.test(text(x)));
 for(const b of buttons){
  if(!/Open in Maps/i.test(text(b)))continue;
  let card=b.parentElement;
  for(let i=0;i<9&&card;i++,card=card.parentElement){
   const t=text(card);
   if(!/\bLOCATION\b/i.test(t)||!/\bDESPAWN\b/i.test(t)||t.length>3500)continue;
   const name=String(query.name||"").toLowerCase();
   if(name&&!t.toLowerCase().includes(name))continue;
   const cp=String(query.cp||"").trim();
   if(cp){
    const measured=nextLabelValue(card,"CP")||(t.match(/\bCP\s*:?\s*(\d{1,5})\b/i)||[])[1]||"";
    if(!measured||Number((measured.match(/\d{1,5}/)||[])[0])!==Number(cp))continue;
   }
   const m=coordinate(t);
   if(m)return JSON.stringify({ok:true,coords:m,status:"Coordenadas obtidas"});
   // Matching card reached, avoid reading another Pokémon's coords.
   break;
  }
 }
 return JSON.stringify({ok:false,status:"O site ainda não exibiu coordenadas"});
}

// PL-04: resolve the actual Coords form after React hydration. Avoid picking
// unrelated IV/CP fields from the search form by using a small shared group.
function locationFields(){
 const inputs=elements('input:not([type=hidden]):not([type=checkbox]):not([type=radio])').filter(vis);
 const words=e=>{
  let parts=["placeholder","aria-label","name","id"].map(k=>e.getAttribute(k)||"");
  if(e.labels)for(const label of Array.from(e.labels).slice(0,3))parts.push(text(label).slice(0,90));
  let node=e;
  for(let depth=0;node&&depth<3;depth++,node=node.parentElement){
   const prev=node.previousElementSibling;
   if(prev&&vis(prev)&&text(prev).length<=85)parts.push(text(prev));
   if(node.tagName==="LABEL"&&text(node).length<=100)parts.push(text(node));
  }
  return parts.join(" ").toLowerCase();
 };
 const name=e=>words(e);
 const radiusPattern=/\b(?:radius|raio|distance|dist[aâ]ncia)\b/i;
 const coordsPattern=/\b(?:coords?|coordinates?|coordenadas?|latitude|longitude|lat[\s,\/+-]*lng|lat[\s,\/+-]*lon)\b/i;
 let radius=inputs.find(e=>radiusPattern.test(name(e)))||null;
 let coords=inputs.find(e=>e!==radius&&coordsPattern.test(name(e)))||null;
 if((!radius||!coords)&&inputs.length){
  const roots=[];
  for(const e of inputs){
   for(let p=e.parentElement,depth=0;p&&depth<5;p=p.parentElement,depth++){
    if(!p.querySelectorAll)continue;
    const near=Array.from(p.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio])')).filter(vis);
    if(near.length!==2||!near.includes(e))continue;
    const title=text(p).slice(0,140);
    const coordsEvidence=near.some(v=>coordsPattern.test(name(v)))||
      /\b(?:coords?|coordinates?|coordenadas?)\b/i.test(title);
    const radiusEvidence=near.some(v=>radiusPattern.test(name(v)))||
      /\b(?:radius|raio|distance|dist[aâ]ncia)\b/i.test(title);
    // Never mistake a nearby IV/CP field for the radius of a location search.
    if(coordsEvidence&&radiusEvidence)roots.push({near,depth});
   }
  }
  roots.sort((a,b)=>a.depth-b.depth);
  if(roots.length){
   const pair=roots[0].near;
   if(radius&&!pair.includes(radius))return {coords:null,radius:null};
   if(coords&&!pair.includes(coords))return {coords:null,radius:null};
   if(radius&&!coords)coords=pair.find(e=>e!==radius)||null;
   if(coords&&!radius)radius=pair.find(e=>e!==coords)||null;
  }
 }
 // A radio or select named "Radius" is not an editable numeric field.
 // Fail closed if React hasn't exposed a unique text/number control.
 if(radius&&coords&&radius===coords)return {coords:null,radius:null};
 return {coords,radius};
}
function locationModeControl(label){
 const re=new RegExp("^\\s*"+label+"\\s*$","i");
 const candidates=elements('button,[role=button],[role=tab],[role=radio],input[type=radio],label');
 for(const e of candidates){
  if(!vis(e))continue;
  const t=text(e)||e.getAttribute("aria-label")||"";
  if(!re.test(t))continue;
  if(e.tagName==="LABEL"&&e.control)return e.control;
  return e;
 }
 return null;
}
function coordsModeSelected(){
 const coordButton=locationModeControl("Coords"),areaButton=locationModeControl("Area");
 if(!coordButton&&!areaButton)return null;
 const active=e=>e&&(e.checked===true||
  e.getAttribute("aria-checked")==="true"||e.getAttribute("aria-pressed")==="true"||
  e.getAttribute("aria-selected")==="true"||
  ["true","on","active","checked"].includes(e.getAttribute("data-state")||"")||
  /(?:^|\s)(?:active|selected|bg-red(?:-\d+)?|bg-rose(?:-\d+)?|bg-primary(?:-\d+)?)(?:\s|$)/i.test(String(e.className||"")));
 if(active(coordButton)&&!active(areaButton))return true;
 if(active(areaButton)&&!active(coordButton))return false;
 // Actual mobile Coords form may have no readable state attribute. Confirm
 // its visible site-specific hint and both editable inputs after switching.
 const fields=locationFields();
 const visibleText=String(document.body&&document.body.innerText||"");
 if(coordButton&&fields.coords&&fields.radius&&
    /paste coordinates\s*\(\s*lat\s*[,;]\s*lng\s*\)\s*and\s*a\s*radius/i.test(visibleText))
   return true;
 return null;
}
function locationValue(field){return field?String(field.value||"").trim():"";}
 function sameLocationCoordinates(actual,requested){
  const parse=s=>{
   const found=String(s||"").trim().match(/^([-+]?\d+(?:\.\d+)?)\s*[,;]\s*([-+]?\d+(?:\.\d+)?)$/);
   if(!found)return null;
   const values=[Number(found[1]),Number(found[2])];
   return values.every(Number.isFinite)&&Math.abs(values[0])<=90&&Math.abs(values[1])<=180?values:null;
  };
  const a=parse(actual),b=parse(requested);
  return !!a&&!!b&&Math.abs(a[0]-b[0])<0.0000001&&Math.abs(a[1]-b[1])<0.0000001;
 }
function configureLocation(req){
 const use=!!req.enabled;
 const fieldsBefore=locationFields();
 if(!use){
  // PL-04: Site defaults to Coords on some mobile layouts even when the
  // application never enabled location. An empty Coords form is still
  // an unrestricted search: do not require the unrelated Area tab.
  // However, never silently accept stale coordinate or radius values.
  // A prefilled radius is an INERT site default without a coordinate.
  // Clearing it on every public search can alter an unrelated field and
  // cause a false "location not applied" block.
  const previousCoords=locationValue(fieldsBefore.coords);
  // A React re-render may replace the radius input after the coordinates edit.
  // Only carry a boolean across cycles: never retain personal coordinates in DOM flags.
  const root=document.body;
  if(previousCoords){
   if(fieldsBefore.coords.disabled)
    return JSON.stringify({ok:false,pending:true,stage:"waiting-coords",reason:"Campo Coords indisponível"});
   if(root)root.__psClearLocationRadius=true;
   if(!valueInput(fieldsBefore.coords,""))
    return JSON.stringify({ok:false,reason:"Campo de coordenadas não editável"});
   return JSON.stringify({ok:false,pending:true,stage:"clearing-coords",
    reason:"Aguardando remover coordenadas antigas"});
  }
  if(root&&root.__psClearLocationRadius){
   if(fieldsBefore.radius&&locationValue(fieldsBefore.radius)){
    if(fieldsBefore.radius.disabled)
     return JSON.stringify({ok:false,pending:true,stage:"waiting-radius",reason:"Campo Raio indisponível"});
    if(!valueInput(fieldsBefore.radius,""))
     return JSON.stringify({ok:false,reason:"Campo de raio não editável"});
    return JSON.stringify({ok:false,pending:true,stage:"clearing-radius",
     reason:"Aguardando remover o raio anterior"});
   }
   root.__psClearLocationRadius=false;
  }
  return JSON.stringify({ok:true,pending:false,stage:"location-off"});
 }
 if(typeof req.coords!=="string"||!/^[-+]?\d+(?:\.\d+)?,[-+]?\d+(?:\.\d+)?$/.test(req.coords)||
    !Number.isInteger(req.radius)||req.radius<0||req.radius>1000||
    Math.abs(Number(req.coords.split(",")[0]))>90||Math.abs(Number(req.coords.split(",")[1]))>180)
    return JSON.stringify({ok:false,reason:"Parâmetros de localização inválidos"});
 const coords=locationModeControl("Coords");
 if(!coords)return JSON.stringify({ok:false,pending:true,reason:"Aguardando opção Coords"});
 if(coordsModeSelected()!==true){
  if(!coords.disabled)coords.click();
  return JSON.stringify({ok:false,pending:true,reason:"Aguardando confirmação do modo Coords"});
 }
 const fields=locationFields();
 if(!fields.coords||!fields.radius)return JSON.stringify({ok:false,pending:true,reason:"Aguardando campos de coordenadas/raio"});
  if(fields.coords.disabled||fields.radius.disabled)
   return JSON.stringify({ok:false,pending:true,stage:"waiting-location-fields",
    reason:"Aguardando liberação dos campos do site"});
  // Set ONE React-controlled field per evaluateJavascript round trip. The next
  // call re-reads actual DOM inputs before trying the second field or searching.
  if(!sameLocationCoordinates(locationValue(fields.coords),req.coords)){
   if(!valueInput(fields.coords,req.coords))
    return JSON.stringify({ok:false,reason:"Campo de coordenadas não editável"});
   return JSON.stringify({ok:false,pending:true,stage:"setting-coords",
    reason:"Aguardando confirmação das coordenadas"});
  }
  if(locationValue(fields.radius)!==String(req.radius)){
   if(!valueInput(fields.radius,String(req.radius)))
    return JSON.stringify({ok:false,reason:"Campo de raio não editável"});
   return JSON.stringify({ok:false,pending:true,stage:"setting-radius",
    reason:"Aguardando confirmação do raio"});
  }
  return JSON.stringify({ok:true,pending:false,stage:"location-on"});
}
function verifyLocation(req){
 const fields=locationFields(),active=coordsModeSelected();
 if(!req.enabled){
  // Without coordinates the radius is only a dormant form default.
  // Never block a guest/non-Shiny search for an unrelated default radius.
  const blank=!locationValue(fields.coords);
  return JSON.stringify({ok:blank,reason:blank?"":"Coordenadas antigas permanecem no site"});
 }
 const coordInput=locationValue(fields.coords),radiusInput=locationValue(fields.radius);
 const coordinatePattern=/^[-+]?\d+(?:\.\d+)?\s*[,;]\s*[-+]?\d+(?:\.\d+)?$/;
 const requested=String(req.coords||"");
 const validText=coordinatePattern.test(coordInput)&&coordinatePattern.test(requested);
 const actual=coordInput.split(/[,;]/).map(Number),expected=requested.split(/[,;]/).map(Number);
 const withinRange=p=>p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180;
 const validRadius=radiusInput!==""&&/^\d+$/.test(radiusInput)&&Number.isInteger(req.radius)&&req.radius>=0&&req.radius<=1000;
 const same=validText&&withinRange(actual)&&withinRange(expected)&&validRadius&&
   Math.abs(expected[0]-actual[0])<0.0000001&&Math.abs(expected[1]-actual[1])<0.0000001&&
   Number(radiusInput)===req.radius;
 return JSON.stringify({ok:!!same&&active===true,reason:active===true?
   "Campos do filtro de localização não confirmados":"Modo Coords não confirmado no site"});
}

if(action.startsWith("configureLocation:")){
 try{return configureLocation(JSON.parse(action.slice("configureLocation:".length)));}
 catch(_){return JSON.stringify({ok:false,reason:"Filtro de localização inválido"});}
}
if(action.startsWith("verifyLocation:")){
 try{return verifyLocation(JSON.parse(action.slice("verifyLocation:".length)));}
 catch(_){return JSON.stringify({ok:false,reason:"Verificação de localização inválida"});}
}
// Shiny activation is independent of Pokémon Search and its cooldown.
if(action==="setShiny")return JSON.stringify(setShiny(shinyOnly));
if(action==="verifyFilters")return JSON.stringify(check());
if(action==="verifyShiny"){
 const actual=readShiny();
 const pending=elements('[role="dialog"],[aria-modal="true"],form').filter(vis).some(e=>/friend code|trainer code|12 digits|vincula|link (?:a |your )?(?:pok[eé]mon go |trainer )?account|connect (?:your )?account/i.test(text(e)));
 return JSON.stringify({ok:shinyOnly?(actual===true&&!pending):(actual!==true),siteShiny:actual,pending:shinyOnly&&pending,
   reason:shinyOnly?(pending?"Vinculação pendente":"Shiny não confirmado"):"Shiny está ativo na página"});
}
if(action==="session"){
 const sw=shinyControl();
 const clickable=elements("a,button,[role=button]").filter(vis);
 const login=clickable.some(e=>/^(?:(?:log\s*in|sign\s*in|login|entrar|fazer login)(?:\s+(?:with|com)\s+(?:google|discord))?)$/i.test(text(e)));
 const loggedIn=clickable.some(e=>/^(?:log\s*out|sign\s*out|sair|desconectar)$/i.test(text(e)));
 const body=String(document.body&&document.body.innerText||"");
 const badgeText=/(?:^|\n)\s*Shiny for your account\b/i;
 const accountBadge=badgeText.test(body)||
   elements("p,small,span,div,label").some(e=>
     vis(e)&&e.children.length<=2&&badgeText.test(text(e))&&text(e).length<140);
 // On the official profile page, the section pair is only present for an
 // authenticated account. A linked Pokemon trainer is NOT required.
 const profileProof=location.pathname==="/profile"&&
   /\bLinked accounts\b/i.test(body)&&/\bPokemon GO accounts\b/i.test(body);
 // Do not infer "authenticated" merely from an absent login button:
 // hidden mobile menus and partially hydrated React can be ambiguous.
 const auth=loggedIn||profileProof||accountBadge?"autenticada":
   login?"login necessário":"não confirmado";
 // The official account-specific Shiny badge is live linkage evidence.
 // Report only a boolean; never expose trainer codes or account details to Java.
 return JSON.stringify({ok:true,auth,trainerLinked:!!accountBadge,shinyAvailable:!!sw,site:location.hostname});
}
if(action==="prepareSearch"){
 const target=["iv","raw","percent"].includes(mode)?"Stats":"PvP";
 return JSON.stringify({ok:tab(target),stage:"prepare"});
}
if(action==="configureSearch"){
 const ready=prepareCoreFilters();
 if(!ready.ok)
  return JSON.stringify({ok:true,configured:false,pending:ready.pending,reason:ready.reason,stage:"wait-form"});
 let configured=false;
 if(mode==="iv")configured=applyIv();
 else if(mode==="raw")configured=applyRaw();
 else if(mode==="percent")configured=applyPercent();
 else configured=applyLeague();
 const other=configured?extras("apply"):{ok:false,pending:true,
  reason:transientPending?"Aguardando confirmar os números digitados no site":mode==="raw"?"Raw IV: não foi possível identificar ou preencher A/D/S":mode==="percent"?"IV%: mínimo/máximo indisponíveis":"Filtro principal indisponível"};
 configured=configured&&other.ok;
 const existing=readShiny();
 if(existing!==null&&existing!==shinyOnly){
  const sw=shinyControl();if(sw)sw.click();
 }
 return JSON.stringify({ok:true,configured,pending:other.pending||transientPending,reason:other.reason,shinyKnown:existing!==null,stage:"configure"});
}
if(action==="submitSearch"){
 const b=oneButton("Search");
 if(!b)return JSON.stringify({ok:false,reason:"Botão Search não localizado"});
 if(b.disabled||b.getAttribute("aria-disabled")==="true")
  return JSON.stringify({ok:false,reason:"Botão Search indisponível"});
 b.click();
 return JSON.stringify({ok:true,stage:"submitted"});
}
if(action==="search"){
 const target=["iv","raw","percent"].includes(mode)?"Stats":"PvP";
 const ok=tab(target);
 setTimeout(()=>{
  if(mode==="iv")applyIv();
  else if(mode==="raw")applyRaw();
  else if(mode==="percent")applyPercent();
  else applyLeague();
  extras("apply");
  const sw=shinyControl(),current=readShiny();
  if(sw&&current!==null&&current!==shinyOnly)sw.click();
  setTimeout(()=>click("Search"),750);
 },600);
 return JSON.stringify({ok,mode,attempted:true});
}
return JSON.stringify({ok:false});
})()