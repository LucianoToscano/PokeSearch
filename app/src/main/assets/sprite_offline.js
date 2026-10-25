/* LT108: exact offline artwork for results AND detail cards.
 * Only accept PokeAPI's verified base-sprite path, or an explicitly verified
 * species/form pair. Never invent sprites for a special form or costume.
 * This is read-only and does not require network, tokens or WebView JS bridge.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchOfflineSprite=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const RAW="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
 const CDN="https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/";
 const LOCAL="file:///android_asset/pokemon-sprites/";
 const rawRegex=/^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/master\/sprites\/pokemon\/(shiny\/)?([0-9]{1,4})\.png$/;
 const mirrorRegex=/^https:\/\/cdn\.jsdelivr\.net\/gh\/PokeAPI\/sprites@master\/sprites\/pokemon\/(shiny\/)?([0-9]{1,4})\.png$/;
 const nameKey=value=>String(value||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
 function dexOf(card){
  const m=/^#?([0-9]{1,4})$/.exec(String(card?.number||"").trim());
  return m?Number(m[1]):0;
 }
 function verifiedBase(card){
  if(!card||typeof card!=="object")return false;
  const dex=dexOf(card),species=nameKey(card.name),form=nameKey(card.form);
  const costume=nameKey(card.costume);
  if(dex<1||dex>1025||!species)return false;
  if(costume&&costume!=="NONE"&&costume!=="NORMAL"&&costume!=="DEFAULT")return false;
  if(card.costume_id!==undefined&&card.costume_id!==null&&Number(card.costume_id)!==0)return false;
  // Provider/DOM paths can omit image even when an explicit default form
  // is confirmed. Recover its exact 1..1025 packaged Dex sprite locally in
  // BOTH results and detail WebViews. Never guess a regional/costume form.
  if(form==="NORMAL"||form==="DEFAULT"||
     form===species||form===species+"NORMAL"||form===species+"DEFAULT")return true;
  // Furfrou Natural (#676) is its official base coat. Not the other trims.
  if(dex===676&&species==="FURFROU"&&
     (form==="NATURAL"||form==="FURFROUNATURAL"))return true;
  return false;
 }
 function resolve(card){
  const image=String(card?.image||"");
  const candidate=rawRegex.exec(image)||mirrorRegex.exec(image);
  if(candidate){
   const dex=Number(candidate[2]);
   // The PokeAPI URL itself already proves exact base-species sprite.
   if(dex>=1&&dex<=1025){
    const path=(candidate[1]?"shiny/":"base/")+dex+".png";
    return {src:LOCAL+path,original:image,offline:true};
   }
  }
  if(!image&&verifiedBase(card)){
   const path=(card.shiny===true?"shiny/":"base/")+dexOf(card)+".png";
   const origin=RAW+(card.shiny===true?"shiny/":"")+dexOf(card)+".png";
   return {src:LOCAL+path,original:origin,offline:true};
  }
  // Preserve provider URLs, data images and unknown special forms untouched.
  return {src:image,original:image,offline:false};
 }
 return Object.freeze({resolve,verifiedBase});
});
