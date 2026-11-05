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

 const PAGE_SIZE=10;
 const FILTER_LIMITS=[10,50,100,0]; // 0 = full ranking
 let state=null,view=null;
 function pageForRank(rows,rank){
  const index=rows.findIndex(r=>r.rank===rank);
  return index>=0?Math.floor(index/PAGE_SIZE):0;
 }
 const visibleRows=s=>s.filter===0?s.rows:s.rows.slice(0,s.filter);
 function setFilter(s,filter){
  if(!s||!FILTER_LIMITS.includes(filter))return false;
  s.filter=filter;s.page=0;s.expandedRank=null;s.scrollSelected=false;
  return true;
 }
 function jumpToSelected(s){
  if(!s||!Number.isInteger(s.selectedRank)||s.selectedRank<1)return false;
  if(!visibleRows(s).some(r=>r.rank===s.selectedRank))s.filter=0;
  s.page=pageForRank(visibleRows(s),s.selectedRank);
  s.scrollSelected=true;
  return true;
 }
 function toggleComparison(s,rank){
  if(!s||s.kind!=="class")return false;
  if(!s.rows.some(r=>r.rank===rank))return false;
  const i=s.compared.indexOf(rank);
  if(i>=0)s.compared.splice(i,1);
  else{
   if(s.compared.length>=2)s.compared.shift();
   s.compared.push(rank);
  }
  return true;
 }
 function comparedRows(s){
  return s.kind==="class"?s.compared.map(rank=>s.rows.find(r=>r.rank===rank)).filter(Boolean):[];
 }
 const levelString=l=>String(l).replace(".",",");
 const statString=x=>Number(x).toFixed(2).replace(".",",");
 // Prevent formula execution when a third-party ranking name is pasted into Sheets.
 const csvCell=x=>{
  const raw=String(x??"");
  const guarded=/^[\s\t\r]*[=+@-]/.test(raw)?"'"+raw:raw;
  return '"'+guarded.replace(/"/g,'""')+'"';
 };
 function filteredCsv(s){
  const filtered=visibleRows(s);
  const head=s.kind==="class"?
   ["Rank","IVs A/D/S","Nível","PC","Eficiência IV (%)","ATK","DEF","HP"]:
   ["Rank Geral","Pokémon / forma"];
  const out=[head.map(csvCell).join(";")];
  for(const r of filtered){
   const values=s.kind==="class"?
    [r.rank,r.iv,levelString(r.level),r.cp,r.efficiency,
     statString(r.atk),statString(r.def),r.hp]:
    [r.rank,r.name];
   out.push(values.map(csvCell).join(";"));
  }
  return out.join("\r\n");
 }
 function summaryText(s){
  const lines=["PokeSearch · "+(s.kind==="class"?"Rank Classe (IVs)":"Rank Geral (PvP)"),
   s.name+" · "+LIGAS[s.league],
   "Fonte: PvPoke (snapshot "+s.sourceDate+")"];
  if(s.kind==="class"){
   const owned=s.rows.find(r=>r.index===s.selectedIv);
   if(owned)lines.push("Meu IV: #"+owned.rank+" · "+owned.iv+
    " · "+owned.efficiency+"% · PC "+owned.cp+" · Nv. "+levelString(owned.level));
   const selections=comparedRows(s);
   for(const r of selections)
    lines.push("Comparar: #"+r.rank+" · "+r.iv+" · "+r.efficiency+
     "% · Nv. "+levelString(r.level)+" · PC "+r.cp+
     " · ATK "+statString(r.atk)+" · DEF "+statString(r.def)+" · HP "+r.hp);
   if(selections.length===2)
    lines.push("Diferença (2 − 1) · Eficiência "+
     (Number(selections[1].efficiency.replace(",","."))-
      Number(selections[0].efficiency.replace(",","."))).toFixed(2).replace(".",",")+" p.p.");
  }else{
   const owned=s.rows.find(r=>r.rank===s.selectedRank);
   if(owned)lines.push("Posição: #"+owned.rank+" · "+owned.name);
  }
  const showing=visibleRows(s),from=s.page*PAGE_SIZE;
  lines.push("Classificação exibida (página "+(s.page+1)+"):");
  for(const r of showing.slice(from,from+PAGE_SIZE)){
   lines.push(s.kind==="class"?
    "#"+r.rank+" · "+r.iv+" · Nv. "+levelString(r.level)+" · PC "+r.cp+
      " · "+r.efficiency+"%":
    "#"+r.rank+" · "+r.name);
  }
  lines.push("Dados de referência; Mega PvP é projeção matemática, não elegibilidade na Liga GO.");
  return lines.join("\n");
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
   rows.find(r=>n(r.name)===n(name)&&r.rank===Number(opts.rank))||
    rows.find(r=>n(r.name)===n(name)):null;
  const candidateRank=Number(opts.rank);
  const selectedRank=selected?.rank??(Number.isInteger(candidateRank)&&candidateRank>=1&&
   rows.some(r=>r.rank===candidateRank)?candidateRank:null);
  state={kind,name,league:opts.league,rows,selectedIv,selectedRank,filter:0,
   page:pageForRank(rows,selectedRank),compared:[],expandedRank:null,scrollSelected:true,
   sourceDate:sourceFor(kind,gm,overall),status:""};
  if(!mount()){state=null;return false;}
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
   "#psRankExplorer{margin:5px 0;padding:7px;border:1px solid #ffffff45;border-radius:10px;background:rgba(28,34,46,.91);color:#f3f5fa;font:10px/1.35 Roboto,Arial,sans-serif;max-width:100%;overflow:hidden}",
   "#psRankExplorer .psrHead{display:flex;align-items:center;justify-content:space-between;gap:5px}",
   "#psRankExplorer .psrTitle{min-width:0;font-size:11px;font-weight:900}",
   "#psRankExplorer button,#psRankExplorer select{font:inherit;color:inherit;background:#ffffff18;border:1px solid #ffffff3b;border-radius:6px;padding:5px;min-height:27px;max-width:100%}",
   "#psRankExplorer button:focus-visible,#psRankExplorer select:focus-visible,#psRankExplorer tr:focus-visible{outline:2px solid #a9e5c8;outline-offset:1px}",
   "#psRankExplorer button:disabled{opacity:.38}",
   "#psRankExplorer select{background:#303a4b;min-width:72px;max-width:96px}",
   "#psRankExplorer .psrSub{font-size:9px;color:#c3cdda;margin:3px 0 5px;overflow-wrap:anywhere}",
   "#psRankExplorer .psrControls{display:flex;align-items:center;justify-content:space-between;gap:3px;flex-wrap:wrap;margin:4px 0}",
   "#psRankExplorer .psrRows{max-height:min(38vh,260px);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;scrollbar-width:thin}",
   "#psRankExplorer table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:9px;font-variant-numeric:tabular-nums}",
   "#psRankExplorer th{position:sticky;top:0;background:#303948;color:#c8d5df;font-weight:700;z-index:1}",
   "#psRankExplorer th,#psRankExplorer td{padding:6px 2px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:clip;border-bottom:1px solid #ffffff17}",
   "#psRankExplorer td:last-child,#psRankExplorer th:last-child{text-align:right}",
   "#psRankExplorer .psrNum{width:15%}#psRankExplorer .psrIv{width:27%}#psRankExplorer .psrLevel{width:14%}#psRankExplorer .psrCp{width:15%}#psRankExplorer .psrEff{width:29%}",
   "#psRankExplorer tr.psrSelected{background:rgba(68,125,103,.42);color:#edfff7}",
   "#psRankExplorer tr.psrCompared{box-shadow:inset 3px 0 #deb861;background:#ffffff16}",
   "#psRankExplorer tr[data-ps-row]{cursor:pointer;min-height:30px}",
   "#psRankExplorer tr.psrExpanded{background:#ffffff0c}",
   "#psRankExplorer .psrTap{min-height:26px;padding:2px 3px;background:transparent;border:0;color:#a9dfff;text-decoration:underline;text-underline-offset:2px}",
   "#psRankExplorer .psrExtra{font-size:9px;line-height:1.5;padding:6px;color:#dce5ef;white-space:normal;overflow-wrap:break-word}",
   "#psRankExplorer .psrPager{font-size:9px;white-space:nowrap}",
   "#psRankExplorer .psrComparison{margin-top:5px;border:1px solid #ffffff20;border-radius:7px;padding:5px;font-size:9px}",
   "#psRankExplorer .psrComparison strong{display:block;margin-bottom:3px}",
   "#psRankExplorer .psrCompRow{padding:3px 0;border-bottom:1px solid #ffffff18}",
   "#psRankExplorer .psrActions button{flex:1 1 auto;white-space:nowrap}",
   "#psRankExplorer .psrStatus{color:#aadfc0;min-height:12px;margin-top:3px;font-size:9px}",
   "#psRankExplorer .psrFooter{margin:4px 0 0;font-size:8px;color:#a8b4c5;overflow-wrap:anywhere}",
   "#evoBody button.psRankOpen{font:inherit;border:0;background:transparent;padding:2px 3px;cursor:pointer;text-decoration:underline;text-underline-offset:2px}"
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
    const anchor=document.getElementById("evolutions");
    if(!anchor)return false;
    anchor.insertAdjacentElement("afterend",view);
    view.addEventListener("change",evt=>{
     const control=evt.target.closest?.("select[data-ps-filter]");
     if(control&&state&&setFilter(state,Number(control.value)))draw();
    });
    view.addEventListener("click",evt=>{
     const b=evt.target.closest?.("button[data-ps-act]");
     if(b){
      evt.stopPropagation();
      if(!state)return;
      const action=b.dataset.psAct;
      if(action==="close"){close();return;}
      if(action==="prev")state.page=Math.max(0,state.page-1);
      if(action==="next")state.page=Math.min(Math.ceil(visibleRows(state).length/PAGE_SIZE)-1,state.page+1);
      if(action==="top"){state.page=0;state.scrollSelected=false;}
      if(action==="selected")jumpToSelected(state);
      if(action==="expand")state.expandedRank=state.expandedRank===Number(b.dataset.rank)?null:Number(b.dataset.rank);
      if(action==="clear")state.compared=[];
      if(action==="copy")return transfer("copy",summaryText(state));
      if(action==="csv")return transfer("copy",filteredCsv(state));
      if(action==="share")return transfer("share",summaryText(state));
      if(action==="compare")toggleComparison(state,Number(b.dataset.rank));
      draw();
      return;
     }
     const tr=evt.target.closest?.("tr[data-ps-row]");
     if(tr&&state&&toggleComparison(state,Number(tr.dataset.psRow)))draw();
    });
    view.addEventListener("keydown",evt=>{
     const tr=evt.target.closest?.("tr[data-ps-row]");
     if(tr&&(evt.key==="Enter"||evt.key===" ")){
      evt.preventDefault();if(state&&toggleComparison(state,Number(tr.dataset.psRow)))draw();
     }
    });
   }
  }
  view.hidden=false;
  return true;
 }
 function transfer(action,content){
  if(!state)return false;
  const native=typeof window!=="undefined"?window.Native:null;
  try{
   if(native&&typeof native.copyPvpRanking==="function"&&action==="copy"){
    native.copyPvpRanking(content);
    state.status="Enviando ao sistema para copiar…";draw();return true;
   }
   if(native&&typeof native.sharePvpRanking==="function"&&action==="share"){
    native.sharePvpRanking(content);
    state.status="Abrindo compartilhamento Android…";draw();return true;
   }
   const nav=typeof navigator!=="undefined"?navigator:null;
   if(action==="copy"&&nav?.clipboard?.writeText){
    nav.clipboard.writeText(content).then(()=>feedback(true,"copy"))
     .catch(()=>feedback(false,"copy"));
    state.status="Copiando…";draw();return true;
   }
   if(action==="share"&&nav?.share){
    nav.share({title:"Ranking PvP PokeSearch",text:content})
     .then(()=>feedback(true,"share"))
     .catch(()=>feedback(false,"share"));
    state.status="Abrindo compartilhamento…";draw();return true;
   }
  }catch(_error){/* An unavailable Native bridge must not claim success. */}
  state.status="Recurso indisponível nesta versão do Android.";
  draw();return false;
 }
 function feedback(ok,action){
  if(!state)return;
  state.status=ok?(action==="copy"?"✓ Copiado para área de transferência":"✓ Seletor de compartilhamento aberto"):
   "Não foi possível "+(action==="copy"?"copiar":"compartilhar")+".";
  draw();
 }
 function comparisonHtml(s){
  if(s.kind!=="class")return "";
  const rows=comparedRows(s);
  const html=rows.map((r,i)=>'<div class="psrCompRow">'+
   '<b>'+(i+1)+'. #'+r.rank+' · '+safe(r.iv)+'</b> · '+r.efficiency+
   '% · PC '+r.cp+' · Nv. '+levelString(r.level)+
   '<div>ATK '+statString(r.atk)+' · DEF '+statString(r.def)+' · HP '+r.hp+'</div></div>').join("");
  const diff=rows.length===2?
   '<div class="psrCompRow">Diferença 2 − 1: eficiência '+
   (Number(rows[1].efficiency.replace(",","."))-Number(rows[0].efficiency.replace(",",".")))
    .toFixed(2).replace(".",",")+' p.p. · ATK '+statString(rows[1].atk-rows[0].atk)+
    ' · DEF '+statString(rows[1].def-rows[0].def)+' · HP '+(rows[1].hp-rows[0].hp)+
    ' · PC '+(rows[1].cp-rows[0].cp)+'</div>':"";
  return '<section class="psrComparison" aria-label="Comparação de IVs">'+
   '<strong>Comparar IVs · '+rows.length+'/2</strong>'+
   (rows.length?html+diff:'Toque em até duas linhas para comparar.')+
   (rows.length?'<button type="button" data-ps-act="clear">Limpar</button>':"")+'</section>';
 }
 function draw(){
  if(!state||!view)return;
  const s=state,rows=visibleRows(s);
  s.page=Math.min(Math.max(0,s.page),Math.max(0,Math.ceil(rows.length/PAGE_SIZE)-1));
  const oldList=view.querySelector?.(".psrRows");
  const oldScroll=oldList?.scrollTop||0;
  const from=s.page*PAGE_SIZE,subset=rows.slice(from,from+PAGE_SIZE);
  const maxPage=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
  const cells=s.kind==="class"?
   '<th class="psrNum">#</th><th class="psrIv">IVs</th><th class="psrLevel">Nv.</th><th class="psrCp">PC</th><th class="psrEff">Eficiência</th>':
   '<th style="width:17%">#</th><th colspan="4">Pokémon / forma</th>';
  const body=subset.map(r=>{
   const selected=r.rank===s.selectedRank;
   const marked=s.compared.includes(r.rank);
   const markup=s.kind==="class"?
    '<td><button type="button" class="psrTap" data-ps-act="expand" data-rank="'+r.rank+
     '" aria-expanded="'+(s.expandedRank===r.rank)+'" title="Detalhar atributos">#'+r.rank+'</button></td>'+
    '<td><button type="button" class="psrTap" data-ps-act="compare" data-rank="'+r.rank+
     '" aria-pressed="'+marked+'" title="Adicionar ou remover da comparação">'+safe(r.iv)+'</button></td>'+
    '<td>'+levelString(r.level)+'</td><td>'+r.cp+'</td><td>'+r.efficiency+'%</td>':
    '<td>#'+r.rank+'</td><td colspan="4">'+safe(r.name)+'</td>';
   const details=s.kind==="class"&&s.expandedRank===r.rank?
    '<tr class="psrExpanded"><td colspan="5"><div class="psrExtra">ATK '+statString(r.atk)+
    ' · DEF '+statString(r.def)+' · HP '+r.hp+' · Nível '+
    levelString(r.level)+' · PC '+r.cp+'</div></td></tr>':"";
   return '<tr data-ps-row="'+r.rank+'" tabindex="0"'+(selected?' data-ps-owned="true"':'')+
    ' class="'+(selected?'psrSelected ':'')+(marked?'psrCompared':'')+
    '" aria-label="'+safe(s.kind==="class"?"Rank "+r.rank+", IV "+r.iv:"Rank "+r.rank+", "+r.name)+'">'+
     markup+'</tr>'+details;
  }).join("");
  const select=s.kind==="class"?"Meu IV":"Minha posição";
  view.innerHTML='<div class="psrHead"><div class="psrTitle">'+
   (s.kind==="class"?"Rank Classe · IVs":"Rank Geral · PvP")+
   '</div><button type="button" data-ps-act="close" aria-label="Fechar classificação">✕</button></div>'+
   '<div class="psrSub">'+safe(s.name)+' · '+safe(LIGAS[s.league])+
   (s.selectedRank?' · #'+s.selectedRank:"")+'</div>'+
   '<div class="psrControls"><button type="button" data-ps-act="top">#1 Topo</button>'+
   '<button type="button" data-ps-act="selected"'+(s.selectedRank?'':' disabled')+'>'+select+'</button>'+
   '<label for="psrFilter">Top</label><select id="psrFilter" data-ps-filter aria-label="Filtrar classificação">'+
   FILTER_LIMITS.map(n=>'<option value="'+n+'"'+(s.filter===n?' selected':'')+'>'+
    (n?n:"Todos")+'</option>').join("")+'</select></div>'+
   '<div class="psrRows" role="region" aria-label="Linhas da classificação" tabindex="0">'+
   '<table><thead><tr>'+cells+'</tr></thead><tbody>'+body+'</tbody></table></div>'+
   '<div class="psrControls"><button type="button" data-ps-act="prev"'+(s.page===0?' disabled':'')+
   '>‹</button><span class="psrPager">Pág. '+(s.page+1)+'/'+maxPage+
   ' · '+(from+1)+'–'+Math.min(from+PAGE_SIZE,rows.length)+' / '+rows.length+'</span>'+
   '<button type="button" data-ps-act="next"'+(s.page===maxPage-1?' disabled':'')+'>›</button></div>'+
   comparisonHtml(s)+
   '<div class="psrControls psrActions"><button type="button" data-ps-act="copy">Copiar</button>'+
   '<button type="button" data-ps-act="share">Compartilhar</button>'+
   '<button type="button" data-ps-act="csv" title="Copiar CSV do filtro, com todas as linhas filtradas">CSV</button></div>'+
   '<div class="psrStatus" role="status" aria-live="polite">'+safe(s.status)+'</div>'+
   '<div class="psrFooter">PvPoke snapshot '+safe(s.sourceDate)+
   (s.kind==="class"?' · Nv. máximo 50, sem melhor amigo':' · Posição da espécie, não dos IVs')+
   '</div>';
  const newList=view.querySelector?.(".psrRows");
  if(newList){
   newList.scrollTop=oldScroll;
   if(s.scrollSelected){
    const found=newList.querySelector?.('tr[data-ps-owned="true"]');
    if(found)newList.scrollTop=Math.max(0,found.offsetTop-(newList.clientHeight||0)/2);
    s.scrollSelected=false;
   }
  }
  if(typeof window!=="undefined"&&typeof window.resizeEvolutionPanel==="function")
   window.resizeEvolutionPanel();
 }
 return {open,close,getIvRows,getOverallRows,ivIndex,megaName,pageForRank,
  setFilter,jumpToSelected,toggleComparison,comparedRows,visibleRows,filteredCsv,summaryText,feedback};

});
