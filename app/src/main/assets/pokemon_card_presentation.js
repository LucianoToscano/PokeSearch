/* PokeSearch: conservative offline detail presenter. No account/network calls. */
(function(root,factory){"use strict";const value=factory();
 if(typeof module==="object"&&module.exports)module.exports=value;
 if(root)root.PokeSearchCardPresentation=value;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 })[c]);
 const TYPES={
  normal:["Normal","●"],fire:["Fogo","♨"],water:["Água","≋"],
  electric:["Elétrico","ϟ"],grass:["Planta","❀"],ice:["Gelo","❄"],
  fighting:["Lutador","✊"],poison:["Venenoso","☣"],ground:["Terrestre","◈"],
  flying:["Voador","➤"],psychic:["Psíquico","◉"],bug:["Inseto","✦"],
  rock:["Pedra","⬟"],ghost:["Fantasma","☾"],dragon:["Dragão","❖"],
  dark:["Sombrio","☽"],steel:["Aço","⬡"],fairy:["Fada","✧"]
 };
 const clean=s=>String(s==null?"":s).toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"");
 const moveId=s=>String(s==null?"":s).toUpperCase().trim()
  .replace(/\s*\*$/,"").replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"");
 function meta(card,data){
  const dex=Number(String(card?.number||card?.dex||"").replace("#",""));
  if(!Number.isSafeInteger(dex)||dex<1||dex>2000)return null;
  const form=clean(card?.form);
  // A strange or unknown form cannot inherit a potentially wrong base type.
  if(form){
   const found=data?.forms?.[dex+":"+form];
   if(found)return found;
   // Costume descriptions are cosmetic but not proof of a new type.
   if(!/(?:costume|halloween|fall20\d\d|hat|cap)/.test(form))return null;
  }
  return data?.base?.[dex]||null;
 }
 function types(card,data){
  const entry=meta(card,data);
  const list=entry?.[0];
  if(!Array.isArray(list)||list.length<1||list.length>2)return "";
  return list.filter(t=>Object.prototype.hasOwnProperty.call(TYPES,t))
   .map(t=>{const src=(typeof window!=="undefined"?window.PokeSearchTypeIcons:globalThis.PokeSearchTypeIcons)?.[t];
     if(!src)return "";
     return '<img class="pkTypeImg" alt="Tipo '+TYPES[t][0]+'" title="'+TYPES[t][0]+'" src="'+src+'">';
   }).join("");
 }
 function gender(value){
  const s=String(value||"").trim().toLowerCase();
  if(["male","♂","m"].includes(s))return '<span class="pkGender male" aria-label="Macho">♂</span>';
  if(["female","♀","f"].includes(s))return '<span class="pkGender female" aria-label="Fêmea">♀</span>';
  if(["genderless","⚲","neutral","sem sexo"].includes(s))
   return '<span class="pkGender genderless" aria-label="Sem gênero">⚲</span>';
  return "";
 }
 function moves(value,card,data){
  const raw=String(value||"").trim();
  if(!raw)return "";
  const entry=meta(card,data);
  const eligible=new Set(Array.isArray(entry?.[1])?entry[1]:[]);
  return raw.split(/\s+\/\s+/).slice(0,3).map(part=>{
   const original=part.trim().replace(/\s*\*$/,"");
   const marked=eligible.has(moveId(original))||/\*$/.test(part.trim());
   return '<span class="pkMove"'+(marked?' title="Golpe especial: MT de Elite ou legado"':'')+'>'+
    esc(original)+(marked?'<sup class="pkLegacy">*</sup>':"")+'</span>';
  }).join(" <span class=\"moveSlash\">/</span> ");
 }
 let locationCountryNames=null;
 function locationCountryFlag(location){
 const parts=String(location||"").split(",");
 if(parts.length<2)return "";
 const normalized=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
 const country=normalized(parts[parts.length-1]);
 if(!locationCountryNames){
  locationCountryNames=new Map(Object.entries({
   "united states":"US","united states of america":"US","usa":"US","us":"US",
   "united kingdom":"GB","uk":"GB","great britain":"GB",
   "south korea":"KR","north korea":"KP","russia":"RU","viet nam":"VN","vietnam":"VN",
   "czech republic":"CZ","czechia":"CZ","ivory coast":"CI","cote d'ivoire":"CI",
   "the netherlands":"NL","netherlands":"NL",
   "taiwan":"TW","australia":"AU","brazil":"BR","brasil":"BR",
   "japan":"JP","france":"FR","germany":"DE","canada":"CA","china":"CN",
   "india":"IN","mexico":"MX","singapore":"SG","thailand":"TH",
   "argentina":"AR","colombia":"CO","chile":"CL","peru":"PE",
   "new zealand":"NZ","indonesia":"ID","philippines":"PH","malaysia":"MY",
   "italy":"IT","spain":"ES","portugal":"PT","poland":"PL","turkey":"TR",
   "south africa":"ZA","egypt":"EG","nigeria":"NG","saudi arabia":"SA",
   "united arab emirates":"AE","switzerland":"CH","sweden":"SE",
   "norway":"NO","finland":"FI","denmark":"DK","greece":"GR",
   "israel":"IL","ireland":"IE","belgium":"BE","austria":"AT",
   "pakistan":"PK","bangladesh":"BD","nepal":"NP",
   "hong kong":"HK","macau":"MO","macao":"MO"
  }));
  // Additional country names in English and Portuguese, when supported by
  // the device WebView; computed only once, with a conservative fallback.
  if(typeof Intl!=="undefined"&&typeof Intl.DisplayNames==="function"){
   try{
    const displayNames=[new Intl.DisplayNames(["en"],{type:"region"}),
      new Intl.DisplayNames(["pt-BR"],{type:"region"})];
    for(let a=65;a<=90;a++)for(let b=65;b<=90;b++){
     const code=String.fromCharCode(a,b);
     for(const display of displayNames){
      const label=display.of(code);
      if(label&&label!==code)locationCountryNames.set(normalized(label),code);
     }
    }
   }catch(_ignored){}
  }
 }
 const code=locationCountryNames.get(country);
 return /^[A-Z]{2}$/.test(code||"")?
  String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt(0))):"";
}
 function despawnTone(seconds){
  if(!Number.isFinite(seconds))return "unknown";
  if(seconds<=300)return "critical";
  if(seconds<=900)return "warning";
  return "good";
 }
 return Object.freeze({esc,types,gender,moves,locationCountryFlag,despawnTone,meta});
});
