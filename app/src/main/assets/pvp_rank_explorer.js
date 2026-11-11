/* LT238: local, on-demand IV-class and species-overall ranking explorer.
 * Uses the same pinned PvPoke snapshots as dock.html. No network/auth/coords. */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchRankExplorer=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const LIGAS={gl:"Grande Liga",ul:"Ultra Liga",ml:"Liga Mestra",lc:"Copa Pequena"};
 const PVP_LEAGUE_ICONS={gl:"ps-gl-lt268.png",ul:"ps-ul-lt268.png",ml:"ps-ml-lt268.png",lc:"ps-cup-lt268.png"};
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
     gm.cpms.length<99||!["gl","ul","ml"].includes(league))return null;
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
  // LT240: bound memory on 4 GB devices; new comparisons may cover many forms.
  while(cache.size>12)cache.delete(cache.keys().next().value);
  return result;
 }

 // LT284: compare two hypothetical IVs with the EXACT same pinned 4096-row
 // Class ranking used by the interactive explorer, not an inferred formula.
 // A/B is ephemeral and never edits the capture, account or provider search.
 function compareIv(gm,name,ivA,ivB,overall){
  const ai=ivIndex(ivA),bi=ivIndex(ivB);
  if(ai<0||bi<0||!String(name||"").trim())return null;
  const out=[];
  for(const league of ["gl","ul","ml"]){
   const rows=getIvRows(gm,name,league);
   if(!rows){
    out.push({league,verified:false,overallRank:null});
    continue;
   }
   const a=rows.find(x=>x.index===ai),b=rows.find(x=>x.index===bi);
   if(!a||!b){
    out.push({league,verified:false,overallRank:null});
    continue;
   }
   // Rank Geral belongs to the species/form, not the IV: exact unique match only.
   const matches=(getOverallRows(overall,league)||[]).filter(
    x=>n(x.name)===n(megaName(name)));
   const overallRank=matches.length===1?matches[0].rank:null;
   const pick=x=>({rank:x.rank,efficiency:x.efficiency,cp:x.cp,
    level:x.level,iv:x.iv});
   const diff=a.product-b.product;
   const tolerance=1e-10*Math.max(1,Math.abs(a.product),Math.abs(b.product));
   out.push({league,verified:true,a:pick(a),b:pick(b),
    better:Math.abs(diff)<=tolerance?"empate":diff>0?"a":"b",
    overallRank});
  }
  return out.some(x=>x.verified)?out:null;
 }
 // LT327: canonicalize three verified ID/name conflicts without modifying
 // any PvPoke rank, tier, source ID, or the immutable snapshot.
 const PVP_OVERALL_CANONICAL_NAMES=Object.freeze({
  aegislash_shield:"Aegislash (Shield)",
  morpeko_full_belly:"Morpeko (Full Belly)",
  mimikyu:"Mimikyu",
  mime_jr:"Mime Jr."
 });
 function getOverallRows(snapshot,league){
  if(!snapshot||!LIGAS[league]||!Array.isArray(snapshot[league]))return null;
  return snapshot[league].filter(e=>Array.isArray(e)&&typeof e[1]==="string"&&
   Number.isInteger(e[2])&&e[2]>=1).map(e=>({
    id:e[0],name:PVP_OVERALL_CANONICAL_NAMES[e[0]]||e[1],rank:e[2]
   })).sort((a,b)=>a.rank-b.rank);
 }

 const PAGE_SIZE=10;
 const FILTER_LIMITS=[10,50,100,0]; // 0 = full ranking
 let state=null,view=null,openKey="",lastDrawState=null;
 const clickKey=opts=>opts?.railKey||[opts?.kind==="overall"?"overall":"class",
  n(opts?.name||""),String(opts?.league||""),Number(opts?.rank)||0].join("|");
 function pageForRank(rows,rank){
  const index=rows.findIndex(r=>r.rank===rank);
  return index>=0?Math.floor(index/PAGE_SIZE):0;
 }
 const visibleRows=s=>s.filter===0?s.rows:s.rows.slice(0,s.filter);
 function setFilter(s,filter){
  if(!s||!FILTER_LIMITS.includes(filter))return false;
  s.filter=filter;s.page=0;s.expandedRank=null;s.scrollSelected=false;
  s.resetTableScroll=true;
  return true;
 }
 function jumpToSelected(s){
  if(!s||!Number.isInteger(s.selectedRank)||s.selectedRank<1)return false;
  if(!visibleRows(s).some(r=>r.rank===s.selectedRank))s.filter=0;
  s.page=pageForRank(visibleRows(s),s.selectedRank);
  s.resetTableScroll=true;s.scrollSelected=true;
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
 // Families are only a navigation aid, never evidence that an unknown
 // event form can evolve. Order verified species by the pinned evolution graph.
 function orderedFamily(name,gm){
  const host=typeof window!=="undefined"?window:{};
  const catalogue=host.PokeSearchPvpFamilyCatalog;
  const forms=typeof catalogue?.family==="function"?
   catalogue.family(name,gm,true):[];
  const values=[...new Set([String(name||""),...forms].filter(Boolean))].slice(0,30);
  const normal=values.filter(x=>!/\(Mega(?: [XY])?\)$/i.test(x));
  const megas=values.filter(x=>/\(Mega(?: [XY])?\)$/i.test(x));
  const links=catalogue?.links||[],present=new Set(normal.map(n));
  const incoming=new Set(links.filter(([from,to])=>present.has(n(from))&&present.has(n(to)))
   .map(([,to])=>n(to)));
  const ordered=[],seen=new Set();
  const walk=value=>{
   if(!value||seen.has(n(value)))return;
   seen.add(n(value));ordered.push(value);
   for(const [from,to] of links)if(n(from)===n(value)&&present.has(n(to)))
    walk(normal.find(v=>n(v)===n(to)));
  };
  normal.filter(x=>!incoming.has(n(x))).forEach(walk);
  normal.forEach(walk);
  return [...ordered,...megas].slice(0,24);
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
  const selectedRank=selected?.rank??(kind==="class"&&Number.isInteger(candidateRank)&&candidateRank>=1&&
   rows.some(r=>r.rank===candidateRank)?candidateRank:null);
  state={kind,name,league:opts.league,rows,selectedIv,selectedRank,filter:0,
   iv:opts.iv,overall,railKey:opts.railKey||"",
   // LT276: both Rank Classe (4096 IVs) and Rank Geral have a league picker.
   // Class keeps the same selected species/IV; each league recalculates its
   // own rank/CP/level/efficiency from the pinned Game Master (not the GL rank).
   leagueOptions:(kind==="overall"?["gl","ul","ml","lc"]:["gl","ul","ml"]).map(league=>({
    league,name,rank:(getOverallRows(overall,league)||[]).find(x=>n(x.name)===n(name))?.rank||null,
    available:kind==="overall"?!!getOverallRows(overall,league)?.length:!!getIvRows(gm,name,league)?.length
   })),
   family:kind==="overall"?(Array.isArray(opts.family)&&opts.family.length?opts.family.slice(0,24):orderedFamily(name,gm)):[],
   forms:Array.isArray(opts.forms)?opts.forms.slice(0,36):[],gm,
   page:pageForRank(rows,selectedRank),compared:[],expandedRank:null,
   scrollSelected:true,resetTableScroll:true,
   sourceDate:sourceFor(kind,gm,overall),status:""};
  if(!mount()){state=null;openKey="";return false;}
  openKey=clickKey(opts);
  draw();
  return true;
 }
 // LT252: tap a selected class/overall chip again to collapse the panel.
 // Changing form, league or rank switches directly without extra windows.
 function toggle(opts){
  if(state&&view&&!view.hidden&&openKey===clickKey(opts)){
   close();return true;
  }
  return open(opts);
 }
 function switchClassLeague(league){
  if(!state||state.kind!=="class"||!LIGAS[league])return false;
  if(league===state.league){draw();return true;}
  const target=state.leagueOptions.find(x=>x.league===league);
  if(!target?.available)return false;
  const opts={kind:"class",league,name:state.name,iv:state.iv,
   forms:state.forms,gm:state.gm,overall:state.overall,railKey:state.railKey};
  // Reopen only when valid data exist: recompute the selected IV and reset
  // page, filter and comparisons; never carry an unrelated league's rank.
  if(!open(opts))return false;
  if(typeof window!=="undefined")window.psRailClassSelectedLeague=league;
  return true;
 }
 function switchOverallLeague(league){
  if(!state||state.kind!=="overall"||!LIGAS[league])return false;
  const target=state.leagueOptions.find(x=>x.league===league);
  if(!target||!getOverallRows(state.overall,league)?.length)return false;
  const exact=(getOverallRows(state.overall,league)||[]).find(x=>n(x.name)===n(state.name));
  const opts={kind:"overall",league,name:state.name,
   rank:exact?.rank||null,iv:state.iv,forms:state.forms,
   gm:state.gm,overall:state.overall,family:state.family,railKey:state.railKey};
  // Keep the previous table/badge unchanged if the new source is unavailable.
  if(!open(opts))return false;
  if(typeof window!=="undefined")window.psRailOverallSelectedLeague=league;
  const badge=document.getElementById("rankLine")?.querySelector?.(".psRailGeneral");
  if(badge){
   badge.dataset.psLeague=league;badge.dataset.psName=opts.name;
   badge.dataset.psRank=exact?.rank?String(exact.rank):"";
   badge.dataset.rgVisible=exact?.rank?"#"+exact.rank:"—";
   const number=badge.querySelector?.(".psRailNumber");
   if(number)number.textContent=exact?.rank?"#"+exact.rank:"—";
   badge.querySelector?.(".psRailEvolve")?.remove?.();
   const context=typeof window!=="undefined"?window:{};
   const original=context.psRankContext?.name||"";
   const verifiedChoice=context.psRailOverallChoices?.find?.(x=>
    x.league===league&&n(x.name)===n(opts.name));
   const canEvolve=target.evolves===true||verifiedChoice?.evolves===true;
   const evo=context.PokeSearchEvolutionBadge?.(original,opts.name,canEvolve);
   if(evo)badge.appendChild(evo);
   badge.dataset.psEvolutionSteps=evo?.dataset?.steps||"0";
   badge.title="Rank Geral · "+LIGAS[league]+" · "+opts.name+
    (exact?.rank?" · #"+exact.rank:" · posição não verificada");
   badge.setAttribute?.("aria-label",badge.title);
  }
  return true;
 }
 function switchOverallSpecies(name){
  if(!state||state.kind!=="overall")return false;
  const target=state.family.find(x=>n(x)===n(name));
  if(!target)return false;
  const exact=(getOverallRows(state.overall,state.league)||[]).find(x=>n(x.name)===n(target));
  return open({kind:"overall",name:target,league:state.league,
   rank:exact?.rank||null,iv:state.iv,forms:state.forms,
   gm:state.gm,overall:state.overall,family:state.family,railKey:state.railKey});
 }
 // LT299: IV tile toggles the entire Rank Classe panel, even after the
 // user changes its league (which changes the rank explorer's clickKey).
 // Do not close a Rank Geral panel on an IV tap.
 function closeIfKind(kind){
  if(!state||state.kind!==kind||!view||view.hidden)return false;
  close();return true;
 }
 function close(){
  if(view)view.hidden=true;
  state=null;openKey="";
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
   "#psRankExplorer .psrTitle{min-width:0;flex:1 1 auto;font-size:11.5px;font-weight:900;line-height:1.25;overflow-wrap:anywhere}",
   "#psRankExplorer .psrHead{align-items:flex-start}",
   "#psRankExplorer .psrLeagueSwitch{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:4px 0;padding:5px 6px;background:#ffffff12;border:1px solid #ffffff30;border-radius:7px}",
   "#psRankExplorer .psrLeagueSwitch label{font-size:10px;color:#dce8f5;font-weight:750}",
   "#psRankExplorer .psrLeagueSwitch select{flex:1 1 auto;max-width:none;min-width:125px}",
   "#psRankExplorer button,#psRankExplorer select{font:inherit;color:inherit;background:#ffffff18;border:1px solid #ffffff3b;border-radius:6px;padding:5px;min-height:27px;max-width:100%}",
   "#psRankExplorer button:focus-visible,#psRankExplorer select:focus-visible,#psRankExplorer tr:focus-visible{outline:2px solid #a9e5c8;outline-offset:1px}",
   "#psRankExplorer button:disabled{opacity:.38}",
   "#psRankExplorer select{background:#303a4b;min-width:72px;max-width:96px}",
   "#psRankExplorer .psrSub{font-size:9px;color:#c3cdda;margin:3px 0 5px;overflow-wrap:anywhere}",
   "#psRankExplorer .psrScopeNote{font-size:9px;line-height:1.3;color:#eccb93;margin:0 0 5px;overflow-wrap:anywhere}",
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
    "#psRankExplorer .psrOptionMenu[hidden],#psRankExplorer select[hidden]{display:none!important}",
    "#psRankExplorer .psrTopControls{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:4px!important;align-items:stretch!important}",
    "#psRankExplorer .psrTopControls button{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:none!important;padding:4px 2px!important;white-space:normal!important;text-align:center!important;line-height:1.15!important;font-size:9.5px!important;min-height:31px!important}",
    "#psRankExplorer .psrLeagueSwitch{display:flex;flex-wrap:nowrap;align-items:center;gap:6px;margin:4px 0;padding:4px 5px}",
    "#psRankExplorer .psrLeaguePicker{flex:1;min-width:0}",
    "#psRankExplorer .psrLeaguePicker>button{box-sizing:border-box;width:100%;max-width:none;text-align:left;min-height:31px}",
    "#psRankExplorer .psrOptionMenu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;margin:4px 0;padding:4px;background:#172d3bf2;border:1px solid #8bb0c15e;border-radius:7px}",
    "#psRankExplorer .psrOptionMenu button{box-sizing:border-box;width:100%;max-width:none;min-width:0;min-height:31px;padding:4px 3px;white-space:normal;text-align:center}",
    "#psRankExplorer .psrOptionMenu button[aria-pressed=true]{border-color:#addcff;background:#4476977a;font-weight:800}",
   "#evoBody button.psRankOpen{font:inherit;border:0;background:transparent;padding:2px 3px;cursor:pointer;text-decoration:underline;text-underline-offset:2px}",
   "#psRankExplorer .psrHead{display:flex!important;align-items:center!important;justify-content:center!important;min-height:28px!important;text-align:center!important}",
   "#psRankExplorer .psrTitle{display:inline-flex!important;justify-content:center!important;align-items:center!important;gap:6px!important;flex:1 1 auto!important;font-size:12px!important}",
   "#psRankExplorer .psrHeaderIcon{width:20px;height:20px;object-fit:contain;flex:0 0 20px}",
   "#psRankExplorer .psrLeagueIcons{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:5px 0;align-items:center}",
   "#psRankExplorer .psrLeagueIconButton{height:39px!important;padding:3px!important;background:#ffffff08!important;display:flex;align-items:center;justify-content:center;position:relative}",
   "#psRankExplorer .psrLeagueIconButton[aria-pressed=true]{border-color:#99d6ff!important;background:#5688a147!important;box-shadow:inset 0 0 0 1px #83c9f37a}",
   "#psRankExplorer .psrLeagueIconButton img{height:29px;width:29px;object-fit:contain}",
   "#psRankExplorer .psrFamily{display:flex;gap:4px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin;padding:2px 0 6px;margin:2px 0 3px;touch-action:pan-x}",
   "#psRankExplorer .psrFamilyButton{box-sizing:border-box;flex:0 0 49px!important;width:49px!important;min-height:59px!important;padding:2px!important;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:#ffffff09!important}",
   "#psRankExplorer .psrFamilyButton[aria-pressed=true]{background:#537da54d!important;border-color:#91cfff!important;box-shadow:inset 0 0 0 1px #98d6ff8c}",
   "#psRankExplorer .psrFamilyButton img{height:38px;width:38px;object-fit:contain;pointer-events:none}",
   "#psRankExplorer .psrFamilyButton .psrFamilyRank{font:750 9px/1.1 Roboto,Arial,sans-serif;color:#e0e8f3}",
   "#psRankExplorer .psrMissingSprite{font:700 8px/1.1 Roboto,Arial,sans-serif;color:#bac9d9;overflow:hidden;max-height:37px;max-width:42px;overflow-wrap:anywhere}",
   "#psRankExplorer .psrTableSprite{width:22px;height:22px;object-fit:contain;display:block}",
   "#psRankExplorer tr.psrOverallRow td:first-child{white-space:normal;overflow:visible;text-align:left}",
   "#psRankExplorer .psrPokemonCell{display:flex;align-items:center;gap:5px;min-width:0;text-align:left}",
   "#psRankExplorer .psrPokemonName{min-width:0;flex:1;white-space:normal;overflow-wrap:anywhere;line-height:1.2;font-size:9.5px}",
   "#psRankExplorer .psrOverallRank{font-size:10px;font-weight:750;white-space:nowrap;text-align:right}",
   "#psRankExplorer .psrSpriteWrap{width:23px;height:23px;flex:0 0 23px;display:inline-flex;justify-content:center;align-items:center;position:relative}",
   "#psRankExplorer .psrSpriteWrap.psrShadow img{filter:drop-shadow(0 0 2px #a174ee)}",
   "#psRankExplorer .psrSpriteWrap.psrShadow:after{content:'';position:absolute;right:-1px;bottom:-1px;width:4px;height:4px;border-radius:50%;background:#a57ee7;pointer-events:none}",
   "#psRankExplorer .psrArtFallback{font:700 8px/1.1 Roboto,Arial,sans-serif;color:#cbd4e0;text-align:center}",
   "#psRankExplorer .psrSpriteWrap img[hidden],#psRankExplorer .psrArtFallback[hidden]{display:none!important}",
   "#psRankExplorer .psrFamilyButton .psrSpriteWrap{width:38px;height:38px;flex:0 0 38px}",
   "#psRankExplorer .psrFamilyButton .psrSpriteWrap img{width:38px;height:38px}",
   "#psRankExplorer .psrNoRank{color:#d7e1ef;font-size:9px;line-height:1.35;margin:4px 0;padding:5px;border:1px solid #ffffff26;border-radius:6px}"
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
    // Try the next independently verified sprite source after an image error.
    // Only identical species+form candidates from rankSpriteMeta are allowed.
    view.addEventListener("error",evt=>{
     const img=evt.target;
     if(!img?.matches?.("img[data-ps-sprite-alts]"))return;
     const remaining=String(img.dataset.psSpriteAlts||"").split("|").filter(Boolean);
     const next=remaining.shift();
     img.dataset.psSpriteAlts=remaining.join("|");
     if(next&&/^(?:file:\/\/\/android_asset\/|https:\/\/)/.test(next)){
      img.src=next;return;
     }
     img.hidden=true;
     const fallback=img.parentElement?.querySelector?.(".psrArtFallback");
     if(fallback)fallback.hidden=false;
    },true);
    view.addEventListener("change",evt=>{
     const control=evt.target.closest?.("select[data-ps-filter]");
     if(control&&state&&setFilter(state,Number(control.value)))draw();
     const picker=evt.target.closest?.("select[data-ps-league-choice]");
     if(picker&&state){
      if(state.kind==="class")switchClassLeague(picker.value);
      else switchOverallLeague(picker.value);
     }
    });
    view.addEventListener("click",evt=>{
     const b=evt.target.closest?.("button[data-ps-act]");
     if(b){
      evt.stopPropagation();
      if(!state)return;
      const action=b.dataset.psAct;
      if(action==="league-menu"||action==="filter-menu"){
       const menu=view.querySelector?.(action==="league-menu"?"#psrLeagueOptions":"#psrFilterOptions");
       if(menu){menu.hidden=!menu.hidden;b.setAttribute("aria-expanded",String(!menu.hidden));}
       return;
      }
      if(action==="league-pick"){
       if(state.kind==="class")switchClassLeague(b.dataset.league);
       else switchOverallLeague(b.dataset.league);
       return;
      }
      if(action==="family-pick"){switchOverallSpecies(b.dataset.psName);return;}
      if(action==="filter-pick"){
       if(setFilter(state,Number(b.dataset.filter)))draw();
       return;
      }
      if(action==="close"){close();return;}
      if(action==="prev"){state.page=Math.max(0,state.page-1);state.resetTableScroll=true;}
      if(action==="next"){state.page=Math.min(Math.ceil(visibleRows(state).length/PAGE_SIZE)-1,state.page+1);state.resetTableScroll=true;}
      if(action==="top"){state.page=0;state.scrollSelected=false;state.resetTableScroll=true;}
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
  // Switching Ursaring → Ursaluna changes the 4096 IVs and must not
  // retain the old species' nested scroll position.
  const newTable=lastDrawState!==s||s.resetTableScroll===true;
  const oldScroll=newTable?0:(oldList?.scrollTop||0);
  lastDrawState=s;s.resetTableScroll=false;
  const from=s.page*PAGE_SIZE,subset=rows.slice(from,from+PAGE_SIZE);
  const maxPage=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
  const cells=s.kind==="class"?
   '<th class="psrNum">#</th><th class="psrIv">IVs</th><th class="psrLevel">Nv.</th><th class="psrCp">PC</th><th class="psrEff">Eficiência</th>':
   '<th colspan="4">Pokémon / forma</th><th style="width:17%">Rank</th>';
  const spriteFor=name=>{
   const lib=typeof window!=="undefined"?window.PokeSearchOfflineSprite:null;
   const meta=lib?.rankSpriteMeta?.(name)||null;
   const list=meta?.candidates||[lib?.rankSprite?.(name)||""];
   const sources=list.filter(src=>typeof src==="string"&&
    /^(?:file:\/\/\/android_asset\/|https:\/\/)/.test(src));
   const dex=meta?.dex||0,shadow=meta?.shadow===true;
   const img=sources.length?
    '<img class="psrTableSprite" src="'+safe(sources[0])+
    '" data-ps-sprite-alts="'+safe(sources.slice(1).join("|"))+
    '" alt="" aria-hidden="true">':"";
   const fallback='<span class="psrArtFallback"'+(sources.length?' hidden':'')+
    ' aria-label="Sprite indisponível">'+(dex?'#'+dex:'?')+'</span>';
   return '<span class="psrSpriteWrap'+(shadow?' psrShadow':'')+'">'+img+fallback+'</span>';
  };
  const body=subset.map(r=>{
   const selected=r.rank===s.selectedRank;
   const marked=s.compared.includes(r.rank);
   const markup=s.kind==="class"?
    '<td><button type="button" class="psrTap" data-ps-act="expand" data-rank="'+r.rank+
     '" aria-expanded="'+(s.expandedRank===r.rank)+'" title="Detalhar atributos">#'+r.rank+'</button></td>'+
    '<td><button type="button" class="psrTap" data-ps-act="compare" data-rank="'+r.rank+
     '" aria-pressed="'+marked+'" title="Adicionar ou remover da comparação">'+safe(r.iv)+'</button></td>'+
    '<td>'+levelString(r.level)+'</td><td>'+r.cp+'</td><td>'+r.efficiency+'%</td>':
    '<td colspan="4"><div class="psrPokemonCell">'+spriteFor(r.name)+
    '<span class="psrPokemonName">'+safe(r.name)+'</span></div></td>'+
    '<td class="psrOverallRank">#'+r.rank+'</td>';
   const details=s.kind==="class"&&s.expandedRank===r.rank?
    '<tr class="psrExpanded"><td colspan="5"><div class="psrExtra">ATK '+statString(r.atk)+
    ' · DEF '+statString(r.def)+' · HP '+r.hp+' · Nível '+
    levelString(r.level)+' · PC '+r.cp+'</div></td></tr>':"";
   return '<tr data-ps-row="'+r.rank+'" tabindex="0"'+(selected?' data-ps-owned="true"':'')+
    ' class="'+(s.kind==="overall"?'psrOverallRow ':'')+
    (selected?'psrSelected ':'')+(marked?'psrCompared':'')+
    '" aria-label="'+safe(s.kind==="class"?"Rank "+r.rank+", IV "+r.iv:"Rank "+r.rank+", "+r.name)+'">'+
     markup+'</tr>'+details;
  }).join("");
  const select=s.kind==="class"?"Meu IV":"Minha posição";
  const leagueChooser=s.kind==="overall"?
   '<div class="psrLeagueIcons" role="group" aria-label="Escolher liga">'+
   s.leagueOptions.map(x=>'<button type="button" class="psrLeagueIconButton" data-ps-act="league-pick"'+
     ' data-league="'+safe(x.league)+'"'+(x.available?'':' disabled')+
     ' aria-pressed="'+(s.league===x.league)+'"'+
     ' aria-label="'+safe(LIGAS[x.league])+'" title="'+safe(LIGAS[x.league])+'">'+
     '<img src="ui-icons/'+PVP_LEAGUE_ICONS[x.league]+'" alt=""></button>').join('')+
   '</div>':
   s.leagueOptions.length?
   '<div class="psrLeagueSwitch"><span class="psrLeagueSwitchLabel">Liga</span>'+
   '<div class="psrLeaguePicker"><button type="button" data-ps-act="league-menu" aria-expanded="false"'+
   ' aria-controls="psrLeagueOptions" aria-label="Escolher liga do '+(s.kind==="class"?"Rank Classe":"Rank Geral")+'">'+safe(LIGAS[s.league])+' ▾</button></div>'+
   '<select id="psrLeague" data-ps-league-choice aria-label="Liga (compatibilidade)" hidden tabindex="-1">'+
   s.leagueOptions.map(x=>'<option value="'+safe(x.league)+'"'+
     (x.league===s.league?' selected':'')+'>'+safe(LIGAS[x.league])+'</option>').join('')+
   '</select></div>'+
   '<div id="psrLeagueOptions" class="psrOptionMenu" role="group" aria-label="Ligas disponíveis" hidden>'+
   s.leagueOptions.map(x=>'<button type="button" data-ps-act="league-pick" data-league="'+safe(x.league)+'"'+
    ((s.kind==="class"?x.available:!!getOverallRows(s.overall,x.league)?.length)?'':' disabled')+
    ' aria-pressed="'+(s.league===x.league)+'">'+safe(LIGAS[x.league])+'</button>').join('')+'</div>':"";
  const familyChooser=s.kind==="overall"&&s.family?.length?
   '<div class="psrFamily" role="group" aria-label="Escolher Pokémon e evolução">'+
   s.family.map(name=>{
    const row=(getOverallRows(s.overall,s.league)||[]).find(r=>n(r.name)===n(name));
    const image=spriteFor(name);
    return '<button type="button" class="psrFamilyButton" data-ps-act="family-pick"'+
     ' data-ps-name="'+safe(name)+'" aria-pressed="'+(n(s.name)===n(name))+'"'+
     ' aria-label="'+safe(name)+' · '+(row?'Rank Geral #'+row.rank:'Sem classificação')+'"'+
     ' title="'+safe(name)+' · '+(row?'#'+row.rank:'Não ranqueado')+'">'+
     image+
     '<span class="psrFamilyRank">'+(row?'#'+row.rank:'—')+'</span></button>';
   }).join('')+'</div>':"";
  const actualIv=s.kind==="class"&&s.selectedIv>=0?
   s.rows.find(r=>r.index===s.selectedIv):null;
  const otherRanks=s.kind==="overall"&&!s.selectedRank?
   s.leagueOptions.filter(x=>x.league!==s.league&&x.rank):[];
  const noRank=s.kind==="overall"&&!s.selectedRank?
   '<div class="psrNoRank">'+safe(s.name)+' não possui posição no snapshot da '+
   safe(LIGAS[s.league])+'.'+
   (otherRanks.length?' Nesta base: '+otherRanks.map(x=>safe(LIGAS[x.league])+
    ' #'+x.rank).join(' · ')+'. Selecione outra liga acima.':'')+
   ' Os dados de IV são independentes do Rank Geral.</div>':"";
  view.innerHTML='<div class="psrHead"><div class="psrTitle">'+
   '<img class="psrHeaderIcon" src="ui-icons/'+
   (s.kind==="class"?PVP_LEAGUE_ICONS[s.league]:"ps-overall-lt268.png")+
   '" alt="" aria-hidden="true">'+
   (s.kind==="class"?"Rank Classe · "+safe(LIGAS[s.league]):"Rank Geral")+
   '</div></div>'+
   '<div class="psrSub">'+(s.kind==="overall"?safe(s.name)+" · "+safe(LIGAS[s.league]):safe(s.name))+
   (actualIv?' · IV '+safe(actualIv.iv):"")+
   (s.selectedRank?' · '+(s.kind==="class"?"Classe IV ":"Rank Geral ")+
      '#'+s.selectedRank:' · Não consta nesta liga')+'</div>'+familyChooser+leagueChooser+noRank+
   (s.kind==="class"?
     '<div class="psrScopeNote">Posição entre 4.096 IVs de '+safe(s.name)+
     ' — não é o Rank Geral da '+safe(LIGAS[s.league])+'.</div>':"")+
   '<div class="psrControls psrTopControls"><button type="button" data-ps-act="top">#1 Topo</button>'+
   '<button type="button" data-ps-act="selected"'+(s.selectedRank?'':' disabled')+'>'+select+'</button>'+
   '<button type="button" data-ps-act="filter-menu" aria-controls="psrFilterOptions" aria-expanded="false" aria-label="Filtrar classificação">'+
    (s.filter?'Top '+s.filter:'Todos')+' ▾</button></div>'+
   '<div id="psrFilterOptions" class="psrOptionMenu" role="group" aria-label="Filtros" hidden>'+
   FILTER_LIMITS.map(n=>'<button type="button" data-ps-act="filter-pick" data-filter="'+n+
    '" aria-pressed="'+(s.filter===n)+'">'+(n?'Top '+n:'Todos')+'</button>').join('')+'</div>'+
   '<select id="psrFilter" data-ps-filter aria-label="Filtro (compatibilidade)" hidden tabindex="-1">'+
   FILTER_LIMITS.map(n=>'<option value="'+n+'"'+(s.filter===n?' selected':'')+'>'+
     (n?n:'Todos')+'</option>').join('')+'</select>'+
   '<div class="psrRows" role="region" aria-label="Linhas da classificação" tabindex="0">'+
   '<table><thead><tr>'+cells+'</tr></thead><tbody>'+body+'</tbody></table></div>'+
   '<div class="psrControls"><button type="button" data-ps-act="prev"'+(s.page===0?' disabled':'')+
   '>‹</button><span class="psrPager">Pág. '+(s.page+1)+'/'+maxPage+
   ' · '+(from+1)+'–'+Math.min(from+PAGE_SIZE,rows.length)+' / '+rows.length+'</span>'+
   '<button type="button" data-ps-act="next"'+(s.page===maxPage-1?' disabled':'')+'>›</button></div>'+
   comparisonHtml(s)+
   '<div class="psrStatus" role="status" aria-live="polite">'+safe(s.status)+'</div>'+
   '<div class="psrFooter">PvPoke snapshot '+safe(s.sourceDate)+
   (s.kind==="class"?' · Nv. máximo 50, sem melhor amigo':' · Posição da espécie, não dos IVs')+
   '</div>';
  const newList=view.querySelector?.(".psrRows");
  if(newList){
   newList.scrollTop=oldScroll;
   if(s.scrollSelected){
    const found=newList.querySelector?.('tr[data-ps-owned="true"]');
    if(found){
     // The selected row's offsetTop can refer to the whole Android card.
     // Calculate in the scroller's own coordinate system instead.
     const box=typeof found.getBoundingClientRect==="function"?
      found.getBoundingClientRect():null;
     const holder=typeof newList.getBoundingClientRect==="function"?
      newList.getBoundingClientRect():null;
     const target=box&&holder?box.top-holder.top+newList.scrollTop:
      (found.offsetTop||0);
     const selectedHeight=box?.height||0;
     newList.scrollTop=Math.max(0,target-
      Math.max(0,((newList.clientHeight||0)-selectedHeight)/2));
    }
    s.scrollSelected=false;
   }
  }
  if(typeof window!=="undefined")window.PokeSearchPvpAdvanced?.enhance(view,s,{getIvRows,pageForRank,redraw:draw});
  if(typeof window!=="undefined"&&typeof window.resizeEvolutionPanel==="function")
   window.resizeEvolutionPanel();
 }
 return {open,toggle,close,closeIfKind,switchOverallLeague,switchOverallSpecies,switchClassLeague,getIvRows,getOverallRows,compareIv,ivIndex,megaName,pageForRank,
  setFilter,jumpToSelected,toggleComparison,comparedRows,visibleRows,filteredCsv,summaryText,feedback};

});
