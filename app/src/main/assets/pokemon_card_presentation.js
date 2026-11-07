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
 // GO/PokéGenie-inspired type palette; same 18 Pokémon GO move types.
 // Color is determined by the verified MOVE ID, never by the Pokémon type.
 const TYPE_COLORS=Object.freeze({
  normal:"#a8a77a",fire:"#ee8130",water:"#6390f0",electric:"#f7d02c",
  grass:"#7ac74c",ice:"#96d9d6",fighting:"#c22e28",poison:"#a33ea1",
  ground:"#e2bf65",flying:"#a98ff3",psychic:"#f95587",bug:"#a6b91a",
  rock:"#b6a136",ghost:"#735797",dragon:"#6f35fc",dark:"#705746",
  steel:"#b7b7ce",fairy:"#d685ad"
 });
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
   // Official Pokémon GO PokéXciting! Singapore 2026: Pikachu #25 has
   // a distinct blue COSTUME, not a battle-stat-changing form. The source
   // exposes it as "Anniversary 2026 Singapore 01". Verify BOTH Dex and
   // species before reusing the pinned Electric base typing; never borrow
   // a type for an unrelated or unverified regional/battle form.
   const singapore2026Costume=dex===25&&clean(card?.name)==="pikachu"&&
    /^anniversary2026singapore0?1$/.test(form);
   if(!["normal","default","standard","base","regular","none"].includes(form)&&
      !/(?:costume|halloween|fall20\d\d|hat|cap)/.test(form)&&
      !singapore2026Costume)return null;
  }
  return data?.base?.[dex]||null;
 }
 // Identical verified species/form source for both the type icons and
 // the defensive effectiveness panel. Unknown form != default/base form.
 function typeKeys(card,data){
  const list=meta(card,data)?.[0];
  if(!Array.isArray(list)||list.length<1||list.length>2||
     new Set(list).size!==list.length||
     list.some(t=>!Object.prototype.hasOwnProperty.call(TYPES,t)))return [];
  return list.slice();
 }
 function types(card,data){
  return typeKeys(card,data).map(t=>{
   const src=(typeof window!=="undefined"?window.PokeSearchTypeIcons:globalThis.PokeSearchTypeIcons)?.[t];
   if(!src)return "";
   return '<img class="pkTypeImg" alt="Tipo '+TYPES[t][0]+'" title="'+TYPES[t][0]+'" src="'+src+'">';
  }).join("");
 }
 // GO defensive type chart, not the main-series damage percentages:
 // 1.6^n where weakness=+1, resistance=-1, legacy immunity=-2.
 // Example: Normal vs Ghost attacks = 1.6^-2 = 0.390625 (not zero).
 // Each of the 18 incoming move types is processed once for one/two
 // independently verified defending types, including neutral cancellations.
 const TYPE_DEFENSE=Object.freeze({
  normal:{weak:["fighting"],resist:[],immune:["ghost"]},
  fire:{weak:["water","ground","rock"],resist:["fire","grass","ice","bug","steel","fairy"]},
  water:{weak:["electric","grass"],resist:["fire","water","ice","steel"]},
  electric:{weak:["ground"],resist:["electric","flying","steel"]},
  grass:{weak:["fire","ice","poison","flying","bug"],resist:["water","electric","grass","ground"]},
  ice:{weak:["fire","fighting","rock","steel"],resist:["ice"]},
  fighting:{weak:["flying","psychic","fairy"],resist:["bug","rock","dark"]},
  poison:{weak:["ground","psychic"],resist:["grass","fighting","poison","bug","fairy"]},
  ground:{weak:["water","grass","ice"],resist:["poison","rock"],immune:["electric"]},
  flying:{weak:["electric","ice","rock"],resist:["grass","fighting","bug"],immune:["ground"]},
  psychic:{weak:["bug","ghost","dark"],resist:["fighting","psychic"]},
  bug:{weak:["fire","flying","rock"],resist:["fighting","grass","ground"]},
  rock:{weak:["water","grass","fighting","ground","steel"],resist:["normal","fire","poison","flying"]},
  ghost:{weak:["ghost","dark"],resist:["poison","bug"],immune:["normal","fighting"]},
  dragon:{weak:["ice","dragon","fairy"],resist:["fire","water","grass","electric"]},
  dark:{weak:["fighting","bug","fairy"],resist:["ghost","dark"],immune:["psychic"]},
  steel:{weak:["fire","fighting","ground"],resist:["normal","grass","ice","flying","psychic","bug","rock","dragon","steel","fairy"],immune:["poison"]},
  fairy:{weak:["poison","steel"],resist:["fighting","bug","dark"],immune:["dragon"]}
 });
 function typeEffectiveness(defendingTypes){
  if(!Array.isArray(defendingTypes)||defendingTypes.length<1||
     defendingTypes.length>2||new Set(defendingTypes).size!==defendingTypes.length||
     defendingTypes.some(t=>!Object.prototype.hasOwnProperty.call(TYPE_DEFENSE,t)))
   return null;
  const all=Object.keys(TYPES).map(type=>{
   let exponent=0;
   for(const defender of defendingTypes){
    const row=TYPE_DEFENSE[defender];
    exponent+=row.weak.includes(type)?1:row.resist.includes(type)?-1:
     row.immune?.includes(type)?-2:0;
   }
   return {type,name:TYPES[type][0],exponent,
    multiplier:Number(Math.pow(1.6,exponent).toFixed(9))};
  });
  return {types:defendingTypes.slice(),
   weaknesses:all.filter(x=>x.exponent>0).sort((a,b)=>b.exponent-a.exponent),
   resistances:all.filter(x=>x.exponent<0).sort((a,b)=>a.exponent-b.exponent),
   neutral:all.filter(x=>x.exponent===0)};
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
  const translator=(typeof window!=="undefined"?window.PokeSearchMovePtBR:
   globalThis.PokeSearchMovePtBR);
  return raw.split(/\s+\/\s+/).slice(0,3).map((part,i)=>{
   const original=part.trim().replace(/\s*\*$/,"");
   // Preserve the canonical source identity for legacy/Elite verification.
   const marked=eligible.has(moveId(original));
   const localized=translator?.isVerified?.(original,i===0)?
     translator.name(original,i===0):original;
   const type=translator?.type?.(original,i===0)||null;
   const color=type&&Object.prototype.hasOwnProperty.call(TYPE_COLORS,type)?
    TYPE_COLORS[type]:null;
   // Only our fixed palette enters the style attribute. Unknown stays neutral.
   return '<span class="pkMove'+(color?' pkMoveTyped':'')+'"'+
    (color?' data-move-type="'+type+'" style="--ps-move-type:'+color+'"':'')+
    (marked?' title="Golpe especial: MT de Elite ou legado"':'')+'>'+
    esc(localized)+(marked?'<sup class="pkLegacy">*</sup>':"")+'</span>';
  }).join(" <span class=\"moveSlash\">|</span> ");
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
 return Object.freeze({esc,types,typeKeys,typeEffectiveness,gender,moves,locationCountryFlag,despawnTone,meta,
  moveTypeColor:type=>Object.prototype.hasOwnProperty.call(TYPE_COLORS,type)?TYPE_COLORS[type]:null});
});
