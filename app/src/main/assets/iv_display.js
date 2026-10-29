/* Display-only IV validation and the PokeSearch's existing IV color palette.
 * Percentage may be derived ONLY from a valid, explicitly returned A/D/S
 * triple; never from PvP rank, filters, CP, form, or guessed IVs.
 */
(function(root,factory){"use strict";
 const display=factory();
 if(typeof module==="object"&&module.exports)module.exports=display;
 if(root)root.PokeSearchIVDisplay=display;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const rawPattern=/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/;
 // Some verified source responses express IV% with 1–2 decimals
 // (e.g. 44/45 => 97.8 or 97.78), while the badge rounds to 98%.
 const percentPattern=/^(?:0|[1-9][0-9]?|100)(?:[.,][0-9]{1,2})?$/;
 const possible=new Set(Array.from({length:46},(_,sum)=>Math.round(sum*100/45)));
 const unavailable=Object.freeze({valid:false,raw:"",percent:null,color:"",derived:false});
 function colorFor(percent){
  if(!Number.isInteger(percent)||!possible.has(percent))return "";
  if(percent===0)return "#00CFE8";
  if(percent<=49)return "#B8BEC8";
  if(percent<=78)return "#28C76F";
  if(percent<=89)return "#388BFF";
  if(percent<=98)return "#C084FC";
  if(percent===100)return "#F04B70";
  return "";
 }
 // PvP stat-product efficiency is continuous (e.g. 92,17%, 99,73%).
 // Use the SAME visual bands as raw IVs, but reserve coral for exactly 100%.
 function colorForEfficiency(value){
  const text=String(value??"").trim();
  if(!/^(?:0|[1-9][0-9]?|100)(?:[.,][0-9]{1,2})?$/.test(text))return "";
  const pct=Number(text.replace(",","."));
  if(!Number.isFinite(pct)||pct<0||pct>100)return "";
  if(pct===0)return "#00CFE8";
  if(pct<50)return "#B8BEC8";
  if(pct<80)return "#28C76F";
  if(pct<90)return "#388BFF";
  if(pct<100)return "#C084FC";
  return "#F04B70";
 }
 // The source may supply only IV%; this is useful, but NOT a
 // three-stat IV spread. Never synthesize A/D/S from a percentage.
 function percentOnly(card){
  const raw=String(card?.iv??"").trim();
  if(raw)return unavailable;
  const supplied=String(card?.ivPercent??"").trim();
  if(!percentPattern.test(supplied))return unavailable;
  const observed=Number(supplied.replace(",","."));
  for(let sum=0;sum<=45;sum++){
   const exact=sum*100/45;
   if(observed===Math.round(exact)||observed===Number(exact.toFixed(1))||
      observed===Number(exact.toFixed(2))){
    const percent=Math.round(exact),color=colorFor(percent);
    return {valid:true,raw:"",percent,color,derived:false,percentOnly:true};
   }
  }
  return unavailable;
 }
 function fromCard(card){
  const raw=String(card?.iv??"").trim();
  if(!rawPattern.test(raw))return unavailable;
  const sum=raw.split("/").map(Number).reduce((a,b)=>a+b,0);
  const percent=Math.round(sum*100/45);
  const color=colorFor(percent);
  if(!color)return unavailable;
  const supplied=String(card?.ivPercent??"").trim();
  // A missing percentage is NOT a missing IV: calculate it from verified A/D/S.
  // A conflicting/non-numeric/impossible supplied percentage is NOT trustworthy.
  if(supplied){
   const observed=Number(supplied.replace(",","."));
   const exact=sum*100/45;
   const valid=percentPattern.test(supplied)&&observed>=0&&observed<=100&&
    (observed===percent||observed===Number(exact.toFixed(1))||
     observed===Number(exact.toFixed(2)));
   if(!valid)return unavailable;
  }
  return {valid:true,raw,percent,color,derived:!supplied};
 }
 return Object.freeze({colorFor,colorForEfficiency,fromCard,percentOnly});
});
