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
             query:"",filter:"all",sort:"cp",limit:96,selected:null};
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
const isShadow=p=>Number(p.alignment)===2;
const isPurified=p=>Number(p.alignment)===1;
const nameOf=p=>String(p.nickname||"").trim()||speciesName(p);
const cleanForm=p=>p.formName&&p.formName!=="Unset"?p.formName:"";
function formVariant(p){
 const raw=cleanForm(p).replace(/[^a-z0-9]/gi,"").toUpperCase();
 const dexName=speciesName(p).replace(/[^a-z0-9]/gi,"").toUpperCase();
 const suffix=raw.startsWith(dexName)?raw.slice(dexName.length):raw;
 return ["","NORMAL","UNSET","DEFAULT"].includes(suffix)?"":suffix;
}
const backgroundMeta=p=>state.meta.backgrounds.get(Number(p.backgroundId));
const costumeMeta=p=>state.meta.costumes.get(Number(p.costume));
const isSpecialBg=p=>(backgroundMeta(p)?.type||"")==="SPECIAL_BACKGROUND";
const isLocationBg=p=>hasBackground(p)&&!isSpecialBg(p);
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
function safeSprite(p){
  const lib=window.PokeSearchOfflineSprite;
  if(!lib||typeof lib.resolve!=="function")return "";
  try{
    const exactForm=formVariant(p);
    const costume=costumeMeta(p);
    const card={number:Number(p.species),name:speciesName(p),form:exactForm,
      shiny:!!p.shiny,gender:p.gender===2?"female":"male"};
    if(p.costume&&costume){card.costume=costume.name;card.costume_id=p.costume;}
    const art=lib.resolve(card);
    const uri=typeof art==="string"?art:art&&art.src;
    if(typeof uri!=="string")return "";
    // The canonical PokeSearch sprite map produces these two vetted sources.
    if(uri.startsWith("file:///android_asset/")||
       uri.startsWith("https://raw.githubusercontent.com/PokeAPI/sprites/")||
       uri.startsWith("https://cdn.jsdelivr.net/gh/PokeAPI/sprites@"))return uri;
  }catch(_){}
  return "";
}
function artHtml(p,css){
  const uri=safeSprite(p),name=escapeHtml(speciesName(p));
  if(!uri)return '<span class="'+css+' no-art" aria-label="Sprite indisponível">◇</span>';
  return '<img class="'+css+'" src="'+escapeHtml(uri)+'" alt="'+name+
    '" loading="lazy" onerror="this.replaceWith(document.createTextNode(\'◇\'))">';
}
function filterPokemon(p){
  switch(state.filter){
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
  case "mega":return !!p.hasMegaEvolved;
  case "event":return (p.events||[]).length>0;
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
    '<button class="filter '+(key===state.filter?"active":"")+
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
 ["shiny","Brilhante","brilhante","#f0cf70"],
 ["lucky","Sortudo","sortudo","#eac492"],
 ["shadow","Sombroso","sombroso","#a88acc"],
 ["purified","Purificado","purificado","#92d5d3"],
 ["event","Evento","evento","#dea5cf"],
 ["traded","Trocado","trocado","#8bd3c1"],
 ["mega","Megaevoluiu","megaevoluiu","#bc6690"],
 ["bgLocal","Fundo de localidade","fundo_de_localidade","#86d7ee"],
 ["bgSpecial","Fundo especial","fundo_especial","#88b2e7"],
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
  const count=state.all.filter(p=>{const filter=state.filter;state.filter=key;const ok=filterPokemon(p);state.filter=filter;return ok}).length;
  return '<button class="category" data-category="'+key+'" aria-label="'+escapeHtml(label)+': '+number(count)+'"><span class="bubble" style="background:'+color+'">'+svgShape(icon)+'</span><span class="label">'+escapeHtml(label)+'</span><span class="count">'+number(count)+'</span></button>';
 }).join("");
 el("personal-tags").innerHTML=Array.from(state.tags.entries()).map(([key,name])=>{
  const count=state.all.filter(p=>(p.tags||[]).includes(key)).length;
  return '<button class="personal-tag" data-tag="'+escapeHtml(key)+'"><i class="dot"></i><span class="tag-name">'+escapeHtml(name)+'</span><span class="tag-count">'+number(count)+'</span></button>';
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
  const visible=state.all.filter(p=>filterPokemon(p)&&matchesQuery(p)).sort(compare);
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
      const flags=[p.shiny?"✨":"",p.favorite?"⭐":"",hasBackground(p)?"🖼️":"",
         p.costume?"🎩":"",isShadow(p)?"◈":""].filter(Boolean).join("");
      return '<button type="button" class="mon" data-id="'+p.id+'" aria-label="'+
        escapeHtml(speciesName(p))+' PC '+number(p.cp)+'">'+
        '<div class="cp"><small>PC</small>'+number(p.cp)+'</div>'+
        '<div class="pic">'+artHtml(p,"sprite")+
        '<span class="flags">'+flags+'</span></div>'+
        '<div class="name">'+escapeHtml(speciesName(p))+'</div>'+
        '<div class="iv"><b>'+p.attack+'</b><b>'+p.defense+'</b><b>'+p.hpIv+'</b></div>'+
        '<div class="hpbar"><i style="width:'+health+'%"></i></div></button>';
    }).join("");
  }
  el("more").hidden=visible.length<=state.limit;
}
function loadSlot(){
  let data={};
  try{data=JSON.parse(bridge.getSnapshot(state.slot)||"{}");}catch(_){}
  state.all=Array.isArray(data.pokemons)?data.pokemons:[];
  state.eggs=Array.isArray(data.eggs)?data.eggs:[];
  state.capacity=Number(data.capacity)||0;
  state.snapshotTime=data.snapshotTime||"";
  state.tags=new Map((data.tags||[]).map(t=>[String(t.id),String(t.name)]));
  state.query="";state.filter="all";state.limit=96;
  el("search").value="";
  el("slot1").classList.toggle("active",state.slot===1);
  el("slot2").classList.toggle("active",state.slot===2);
  el("collection-title").textContent="Inventário "+state.slot;
  summaryTime();renderFilters();renderStats();render();renderTabs();renderTags();renderEggs();
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
 el("hero").className="hero "+(presets.some(x=>x[0]===preset)?preset:"default");
 el("hero-title").innerHTML="<small>PC</small> "+number(p.cp);
 el("hero-sprite").innerHTML=artHtml(p,"hero-img").replace('loading="lazy"','loading="eager"');
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
 if(p.hasMegaEvolved)chips.push("Megaevoluiu");
 if(p.breadMode===1)chips.push("Dinamax");
 if(p.breadMode===2)chips.push("Gigamax");
 if(p.events?.length)chips.push("Evento");
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
  (p.hasMegaEvolved?"<br>Megaevolução registrada"+(p.megaLevel?" · Nível "+p.megaLevel:""):"")+
  (p.buddyKm?"<br>Km com companheiro: "+decimal(p.buddyKm,1):"")+
  '<br>Tags: '+escapeHtml(tags||"Nenhuma")+
  '<br>Pokébola: '+number(p.pokeball)+
  '<br><b>Ficha privada. Não altera o Pokémon no jogo.</b></div>';
 renderPresets(p,preset);
 const position=state.filtered.findIndex(x=>x.id===p.id);
 el("detail-prev").disabled=position<=0;
 el("detail-next").disabled=position<0||position>=state.filtered.length-1;
 el("detail").classList.add("open");el("detail").scrollTop=0;
}
function renderPresets(p,current){
  el("presets").innerHTML=presets.map(([key,label])=>
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
window.pokeBack=()=>closeSort()||hideDetail();
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
  state.filter=b.dataset.filter;state.limit=96;renderFilters();render();
});
el("search").addEventListener("input",e=>{state.query=e.target.value;state.limit=96;render();});
el("sort").addEventListener("change",e=>{state.sort=e.target.value;render();});
el("grid").addEventListener("click",e=>{
  const b=e.target.closest("[data-id]");if(b)showDetail(b.dataset.id);
});
el("more").addEventListener("click",()=>{state.limit+=96;render();});
el("detail-back").addEventListener("click",hideDetail);
el("presets").addEventListener("click",e=>{
  const button=e.target.closest("[data-preset]");
  if(!button||!state.selected)return;
  const name=button.dataset.preset;
  bridge.setDecoration(state.slot,state.selected.id,name);
  el("hero").className="hero "+name;
  el("decor-label").textContent=name==="default"?"Fundo padrão":"Fundo decorativo PokeSearch";
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
 state.filter=b.dataset.category;state.tagId=null;state.limit=96;
 renderFilters();setTab("pokemon");render();
});
el("personal-tags").addEventListener("click",e=>{
 const b=e.target.closest("[data-tag]");if(!b)return;
 state.filter="tag";state.tagId=b.dataset.tag;state.limit=96;
 renderFilters();setTab("pokemon");render();
});
function shiftDetail(delta){
 if(!state.selected)return;
 const i=state.filtered.findIndex(p=>p.id===state.selected.id);
 const next=state.filtered[i+delta];if(next)showDetail(next.id);
}
el("detail-prev").addEventListener("click",()=>shiftDetail(-1));
el("detail-next").addEventListener("click",()=>shiftDetail(1));
loadCatalog();loadMeta();loadSlot();
})();