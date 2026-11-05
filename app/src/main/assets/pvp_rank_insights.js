/* LT240: deterministic PvP search, form projection and verified top badges. */
(function(root,factory){"use strict";const a=factory();if(typeof module!=="undefined"&&module.exports)module.exports=a;if(root)root.PokeSearchPvpInsights=a;})(typeof window!=="undefined"?window:null,function(){"use strict";
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const ivIndex=v=>{const m=String(v||"").trim().match(/^([0-9]|1[0-5])\/([0-9]|1[0-5])\/([0-9]|1[0-5])$/);return m?Number(m[1])*256+Number(m[2])*16+Number(m[3]):-1;};
function lookup(rows,kind,query){
 if(!Array.isArray(rows)||!query)return null;
 const s=String(query).trim(),i=ivIndex(s);
 if(kind==="class"&&i>=0)return rows.find(r=>r.index===i)||null;
 const rank=s.match(/^#\s*(\d{1,4})$/);
 if(rank)return rows.find(r=>r.rank===Number(rank[1]))||null;
 if(kind==="class"){
  const efficiency=s.match(/^(\d{1,3})(?:[,.](\d{1,2}))?\s*%$/);
  if(!efficiency)return null;
  const val=Number(efficiency[1])+Number((efficiency[2]||"").padEnd(2,"0"))/100;
  if(val>100)return null;
  return rows.reduce((best,r)=>{
   const diff=Math.abs(Number(r.efficiency.replace(",","."))-val);
   return !best||diff<best.diff||(diff===best.diff&&r.rank<best.row.rank)?{row:r,diff}:best;
  },null)?.row||null;
 }
 const q=norm(s);
 return rows.find(r=>norm(r.name)===q)||rows.find(r=>norm(r.name).includes(q))||null;
}
function compareForms(gm,forms,iv,league,getRows){
 if(!Array.isArray(forms)||typeof getRows!=="function"||!["gl","ul","ml"].includes(league))return [];
 const idx=ivIndex(iv);if(idx<0)return [];
 const seen=new Set(),out=[];
 for(const form of forms.slice(0,36)){
  const name=String(typeof form==="string"?form:form?.name||"").trim();
  if(!name||seen.has(norm(name)))continue;
  seen.add(norm(name));
  const row=getRows(gm,name,league)?.find(r=>r.index===idx);
  if(!row)continue;
  out.push({name,iv:row.iv,rank:row.rank,efficiency:row.efficiency,
   level:row.level,cp:row.cp,mega:/mega/i.test(name),
   reference:typeof form==="object"&&form?.referenceOnly===true});
 }
 return out.sort((a,b)=>a.rank-b.rank||a.name.localeCompare(b.name));
}
function topBadges(leagues,limit=5){
 if(!Array.isArray(leagues)||![1,5,10,50].includes(limit))return [];
 const hits=[];
 for(const l of leagues){
  if(!["gl","ul","ml"].includes(l?.league))continue;
  const candidates=[...(l.own?[{...l.own,name:"Atual"}]:[]),
   ...(Array.isArray(l.evolutions)?l.evolutions:[]),
   ...(Array.isArray(l.megas)?l.megas:[])];
  for(const c of candidates){
   const rank=Number(c?.rank);
   if(!Number.isInteger(rank)||rank<1||rank>limit||c?.eligible===false)continue;
   hits.push({name:String(c.name||"Atual").slice(0,90),league:l.league,rank,
    mega:c.megaProjection===true,reference:c.referenceOnly===true});
  }
 }
 return hits.sort((a,b)=>a.rank-b.rank).slice(0,10);
}
return Object.freeze({lookup,compareForms,topBadges,ivIndex});
});