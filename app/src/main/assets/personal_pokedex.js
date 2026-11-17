/* LT377 · Minha Pokédex: visualização local, sem conta remota ou comércio. */
(function(){
"use strict";
const bridge=window.PersonalInventory;
const filterDefs=[
  ["all","Todos"],["shiny","✨ Brilhante"],["hundo","100% IV"],
  ["background","🖼 Fundos"],["costume","🎩 Trajes"],["shadow","Sombroso"],
  ["purified","Purificado"],["lucky","Sortudo"],["favorite","★ Favoritos"],
  ["tagged","Com tags"],["traded","Recebidos por troca"]
];
const presets=[["default","Padrão"],["aurora","Aurora"],["sunset","Pôr do sol"],
               ["ocean","Oceano"],["night","Noite"]];
const state={slot:1,all:[],filtered:[],tags:new Map(),names:new Map(),tab:"pokemon",eggs:[],capacity:0,tagId:null,meta:{moves:new Map(),backgrounds:new Map(),costumes:new Map()},
             query:"",filter:"all",activeFilters:new Set(),sort:"cp",limit:96,selected:null,
             selecting:false,selectedIds:new Set(),bgFiles:[],bgCards:[],bgAssets:new Map(),
             bgCached:new Set(),backgroundTarget:null,bgQuery:"",
             spriteIndex:null,spriteCached:new Set(),spriteMatchCache:new Map(),spriteStats:{},
             editingPokemon:null,editingTagId:null,suppressCardClick:false};
const el=id=>document.getElementById(id);
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,s=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[s]));
const number=v=>new Intl.NumberFormat("pt-BR").format(Number(v)||0);
const decimal=(v,d)=>Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
const speciesName=p=>state.names.get(Number(p.species))||("#"+p.species);
const ivValue=p=>(p.attack||0)+(p.defense||0)+(p.hpIv||0);
const isHundo=p=>ivValue(p)===45;
const hasBackground=p=>Number(p.backgroundId)>0;
// Alignment values verified against the original PGSStats export.
const isShadow=p=>Number(p.alignment)===1;
const isPurified=p=>Number(p.alignment)===2;
const nameOf=p=>String(p.nickname||"").trim()||speciesName(p);
const cleanForm=p=>{
 const row=state.spriteIndex?.forms.get(Number(p.form));
 const raw=String(row?.[1]||p.formName||"").trim();
 return ["","UNSET","NORMAL","DEFAULT"].includes(raw.toUpperCase())?"":raw;
};
function formVariant(p){
 const raw=cleanForm(p).replace(/[^a-z0-9]/gi,"").toUpperCase();
 const dexName=speciesName(p).replace(/[^a-z0-9]/gi,"").toUpperCase();
 const suffix=raw.startsWith(dexName)?raw.slice(dexName.length):raw;
 return ["","NORMAL","UNSET","DEFAULT"].includes(suffix)?"":suffix;
}
const backgroundMeta=p=>state.meta.backgrounds.get(Number(p.backgroundId));
const costumeMeta=p=>state.meta.costumes.get(Number(p.costume));
const isSpecialBg=p=>(backgroundMeta(p)?.type||"")==="SPECIAL_BACKGROUND";
const isLocationBg=p=>hasBackground(p)&&backgroundMeta(p)?.type==="LOCATION_CARD";
const isUnknownBg=p=>hasBackground(p)&&!backgroundMeta(p);
const isMegaRegistered=p=>!!p.hasMegaEvolved||Number(p.megaFormsCount)>0||Number(p.megaLevel)>0;
const speciesFlags=p=>state.spriteIndex?.idStatus(p.species)||{};
const isLegendary=p=>!!speciesFlags(p).legendary;
const isMythical=p=>!!speciesFlags(p).mythical;
const canEvolve=p=>!!speciesFlags(p).canEvolve&&!(costumeMeta(p)?.noEvolve);
const walkedWithBuddy=p=>Number(p.buddyKm)>0;
const hasEventOrigin=p=>Array.isArray(p.events)&&p.events.length>0;
const isVisualEvent=p=>Number(p.costume)>0||!!state.spriteIndex?.isCostumeForm(p.form);
function availableMetaName(type,id){
 const m=state.meta[type].get(Number(id));
 return m?.name||"Código "+id;
}
function loadMeta(){
 try{
  const data=JSON.parse(bridge.getMetaCatalog()||"{}");
  state.meta.moves=new Map((data.moves||[]).map(r=>[r[0],{name:r[1],type:r[2],fast:!!r[3],pvp:r[4],energy:r[5],power:r[6]}]));
  state.meta.backgrounds=new Map((data.backgrounds||[]).map(r=>[r[0],{name:r[1],type:r[2]}]));
  state.meta.costumes=new Map((data.costumes||[]).map(r=>[r[0],{name:r[1],noEvolve:!!r[2]}]));
 }catch(_){}
}
function refreshSpriteCache(fromNative){
 let status=fromNative;
 if(!status)try{status=JSON.parse(bridge.getSpriteStatus()||"{}");}catch(_){status={};}
 try{state.spriteCached=new Set(JSON.parse(bridge.getCachedSpriteKeys()||"[]"));}catch(_){
  state.spriteCached=new Set();
 }
 state.spriteStats=status||{};
 el("sprite-cache-count").textContent=number(state.spriteCached.size);
 el("sprite-status").textContent=number(status?.downloaded||0)+" / "+
  number(status?.total||0)+" imagens baixadas · "+decimal((status?.bytes||0)/1048576,1)+" MiB"+
  (status?.busy?" · "+number(status.done)+"/"+number(status.queued)+" processadas":"")+
  (status?.error?" · "+status.error:"");
 for(const id of ["sprites-download-collection","sprites-download-all","sprites-download-legacy","sprites-clear"]){
  el(id).disabled=!!status?.busy;
 }
 el("sprites-cancel").disabled=!status?.busy;
 renderSpriteCoverage();
 if(state.selected)renderSpriteStatus(state.selected);
 // Re-render a displayed page only when a batch is complete.
 if(!status?.busy&&state.all.length)render();
}
window.pokeSpriteProgress=status=>refreshSpriteCache(status);
function collectionKeys(){
 const found=new Set(),missing=[];
 for(const p of state.all){
  const hit=visualMatch(p);
  if(hit.key)found.add(hit.key);
  else missing.push(p);
 }
 return {keys:[...found],missing};
}
function renderSpriteCoverage(){
 if(!state.spriteIndex){
  el("sprite-collection-coverage").textContent="Banco de sprites indisponível nesta instalação.";
  el("sprite-catalog-preview").textContent="";
  return;
 }
 const {keys,missing}=collectionKeys();
 const local=keys.filter(key=>state.spriteCached.has(key)).length;
 el("sprite-collection-coverage").textContent=
  "Inventário "+state.slot+": "+number(keys.length)+" imagens distintas identificadas, "+
  number(local)+" já baixadas, "+number(missing.length)+
  " exemplares sem correspondência exata. Sem substituição automática por outra forma.";
 el("sprite-catalog-preview").innerHTML=
  '<span class="sprite-badge">'+number(state.spriteIndex.primary.size)+
   ' sprites GO (formas/trajes/Shiny)</span>'+
  '<span class="sprite-badge">'+number(state.spriteIndex.legacy.size)+
   ' sprites legadas</span>'+
  '<span class="sprite-badge">'+number(state.spriteIndex.forms.size)+
   ' formas catalogadas</span>'+
  '<span class="sprite-badge">'+number(state.spriteIndex.costumes.size)+
   ' códigos de trajes</span>';
}
function renderSpriteStatus(p){
 const item=visualMatch(p);
 const stored=!!item.key&&state.spriteCached.has(item.key);
 const usingOld=!!safeSprite(p)&&!stored;
 el("sprite-availability").textContent=stored?
  "Variante exata baixada e disponível localmente ("+item.key+").":
  item.key?"Arquivo identificado ("+item.key+"), ainda não baixado. "+
    (usingOld?"Imagem já empacotada usada como alternativa verificada.":"Sem outra arte exata disponível."):
    "Nenhum arquivo exato confirmado no catálogo para esta espécie/forma/traje/Shiny. "+
    "O PokeSearch não exibirá uma variante diferente.";
 el("download-this-sprite").disabled=!item.key||stored||!!state.spriteStats.busy;
 el("download-this-sprite").textContent=stored?"Sprite já disponível":"Baixar sprite desta forma";
}
function openSpritePanel(){
 el("sprite-panel").hidden=false;
 refreshSpriteCache();
}
function requestSprites(mode,selection){
 if(!state.spriteIndex)return notice("Catálogo visual não disponível.");
 if(state.spriteStats.busy)return notice("Um download já está em andamento.");
 const keys=mode==="collection"?selection||collectionKeys().keys:[];
 if(mode==="collection"&&!keys.length)return notice("Nenhuma sprite exata identificada para baixar.");
 bridge.downloadSprites(mode,JSON.stringify(keys));
 refreshSpriteCache();
}
function loadSpriteIndex(){
 try{
  const data=JSON.parse(bridge.getSpriteManifest()||"{}");
  state.spriteIndex=window.PokeSearchSpriteCatalog?.create(data)||null;
 }catch(_){state.spriteIndex=null;}
 refreshSpriteCache();
}
function visualMatch(p){
 const id=String(p.id);
 if(state.spriteMatchCache.has(id))return state.spriteMatchCache.get(id);
 const found=state.spriteIndex?.classify({
  species:p.species,name:speciesName(p),form:p.form,formName:p.formName,
  costume:p.costume,gender:p.gender,shiny:p.shiny
 })||{key:null,reason:"catalog-unavailable"};
 state.spriteMatchCache.set(id,found);
 return found;
}
function spriteLocalUrl(key){
 if(typeof key!=="string"||!/^[al]:[A-Za-z0-9_.-]+\.png$/.test(key))return "";
 return "https://pokesearch.local/sprite/"+key[0]+"/"+key.slice(2);
}
function safeSprite(p){
 const exact=visualMatch(p);
 if(exact.key&&state.spriteCached.has(exact.key))return spriteLocalUrl(exact.key);
 const lib=window.PokeSearchOfflineSprite,delivery=window.PokeSearchSpriteDelivery;
 // Restore the packaged sprites for independently verified default forms:
 // PGSStats carries numeric IDs but usually has no formName at all.
 if(lib&&typeof lib.resolve==="function"){
  try{
   const form=formVariant(p),costume=costumeMeta(p);
   const defaultById=!!delivery?.auditedDefault({
    species:p.species,name:speciesName(p),form:p.form,shiny:p.shiny,
    costume:p.costume
   },state.spriteIndex,exact);
   const card={number:Number(p.species),name:speciesName(p),
    form,form_id:defaultById?0:p.form,shiny:!!p.shiny,
    gender:p.gender===2?"female":"male"};
   if(p.costume){card.costume_id=p.costume;card.costume=costume?.name||"";}
   const art=lib.resolve(card);
   const uri=typeof art==="string"?art:art?.src;
   if(typeof uri==="string"){
    const valid=uri.startsWith("file:///android_asset/")||
      uri.startsWith("https://raw.githubusercontent.com/PokeAPI/sprites/")||
      uri.startsWith("https://cdn.jsdelivr.net/gh/PokeAPI/sprites@");
    if(valid&&((!p.costume&&!Number(p.form)&&!form)||defaultById||
      (art&&typeof art==="object"&&
       (art.exactCostume||art.officialForm||art.offline||art.providerExact))))
      return uri;
   }
  }catch(_){}
 }
 // If no exact image was packaged, display its VERIFIED online variant
 // directly. Only actual manifest entries can produce remote URLs; do not
 // silently use a different form, Shiny, gender or costume.
 if(exact.key)return delivery?.remoteUrl(exact.key,state.spriteIndex)||"";
 return "";
}
function artHtml(p,css){
  const uri=safeSprite(p),name=escapeHtml(speciesName(p));
  if(!uri)return '<span class="'+css+' no-art" aria-label="Sprite indisponível">◇</span>';
  return '<img class="'+css+'" src="'+escapeHtml(uri)+'" alt="'+name+
    '" loading="lazy" onerror="this.replaceWith(document.createTextNode(\'◇\'))">';
}
function filterPokemon(p,key=state.filter){
  switch(key){
  case "shiny":return !!p.shiny;
  case "hundo":return isHundo(p);
  case "background":return hasBackground(p);
  case "costume":return p.costume>0;
  case "shadow":return isShadow(p);
  case "purified":return isPurified(p);
  case "lucky":return !!p.lucky;
  case "favorite":return !!p.favorite;
  case "tagged":return !!(p.tags&&p.tags.length);
  case "traded":return !!p.traded;
  case "tag":return (p.tags||[]).some(t=>String(t)===state.tagId);
  case "mega":return isMegaRegistered(p);
  case "event":return hasEventOrigin(p);
  case "eventVisual":return isVisualEvent(p);
  case "legendary":return isLegendary(p);
  case "mythical":return isMythical(p);
  case "evolvable":return canEvolve(p);
  case "buddy":return walkedWithBuddy(p);
  case "bgUnknown":return isUnknownBg(p);
  case "bgLocal":return isLocationBg(p);
  case "bgSpecial":return isSpecialBg(p);
  case "dynamax":return Number(p.breadMode)===1;
  case "gigantamax":return Number(p.breadMode)===2;
  case "hatched":return !!p.hatchedFromEgg;
  default:return true;
  }
}
function matchesQuery(p){
  const s=state.query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  if(!s)return true;
  const n=(speciesName(p)+" "+nameOf(p)+" "+cleanForm(p)+" "+p.species)
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  return n.includes(s);
}
function compare(a,b){
  switch(state.sort){
  case "recent":return (b.caughtMs||0)-(a.caughtMs||0);
  case "iv":return ivValue(b)-ivValue(a)||(b.cp||0)-(a.cp||0);
  case "number":return a.species-b.species||(b.cp||0)-(a.cp||0);
  case "name":return speciesName(a).localeCompare(speciesName(b),"pt-BR");
  case "hp":return (b.maxStamina||0)-(a.maxStamina||0);
  case "favorite":return Number(!!b.favorite)-Number(!!a.favorite)||(b.cp||0)-(a.cp||0);
  default:return (b.cp||0)-(a.cp||0);
  }
}
function renderFilters(){
  el("filters").innerHTML=filterDefs.map(([key,label])=>
    '<button class="filter '+((!state.activeFilters.size&&key==="all")||state.activeFilters.has(key)?"active":"")+
    '" data-filter="'+key+'">'+label+'</button>').join("");
}
function renderStats(){
  const all=state.all;
  el("m-total").textContent=number(all.length);
  el("m-shiny").textContent=number(all.filter(p=>p.shiny).length);
  el("m-hundo").textContent=number(all.filter(isHundo).length);
  el("m-bg").textContent=number(all.filter(hasBackground).length);
}
function renderTabs(){
 el("app").classList.toggle("tab-tags",state.tab==="tags");
 el("app").classList.toggle("tab-eggs",state.tab==="eggs");
 document.querySelectorAll("[data-tab]").forEach(b=>{
  b.classList.toggle("active",b.dataset.tab===state.tab);
  b.setAttribute("aria-selected",String(b.dataset.tab===state.tab));
 });
 el("tags-panel").hidden=state.tab!=="tags";
 el("eggs-panel").hidden=state.tab!=="eggs";
 el("tab-tags-count").textContent=number(state.tags.size);
 el("tab-pokemon-count").textContent=number(state.all.length)+(state.capacity?" / "+number(state.capacity):"");
 el("tab-eggs-count").textContent=number(state.eggs.length);
}
function svgShape(key){
 const row=window.PokeSearchTagShapes?.[key];
 if(!row)return '<span aria-hidden="true">★</span>';
 return '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+row[0]+' '+row[1]+'"><path d="'+escapeHtml(row[2])+'"/></svg>';
}
const categoryDefs=[
 ["buddy","Caminhou como companheiro","companheiros","#84cfa7"],
 ["legendary","Lendário","lendario","#5d5470"],
 ["mythical","Mítico","mitico","#d796de"],
 ["evolvable","Espécie pode evoluir","pode_evoluir","#c9868c"],
 ["shiny","Brilhante","brilhante","#f0cf70"],
 ["lucky","Sortudo","sortudo","#eac492"],
 ["shadow","Sombroso","sombroso","#a88acc"],
 ["purified","Purificado","purificado","#92d5d3"],
 ["eventVisual","Evento / visual especial","evento","#dea5cf"],
 ["event","Origem em evento","evento","#d4b8dd"],
 ["traded","Trocado","trocado","#8bd3c1"],
 ["mega","Megaevoluiu","megaevoluiu","#bc6690"],
 ["bgLocal","Fundo de localidade","fundo_de_localidade","#86d7ee"],
 ["bgSpecial","Fundo especial","fundo_especial","#88b2e7"],
 ["bgUnknown","Fundo sem classificação","fundo_especial","#a9aeba"],
 ["dynamax","Dinamax","dinamax","#e91293"],
 ["gigantamax","Gigamax","gigamax","#b20073"],
 ["hundo","IV 100%","brilhante","#edb2a3"],
 ["costume","Vestimenta","evento","#d2b3d6"],
 ["hatched","Chocado","chocado","#86cda6"],
 ["favorite","Favoritos","brilhante","#a9d4be"],
 ["tagged","Etiquetas","evento","#8bb7da"]
];
function renderTags(){
 el("tag-categories").innerHTML=categoryDefs.map(([key,label,icon,color])=>{
  const count=state.all.filter(p=>filterPokemon(p,key)).length;
  return '<button class="category" data-category="'+key+'" aria-label="'+escapeHtml(label)+': '+number(count)+'"><span class="bubble" style="background:'+color+'">'+svgShape(icon)+'</span><span class="label">'+escapeHtml(label)+'</span><span class="count">'+number(count)+'</span></button>';
 }).join("");
 el("personal-tags").innerHTML=Array.from(state.tags.entries()).map(([key,name])=>{
  const count=state.all.filter(p=>(p.tags||[]).includes(key)).length;
  return '<div class="personal-tag"><button class="tag-filter" data-tag="'+escapeHtml(key)+'"><i class="dot"></i><span class="tag-name">'+escapeHtml(name)+'</span><span class="tag-count">'+number(count)+'</span></button><button type="button" class="tag-edit" data-edit-tag="'+escapeHtml(key)+'">Editar</button></div>';
 }).join("")||'<p class="pane-sub">Nenhuma etiqueta no arquivo importado.</p>';
}
function renderEggs(){
 el("egg-grid").innerHTML=state.eggs.length?state.eggs.map((egg,i)=>{
  const distance=egg.distance?decimal(egg.distance,0)+" km":"Distância indisponível";
  return '<div class="egg"><div class="egg-art" aria-hidden="true">◈</div><strong>'+escapeHtml(distance)+'</strong><span>'+(egg.incubating?"Incubando":"Não incubado")+'</span></div>';
 }).join(""):'<p class="pane-sub">Nenhum ovo no arquivo importado.</p>';
}
function setTab(name){
 if(!["tags","pokemon","eggs"].includes(name))return;
 state.tab=name;renderTabs();
}
function summaryTime(){
  const s=state.snapshotTime;
  el("import-time").textContent=s?"Exportação: "+s:"Importe PGSStats.json ou PGSStats.json";
}
function render(){
  const visible=state.all.filter(p=>
    [...state.activeFilters].every(key=>filterPokemon(p,key))&&matchesQuery(p)).sort(compare);
  state.filtered=visible;
  el("result-note").textContent=number(visible.length)+" Pokémon encontrados · Lista privada";
  const displayed=visible.slice(0,state.limit);
  if(!state.all.length){
    el("grid").innerHTML='<div class="empty" style="grid-column:1/-1">'+
      '<div class="symbol">◉</div><strong>Sua coleção está vazia</strong>'+
      'Importe o arquivo PGSStats.json para montar a Pokédex automaticamente.'+
      '</div>';
  }else if(!visible.length){
    el("grid").innerHTML='<div class="empty" style="grid-column:1/-1">'+
      '<strong>Nenhum Pokémon encontrado</strong>Experimente outro filtro ou busca.</div>';
  }else{
    el("grid").innerHTML=displayed.map(p=>{
      const max=p.maxStamina||0,health=max?Math.min(100,Math.round(100*(p.stamina||0)/max)):100;
      const chosen=state.selectedIds.has(p.id);
       const flags=[p.favorite?"⭐":"",hasBackground(p)?"🖼️":"",p.costume?"🎩":""].filter(Boolean).join("");
       const overlays=(isShadow(p)?'<span class="shadow-flame" aria-label="Sombroso">♨</span>':"")+
         (isPurified(p)?'<span class="purified-star" aria-label="Purificado">✦</span>':"")+
         (p.shiny?'<span class="status-shiny" aria-label="Brilhante">✦</span>':"")+
         (p.costume?'<span class="species-form-badge">T</span>':"");
      return '<button type="button" class="mon '+(chosen?"selected":"")+'" data-id="'+p.id+'" aria-label="'+
        escapeHtml(speciesName(p))+' PC '+number(p.cp)+'">'+
        (state.selecting?'<span class="selection-indicator" aria-hidden="true">'+(chosen?"✓":"")+'</span>':"")+ 
        '<div class="cp"><small>PC</small>'+number(p.cp)+'</div>'+
        '<div class="pic">'+artHtml(p,"sprite")+overlays+
        '<span class="flags">'+flags+'</span></div>'+
        '<div class="name">'+escapeHtml(speciesName(p))+'</div>'+
        '<div class="iv"><b>'+p.attack+'</b><b>'+p.defense+'</b><b>'+p.hpIv+'</b></div>'+
        '<div class="hpbar"><i style="width:'+health+'%"></i></div></button>';
    }).join("");
  }
  el("more").hidden=visible.length<=state.limit;
}

function renderSelection(){
 el("selection-strip").hidden=!state.selecting;
 el("selection-count").textContent=number(state.selectedIds.size)+" selecionado(s)";
 el("selection-compare").disabled=state.selectedIds.size<2||state.selectedIds.size>3;
  el("selection-tag").disabled=state.selectedIds.size===0;
  el("selection-tag-choice").disabled=state.selectedIds.size===0;
  el("selection-delete").disabled=state.selectedIds.size===0;
 el("select-toggle").classList.toggle("active",state.selecting);
}
function compareSelected(){
 const chosen=[...state.selectedIds].map(id=>state.all.find(p=>p.id===id)).filter(Boolean);
 if(chosen.length<2)return;
 const rows=[
  ["PC",p=>number(p.cp)],["IV",p=>p.attack+"/"+p.defense+"/"+p.hpIv],
  ["IV %",p=>Math.round(ivValue(p)/45*100)+"%"],
  ["PS",p=>number(p.maxStamina)],["Shiny",p=>p.shiny?"Sim":"Não"],
  ["Sombroso",p=>isShadow(p)?"Sim":"Não"],
  ["Fundo",p=>hasBackground(p)?"ID "+p.backgroundId:"—"],
  ["Traje",p=>p.costume?"ID "+p.costume:"—"],
  ["Forma",p=>cleanForm(p)||"Padrão"]
 ];
 el("compare-content").innerHTML='<table class="compare-table"><thead><tr><th>Dados</th>'+
  chosen.map(p=>'<th>'+artHtml(p,"compare-sprite")+'<div>'+escapeHtml(speciesName(p))+'</div></th>').join("")+
  '</tr></thead><tbody>'+rows.map(([label,fn])=>'<tr><th>'+escapeHtml(label)+'</th>'+
   chosen.map(p=>'<td>'+escapeHtml(fn(p))+'</td>').join("")+'</tr>').join("")+'</tbody></table>';
 el("compare-panel").hidden=false;
}
function openHistory(){
 let history=[];
 try{history=JSON.parse(bridge.getImportHistory(state.slot)||"[]");}catch(_){}
 el("history-rows").innerHTML=history.length?history.map(row=>{
  const when=new Date(Number(row.at)).toLocaleString("pt-BR");
  const diff=row.baseline?'<span>+'+number(row.added)+' novos</span><span>−'+number(row.removed)+
   ' ausentes</span><span>'+number(row.changed)+' alterados</span>':
   '<span>Importação inicial</span>';
  return '<div class="history-row"><strong>'+escapeHtml(when)+'</strong>'+
   '<div class="history-summary">'+diff+'</div><small>'+number(row.total)+' Pokémon no inventário</small></div>';
 }).join(""):'<p class="pane-sub">Nenhuma importação registrada nesta versão.</p>';
 const native=typeof bridge.getLastImportDiff==="function"?bridge.getLastImportDiff(state.slot):"{}";
 let changes={};try{changes=JSON.parse(native||"{}");}catch(_){}
 const types=[["new","Novos nesta importação"],["changed","Registros alterados"],
              ["missing","Ausentes neste instantâneo"]];
 const lists=types.map(([key,title])=>{
  const items=Array.isArray(changes[key])?changes[key]:[];
  return '<details class="lt402-diff"><summary>'+escapeHtml(title)+' ('+number(items.length)+')</summary>'+
   (items.length?'<ul>'+items.slice(0,200).map(p=>
     '<li>'+escapeHtml(state.names.get(Number(p.species))||("#"+p.species))+
     ' · ID …'+escapeHtml(String(p.id).slice(-6))+'</li>').join("")+'</ul>':
     '<p class="note">Nenhuma diferença nesta categoria.</p>')+
   (items.length>200?'<p class="note">Mostrando 200 de '+number(items.length)+' itens.</p>':"")+
   '</details>';
 });
 if(changes.at)el("history-rows").insertAdjacentHTML("beforeend",
  '<p class="note">Diferenças da importação mais recente. Ausência não comprova transferência ou exclusão no jogo.</p>'+
  lists.join(""));
 el("history-panel").hidden=false;
}
function loadBackgrounds(){
 try{
  const manifest=JSON.parse(bridge.getBackgroundManifest()||"{}");
  state.bgAssets=new Map((manifest.assets||[]).map(a=>[a[0],{size:a[1],sha:a[2]}]));
  state.bgCards=(manifest.cards||[]).map(c=>({id:c[0],name:c[1],type:c[2],file:c[3]}));
 }catch(_){state.bgAssets=new Map();state.bgCards=[];}
 refreshBackgrounds();
}
function bgFilename(id){
 const card=state.bgCards.find(c=>Number(c.id)===Number(id));
 return card?.file||"";
}
function bgImageUrl(name){
 return "https://pokesearch.local/bg/"+encodeURIComponent(name);
}
function refreshBackgrounds(status){
 let information=status;
 if(!information)try{information=JSON.parse(bridge.getBackgroundStatus()||"{}");}catch(_){information={};}
 try{state.bgCached=new Set(JSON.parse(bridge.getCachedBackgroundNames()||"[]"));}catch(_){state.bgCached=new Set();}
 const available=state.bgCached.size;
 el("background-cache-count").textContent=available+"/"+number(state.bgAssets.size);
 el("bg-status").textContent=available+" de "+number(state.bgAssets.size)+" imagens locais · "+
  decimal((information.bytes||0)/1048576,1)+" MiB baixados"+
  (information.running?" · "+(information.processed||0)+" processados":"")+
  (information.error?" · "+information.error:"");
 el("backgrounds-download").disabled=!!information.running||available===state.bgAssets.size;
 el("backgrounds-clear").disabled=!!information.running||available===0;
 el("backgrounds-cancel").disabled=!information.running;
 if(!el("background-panel").hidden&&(!information.running||!information.processed||information.processed%24===1))renderBackgroundGallery();
 if(state.selected)applyHeroBackground(state.selected,bridge.getDecoration(state.slot,state.selected.id));
}
window.pokeBackgroundProgress=function(status){refreshBackgrounds(status);};
function applyHeroBackground(p,choice){
 const hero=el("hero");
 let filename="";
 let label="";
 if(choice==="original"||choice==="default"){
  filename=bgFilename(p.backgroundId);
  label="Fundo original do encontro";
 }else if(choice.startsWith("asset:")){
  filename=choice.substring(6);label="Fundo decorativo escolhido";
 }
 if(filename&&state.bgCached.has(filename)){
  hero.className="hero official-bg";
  hero.style.backgroundImage='url("'+bgImageUrl(filename)+'")';
  el("decor-label").textContent=label;
 }else{
  hero.className="hero "+(presets.some(x=>x[0]===choice)?choice:"default");
  hero.style.backgroundImage="";
  el("decor-label").textContent=filename?"Imagem indisponível — fundo padrão":
    choice==="default"?"Fundo padrão":"Fundo decorativo PokeSearch";
 }
 const original=bgFilename(p.backgroundId);
 el("background-availability").textContent=hasBackground(p)?
  (original?"Fundo do encontro #"+p.backgroundId+
    (state.bgCached.has(original)?" disponível neste aparelho.":" catalogado, mas ainda não baixado."):
   "Fundo registrado #"+p.backgroundId+" sem imagem correspondente confirmada."):
  "Este Pokémon não tem fundo de encontro registrado. A galeria permite uma decoração opcional.";
}
function renderBackgroundGallery(){
 const q=state.bgQuery.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const found=state.bgCards.filter(c=>
  (c.name+" "+c.id+" "+c.type).normalize("NFD").replace(/[\u0300-\u036f]/g,"")
   .toLowerCase().includes(q));
 el("background-hint").textContent=found.length+" fundos encontrados · "+
  (state.backgroundTarget?"Toque em um fundo já baixado para aplicar à ficha pessoal.":
   "Abra uma ficha Pokémon para escolher um fundo decorativo.");
 el("background-list").innerHTML=found.slice(0,150).map(c=>{
  const ready=c.file&&state.bgCached.has(c.file);
  return '<button type="button" class="background-item" data-bg-id="'+c.id+'"'+
   (!ready||!state.backgroundTarget?" disabled":"")+'>'+
   '<div class="image-slot">'+(ready?'<img loading="lazy" src="'+bgImageUrl(c.file)+
    '" alt="'+escapeHtml(c.name)+'">':'<span aria-hidden="true">▧</span>')+'</div>'+
   '<strong>'+escapeHtml(c.name)+'</strong><small>#'+c.id+' · '+
    (ready?"Disponível":"Imagem não baixada ou não identificada")+'</small></button>';
 }).join("")+(found.length>150?'<p class="pane-sub">Digite na busca para encontrar os demais fundos.</p>':"");
}
function openBackgroundGallery(target){
 state.backgroundTarget=target||null;
 state.bgQuery="";el("background-search").value="";
 el("background-panel").hidden=false;
 refreshBackgrounds();
}
function loadSlot(){
  confirmDeleteAll=false;confirmDeleteSelection=false;confirmTagDelete=false;
  el("delete-all").textContent="Limpar inventário";
  let data={};
  try{data=JSON.parse(bridge.getSnapshot(state.slot)||"{}");}catch(_){}
  state.all=Array.isArray(data.pokemons)?data.pokemons:[];
  state.eggs=Array.isArray(data.eggs)?data.eggs:[];
  state.capacity=Number(data.capacity)||0;
  state.snapshotTime=data.snapshotTime||"";
  state.tags=new Map((data.tags||[]).map(t=>[String(t.id),String(t.name)]));
   renderTagSelection();
   el("sync-status").textContent=typeof bridge.getSyncStatus==="function"?
    bridge.getSyncStatus(state.slot):"Arquivo local não vinculado";
  state.query="";state.filter="all";state.activeFilters.clear();state.limit=96;
  state.spriteMatchCache.clear();
  state.selecting=false;state.selectedIds.clear();renderSelection();
  el("search").value="";
  el("slot1").classList.toggle("active",state.slot===1);
  el("slot2").classList.toggle("active",state.slot===2);
  el("collection-title").textContent="Inventário "+state.slot;
  summaryTime();renderFilters();renderStats();render();renderTabs();renderTags();renderEggs();renderSpriteCoverage();
}
function hbar(label,v){
  return '<div class="ivrow"><span>'+escapeHtml(label)+'</span><div class="ivbar"><i style="width:'+
    Math.round(Number(v)/15*100)+'%"></i></div><b>'+v+'/15</b></div>';
}
function renderPvp(p){
 const lib=window.PokeSearchRankExplorer,gm=window.POKESEARCH_PVP_IV_DATA;
 const base=speciesName(p),form=formVariant(p);
 const full=form?base+" ("+form[0]+form.slice(1).toLowerCase()+")":base;
 const name=isShadow(p)?full+" (Shadow)":full;
 const idx=p.attack*256+p.defense*16+p.hpIv;
 let verified=0;
 el("pvp-ranks").innerHTML=["gl","ul","ml"].map((league,i)=>{
  let owned=null;
  try{
   const rows=lib&&gm?lib.getIvRows(gm,name,league):null;
   if(rows)owned=rows.find(r=>r.index===idx)||null;
  }catch(_){}
  if(owned)verified++;
  const label=["Grande Liga","Ultra Liga","Liga Mestra"][i];
  return '<div class="pvp-rank"><small>'+label+'</small><b>'+
   (owned?"#"+number(owned.rank):"—")+'</b><small>'+
   (owned?"Eficiência "+owned.efficiency+"%":"Sem dados exatos")+'</small></div>';
 }).join("");
 el("pvp-note").textContent=verified?
  "Ranking teórico por IV no limite de nível 50 (sem melhor amigo), snapshot PvPoke de "+
    (gm.retrieved||"data não informada")+". Não é o ranking geral da espécie.":
  "Não há correspondência exata da espécie/forma no snapshot PvPoke. Ranking não estimado.";
}
function showDetail(id){
 const p=state.all.find(x=>x.id===id);
 if(!p)return;
 state.selected=p;
 const preset=bridge.getDecoration(state.slot,p.id);
 applyHeroBackground(p,preset);
 el("hero-title").innerHTML="<small>PC</small> "+number(p.cp);
 el("hero-sprite").innerHTML=artHtml(p,"hero-img").replace('loading="lazy"','loading="eager"');
 renderSpriteStatus(p);
 el("decor-label").textContent=preset==="default"?"Fundo padrão":"Fundo decorativo PokeSearch";
 el("detail-name").textContent=speciesName(p);
 el("detail-sub").textContent=(p.nickname?"Apelido: "+p.nickname+" · ":"")+"Pokédex #"+p.species+
   (cleanForm(p)?" · "+cleanForm(p):"");
 el("detail-gender").textContent=p.gender===1?"♂":p.gender===2?"♀":"";
 const percent=p.maxStamina?Math.min(100,100*p.stamina/p.maxStamina):100;
 el("health-bar").style.width=percent+"%";
 el("health-text").textContent=number(p.stamina)+" / "+number(p.maxStamina)+" PS";
 el("detail-weight").textContent=decimal(p.weightKg,2)+" kg";
 el("detail-height").textContent=decimal(p.heightM,2)+" m";
 el("detail-iv").textContent=Math.round(ivValue(p)*100/45)+"%";
 const chips=[];
 if(p.shiny)chips.push("✨ Brilhante");
 if(isHundo(p))chips.push("★ IV 100%");
 if(p.favorite)chips.push("★ Favorito");
 if(p.lucky)chips.push("Sortudo");
 if(isShadow(p))chips.push("Sombroso");
 if(isPurified(p))chips.push("Purificado");
 if(p.costume)chips.push("🎩 "+availableMetaName("costumes",p.costume));
 if(hasBackground(p))chips.push("🖼 "+availableMetaName("backgrounds",p.backgroundId));
 if(p.traded)chips.push("Recebido por troca");
 if(isMegaRegistered(p))chips.push("Megaevolução registrada");
 if(p.breadMode===1)chips.push("Dinamax");
 if(p.breadMode===2)chips.push("Gigamax");
 if(isVisualEvent(p))chips.push("Evento/traje registrado");
 if(hasEventOrigin(p))chips.push("Origem em evento");
 if(p.hatchedFromEgg)chips.push("Chocado");
 el("badges").innerHTML=chips.map(v=>'<span class="chip">'+escapeHtml(v)+'</span>').join("");
 const iv=ivValue(p),stars=iv===45?3:iv>=37?3:iv>=30?2:iv>=23?1:0;
 el("appraisal-level").innerHTML='<span class="appraisal-medal '+(iv===45?"perfect":"")+'">'+
  (iv===45?"IV perfeito · 100%":Math.round(100*iv/45)+"% · "+stars+" estrelas")+
  '</span><span class="appraisal-stars">'+("★".repeat(stars))+'</span>';
 el("individual-bars").innerHTML=hbar("Ataque",p.attack)+hbar("Defesa",p.defense)+hbar("PS",p.hpIv);
 const moveName=id=>{
  const m=state.meta.moves.get(Number(id));
  return !id?"Não informado":m?escapeHtml(m.name):"ID "+id;
 };
 el("moves").innerHTML='<div class="note">Ataque rápido: <b>'+moveName(p.move1)+'</b>'+
  '<br>Ataque carregado: <b>'+moveName(p.move2)+'</b>'+
  (p.move3?"<br>Segundo carregado: <b>"+moveName(p.move3)+"</b>":"")+
  '<br><small>Movimentos registrados no JSON; nomenclatura da tabela local.</small></div>';
 renderPvp(p);
 const tags=(p.tags||[]).map(t=>state.tags.get(String(t))||"Tag").join(", ");
 const date=p.caughtMs?new Date(p.caughtMs).toLocaleDateString("pt-BR"):"Não informada";
 const outfit=p.costume?availableMetaName("costumes",p.costume)+" (#"+p.costume+")":"Nenhuma";
 const background=hasBackground(p)?availableMetaName("backgrounds",p.backgroundId)+" (#"+p.backgroundId+")":"Nenhum";
 el("other-info").innerHTML='<div class="note">Obtido em: '+escapeHtml(date)+
  '<br>Forma: '+escapeHtml(cleanForm(p)||"Padrão")+
  '<br>Vestimenta: '+escapeHtml(outfit)+
  '<br>Fundo original: '+escapeHtml(background)+
  (p.events?.length?'<br>Eventos: '+escapeHtml(p.events.join(", ")):"")+
  (isMegaRegistered(p)?"<br>Histórico de MegaEvolução"+
     (p.megaFormsCount?" · "+p.megaFormsCount+" forma(s)":"")+
     (p.megaLevel?" · Nível "+p.megaLevel:""):"")+
  (p.buddyKm?"<br>Km com companheiro: "+decimal(p.buddyKm,1):"")+
  '<br>Tags: '+escapeHtml(tags||"Nenhuma")+
  '<br>Pokébola: '+number(p.pokeball)+
  '<br><b>Ficha privada. Não altera o Pokémon no jogo.</b></div>';
 renderPresets(p,preset);
 el("personal-note").value=bridge.getNote(state.slot,p.id)||"";
 const position=state.filtered.findIndex(x=>x.id===p.id);
 el("detail-prev").disabled=position<=0;
 el("detail-next").disabled=position<0||position>=state.filtered.length-1;
 el("detail").classList.add("open");el("detail").scrollTop=0;
}
function renderPresets(p,current){
  const choices=hasBackground(p)?[["original","Fundo do encontro"],...presets]:presets;
  el("presets").innerHTML=choices.map(([key,label])=>
    '<button class="preset '+(current===key?"active":"")+
    '" data-preset="'+key+'">'+escapeHtml(label)+'</button>').join("");
}
function hideDetail(){
  if(!state.selected)return false;
  state.selected=null;el("detail").classList.remove("open");return true;
}
function notice(message){
  const box=el("notice");box.textContent=message;box.style.display="block";
  clearTimeout(notice.timer);notice.timer=setTimeout(()=>box.style.display="none",5000);
}
window.pokeImportCompleted=function(message,ok){
  if(ok)loadSlot();
  notice(message);
};
function closeSort(){
 const layer=el("sort-backdrop");if(layer.hidden)return false;
 layer.hidden=true;el("sort-trigger").setAttribute("aria-expanded","false");return true;
}
function closeOverlay(){
 for(const id of ["edit-panel","tag-editor-panel","compare-panel","history-panel","background-panel","sprite-panel"]){
  const panel=el(id);
  if(!panel.hidden){panel.hidden=true;state.backgroundTarget=null;return true;}
 }
 return false;
}
window.pokeBack=()=>closeOverlay()||closeSort()||hideDetail();
function loadCatalog(){
  try{
    const catalog=JSON.parse(bridge.getCatalog());
    state.names=new Map(catalog.filter(x=>Array.isArray(x)&&x.length===2).map(x=>[Number(x[0]),String(x[1])]));
  }catch(_){state.names=new Map();}
}
el("back").addEventListener("click",()=>bridge.closeScreen());
el("slot1").addEventListener("click",()=>{hideDetail();state.slot=1;loadSlot()});
el("slot2").addEventListener("click",()=>{hideDetail();state.slot=2;loadSlot()});
el("import").addEventListener("click",()=>bridge.chooseJson(state.slot));
el("help").addEventListener("click",()=>notice(
  "Importação manual e local. Nenhum JSON é enviado para outros usuários ou servidores. Cada inventário é independente."));
el("filters").addEventListener("click",e=>{
  const b=e.target.closest("[data-filter]");if(!b)return;
  const key=b.dataset.filter;
  if(key==="all")state.activeFilters.clear();
  else if(state.activeFilters.has(key))state.activeFilters.delete(key);
  else state.activeFilters.add(key);
  state.filter=state.activeFilters.size?[...state.activeFilters][0]:"all";
  state.limit=96;renderFilters();render();
});
el("search").addEventListener("input",e=>{state.query=e.target.value;state.limit=96;render();});
el("sort").addEventListener("change",e=>{state.sort=e.target.value;render();});
el("grid").addEventListener("click",e=>{
  const b=e.target.closest("[data-id]");
  if(!b)return;
  if(state.suppressCardClick){state.suppressCardClick=false;return;}
   if(state.selecting){
     const id=b.dataset.id;
     if(state.selectedIds.has(id))state.selectedIds.delete(id);
     else state.selectedIds.add(id);
     confirmDeleteSelection=false;
     renderSelection();render();
   }else showDetail(b.dataset.id);
});
el("more").addEventListener("click",()=>{state.limit+=96;render();});
el("detail-back").addEventListener("click",hideDetail);
el("presets").addEventListener("click",e=>{
  const button=e.target.closest("[data-preset]");
  if(!button||!state.selected)return;
  const name=button.dataset.preset;
  bridge.setDecoration(state.slot,state.selected.id,name);
  applyHeroBackground(state.selected,name);
  renderPresets(state.selected,name);
});
function setSort(key){
 const sel=el("sort");sel.value=key;state.sort=key;
 el("sort-label").textContent=sel.selectedOptions[0]?.textContent||key;
 render();closeSort();
}
el("sort-trigger").addEventListener("click",()=>{
 const layer=el("sort-backdrop");layer.hidden=false;
 el("sort-trigger").setAttribute("aria-expanded","true");
 el("sort-choices").innerHTML=Array.from(el("sort").options).map(o=>
  '<button type="button" class="sort-choice '+(state.sort===o.value?"active":"")+
  '" data-sort="'+escapeHtml(o.value)+'">'+escapeHtml(o.textContent)+'</button>').join("");
});
el("sort-choices").addEventListener("click",e=>{
 const b=e.target.closest("[data-sort]");if(b)setSort(b.dataset.sort);
});
el("sort-cancel").addEventListener("click",closeSort);
el("sort-backdrop").addEventListener("click",e=>{
 if(e.target===el("sort-backdrop"))closeSort();
});
document.querySelectorAll("[data-tab]").forEach(b=>
 b.addEventListener("click",()=>setTab(b.dataset.tab)));
el("tag-categories").addEventListener("click",e=>{
 const b=e.target.closest("[data-category]");if(!b)return;
 state.filter=b.dataset.category;state.activeFilters=new Set([state.filter]);
 state.tagId=null;state.limit=96;
 renderFilters();setTab("pokemon");render();
});
el("personal-tags").addEventListener("click",e=>{
 const edit=e.target.closest("[data-edit-tag]");
  if(edit){openTagEditor(edit.dataset.editTag);return;}
  const b=e.target.closest("[data-tag]");if(!b)return;
 state.filter="tag";state.activeFilters=new Set(["tag"]);
 state.tagId=b.dataset.tag;state.limit=96;
 renderFilters();setTab("pokemon");render();
});
function shiftDetail(delta){
 if(!state.selected)return;
 const i=state.filtered.findIndex(p=>p.id===state.selected.id);
 const next=state.filtered[i+delta];if(next)showDetail(next.id);
}
el("detail-prev").addEventListener("click",()=>shiftDetail(-1));
el("detail-next").addEventListener("click",()=>shiftDetail(1));
el("select-toggle").addEventListener("click",()=>{
 state.selecting=!state.selecting;state.selectedIds.clear();
 renderSelection();render();
});
el("selection-clear").addEventListener("click",()=>{
 state.selectedIds.clear();renderSelection();render();
});
el("selection-compare").addEventListener("click",compareSelected);
el("compare-close").addEventListener("click",()=>{el("compare-panel").hidden=true;});
el("history-open").addEventListener("click",openHistory);
el("history-close").addEventListener("click",()=>{el("history-panel").hidden=true;});
el("sprites-open").addEventListener("click",openSpritePanel);
el("sprites-close").addEventListener("click",()=>{el("sprite-panel").hidden=true;});
el("sprites-download-collection").addEventListener("click",()=>requestSprites("collection"));
el("sprites-download-all").addEventListener("click",()=>requestSprites("all"));
el("sprites-download-legacy").addEventListener("click",()=>requestSprites("legacy"));
el("sprites-cancel").addEventListener("click",()=>bridge.cancelSpriteDownload());
let spriteClearConfirmation=false;
el("sprites-clear").addEventListener("click",()=>{
 if(!spriteClearConfirmation){
  spriteClearConfirmation=true;el("sprites-clear").textContent="Confirmar limpeza";
  notice("Toque novamente para excluir apenas as imagens baixadas.");
  return;
 }
 spriteClearConfirmation=false;el("sprites-clear").textContent="Limpar imagens baixadas";
 bridge.clearSpriteCache();refreshSpriteCache();
});
el("download-this-sprite").addEventListener("click",()=>{
 if(!state.selected)return;
 const exact=visualMatch(state.selected);
 if(exact.key)requestSprites("collection",[exact.key]);
});
el("backgrounds-open").addEventListener("click",()=>openBackgroundGallery(null));
el("background-gallery-for-pokemon").addEventListener("click",()=>{
 if(state.selected)openBackgroundGallery(state.selected.id);
});
el("backgrounds-close").addEventListener("click",()=>{
 el("background-panel").hidden=true;state.backgroundTarget=null;
});
el("background-search").addEventListener("input",e=>{
 state.bgQuery=e.target.value;renderBackgroundGallery();
});
el("background-list").addEventListener("click",e=>{
 const b=e.target.closest("[data-bg-id]");if(!b||!state.backgroundTarget)return;
 const item=state.bgCards.find(c=>String(c.id)===b.dataset.bgId);
 if(!item||!item.file||!state.bgCached.has(item.file))return;
 const pokemon=state.all.find(p=>p.id===state.backgroundTarget);
 if(!pokemon)return;
 bridge.setDecoration(state.slot,pokemon.id,"asset:"+item.file);
 if(state.selected?.id===pokemon.id){
  applyHeroBackground(pokemon,"asset:"+item.file);
  renderPresets(pokemon,"asset:"+item.file);
 }
 el("background-panel").hidden=true;state.backgroundTarget=null;
 notice("Fundo pessoal aplicado. O fundo original do jogo não foi modificado.");
});
el("backgrounds-download").addEventListener("click",()=>{
 if(!state.bgAssets.size)return notice("Catálogo de fundos indisponível.");
 bridge.downloadAllBackgrounds();
 refreshBackgrounds();
});
el("backgrounds-cancel").addEventListener("click",()=>bridge.cancelBackgroundDownload());
let confirmClear=false;
el("backgrounds-clear").addEventListener("click",()=>{
 if(!confirmClear){
  confirmClear=true;el("backgrounds-clear").textContent="Confirmar exclusão";
  notice("Toque novamente para apagar apenas o cache de fundos.");
  return;
 }
 confirmClear=false;el("backgrounds-clear").textContent="Apagar cache";
 bridge.clearBackgroundCache();refreshBackgrounds();
});
el("save-note").addEventListener("click",()=>{
 if(!state.selected)return;
 bridge.setNote(state.slot,state.selected.id,el("personal-note").value);
 notice("Anotação salva neste aparelho.");
});

/* LT402: all changes stay in local device storage; no Pokémon GO writes. */
function runEdit(action,params,after){
 let result;
 try{result=JSON.parse(bridge.editInventory(state.slot,action,JSON.stringify(params))||"{}");}
 catch(_){return notice("Falha de acesso ao inventário local.");}
 if(!result.ok)return notice(result.error||"Não foi possível salvar.");
 const tab=state.tab;
 loadSlot();setTab(tab);
 if(after)after(result);
 else notice("Alteração salva apenas no inventário pessoal.");
}
function renderTagSelection(){
 el("selection-tag-choice").innerHTML=Array.from(state.tags.entries()).map(([id,label])=>
  '<option value="'+escapeHtml(id)+'">'+escapeHtml(label)+'</option>').join("")||
  '<option value="">Crie uma etiqueta</option>';
}
function openEditor(p){
 state.editingPokemon=p?.id||null;
 el("edit-heading").textContent=p?"Editar "+speciesName(p):"Adicionar Pokémon";
 el("edit-species").disabled=!!p;
 const value=(k,def)=>p?.[k]??def;
 for(const [k,def] of [["species",1],["nickname",""],["cp",0],["stamina",0],
    ["maxStamina",0],["attack",0],["defense",0],["hpIv",0],["buddyHearts",0]])
   el("edit-"+k).value=value(k,def);
 el("edit-bestBuddy").checked=!!p?.bestBuddy;
 el("edit-favorite").checked=!!p?.favorite;
 const moves=[...state.meta.moves.entries()];
 function fill(id,fast,value){
   let html='<option value="0">Não informado</option>';
   for(const [n,m] of moves){
     if(fast!==null&&m.fast!==fast)continue;
     html+='<option value="'+Number(n)+'">'+escapeHtml(m.name)+' (#'+Number(n)+')</option>';
   }
   const target=el("edit-"+id);target.innerHTML=html;
   if(value&&!moves.some(([n])=>Number(n)===Number(value)))
     target.insertAdjacentHTML("beforeend",'<option value="'+Number(value)+'">ID '+Number(value)+'</option>');
   target.value=String(Number(value)||0);
 }
 fill("move1",true,p?.move1);fill("move2",false,p?.move2);fill("move3",false,p?.move3);
 el("edit-tags").innerHTML=Array.from(state.tags.entries()).map(([id,label])=>
  '<label><input type="checkbox" data-assign-tag="'+escapeHtml(id)+'"'+
  ((p?.tags||[]).includes(id)?" checked":"")+'> '+escapeHtml(label)+'</label>').join("")||
  '<span class="note">Crie etiquetas na aba Tags.</span>';
 el("edit-delete").hidden=!p;
 el("edit-panel").hidden=false;
}
function saveEditor(){
 const p=state.editingPokemon?state.all.find(x=>x.id===state.editingPokemon):null;
 const fields={nickname:el("edit-nickname").value.trim(),favorite:el("edit-favorite").checked,
    bestBuddy:el("edit-bestBuddy").checked,
    tags:[...el("edit-tags").querySelectorAll("input:checked")].map(x=>x.dataset.assignTag)};
 for(const key of ["cp","stamina","maxStamina","attack","defense","hpIv",
                    "buddyHearts","move1","move2","move3"]){
   const field=el("edit-"+key),n=Number(field.value);
   const maximum=key==="buddyHearts"?300:
      ["attack","defense","hpIv"].includes(key)?15:
      key.startsWith("move")?100000:99999;
   if(!Number.isInteger(n)||n<0||n>maximum)
      return notice("Revise o campo "+key+".");
   fields[key]=n;
 }
 if(!p){
    const species=Number(el("edit-species").value);
    if(!Number.isInteger(species)||species<1||species>1025)
      return notice("Informe o número da espécie entre 1 e 1025.");
    runEdit("add",{species,fields},result=>{
       el("edit-panel").hidden=true;showDetail(result.id);
       notice("Pokémon adicionado somente ao inventário pessoal.");
    });
 }else runEdit("edit",{id:p.id,fields},result=>{
    el("edit-panel").hidden=true;showDetail(result.id);
    notice("Ficha salva no inventário local.");
 });
}
function openTagEditor(id){
 state.editingTagId=id||null;
 el("tag-editor-name").value=id?(state.tags.get(id)||""):"";
 el("tag-editor-delete").hidden=!id;
 el("tag-editor-panel").hidden=false;
}
let confirmDeleteAll=false,confirmDeleteSelection=false,confirmTagDelete=false;
el("add-pokemon").addEventListener("click",()=>openEditor(null));
el("edit-pokemon").addEventListener("click",()=>{if(state.selected)openEditor(state.selected);});
el("edit-close").addEventListener("click",()=>{el("edit-panel").hidden=true;});
el("edit-save").addEventListener("click",saveEditor);
el("edit-delete").addEventListener("click",()=>{
 if(!state.editingPokemon)return;
 runEdit("delete",{ids:[state.editingPokemon]},()=>{
   el("edit-panel").hidden=true;hideDetail();
   notice("Excluído localmente. Use Desfazer exclusão para restaurar.");
 });
});
el("backup-export").addEventListener("click",()=>bridge.exportInventory(state.slot));
el("sync-source").addEventListener("click",()=>bridge.linkSyncFile(state.slot));
el("sync-now").addEventListener("click",()=>bridge.syncLocalFile(state.slot));
el("undo-delete").addEventListener("click",()=>{
 runEdit("undo",{},()=>notice("Última exclusão restaurada."));
});
el("delete-all").addEventListener("click",()=>{
 if(!state.all.length)return notice("O inventário está vazio.");
 if(!confirmDeleteAll){
   confirmDeleteAll=true;el("delete-all").textContent="Confirmar limpar tudo";
   return notice("Toque novamente para excluir tudo deste inventário (reversível).");
 }
 confirmDeleteAll=false;el("delete-all").textContent="Limpar inventário";
 runEdit("clear",{},()=>notice("Inventário limpo. Use Desfazer para restaurar."));
});
el("selection-delete").addEventListener("click",()=>{
 const ids=[...state.selectedIds];
 if(!ids.length)return;
 if(!confirmDeleteSelection){
   confirmDeleteSelection=true;
   return notice("Toque novamente em Excluir selecionados para confirmar.");
 }
 confirmDeleteSelection=false;
 runEdit("delete",{ids},()=>notice(ids.length+" Pokémon removidos, com opção de desfazer."));
});
el("selection-tag").addEventListener("click",()=>{
 const id=el("selection-tag-choice").value;
 if(!id||!state.tags.has(id))return notice("Escolha uma etiqueta válida.");
 runEdit("tagAssign",{id,ids:[...state.selectedIds],enable:true},
  ()=>notice("Etiqueta aplicada aos Pokémon selecionados."));
});
el("tag-create").addEventListener("click",()=>openTagEditor(null));
el("tag-editor-close").addEventListener("click",()=>{el("tag-editor-panel").hidden=true;});
el("tag-editor-save").addEventListener("click",()=>{
 const name=el("tag-editor-name").value.trim();
 if(!name)return notice("Digite um nome para a etiqueta.");
 runEdit("tagSave",{id:state.editingTagId||"",name},()=>{
    el("tag-editor-panel").hidden=true;notice("Etiqueta salva.");
 });
});
el("tag-editor-delete").addEventListener("click",()=>{
 if(!state.editingTagId)return;
 if(!confirmTagDelete){confirmTagDelete=true;return notice("Toque novamente para excluir a etiqueta.");}
 confirmTagDelete=false;
 runEdit("tagDelete",{id:state.editingTagId},()=>{
   el("tag-editor-panel").hidden=true;notice("Etiqueta removida.");
 });
});
/* Press and hold any card to enter unlimited multi-selection mode. */
let pressTimer=null,pressId=null,pressX=0,pressY=0;
const cancelPress=()=>{clearTimeout(pressTimer);pressTimer=null;pressId=null;};
el("grid").addEventListener("pointerdown",e=>{
 const card=e.target.closest("[data-id]");
 if(!card||state.selecting)return;
 pressId=card.dataset.id;pressX=e.clientX;pressY=e.clientY;
 pressTimer=setTimeout(()=>{
   if(!pressId)return;
   state.selecting=true;state.selectedIds.clear();state.selectedIds.add(pressId);
   state.suppressCardClick=true;renderSelection();render();
   setTimeout(()=>{state.suppressCardClick=false;},650);
   notice("Seleção múltipla ativa · toque em outros para marcar.");
   cancelPress();
 },480);
});
el("grid").addEventListener("pointermove",e=>{
 if(Math.abs(e.clientX-pressX)>12||Math.abs(e.clientY-pressY)>12)cancelPress();
});
for(const event of ["pointerup","pointercancel","pointerleave"])
 el("grid").addEventListener(event,cancelPress);

loadCatalog();loadMeta();loadSpriteIndex();loadBackgrounds();loadSlot();
})();