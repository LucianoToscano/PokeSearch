/* LT240 optional panel layered on LT239 explorer. Never replaces the old IV engine. */
(function(root,factory){"use strict";const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;if(root)root.PokeSearchPvpAdvanced=api;})(typeof window!=="undefined"?window:null,function(){"use strict";
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const allowed=["overall","leads","closers","switches","chargers"];
const labels={overall:"Geral offline",leads:"Abertura",closers:"Finalização",switches:"Troca",chargers:"Carregadores"};
let current=null,bound=null;
const css=[
 "#psRankExplorer .psa{margin-top:5px;border-top:1px solid #ffffff35;padding:5px 0}",
 "#psRankExplorer .psaRow{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin:4px 0}",
 "#psRankExplorer .psaSearch{display:flex;flex:1;min-width:0;gap:4px}",
 "#psRankExplorer .psaSearch input{flex:1;min-width:0;min-height:30px;padding:4px;color:#f5f7fa;background:#ffffff1c;border:1px solid #ffffff48;border-radius:6px;font:inherit}",
 "#psRankExplorer .psa button{min-height:29px}",
 "#psRankExplorer .psa select{min-width:110px;max-width:160px}",
 "#psRankExplorer .psaForm{max-height:140px;overflow:auto;overscroll-behavior:contain;padding:3px;border-radius:6px;border:1px solid #ffffff21}",
 "#psRankExplorer .psaLine{font-size:9px;padding:5px 2px;border-bottom:1px solid #ffffff20;overflow-wrap:anywhere}",
 "#psRankExplorer .psaTop{color:#bbeacf;font-weight:700}",
 "#psRankExplorer .psaMuted{color:#b9c4d0;font-size:9px}",
 "#psRankExplorer .psaResult{max-height:158px;overflow:auto;overscroll-behavior:contain}",
 "#psRankExplorer .psaResult button{width:100%;text-align:left;white-space:normal}",
 "#psRankExplorer tr.psaFound{box-shadow:inset 3px 0 #84d7e4;background:#277b7d66}",
 "@media(max-width:320px){#psRankExplorer .psa{font-size:9px}#psRankExplorer .psaRow{gap:2px}#psRankExplorer .psa button{padding:3px}}",
 "@media(min-width:420px){#psRankExplorer .psaLine{font-size:10px}#psRankExplorer .psaForm{max-height:180px}}"
].join("\n");
function openQuery(s,query,api,ins){
 const found=ins.lookup(s.rows,s.kind,query);
 if(!found){s.advancedStatus="Combinação não encontrada.";return false;}
 s.filter=0;s.page=api.pageForRank(s.rows,found.rank);
 s.foundRank=found.rank;s.advancedStatus="Localizado #"+found.rank+
  (s.kind==="class"?" · "+found.iv+" · "+found.efficiency+"%":" · "+found.name);
 return true;
}
function formList(s,api,ins){
 const iv=s.rows.find(r=>r.index===s.selectedIv)?.iv;
 const rows=ins.compareForms(s.gm,s.forms,iv,s.league,api.getIvRows);
 if(!rows.length)return '<div class="psaMuted">Formas não identificadas com segurança.</div>';
 return '<div class="psaForm">'+rows.map(r=>'<div class="psaLine">'+
  (r.rank===1?'<span class="psaTop">TOP 1 </span>':"")+
  '<b>'+esc(r.name)+'</b> '+(r.mega?'(Mega projetada) ':'')+'#'+r.rank+
  ' · '+r.efficiency+'% · PC '+r.cp+' · Nv. '+String(r.level).replace(".",",")+'</div>').join("")+'</div>';
}
function categoryList(s){
 if(!s.categoryRows)return '<div class="psaMuted">'+(s.categoryLoading?"Consultando fonte PvPoke…":
  "Selecione uma categoria para consultar.")+'</div>';
 const rows=s.categoryRows.slice(s.categoryPage*10,s.categoryPage*10+10);
 return '<div class="psaResult">'+rows.map(r=>
  '<button type="button" data-psa="move" data-rank="'+r.rank+'">#'+r.rank+' · '+
  esc(r.name)+(Number.isFinite(r.score)?' · '+r.score.toFixed(1):'')+'</button>').join("")+'</div>'+
  '<div class="psaRow"><button data-psa="cprev" type="button"'+(s.categoryPage===0?' disabled':'')+'>‹</button>'+
  '<span class="psaMuted">Pág. '+(s.categoryPage+1)+'/'+Math.ceil(s.categoryRows.length/10)+'</span>'+
  '<button data-psa="cnext" type="button"'+(s.categoryPage+1>=Math.ceil(s.categoryRows.length/10)?' disabled':'')+'>›</button></div>';
}
function movesHtml(s){
 const x=s.movesShown;if(!x)return "";
 const mv=m=>esc(m?.name||"—")+(m?.status==="elite"?" (Elite)":m?.status==="legacy"?" (Legado)":"");
 return '<div class="psaForm"><div><b>'+esc(x.name)+'</b></div>'+
  '<div>Ágil: '+mv(x.fast)+'</div>'+
  '<div>Carregados: '+x.charged.map(mv).join(" · ")+'</div>'+
  (x.matchups.length?'<div>Vantagens: '+x.matchups.map(m=>esc(m.name)).join(", ")+'</div>':"")+
  (x.counters.length?'<div>Ameaças: '+x.counters.map(m=>esc(m.name)).join(", ")+'</div>':"")+
  '<div class="psaMuted">Golpes recomendados pela fonte, não ataques da captura</div></div>';
}
function draw(view,s,api,ins){
 let el=view.querySelector?.("#psRankAdvanced");
 if(!el){el=document.createElement("section");el.id="psRankAdvanced";el.className="psa";view.appendChild(el);}
 let body='<div class="psaRow"><div class="psaSearch">'+
  '<input data-psa-input maxlength="45" aria-label="Pesquisa direta de IV, rank ou eficiência" placeholder="'+
  (s.kind==="class"?"0/15/14 · #25 · 99,50%":"Espécie ou #25")+
  '" value="'+esc(s.searchText||"")+'"/><button type="button" data-psa="search">Ir</button></div></div>';
 if(s.kind==="class"&&s.forms?.length){
  body+='<div class="psaRow"><button type="button" data-psa="forms">Normal / Mega / Evoluções '+(s.formsOpen?'▴':'▾')+'</button></div>'+
   (s.formsOpen?formList(s,api,ins):"");
 }
 if(s.kind==="overall"){
  body+='<div class="psaRow"><label for="psaCategory">Categoria PvP</label>'+
   '<select id="psaCategory" data-psa-category>'+
   allowed.map(v=>'<option value="'+v+'"'+(s.category===v?' selected':'')+'>'+labels[v]+'</option>').join("")+'</select></div>'+
   (s.category!=="overall"?categoryList(s):"")+movesHtml(s);
 }
 body+='<div class="psaMuted" role="status" aria-live="polite">'+esc(s.advancedStatus||"")+'</div>';
 el.innerHTML=body;
 if(s.foundRank){
  const node=view.querySelector?.('tr[data-ps-row="'+s.foundRank+'"]');
  if(node){node.classList.add("psaFound");if(s.foundPending&&node.scrollIntoView)node.scrollIntoView({block:"nearest"});}
  s.foundPending=false;
 }
}
async function changeCategory(s,value,view,api,ins){
 if(!allowed.includes(value))return;
 s.category=value;s.categoryRows=null;s.categoryPage=0;s.movesShown=null;s.categoryLoading=false;
 if(value==="overall"){s.advancedStatus="Ranking offline preservado ("+s.sourceDate+")";draw(view,s,api,ins);return;}
 const provider=window.PokeSearchPvpRankMoves;
 if(!provider?.categoryRows){s.advancedStatus="Categorias indisponíveis.";draw(view,s,api,ins);return;}
 const token=++s.requestId;s.categoryLoading=true;s.advancedStatus="Fonte "+provider.source;
 draw(view,s,api,ins);
 const response=await provider.categoryRows(s.league,value);
 if(current?.s!==s||token!==s.requestId||s.category!==value)return;
 s.categoryLoading=false;
 if(!response?.rows?.length){s.category="overall";s.advancedStatus="Falha ao consultar. Fonte offline mantida.";}
 else{s.categoryRows=response.rows;s.advancedStatus="Top "+response.rows.length+" · "+response.source;}
 draw(view,s,api,ins);
}
async function openMoves(s,rank,view,api,ins){
 const row=s.categoryRows?.find(r=>r.rank===rank);if(!row)return;
 const p=window.PokeSearchPvpRankMoves;
 const token=++s.requestId;s.advancedStatus="Buscando golpes…";draw(view,s,api,ins);
 const r=await p?.lookup(s.league,row.name);
 if(current?.s!==s||s.requestId!==token)return;
 s.movesShown=r?{...r,name:row.name,matchups:row.matchups||[],counters:row.counters||[]}:null;
 s.advancedStatus=r?"Golpes verificados · "+r.source:"Sem golpes verificados.";
 draw(view,s,api,ins);
}
function enhance(view,s,api){
 if(!view||!s||typeof document==="undefined")return;
 const ins=window.PokeSearchPvpInsights;if(!ins)return;
 if(!s.advancedInitialized){
  s.advancedInitialized=true;s.searchText="";s.category="overall";s.requestId=0;
  s.categoryPage=0;s.formsOpen=false;s.forms=s.forms||[];
 }
 if(bound!==view){
  bound=view;
  const style=document.createElement("style");style.id="psRankAdvancedCSS";style.textContent=css;
  if(!document.getElementById("psRankAdvancedCSS"))document.head.appendChild(style);
  view.addEventListener("click",evt=>{
   const btn=evt.target.closest?.("button[data-psa]");if(!btn||!current)return;
   evt.stopPropagation();const {s,api,ins,view}=current,a=btn.dataset.psa;
   if(a==="search"){const input=view.querySelector?.("input[data-psa-input]");
    s.searchText=input?.value||"";openQuery(s,s.searchText,api,ins);
    s.foundPending=true;api.redraw();return;}
   if(a==="forms"){s.formsOpen=!s.formsOpen;api.redraw();return;}
   if(a==="cprev"||a==="cnext"){s.categoryPage=Math.max(0,Math.min(
    Math.ceil((s.categoryRows?.length||0)/10)-1,s.categoryPage+(a==="cnext"?1:-1)));
    draw(view,s,api,ins);return;}
   if(a==="move")openMoves(s,Number(btn.dataset.rank),view,api,ins);
  });
  view.addEventListener("change",evt=>{
   const target=evt.target.closest?.("select[data-psa-category]");
   if(current&&target)changeCategory(current.s,target.value,current.view,current.api,current.ins);
  });
  view.addEventListener("keydown",evt=>{
   if(evt.key!=="Enter"||!evt.target.closest?.("input[data-psa-input]")||!current)return;
   evt.preventDefault();const {s,api,ins}=current;s.searchText=evt.target.value;
   openQuery(s,s.searchText,api,ins);s.foundPending=true;api.redraw();
  });
 }
 current={view,s,api,ins};
 draw(view,s,api,ins);
}
return Object.freeze({enhance,openQuery,categoryList});
});