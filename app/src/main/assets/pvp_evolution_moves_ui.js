/* LT295 — PvP move recommendations bound to the precise evolution row.
 * The top-header move icon was for the highest-ranked species, which might
 * NOT be the Pokemon captured and is ambiguous in evolutionary families.
 * Each inline action uses its own species and league, one open panel at a time.
 * Source = existing pinned PvPoke + verified pt-BR move metadata.
 */
(function(root){
 "use strict";
 let scope="",opened="",sequence=0;
 const cache=new Map(),statusCache=new Map();
 const esc=value=>String(value==null?"":value).replace(/[&<>"']/g,
  c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const leagues={gl:"Grande Liga",ul:"Ultra Liga",ml:"Liga Mestra"};
 const color={normal:"#bec9d5",fighting:"#ff9a82",flying:"#a2b9ff",
  poison:"#cda0fa",ground:"#e0ba86",rock:"#dcc78c",bug:"#b5da70",
  ghost:"#b7a2ff",steel:"#bad2e4",fire:"#ff9d68",water:"#67b8ff",
  grass:"#7de79a",electric:"#ffe77a",psychic:"#ff9ebc",ice:"#8ceafa",
  dragon:"#aeabff",dark:"#cbb0a5",fairy:"#ff9ed5"};
 const keyOf=btn=>scope+"|"+btn.dataset.psLeague+"|"+
  (btn.dataset.psMega==="true"?"mega":"normal")+"|"+
  String(btn.dataset.psName||"").toLowerCase().trim();
 function bodyRows(){
  return root.document?.querySelectorAll?.("#evoBody .evoLine")||[];
 }
 function setScope(value){
  const next=String(value||"");
  if(next===scope)return;
  scope=next;opened="";sequence++;cache.clear();statusCache.clear();
 }
 function close(){
  opened="";sequence++;
  for(const row of bodyRows()){
   const slot=row.querySelector?.(".evoMoveDetails"),
    btn=row.querySelector?.(".evoMovesAction");
   if(slot)slot.hidden=true;
   btn?.setAttribute?.("aria-expanded","false");
   row.classList?.remove?.("evoMovesOpen");
  }
 }
 function restore(){
  if(!opened)return;
  for(const row of bodyRows()){
   const btn=row.querySelector?.(".evoMovesAction");
   const slot=row.querySelector?.(".evoMoveDetails");
   if(!btn||!slot||keyOf(btn)!==opened)continue;
   slot.hidden=false;row.classList?.add?.("evoMovesOpen");
   btn.setAttribute?.("aria-expanded","true");
   slot.innerHTML=cache.get(opened)||
    '<div class="evoMoveCaution">Consultando golpes PvP...</div>';
  }
 }
 function render(name,league,mega,reference,data){
  const title='<div class="evoMoveTitle"><b>'+esc(name)+'</b> · '+
   esc(leagues[league]||league)+(mega?' · Megaedição':"")+'</div>';
  const projection=reference?'<div class="evoMoveCaution">Projeção teórica: não garante que a fantasia/forma possa evoluir ou aprender estes golpes.</div>':"";
  if(!data)return title+projection+
   '<div class="evoMoveCaution">Golpes recomendados não confirmados para esta espécie e liga.</div>';
  if(mega&&data.megaRecommendation!==true)return title+projection+
   '<div class="evoMoveCaution">Recomendação da Megaedição não verificada.</div>';
  if(data.availableOnly===true||data.recommended===false)return title+projection+
   '<div class="evoMoveCaution">Só há dados de golpes possíveis; nenhum conjunto PvP recomendado foi confirmado.</div>';
  if(!data.fast||!Array.isArray(data.charged)||!data.charged.length)return title+projection+
   '<div class="evoMoveCaution">Conjunto PvP não confirmado.</div>';
  function line(label,m){
   if(!m)return "";
   const valid=m.localeVerified===true&&m.name&&m.name!=="—";
   const shade=Object.prototype.hasOwnProperty.call(color,m.type)?color[m.type]:color.normal;
   // An Elite Charged move gets the actual Elite Charged TM symbol.
   // A historical legacy move is not proof that Elite TM can obtain it.
   const mtSymbol=m.status==="elite"?
    '<img class="evoMoveMtIcon" src="ui-icons/'+
    (label==="Ágil"?"mt-agil-elite-lt265.png":"mt-carregada-elite-lt265.png")+
    '" alt="" aria-hidden="true">':"";
   const legacyNote=m.status==="legacy"?
    '<small class="evoMoveLegacy">Legado · MT não confirmada</small>':"";
   const fast=label==="Ágil";
   const verified=valid&&["normal","elite","legacy"].includes(m.status);
   // Normal fast/charged have distinct neutral icons; Elite retains exact
   // user-provided image. Grey means unverified, never "has no Elite".
   const badge=root.PokeSearchMovePanel?.mtBadge?.(fast,verified?m.status:"unknown")||
    (mtSymbol?'<span aria-label="MT de Elite identificada">'+mtSymbol+'</span>':legacyNote);
   const numbers=valid?root.PokeSearchMovePanel?.recommendationMetrics?.(m,fast)||"":"";
   return '<div class="evoMoveDetailGroup"><div class="evoMoveItem"><span>'+esc(label)+':</span> '+
    '<strong style="color:'+shade+'">'+(valid?esc(m.name):"Não confirmado")+'</strong>'+
    badge+'</div>'+numbers+'</div>';
  }
  return title+projection+
   line("Ágil",data.fast)+data.charged.slice(0,2).map((move,i)=>line("C"+(i+1),move)).join("");
 }
 function applyStatus(btn,data){
  if(!data||data.availableOnly===true||!data.fast||
     !Array.isArray(data.charged)||!data.charged.length)return;
  const moves=[data.fast,...data.charged.slice(0,2)];
  // Legacy means a historical move, but DOES NOT prove an Elite TM
  // is obtainable. Leave the icon grey until Elite/normal is confirmed.
  if(moves.some(m=>!["normal","elite"].includes(m?.status)))return;
  const mt=moves.some(m=>m.status==="elite")?"elite":"normal";
  btn.dataset.psMt=mt;
  btn.title=btn.title+" · status do conjunto confirmado";
 }
 // LT296: preload the MT verdict for each exact form/league without opening
 // its recommendations. Unknown/legacy-only must remain grey, not normal.
 function syncStatus(key,mt){
  for(const row of bodyRows()){
   const btn=row.querySelector?.(".evoMovesAction");
   if(!btn||keyOf(btn)!==key)continue;
   btn.dataset.psMt=mt;
   btn.title=(mt==="elite"?"MT de Elite identificada: ":
    mt==="normal"?"Golpes sem MT de Elite/legado: ":
    "Estado da MT ainda não confirmado: ")+String(btn.dataset.psName||"");
   btn.setAttribute?.("aria-label",btn.title);
  }
 }
 function prime(){
  const engine=root.PokeSearchPvpRankMoves;
  if(typeof engine?.getStatus!=="function")return false;
  const identity=scope;
  for(const row of bodyRows()){
   const btn=row.querySelector?.(".evoMovesAction");
   if(!btn)continue;
   const key=keyOf(btn);
   if(statusCache.has(key)){
    syncStatus(key,statusCache.get(key)?.mt||"unknown");continue;
   }
   const name=String(btn.dataset.psName||"").trim();
   const league=String(btn.dataset.psLeague||"");
   const mega=btn.dataset.psMega==="true";
   if(!name||!Object.prototype.hasOwnProperty.call(leagues,league))continue;
   statusCache.set(key,{mt:"unknown",pending:true});
   Promise.resolve().then(()=>engine.getStatus(league,name,mega)).then(status=>{
    if(scope!==identity)return;
    const mt=status?.verified===true&&["elite","normal"].includes(status.mt)?
     status.mt:"unknown";
    statusCache.set(key,{mt,pending:false});
    syncStatus(key,mt);
   }).catch(()=>{if(scope===identity)statusCache.set(key,{mt:"unknown",pending:false});});
  }
  return true;
 }
 async function open(event,button){
  event?.preventDefault?.();event?.stopPropagation?.();
  const row=button?.closest?.(".evoLine");
  const slot=row?.querySelector?.(".evoMoveDetails");
  if(!row||!slot)return false;
  const name=String(button.dataset.psName||"").trim().slice(0,90);
  const league=String(button.dataset.psLeague||"");
  const mega=button.dataset.psMega==="true";
  const reference=button.dataset.psReference==="true";
  if(!name||!Object.prototype.hasOwnProperty.call(leagues,league))return false;
  const key=keyOf(button);
  if(opened===key&&!slot.hidden){close();root.resizeEvolutionPanel?.();return true;}
  close();opened=key;
  const ticket=++sequence,identity=scope;
  const oldTop=root.document?.getElementById?.("movesPopover");
  if(oldTop)oldTop.hidden=true;
  restore();
  root.resizeEvolutionPanel?.();
  if(cache.has(key))return true;
  try{
   const engine=root.PokeSearchPvpRankMoves;
   const data=mega?await engine?.lookupMega?.(league,name):
    await engine?.lookup?.(league,name);
   if(ticket!==sequence||scope!==identity||opened!==key)return false;
   cache.set(key,render(name,league,mega,reference,data));
   restore();
   if(data)for(const r of bodyRows()){
    const b=r.querySelector?.(".evoMovesAction");
    if(b&&keyOf(b)===key)applyStatus(b,data);
   }
   root.resizeEvolutionPanel?.();return true;
  }catch(_){
   if(ticket!==sequence||scope!==identity||opened!==key)return false;
   cache.set(key,render(name,league,mega,reference,null));
   restore();root.resizeEvolutionPanel?.();return false;
  }
 }
 const api=Object.freeze({open,close,restore,setScope,prime,render});
 root.PokeSearchEvolutionMoves=api;
 root.toggleEvolutionMoves=open;
})(typeof window!=="undefined"?window:globalThis);
