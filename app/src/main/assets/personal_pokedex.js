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
const state={slot:1,all:[],filtered:[],tags:new Map(),names:new Map(),
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
function safeSprite(p){
  const lib=window.PokeSearchOfflineSprite;
  if(!lib||typeof lib.resolve!=="function")return "";
  try{
    const art=lib.resolve({number:Number(p.species),name:speciesName(p),
      form:cleanForm(p),shiny:!!p.shiny});
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
  state.snapshotTime=data.snapshotTime||"";
  state.tags=new Map((data.tags||[]).map(t=>[String(t.id),String(t.name)]));
  state.query="";state.filter="all";state.limit=96;
  el("search").value="";
  el("slot1").classList.toggle("active",state.slot===1);
  el("slot2").classList.toggle("active",state.slot===2);
  el("collection-title").textContent="Inventário "+state.slot;
  summaryTime();renderFilters();renderStats();render();
}
function hbar(label,v){
  return '<div class="ivrow"><span>'+escapeHtml(label)+'</span><div class="ivbar"><i style="width:'+
    Math.round(Number(v)/15*100)+'%"></i></div><b>'+v+'/15</b></div>';
}
function showDetail(id){
  const p=state.all.find(x=>x.id===id);
  if(!p)return;
  state.selected=p;
  const img=artHtml(p,"hero-img");
  const preset=bridge.getDecoration(state.slot,p.id);
  el("hero").className="hero "+(presets.some(x=>x[0]===preset)?preset:"default");
  el("hero-title").innerHTML="<small>PC</small> "+number(p.cp);
  el("hero-sprite").innerHTML=img.replace('loading="lazy"','loading="eager"');
  el("decor-label").textContent=preset==="default"?"Fundo padrão":"Fundo decorativo PokeSearch";
  el("detail-name").textContent=speciesName(p);
  el("detail-sub").textContent=(p.nickname?"Apelido: "+p.nickname+" · ":"")+
    "Pokédex #"+p.species+(cleanForm(p)?" · "+cleanForm(p):"");
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
  if(p.costume)chips.push("Traje #"+p.costume);
  if(hasBackground(p))chips.push("Fundo registrado #"+p.backgroundId);
  if(p.traded)chips.push("Recebido por troca");
  el("badges").innerHTML=chips.map(s=>'<span class="chip">'+escapeHtml(s)+'</span>').join("");
  el("individual-bars").innerHTML=hbar("Ataque",p.attack)+
    hbar("Defesa",p.defense)+hbar("PS",p.hpIv);
  el("moves").innerHTML='<div class="note">Ataque rápido: '+(p.move1?"ID "+p.move1:"Não informado")+
    '<br>Ataque carregado: '+(p.move2?"ID "+p.move2:"Não informado")+
    (p.move3?"<br>Segundo carregado: ID "+p.move3:"")+
    '<br>Os nomes serão relacionados ao catálogo de golpes Pokémon GO.</div>';
  const tags=(p.tags||[]).map(t=>state.tags.get(String(t))||"Tag").join(", ");
  const date=p.caughtMs?new Date(p.caughtMs).toLocaleDateString("pt-BR"):"Não informada";
  el("other-info").innerHTML=
    '<div class="note">Obtido em: '+escapeHtml(date)+
    '<br>Forma: '+escapeHtml(cleanForm(p)||"Padrão")+
    '<br>Vestimenta: '+(p.costume?"Código "+p.costume+" (sprite-base ilustrativa; traje não certificado)":"Sem traje cadastrado")+
    '<br>Fundo original: '+(hasBackground(p)?"Código "+p.backgroundId:"Não registrado")+
    '<br>Tags: '+escapeHtml(tags||"Nenhuma")+
    '<br>Pokébola: '+number(p.pokeball)+
    '<br><b>Este inventário não altera seus Pokémon no jogo.</b></div>';
  renderPresets(p,preset);
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
window.pokeBack=()=>hideDetail();
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
loadCatalog();loadSlot();
})();