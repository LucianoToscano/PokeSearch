/* LT238: local, on-demand IV-class and species-overall ranking explorer.
 * Uses the same pinned PvPoke snapshots as dock.html. No network/auth/coords. */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchRankExplorer=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const LIGAS={gl:"Grande Liga",ul:"Ultra Liga",ml:"Liga Mestra"};
 const safe=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
 const n=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 const megaName=name=>{
  const s=String(name||"").trim(),m=s.match(/^Mega (.+?)(?: ([XY]))?$/i);
  return m?m[1]+" (Mega"+(m[2]?" "+m[2].toUpperCase():"")+")":s;
 };
 const ivIndex=iv=>{
  const m=String(iv||"").match(/^(1[0-5]|[0-9])\/(1[0-5]|[0-9])\/(1[0-5]|[0-9])$/);
  return m?Number(m[1])*256+Number(m[2])*16+Number(m[3]):-1;
 };
 const cache=new Map();
 function getIvRows(gm,name,league){
  if(!gm||!Array.isArray(gm.pokemon)||!Array.isArray(gm.cpms)||
     gm.cpms.length<99||!LIGAS[league])return null;
  const key=n(megaName(name)),species=gm.pokemon.filter(p=>p&&n(p[1])===key);
  if(species.length!==1)return null; // Fail closed on ambiguous forms.
  const [id,,baseAtk,baseDef,baseHp]=species[0];
  if(![baseAtk,baseDef,baseHp].every(x=>Number.isFinite(x)&&x>0))return null;
  const cacheKey=String(gm.retrieved||"")+":"+id+":"+league;
  if(cache.has(cacheKey))return cache.get(cacheKey);
  const cap=league==="gl"?1500:league==="ul"?2500:Infinity;
  const cpms=gm.cpms,scale=cpms.map(x=>x*x),result=[];
  for(let a=0;a<16;a++)for(let d=0;d<16;d++)for(let h=0;h<16;h++){
   const atk=baseAtk+a,def=baseDef+d,hp=baseHp+h;
   const cpFactor=atk*Math.sqrt(def*hp)/10;
   let lo=0,hi=cpms.length-1,best=-1;
   while(lo<=hi){
    const mid=(lo+hi)>>1,cp=Math.max(10,Math.floor(cpFactor*scale[mid]));
    if(cp<=cap){best=mid;lo=mid+1;}else hi=mid-1;
   }
   if(best<0)continue;
   const cpm=cpms[best],battleHp=Math.max(10,Math.floor(hp*cpm));
   result.push({
    index:a*256+d*16+h,iv:a+"/"+d+"/"+h,level:1+best/2,
    cp:Math.max(10,Math.floor(cpFactor*scale[best])),
    atk:atk*cpm,def:def*cpm,hp:battleHp,
    product:atk*def*battleHp*scale[best]
   });
  }
  result.sort((a,b)=>b.product-a.product||a.index-b.index);
  if(!result.length)return null;
  const maximum=result[0].product;
  result.forEach((r,i)=>{
   r.rank=i+1;
   r.efficiency=(Math.min(10000,Math.round(r.product/maximum*10000))/100).toFixed(2).replace(".",",");
  });
  cache.set(cacheKey,result);
  return result;
 }
 function getOverallRows(snapshot,league){
  if(!snapshot||!LIGAS[league]||!Array.isArray(snapshot[league]))return null;
  return snapshot[league].filter(e=>Array.isArray(e)&&typeof e[1]==="string"&&
   Number.isInteger(e[2])&&e[2]>=1).map(e=>({id:e[0],name:e[1],rank:e[2]}))
   .sort((a,b)=>a.rank-b.rank);
 }
 let state=null,view=null;
 function pageForRank(rows,rank){
  const index=rows.findIndex(r=>r.rank===rank);
  return index>=0?Math.floor(index/10):0;
 }
 function sourceFor(kind,gm,overall){
  return kind==="class"?(gm?.retrieved||"sem data"):overall?.retrieved||"sem data";
 }
 function open(opts){
  if(typeof document==="undefined"||!opts||!LIGAS[opts.league])return false;
  const rootWindow=typeof window!=="undefined"?window:{};
  const gm=opts.gm||rootWindow.POKESEARCH_PVP_IV_DATA;
  const overall=opts.overall||rootWindow.POKESEARCH_PVPOKE_OVERALL;
  const kind=opts.kind==="overall"?"overall":"class";
  const name=String(opts.name||"").slice(0,100);
  const rows=kind==="class"?getIvRows(gm,name,opts.league):getOverallRows(overall,opts.league);
  if(!rows||!rows.length)return false;
  const selectedIv=ivIndex(opts.iv);
  const selected=kind==="class"&&selectedIv>=0?
   rows.find(r=>r.index===selectedIv):kind==="overall"?
   rows.find(r=>n(r.name)===n(name)):null;
  const selectedRank=selected?.rank??(Number.isInteger(Number(opts.rank))?
   Number(opts.rank):null);
  state={kind,name,league:opts.league,rows,selectedIv,selectedRank,
   page:pageForRank(rows,selectedRank),expandedRank:null,sourceDate:sourceFor(kind,gm,overall)};
  mount();
  draw();
  return true;
 }
 function close(){
  if(view)view.hidden=true;
  state=null;
  if(typeof window!=="undefined"&&typeof window.resizeEvolutionPanel==="function")
   window.resizeEvolutionPanel();
 }
 function style(){
  if(document.getElementById("psRankExplorerCSS"))return;
  const css=document.createElement("style");css.id="psRankExplorerCSS";
  css.textContent=[
   "#psRankExplorer[hidden]{display:none!important}",
   "#psRankExplorer{margin:5px 0;padding:5px;border:1px solid #ffffff47;border-radius:10px;background:rgba(28,34,46,.94);color:#f3f5fa;font:10px Roboto,Arial,sans-serif}",
   "#psRankExplorer .psrHead{display:flex;align-items:center;justify-content:space-between;gap:3px}",
   "#psRankExplorer .psrTitle{min-width:0;font-size:11px;font-weight:900;line-height:1.2}",
   "#psRankExplorer button{font:inherit;color:inherit;background:#ffffff1c;border:1px solid #ffffff34;border-radius:5px;padding:4px 5px;min-height:24px}",
   "#psRankExplorer button:focus-visible{outline:2px solid #a9e5c8}",
   "#psRankExplorer .psrSub{font-size:9px;color:#c3cdda;margin:3px 0 5px}",
   "#psRankExplorer .psrControls{display:flex;align-items:center;justify-content:space-between;gap:3px;margin:4px 0}",
   "#psRankExplorer .psrRows{max-height:min(43vh,265px);overflow:auto;overscroll-behavior:contain;touch-action:pan-y}",
   "#psRankExplorer table{width:100%;border-collapse:collapse;font-size:9px;font-variant-numeric:tabular-nums}",
   "#psRankExplorer th{position:sticky;top:0;background:#303948;color:#c8d5df;font-weight:600}",
   "#psRankExplorer th,#psRankExplorer td{padding:5px 2px;text-align:left;white-space:nowrap;border-bottom:1px solid #ffffff16}",
   "#psRankExplorer td:last-child,#psRankExplorer th:last-child{text-align:right}",
   "#psRankExplorer tr.psrSelected{background:#43816c66;color:#edfff7}",
   "#psRankExplorer tr.psrExpanded{background:#ffffff0e}",
   "#psRankExplorer .psrTap{min-height:20px;padding:2px 3px;background:transparent;border:0;color:#9bd5ff;text-decoration:underline}",
   "#psRankExplorer .psrExtra{font-size:9px;line-height:1.4;padding:6px;color:#dce5ef}",
   "#psRankExplorer .psrPager{font-size:9px;white-space:nowrap}",
   "#psRankExplorer .psrFooter{margin:5px 0 0;font-size:8px;color:#a8b4c5}",
   "#evoBody button.psRankOpen{font:inherit;border:0;background:transparent;padding:2px 3px;cursor:pointer;text-decoration:underline;text-underline-offset:2px}",
   "#evoBody button.psRankOpen:focus-visible{outline:2px solid #9bd5ff;border-radius:3px}",
   "#evoBody button.evoClass{color:#a8ddff}",
   "#evoBody button.evoOverall{color:#dce7f1}"
  ].join("\n");
  document.head.appendChild(css);
 }
 function mount(){
  style();
  if(!view){
   view=document.getElementById("psRankExplorer");
   if(!view){
    view=document.createElement("section");view.id="psRankExplorer";
    view.setAttribute("aria-label","Explorar rankings PvP");
    const panel=document.getElementById("panel"),anchor=document.getElementById("evolutions");
    if(!panel||!anchor)return;
    anchor.insertAdjacentElement("afterend",view);
    view.addEventListener("click",evt=>{
     const b=evt.target.closest("button[data-ps-act]");
     if(!b)return;
     evt.stopPropagation();
     const action=b.dataset.psAct;
     if(action==="close")close();
     else if(state){
      const maxPage=Math.max(0,Math.ceil(state.rows.length/10)-1);
      if(action==="prev")state.page=Math.max(0,state.page-1);
      if(action==="next")state.page=Math.min(maxPage,state.page+1);
      if(action==="top")state.page=0;
      if(action==="selected")state.page=pageForRank(state.rows,state.selectedRank);
      if(action==="expand")state.expandedRank=state.expandedRank===Number(b.dataset.rank)?null:Number(b.dataset.rank);
      draw();
     }
    });
   }
  }
  view.hidden=false;
 }
 function draw(){
  if(!state||!view)return;
  const {kind,rows,name,league,page,selectedRank,expandedRank}=state;
  const from=page*10,subset=rows.slice(from,from+10),maxPage=Math.ceil(rows.length/10);
  const cells=kind==="class"?
   '<th>#</th><th>IV</th><th>Nv.</th><th>PC</th><th>Ef.</th>':
   '<th>#</th><th colspan="4">Pokémon / forma</th>';
  const body=subset.map(r=>{
   const selected=r.rank===selectedRank;
   const markup=kind==="class"?
    '<td><button class="psrTap" data-ps-act="expand" data-rank="'+r.rank+'" aria-expanded="'+(expandedRank===r.rank)+'">#'+r.rank+'</button></td>'+
    '<td>'+safe(r.iv)+'</td><td>'+String(r.level).replace(".",",")+'</td>'+
    '<td>'+r.cp+'</td><td>'+r.efficiency+'%</td>':
    '<td>#'+r.rank+'</td><td colspan="4">'+safe(r.name)+'</td>';
   const details=kind==="class"&&expandedRank===r.rank?
    '<tr class="psrExpanded"><td colspan="5"><div class="psrExtra">ATK '+r.atk.toFixed(2).replace(".",",")+
    ' · DEF '+r.def.toFixed(2).replace(".",",")+' · HP '+r.hp+
    ' · Nível '+String(r.level).replace(".",",")+' · PC '+r.cp+'</div></td></tr>':"";
   return '<tr'+(selected?' class="psrSelected"':'')+'>'+markup+'</tr>'+details;
  }).join("");
  const heading=kind==="class"?"Rank Classe · IVs":"Rank Geral · PvP";
  view.innerHTML='<div class="psrHead"><div class="psrTitle">'+heading+'</div>'+
   '<button data-ps-act="close" aria-label="Fechar classificação">✕</button></div>'+
   '<div class="psrSub">'+safe(name)+' · '+LIGAS[league]+
   (selectedRank?' · posição #'+selectedRank:"")+'</div>'+
   '<div class="psrControls"><button data-ps-act="top">#1 Topo</button>'+
   '<button data-ps-act="selected"'+(selectedRank?'':' disabled')+'>Meu rank</button>'+
   '<span class="psrPager">Pág. '+(page+1)+'/'+maxPage+'</span></div>'+
   '<div class="psrRows"><table><thead><tr>'+cells+'</tr></thead><tbody>'+body+'</tbody></table></div>'+
   '<div class="psrControls"><button data-ps-act="prev"'+(page===0?' disabled':'')+'>‹ Anterior</button>'+
   '<span class="psrPager">'+(from+1)+'–'+Math.min(from+10,rows.length)+' / '+rows.length+'</span>'+
   '<button data-ps-act="next"'+(page===maxPage-1?' disabled':'')+'>Próxima ›</button></div>'+
   '<div class="psrFooter">PvPoke snapshot '+safe(state.sourceDate)+
   (kind==="class"?' · 4096 IVs · Nv. máximo 50, sem melhor amigo':' · Ranking geral das espécies, não dos IVs')+
   '</div>';
  if(typeof window!=="undefined"&&typeof window.resizeEvolutionPanel==="function"){
   window.resizeEvolutionPanel();
   if(typeof view.scrollIntoView==="function")view.scrollIntoView({block:"nearest"});
  }
 }
 return {open,close,getIvRows,getOverallRows,ivIndex,megaName,pageForRank};
});
