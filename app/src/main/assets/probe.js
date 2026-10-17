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
function optionElements(){return elements('[role=option],[role=menuitemradio],[data-slot="select-item"],[data-radix-collection-item],option').filter(vis);}
function findOption(want){return optionElements().find(o=>text(o).toLowerCase()===String(want).toLowerCase())||null;}
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
 let opt=findOption(want);
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
 tab("Stats");tab("% IV");
 const fields=percentageIVInputs();
 if(fields.length!==2)return false;
 return fields.every(e=>valueInput(e,"100"));
}
function configuredRank(){return mode==="ul"?filters.ulRank:filters.glRank;}
function rawValues(){
 const values=[filters.attack,filters.defense,filters.stamina];
 const inputs=rawIVInputs();
 if(inputs.length===3)return {inputs,values};
 if(inputs.length!==6)return null;
 // Raw IV forms may expose a min/max field for each stat.
 // Use nearby stat labels rather than guessing the 6-field DOM order.
 const mapped=inputs.map(input=>{
  for(let node=input.parentElement,depth=0;node&&depth<3;node=node.parentElement,depth++){
   const own=clean(node.innerText||"").toLowerCase();
   const names=[/\b(?:attack|atk|ataque)\b/,/\b(?:defense|defence|def|defesa)\b/,/\b(?:stamina|sta|hp|vida)\b/];
   const matching=names.map((re,i)=>re.test(own)?i:-1).filter(i=>i>=0);
   if(matching.length===1)return matching[0];
  }
  return -1;
 });
 if(mapped.every(i=>i>=0)&&[0,1,2].every(i=>mapped.filter(x=>x===i).length===2))
  return {inputs,values:mapped.map(i=>values[i])};
 // Equal IVs are unambiguous even without labels; unequal ones must not be misapplied.
 if(values.every(v=>v===values[0]))return {inputs,values:inputs.map(()=>values[0])};
 return null;
}
function rawIsHundo(){
 return filters.attack===15&&filters.defense===15&&filters.stamina===15;
}
function applyRaw(){
 tab("Stats");tab("Raw IV");
 const group=rawValues();
 if(group&&group.inputs.every((input,i)=>valueInput(input,group.values[i])))return true;
 // A 15/15/15 selection is IV100 even on the site's % IV form.
 // Fallback only for this exact combination, never for mixed IV values.
 return rawIsHundo()&&set100Percent();
}
function verifyRaw(){
 const group=rawValues();
 if(group&&group.inputs.every((input,i)=>Number(input.value)===group.values[i]))return true;
 if(!rawIsHundo())return false;
 const percent=percentageIVInputs();
 return percent.length===2&&percent.every(input=>Number(input.value)===100);
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
 tab("Stats");tab("% IV");
 const inputs=percentageIVInputs();
 return inputs.length===2&&valueInput(inputs[0],filters.percentMin)&&valueInput(inputs[1],filters.percentMax);
}
function verifyPercent(){
 if(!validPercentRange())return false;
 const inputs=percentageIVInputs();
 return inputs.length===2&&Number(inputs[0].value)===filters.percentMin&&Number(inputs[1].value)===filters.percentMax;
}
function applyIv(){
 // Preserve the original Hundo compatibility (% IV 100/100 or exact Raw IV).
 if(set100Percent())return true;
 tab("Stats");tab("Raw IV");
 const raw=rawIVInputs();
 return (raw.length===3||raw.length===6)&&raw.every(x=>valueInput(x,"15"));
}
function applyLeague(){
 const rank=inputNear("Top ranking");
 return !!rank&&valueInput(rank,configuredRank())&&
  choice("League",mode==="ul"?"Ultra League":"Great League")&&
  choice("Include previous evolutions",filters.includePreviousEvolutions===false?"No":"Yes");
}
function checkCore(){
 const currentShiny=readShiny();
 if(currentShiny!==shinyOnly && !(shinyOnly===false&&currentShiny===null))
  return {ok:false,reason:"Shiny não confirmado",shiny:currentShiny};
 if(mode==="iv"){
  const ins=rawIVInputs();
  if((ins.length===3||ins.length===6)&&ins.every(x=>x.value==="15"))return {ok:true};
  const pc=percentageIVInputs();
  if(pc.length===2&&pc.every(x=>x.value==="100"))return {ok:true};
  return {ok:false,reason:"IV100: Raw IV 15/15/15 ou % IV 100/100 não confirmados"};
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

const EXTRA_LABELS={sortBy:"Sort by",pokemon:"Pokemon",form:"Form",size:"Size",gender:"Gender",weather:"Weather"};
function extraControl(label){
 const e=field(label);if(e)return e;
 const rx=label==="Pokemon"?/pok[eé]mon/i:new RegExp(label,"i");
 return elements('input:not([type=hidden]),select,[role=combobox],button[aria-haspopup]')
  .find(x=>vis(x)&&rx.test((x.getAttribute("placeholder")||"")+" "+(x.getAttribute("aria-label")||"")))||null;
}
function siteOptions(){
 return [...new Set(optionElements().map(text).map(clean).filter(x=>x&&x.length<100))].slice(0,80);
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
 if(!e)return !want;
 const actual=extraValue(key);
 if(!want){
  if(isNeutral(actual))return true;
  if(e.matches("input"))return valueInput(e,"");
  // Reset prior active filter when user switches back to Any.
  const opt=optionElements().find(o=>isNeutral(text(o)));
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
 const opt=findOption(want);
 if(opt){opt.click();return true;}
 if(e.getAttribute("aria-expanded")!=="true")e.click();
 transientPending=true;
 return false;
}
function extraMatches(key,want){
 const v=extraValue(key);
 if(v===null)return !want;
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
 return JSON.stringify({ok:!!label,key,options:label?siteOptions():[]});
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
function extras(action){
 transientPending=false;
 const failed=[];
 for(const key of Object.keys(EXTRA_LABELS)){
  if(key==="sortBy"&&!filters.sortBy)continue;
  const want=String(filters[key]||"").trim();
  const ok=action==="apply"?extraSelect(key,want):extraMatches(key,want);
  if(!ok)failed.push(key);
  if(transientPending)break; // one portal dropdown at a time
 }
 if(!transientPending)for(const key of extraNumberKeys()){
  const want=String(filters[key]||"").trim(),input=extraNumberField(key);
  if(want&&!input){failed.push(key);continue;}
  if(!input)continue;
  const ok=action==="apply"?valueInput(input,want):String(input.value||"").trim()===want;
  if(!ok)failed.push(key);
 }
 return {ok:failed.length===0,pending:action==="apply"&&transientPending,reason:"Filtros adicionais: "+failed.join(", ")};
}
function check(){const base=checkCore();return base.ok?extras("verify"):base;}
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
 const percent=ivMatch?ivMatch[1]:(raw?String(Math.round(raw.split("/").map(Number).reduce((a,b)=>a+b,0)/45*100)):"");
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
 const isShiny=/✨/.test(title);
 return {
  sourceIndex,name:title.replace(/✨/g,"").trim(),image:image?image.src:"",
  number:(meta.match(/#\d{1,4}/)||[])[0]||"",
  gender:/\bFemale\b|♀/i.test(meta)?"♀":/\bMale\b|♂/i.test(meta)?"♂":"",
  size:size,moves:move,location:clean(loc),despawn:(desp.match(/\d{1,2}:\d{2}/)||[])[0]||"",
  cp:val("CP",/(\d{1,5})/),level:val("(?:LVL|Level)",/([\d.]+)/),
  iv:raw,ivPercent:percent,rank:rankMatch?rankMatch[1]:"",
  shiny:isShiny,form:(title.match(/\(([^)]+)\)/)||[])[1]||""
 };
}
function collect(){
 const found=cardRoots().map(item=>parseCard(item.node,item.sourceIndex));
 const siteCriteria=check().ok;
 const rankLimit=configuredRank();
 const isLeague=mode==="gl"||mode==="ul";
 const matches=x=>{
  if(mode==="iv")return x.iv==="15/15/15"||x.ivPercent==="100";
  if(mode==="raw"){
   const target=[filters.attack,filters.defense,filters.stamina].join("/");
   return !x.iv||x.iv===target;
  }
  if(mode==="percent"){
   const pct=Number(x.ivPercent);
   return x.ivPercent===""||(Number.isFinite(pct)&&pct>=filters.percentMin&&pct<=filters.percentMax);
  }
  if(isLeague)return !x.rank||(Number(x.rank)>=1&&Number(x.rank)<=rankLimit);
  return false;
 };
 const valid=siteCriteria?found.filter(matches).map(x=>{
  if(isLeague&&rankLimit===1&&!x.rank)return {...x,rank:"1",rankSource:"verified-site-filter"};
  if(isLeague&&!x.rank)return {...x,rankLimit,rankSource:"verified-site-filter"};
  return x;
 }):[];
 const uncertain=!siteCriteria||found.some(x=>!matches(x));
 const t=text(document.body);
 const loading=!!document.querySelector('[aria-busy="true"],[role="progressbar"]')||
   !!oneButton("Searching")||!!oneButton("Loading");
 const explicitEmpty=/\b(?:no results found|no results|nenhum resultado|sem resultados)\b/i.test(t);
 const siteCount=Number((t.match(/\bShowing\s+(\d+)\s+spawns?\b/i)||[])[1]||0);
 const parseFailure=siteCount>0&&found.length===0;
 return JSON.stringify({ok:true,cards:valid,found:found.length,siteCount,parseFailure,uncertain,loading,explicitEmpty,criteriaConfirmed:siteCriteria,leagueConfirmed:isLeague&&siteCriteria,siteShiny:readShiny()});
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

function locationFields(){
 const inputs=elements('input:not([type=hidden]):not([type=checkbox]):not([type=radio])').filter(vis);
 const label=e=>(e.getAttribute("placeholder")||"")+" "+(e.getAttribute("aria-label")||"");
 const radius=inputs.find(e=>/radius|raio/i.test(label(e)));
 let coords=inputs.find(e=>e!==radius&&/coords|coordinates|latitude|longitude|lat[ ,/]+lng|40\.637/i.test(label(e)));
 if(!coords&&radius){
  for(let p=radius.parentElement,depth=0;p&&depth<5;p=p.parentElement,depth++){
   const nearby=Array.from(p.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio])')).filter(vis);
   if(nearby.length===2&&nearby.includes(radius)){coords=nearby.find(e=>e!==radius);break;}
   if(nearby.length>6)break;
  }
 }
 return {coords,radius};
}
function coordsModeSelected(){
 const coordButton=oneButton("Coords"),areaButton=oneButton("Area");
 if(!coordButton&&!areaButton)return null;
 const active=e=>e&&(e.getAttribute("aria-pressed")==="true"||
  e.getAttribute("aria-selected")==="true"||
  ["true","on","active","checked"].includes(e.getAttribute("data-state")||"")||
  /(?:^|\s)(?:active|selected|bg-red|bg-rose|bg-primary)(?:\s|$)/.test(e.className||""));
 if(active(coordButton))return true;
 if(active(areaButton))return false;
 // Field presence alone is not proof that the site selected Coords.
 return null;
}
function locationValue(field){return field?String(field.value||"").trim():"";}
function configureLocation(req){
 const use=!!req.enabled;
 const fieldsBefore=locationFields();
 if(!use){
  if(fieldsBefore.coords)valueInput(fieldsBefore.coords,"");
  if(fieldsBefore.radius)valueInput(fieldsBefore.radius,"");
  const area=oneButton("Area");
  if(area&&coordsModeSelected()!==false)area.click();
  return JSON.stringify({ok:true,stage:"location-off"});
 }
 if(typeof req.coords!=="string"||!/^[-+]?\d+(?:\.\d+)?,[-+]?\d+(?:\.\d+)?$/.test(req.coords)||
    !Number.isInteger(req.radius)||req.radius<0||req.radius>1000||
    Math.abs(Number(req.coords.split(",")[0]))>90||Math.abs(Number(req.coords.split(",")[1]))>180)
    return JSON.stringify({ok:false,reason:"Parâmetros de localização inválidos"});
 const coords=oneButton("Coords");
 if(!coords)return JSON.stringify({ok:false,reason:"Opção Coords não localizada"});
 if(coordsModeSelected()!==true)coords.click();
 const fields=locationFields();
 if(!fields.coords||!fields.radius)return JSON.stringify({ok:false,reason:"Campos de coordenadas/raio não encontrados"});
 return JSON.stringify({ok:valueInput(fields.coords,req.coords)&&valueInput(fields.radius,String(req.radius)),stage:"location-on"});
}
function verifyLocation(req){
 const fields=locationFields(),active=coordsModeSelected();
 if(!req.enabled){
  const blank=(!fields.coords||!locationValue(fields.coords))&&(!fields.radius||!locationValue(fields.radius));
  return JSON.stringify({ok:active!==true&&blank,reason:"Coordenadas do site ainda ativas"});
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
 const login=elements("a,button,[role=button]").some(e=>vis(e)&&/^(?:Log ?in|Sign ?in|Entrar|Fazer login)$/i.test(text(e)));
 const loggedIn=elements("a,button,[role=button]").some(e=>vis(e)&&/^(?:Log ?out|Sign ?out|Sair|Desconectar)$/i.test(text(e)));
 // Mobile menus may hide Logout. The site's account-specific Shiny notice
 // confirms a session without exposing the account identifier to Android.
 const accountBadge=elements("p,small,span,div,label").some(e=>
   vis(e)&&e.children.length<=2&&/^Shiny for your account\b/i.test(text(e))&&text(e).length<140)
   ||/(?:^|\n)\s*Shiny for your account\b/i.test(String(document.body&&document.body.innerText||""));
 return JSON.stringify({ok:true,auth:loggedIn||accountBadge?"autenticada":login?"login necessário":"não confirmado",
   shinyAvailable:!!sw,site:location.hostname});
}
if(action==="prepareSearch"){
 const target=["iv","raw","percent"].includes(mode)?"Stats":"PvP";
 return JSON.stringify({ok:tab(target),stage:"prepare"});
}
if(action==="configureSearch"){
 let configured=false;
 if(mode==="iv")configured=applyIv();
 else if(mode==="raw")configured=applyRaw();
 else if(mode==="percent")configured=applyPercent();
 else configured=applyLeague();
 const other=configured?extras("apply"):{ok:false,pending:transientPending,reason:"Filtro principal indisponível"};
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