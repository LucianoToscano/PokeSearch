/* LT401 hotfix · Exact, pinned sprite delivery without requiring a full download.
 * URLs are generated solely from the verified manifest, never from PGSStats input.
 * No PNGs or user account data are bundled or uploaded.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchSpriteDelivery=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const PIN="db10df75d6f6f92018d9786af0aecc238fecc4ef";
 const ROOT="https://raw.githubusercontent.com/PokeMiners/pogo_assets/"+PIN+
   "/Images/Pokemon%20-%20256x256/";
 const norm=s=>String(s??"").toUpperCase().replace(/[^A-Z0-9]/g,"");
 function remoteUrl(key,index){
  if(typeof key!=="string"||!/^[al]:[A-Za-z0-9_.-]{1,150}\.png$/.test(key))
   return "";
  if(!index||!index.entry(key))return "";
  const group=key[0],filename=key.slice(2);
  return ROOT+(group==="a"?"Addressable%20Assets/":"")+
    encodeURIComponent(filename);
 }
 function auditedDefault(p,index,match){
  if(!p||!index||!match?.key||Number(p.costume)>0)return false;
  const id=Number(p.form)||0,sp=Number(p.species);
  if(id<=0||sp<=0)return false;
  const form=index.forms.get(id);
  if(!form||norm(form[1])!=="NORMAL")return false;
  const expected=norm(String(p.name||p.speciesName||""))+"NORMAL";
  if(norm(form[2])!==expected)return false;
  const suffix=p.shiny?".s":"";
  // A normal form is only an offline base fallback if the GO manifest
  // independently verifies its exact default appearance.
  return match.key==="a:pm"+sp+suffix+".icon.png"||
    match.key==="l:pokemon_icon_"+String(sp).padStart(3,"0")+"_00"+
      (p.shiny?"_shiny":"")+".png";
 }
 return Object.freeze({remoteUrl,auditedDefault});
});
