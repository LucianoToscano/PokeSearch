/* LT325 — detector read-only for verified encounter opportunities.
 * Reuses the EXISTING PvPoke calculations supplied by dock.html; never
 * computes ranks, fetches from a provider or changes the Pokémon's IV.
 * Projection is NOT evidence of actual Pokémon GO evolution eligibility.
 */
(function(root,factory) {
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchValueDetector=api;
})(typeof window!=="undefined"?window:null,function() {
 "use strict";
 const validRank=(v,max)=>Number.isInteger(v)&&v>=1&&v<=max?v:null;
 const leagues=["gl","ul","ml"];
 const short={gl:"GL",ul:"UL",ml:"ML"};
 function detect(card,context,analysis) {
  const c=card&&typeof card==="object"?card:{};
  const opts=context&&typeof context==="object"?context:{};
  const rows=analysis&&typeof analysis==="object"?analysis:{};
  const now=Number.isFinite(opts.nowMs)?opts.nowMs:Date.now();
  // A transient source error, previous search, ambiguous field or expired
  // spawn MUST NOT receive a fresh or valuable badge.
  const expiry=Number(c.expiresAtMs);
  if(c.evidenceVerified!==true||c.evidencePartial===true||
     c.evidenceOld===true||opts.stale===true||opts.searching===true||
     !Number.isFinite(expiry)||expiry<=now||expiry>now+86400000||
     opts.ivVerified!==true||!Array.isArray(rows.leagues))
    return null;
  const raw=typeof c.iv==="string"?c.iv.trim():"";
  if(!/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(raw))
    return null;
  // IV 100% means exact 15/15/15, not a search threshold or a
  // rounded percentage from another spawn.
  if(raw==="15/15/15"&&opts.ivPercent===100)
   return Object.freeze({kind:"perfect",symbol:"◆",priority:400,
    label:"IV 100% · 15/15/15",projected:false});
  const matches=[];
  for(const row of rows.leagues.slice(0,3)){
   const league=row?.league;
   if(!leagues.includes(league)||matches.some(x=>x.league===league))continue;
   const iv=validRank(row.ivRank,4096),rg=validRank(row.overallRank,10000);
   if(iv===null)continue;
   const eligible=row.eligible!==false&&row.referenceOnly!==true&&row.megaProjection!==true;
   if(!eligible)continue;
   const strongMeta=iv<=10&&rg!==null&&rg<=100;
   const classOne=iv===1;
   if(strongMeta||classOne)
    matches.push({kind:strongMeta?"pvp":"class",league,iv,rg,
     priority:strongMeta?300-iv:200,
     label:short[league]+" IV #"+iv+
      (rg!==null?" · RG #"+rg:" · RG indisponível")});
  }
  if(matches.length){
   matches.sort((a,b)=>b.priority-a.priority||a.iv-b.iv||
    (a.rg??Infinity)-(b.rg??Infinity)||
    leagues.indexOf(a.league)-leagues.indexOf(b.league));
   const best=matches[0];
   return Object.freeze({kind:best.kind,symbol:"◆",priority:best.priority,
    label:best.label,league:best.league,projected:false});
  }
  // Projection-only: the EXISTING evolution engine must have proved a
  // numerical CP fit and an exact species+league IV rank. Items, quests,
  // costume legality and ability to evolve remain explicitly unverified.
  const projections=Array.isArray(rows.evolutions)?rows.evolutions:[];
  const viable=[];
  for(const p of projections.slice(0,3)){
   const league=p?.league,iv=validRank(p?.ivRank,4096);
   const rg=validRank(p?.overallRank,10000);
   const name=typeof p?.name==="string"?p.name.trim():"";
   if(!leagues.includes(league)||!name||name.length>70||
      p.eligible!==true||p.referenceOnly===true||
      p.megaProjection===true||iv===null||iv>10||
      rg===null||rg>100)continue;
   viable.push({league,iv,rg,name});
  }
  viable.sort((a,b)=>a.iv-b.iv||a.rg-b.rg||
   leagues.indexOf(a.league)-leagues.indexOf(b.league));
  if(viable.length){
   const best=viable[0];
   return Object.freeze({kind:"evolution",symbol:"◇",priority:100,
    label:"Projeção "+best.name+" · "+short[best.league]+
      " IV #"+best.iv+" · RG #"+best.rg+
      " (evolução não garantida)",
    league:best.league,projected:true});
  }
  return null;
 }
 return Object.freeze({detect});
});
