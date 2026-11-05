/* LT240 · PvP explorer extras. Pinned local game master and PvPoke data;
 * never infer species ranks from IV ranks, no remote scans, no credentials. */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchLt240=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const safe=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
 const normal=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
 const pct=s=>Number(String(s||"").replace(",",".").replace("%",""));
 const SOURCE_REV="e02bde78d19be9b9099b5a6629c6a8d0835a53be";
 const limits=[1,5,10,50];
 function search(rows,kind,query){
  const q=String(query||"").trim();
  if(!q||!Array.isArray(rows))return null;
  const iv=q.match(/^(?:iv[:\s]*)?((?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5]))$/i);
  if(iv&&kind==="class"){
   const row=rows.find(r=>r.iv===iv[1]);
   return row?{rank:row.rank,reason:"IV "+iv[1]}:null;
  }
  const rank=q.match(/^(?:#|rank\s*#?\s*)(\d{1,4})$/i);
  if(rank){
   const row=rows.find(r=>r.rank===Number(rank[1]));
   return row?{rank:row.rank,reason:"Rank #"+row.rank}:null;
  }
  const efficiency=q.match(/^(\d{1,3}(?:[.,]\d{1,2})?)\s*%?$/);
  if(efficiency&&kind==="class"){
   const value=pct(efficiency[1]);if(value<0||value>100)return null;
   const match=rows.find(r=>pct(r.efficiency)<=value);
   return match?{rank:match.rank,reason:"Eficiência ≤ "+value.toFixed(2).replace(".",",")+"%"}:null;
  }
  if(kind==="overall"&&q.length>=2){
   const found=rows.find(r=>normal(r.name)===normal(q))||
    rows.find(r=>normal(r.name).includes(normal(q)));
   return found?{rank:found.rank,reason:"Pokémon "+found.name}:null;
  }
  return null;
 }
 function forms(gm,ranker,league,iv,names,max=12){
  if(!gm||!ranker||!Array.isArray(names)||!/^([0-9]|1[0-5])\/([0-9]|1[0-5])\/([0-9]|1[0-5])$/.test(String(iv||"")))return [];
  const visited=new Set(),result=[];
  for(const x of names.slice(0,32)){
   const name=typeof x==="string"?x:String(x?.name||"");
   const key=normal(name);
   if(!name||visited.has(key))continue;visited.add(key);
   const rows=ranker.getIvRows(gm,name,league);
   const chosen=rows?.find(r=>r.iv===iv);
   if(chosen)result.push({name,rank:chosen.rank,level:chosen.level,cp:chosen.cp,
    efficiency:chosen.efficiency,mega:/^(Mega )|(\(Mega(?: [XY])?\))$/i.test(name)});
   if(result.length>=Math.min(12,Math.max(1,max)))break;
  }
  return result.sort((a,b)=>a.rank-b.rank||b.cp-a.cp);
 }
 function topHighlights(payload,limit=10){
  if(!payload||!Array.isArray(payload.leagues)||!limits.includes(limit))return [];
  const hits=[],seen=new Set();
  for(const league of payload.leagues){
   if(!["gl","ul","ml"].includes(league?.league))continue;
   const candidates=[
    ...(league.own?[{...league.own,name:payload.name,kind:"Normal"}]:[]),
    ...(Array.isArray(league.evolutions)?league.evolutions.map(x=>({...x,kind:"Evolução"})):[]),
    ...(Array.isArray(league.megas)?league.megas.filter(x=>x.megaProjection===true).map(x=>({...x,kind:"Mega projetada"})):[])
   ];
   for(const v of candidates){
    const r=Number(v?.rank),id=league.league+":"+normal(v.name);
    if(!Number.isInteger(r)||r<1||r>limit||v.eligible===false||seen.has(id))continue;
    seen.add(id);
    hits.push({league:league.league,name:String(v.name||"").slice(0,80),
     rank:r,kind:v.kind,isProjection:!!v.megaProjection});
   }
  }
  return hits.sort((a,b)=>a.rank-b.rank).slice(0,12);
 }
 function overallDetail(snapshot,league,id){
  const raw=snapshot?.details?.[league]?.[id];
  if(!raw||!Number.isFinite(raw.score))return null;
  const row=(snapshot[league]||[]).find(x=>x[0]===id);
  if(!row)return null;
  return {score:raw.score,moveset:Array.isArray(raw.moveset)?raw.moveset.slice(0,3):[],
   wins:Array.isArray(raw.wins)?raw.wins.slice(0,3):[],
   counters:Array.isArray(raw.counters)?raw.counters.slice(0,3):[],
   sourceDate:snapshot.sourceDates?.[league]||snapshot.retrieved};
 }
 function verifySnapshot(gm,overall){
  const bad=[];
  if(!gm||!Array.isArray(gm.cpms)||gm.cpms.length<99||
   !Array.isArray(gm.pokemon)||gm.pokemon.length<1700)bad.push("game master");
  for(const league of ["gl","ul","ml"]){
   if(!Array.isArray(overall?.[league])||overall[league].length<350||
    overall[league][0]?.[2]!==1)bad.push(league);
  }
  if(gm?.sourceCommit!==SOURCE_REV||overall?.sourceCommit!==SOURCE_REV)bad.push("revisões");
  return {valid:bad.length===0,issues:bad,gameDate:gm?.retrieved||null,
   overallDate:overall?.retrieved||null,sourceCommit:SOURCE_REV};
 }
 function enhance(view,state,engine){
  if(!view||!state||typeof view.querySelector!=="function"||!engine)return;
  const table=view.querySelector(".psrRows");
  if(!table||typeof table.insertAdjacentHTML!=="function")return;
  const self=state,query=String(self.searchQuery||"");
  const meta=state.kind==="overall"?overallDetail(
   (typeof window!=="undefined"?window.POKESEARCH_PVPOKE_OVERALL:null),
   state.league,(state.rows.find(r=>r.rank===(self.overallDetailRank||self.selectedRank))||{}).id):null;
  const controls='<div class="lt240Search"><input id="lt240Query" type="search" maxlength="80"'+
   ' aria-label="Buscar IV, posição ou eficiência" value="'+safe(query)+
   '" placeholder="'+(state.kind==="class"?'0/15/14 · #125 · 99,5%':'Nome Pokémon · #125')+'">'+
   '<button type="button" data-lt240="search">Buscar</button></div>';
  table.insertAdjacentHTML("beforebegin",controls);
  const names=self.formNames||[];
  if(state.kind==="class"&&names.length&&self.ownedIv&&typeof window!=="undefined"){
   const comparison=forms(window.POKESEARCH_PVP_IV_DATA,engine,state.league,self.ownedIv,names);
   if(comparison.length){
    const rows=comparison.map(x=>'<div>'+safe(x.name)+' · <b>#'+x.rank+
     '</b> · '+x.efficiency+'% · Nv. '+x.level+' · PC '+x.cp+
     (x.mega?' · projeção Mega':'')+'</div>').join("");
    table.insertAdjacentHTML("afterend",'<details class="lt240Forms"><summary>Normal × Mega × Evoluções · '+
     comparison.length+'</summary>'+rows+'</details>');
   }
  }
  if(state.kind==="overall"&&meta){
   const items=(list)=>list.map(p=>safe(String(p[0]).replace(/_/g," "))+
    (Number.isFinite(p[1])?' ('+p[1]+')':'')).join(" · ")||"—";
   table.insertAdjacentHTML("afterend",'<div class="lt240Overall">Score PvPoke: <b>'+
    safe(meta.score)+'</b> · Fonte '+safe(meta.sourceDate)+
    '<div>Golpes recomendados (IDs técnicos): '+safe(meta.moveset.join(" / ")||"—")+
    '</div><div>Confrontos favoráveis: '+items(meta.wins)+
    '</div><div>Ameaças: '+items(meta.counters)+
    '</div><small>Golpes em PT-BR e MT Elite: use ⚔️ na análise PvP quando disponível.</small></div>');
  }
  if(!view.lt240Bound && typeof view.addEventListener==="function"){
   view.lt240Bound=true;
   const action=()=>{
    const input=view.querySelector("#lt240Query");
    const current=engine.getState?.();
    if(!input||!current)return;
    current.searchQuery=input.value;
    const found=search(current.rows,current.kind,input.value);
    if(found){
     current.status="Encontrado: "+found.reason;
     if(typeof engine.goToRank==="function")engine.goToRank(found.rank);
    }else{
     current.status="Não encontrado. Use IV A/D/S, #rank ou eficiência.";
     if(typeof engine.redraw==="function")engine.redraw();
    }
   };
   view.addEventListener("click",event=>{
    if(event.target.closest?.('button[data-lt240="search"]')){event.stopPropagation();action();}
    else if(engine.getState?.()?.kind==="overall"){
     const tr=event.target.closest?.("tr[data-ps-row]");
     if(tr){engine.getState().overallDetailRank=Number(tr.dataset.psRow);engine.redraw?.();}
    }
   });
   view.addEventListener("keydown",event=>{
    if(event.key==="Enter"&&event.target?.id==="lt240Query"){event.preventDefault();action();}
   });
  }
  if(typeof document!=="undefined"&&!document.getElementById("lt240CSS")){
   const style=document.createElement("style");style.id="lt240CSS";
   style.textContent='#psRankExplorer .lt240Search{display:flex;gap:4px;margin:5px 0}'+
    '#psRankExplorer .lt240Search input{background:#ffffff17;border:1px solid #ffffff4a;border-radius:6px;min-width:0;flex:1;padding:6px;color:#fff;font:inherit;min-height:30px}'+
    '#psRankExplorer .lt240Search button{min-width:55px}'+
    '#psRankExplorer .lt240Forms,#psRankExplorer .lt240Overall{font-size:9px;border-top:1px solid #ffffff29;padding:5px;line-height:1.6;overflow-wrap:anywhere}'+
    '#psRankExplorer .lt240Forms>summary{cursor:pointer;font-weight:bold}'+
    '@media (max-width:330px){#psRankExplorer{font-size:9px;padding:4px}'+
    '#psRankExplorer .psrRows{max-height:32vh}#psRankExplorer td{padding:4px 1px}}'+
    '@media (min-width:440px){#psRankExplorer .psrRows{max-height:46vh}'+
    '#psRankExplorer button{min-height:31px}#psRankExplorer{font-size:11px}}';
   document.head.appendChild(style);
  }
 }
 return {search,forms,topHighlights,overallDetail,verifySnapshot,enhance,SOURCE_REV};
});
