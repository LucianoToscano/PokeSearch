/* Evidence-only status for the EXISTING PokeSearch result cards (LT325 QA).
 * No API calls, GPS, ranking calculations, user data or new alerts.
 * Native decides whether a request was confirmed; this module only explains
 * that evidence. "Partial" describes the search, not every validated spawn.
 */
(function(root,factory) {
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchResultEvidence=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const clean=v=>typeof v==="string"?v.trim():"";
 const origin=card=>card?.evidenceSource==="api"?"API":
  card?.evidenceSource==="site"?"Site":"Origem não identificada";
 const number=v=>Number.isFinite(Number(v))?Number(v):null;
 function distanceValue(raw){
  const value=clean(raw);
  return /^(?:\d+(?:[.,]\d+)?)\s*(?:km|m|mi)$/i.test(value)?value:null;
 }
 function assess(card,options,checks){
  const c=card&&typeof card==="object"?card:{};
  const o=options&&typeof options==="object"?options:{};
  const validations=checks&&typeof checks==="object"?checks:{};
  const now=Number.isFinite(o.nowMs)?o.nowMs:Date.now();
  const expiry=number(c.expiresAtMs);
  const expired=expiry!==null&&expiry>0&&expiry<=now;
  // A cached/previous encounter must NEVER be displayed as a newly
  // confirmed spawn while the next request is active or has failed.
  const previous=c.evidenceOld===true||o.stale===true||o.searching===true;
  const verified=c.evidenceVerified===true;
  const partial=c.evidencePartial===true;
  const state=expired?"expired":previous?"previous":
   !verified?"unverified":partial?"partial":"verified";
  const source=origin(c);
  const headline={
   verified:source+" · busca confirmada",
   partial:source+" · leitura parcial",
   previous:source+" · resultado anterior",
   unverified:source+" · sem confirmação",
   expired:source+" · encontro expirado"
  }[state];
  const icon={verified:"",partial:"◐",previous:"!",unverified:"?",expired:"!"}[state];
  const raw=clean(c.iv);
  const pct=clean(c.ivPercent);
  const ivVerified=validations.ivVerified===true;
  const iv=ivVerified?"IV consistente com a origem":
   raw||pct?"IV não comprovado":"IV indisponível";
  const km=distanceValue(c.distance)?
   "Km informado pela fonte; referência não validada como GPS do aparelho":
   "Km indisponível; nenhuma distância foi calculada";
  const rankSource=clean(c.ivRankSource);
  const rank=rankSource==="api-pvp"&&/^(?:[1-9]|[1-4][0-9]|50)$/.test(clean(c.rank))?
   "Rank PvP informado pela API; distinto do Rank Geral e do rank IV":
   rankSource==="explicit-species-iv"&&
    ["gl","ul"].includes(clean(c.ivRankLeague).toLowerCase())&&
    Number.isInteger(Number(c.ivRank))&&Number(c.ivRank)>=1&&Number(c.ivRank)<=4096?
   "Rank IV da espécie identificado na fonte; Rank Geral é outra classificação":
   "Rank do encontro não confirmado; projeções consultáveis nos painéis";
  const shiny=c.shiny===true?
   "Shiny indicado na origem; não atesta vínculo com treinador":
   "Shiny não indicado; não presume disponibilidade";
  const details=[headline,iv,km,rank,shiny];
  return Object.freeze({state,source,headline,icon,
   warning:state!=="verified",details:Object.freeze(details),
   explanation:details.join(" · ")});
 }
 return Object.freeze({assess,distanceValue});
});
