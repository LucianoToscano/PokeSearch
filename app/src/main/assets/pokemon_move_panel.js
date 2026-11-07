/* LT298 — user-facing moves: exact GO stats and four MT categories.
 * PVP recommendation != captured move; PvE Dmg/CD/DPS != PvP power/energy.
 * No inferred MT Elite availability: legacy is "unknown" unless proven.
 */
(function(root,factory){"use strict";const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.PokeSearchMovePanel=api;
})(typeof window!=="undefined"?window:globalThis,function(root){"use strict";
const esc=x=>String(x??"").replace(/[&<>"']/g,k=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[k]));
const COLOUR=Object.freeze({normal:"#bec9d5",fighting:"#ff9a82",flying:"#a2b9ff",poison:"#cda0fa",ground:"#e0ba86",rock:"#dcc78c",bug:"#b5da70",ghost:"#b7a2ff",steel:"#bad2e4",fire:"#ff9d68",water:"#67b8ff",grass:"#7de79a",electric:"#ffe77a",psychic:"#ff9ebc",ice:"#8ceafa",dragon:"#aeabff",dark:"#cbb0a5",fairy:"#ff9ed5"});
const files=Object.freeze({
 normalFast:"mt-agil-normal-lt298.svg",
 normalCharged:"mt-carregada-normal-lt298.svg",
 eliteFast:"mt-agil-elite-lt265.png",
 eliteCharged:"mt-carregada-elite-lt265.png",
 unknown:"mt-unknown.png"
});
function mtBadge(fast,status){
 const safe=String(status||"unknown");
 const kind=safe==="normal"?"normal":safe==="elite"?"elite":"unknown";
 const f=kind==="normal"?(fast?files.normalFast:files.normalCharged):
  kind==="elite"?(fast?files.eliteFast:files.eliteCharged):files.unknown;
 const name=fast?"MT Ágil":"MT Carregada";
 const text=kind==="elite"?name+" de Elite indicada pela fonte":
  kind==="normal"?name+" normal no conjunto recomendado":
  (safe==="legacy"?"Golpe legado; disponibilidade de MT não confirmada":
  "Disponibilidade da MT não confirmada");
 return '<span class="psMoveMtIcon" data-mt-kind="'+kind+'" title="'+esc(text)+
  '" aria-label="'+esc(text)+'"><img src="ui-icons/'+f+
  '" alt="" aria-hidden="true"></span>';
}
function metricsFor(move,fast){
 if(!move)return null;
 const id=typeof move==="string"?move:move.id||move.name||"";
 return root?.PokeSearchMoveMetrics?.lookup?.(String(id),!!fast)||null;
}
function pveStats(move,fast){
 const m=metricsFor(move,fast);
 const string=root?.PokeSearchMoveMetrics?.pveLine?.(m)||"";
 return string?'<div class="psMovePveStats" title="Dados de combate em raides, não da Liga GO">Raides: '+esc(string)+'</div>':"";
}
function pvpStats(move,fast){
 const stats=typeof move==="object"&&move?.stats?move.stats:null;
 const toNumber=(x,min,max)=>typeof x==="number"&&Number.isFinite(x)&&x>=min&&x<=max?x:null;
 const power=toNumber(stats?.power,1,500);
 const energy=fast?toNumber(stats?.energyGain,1,100):toNumber(stats?.energyCost,1,200);
 const reference=metricsFor(move,fast);
 const nPower=power??reference?.pvpPower??null;
 const nEnergy=energy??(reference?.pvpEnergy==null?null:fast?Math.max(0,reference.pvpEnergy):Math.max(0,-reference.pvpEnergy));
 const out=[];
 if(nPower!==null)out.push("Poder "+nPower);
 if(nEnergy!==null&&nEnergy>0)out.push((fast?"Energia +":"Custo ")+nEnergy);
 return out.length?'<div class="psMovePvpStats">PvP: '+esc(out.join(" • "))+'</div>':"";
}
function recommendationMetrics(move,fast){
 return '<div class="psMoveNumbers">'+pvpStats(move,fast)+pveStats(move,fast)+'</div>';
}
// Card's current moves are NOT automatically the PvPoke recommendations.
// The card metadata combines Elite and legacy IDs; it cannot prove Elite
// availability. Grey is the ONLY safe symbol for that group.
function captured(raw,card,metadata){
 const parts=String(raw||"").split(/\s*(?:\/|\|)\s*/).map(x=>x.trim()).filter(Boolean).slice(0,3);
 if(!parts.length)return '<div class="psMoveTitle">Golpes capturados indisponíveis</div>';
 const record=root?.PokeSearchCardPresentation?.meta?.(card,metadata)||null;
 const special=new Set(Array.isArray(record?.[1])?record[1]:[]);
 const sections=parts.map((name,i)=>{
  const fast=i===0,info=metricsFor(name,fast);
  const label=fast?"Ágil":i===1?"C1":"C"+i;
  const translated=info?.name||name;
  const type=info?.type||null;
  const color=Object.prototype.hasOwnProperty.call(COLOUR,type)?COLOUR[type]:"#e7eff7";
  const status=info?.id&&record?
    (special.has(info.id)||special.has(info.id.replace(/_FAST$/,""))?"legacy":"normal"):"unknown";
  return '<div class="psMoveDetailItem"><div class="psMoveHeaderLine">'+
   '<span class="psMoveSlot">'+esc(label)+':</span>'+
   '<b class="psMoveTypedName" style="color:'+color+'">'+esc(translated)+'</b>'+
   mtBadge(fast,status)+'</div>'+pvpStats(info?{id:info.id}:null,fast)+
   pveStats(info?{id:info.id}:null,fast)+
   (!info?'<div class="psMoveUnavailable">Valores não confirmados para este golpe</div>':"")+
   '</div>';
 }).join("");
 return '<div class="psMoveTitle">Golpes capturados · '+esc(card?.name||"Pokémon")+'</div>'+
  '<div class="psMoveNote">Estatísticas do golpe atual, não recomendação de PvPoke.</div>'+
  sections+'<div class="psMoveNote">MT de Elite só é identificada quando a fonte confirma; legado sem confirmação fica cinza.</div>';
}
return Object.freeze({mtBadge,metricsFor,pvpStats,pveStats,recommendationMetrics,captured});
});
