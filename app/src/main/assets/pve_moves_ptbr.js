/* LT265: PT-BR GO move names for the captured card and PvE type rankings.
 * Same pinned WatWowMap Pokémon GO move/proto and pt-BR catalogue already used
 * by PvPoke's verified move panel. Never machine-translate or guess IDs.
 * Network errors keep the offline verified subset; source may be incomplete.
 */
(function(root,factory){"use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.PokeSearchMovePtBR=api;
})(typeof window!=="undefined"?window:null,function(){"use strict";
 const BASE="https://raw.githubusercontent.com/WatWowMap/pogo-data-api/"+
  "31a3bcdc2e412f315c4be2bb593807f45cb9bd9b/data/v1/";
 const OFFLINE=Object.freeze({
  PECK_FAST:"Bicada",FLY:"Voar",FIRE_SPIN_FAST:"Chama Furacão",
  FIRE_BLAST:"Rajada de Fogo",EMBER_FAST:"Brasa",HEAT_WAVE:"Onda de Calor",
  QUICK_ATTACK_FAST:"Ataque Rápido",SWIFT:"Ataque Veloz",
  AIR_SLASH_FAST:"Golpe de Ar",BRAVE_BIRD:"Pássaro Bravo",
  WING_ATTACK_FAST:"Ataque de Asa",TWISTER:"Twister",
  AERIAL_ACE:"Ás dos Ares",THUNDER_SHOCK_FAST:"Trovoada de Choques",
  THUNDERBOLT:"Relâmpago",THUNDER:"Trovão",MUD_SHOT_FAST:"Tiro de Lama",
  WATER_PULSE:"Pulso d'Água",RAZOR_LEAF_FAST:"Folha Navalha",
  BITE_FAST:"Mordida",TACKLE_FAST:"Investida",SCRATCH_FAST:"Arranhão",
  COUNTER_FAST:"Contra-atacar",DRAGON_BREATH_FAST:"Sopro do Dragão",
  HYDRO_CANNON:"Hidro Canhão",SURF:"Surfar",FRENZY_PLANT:"Planta Mortal",
  SHADOW_BALL:"Bola Sombria",WATER_GUN_FAST:"Revólver d'Água",
  VINE_WHIP_FAST:"Chicote de Vinha",DRAGON_TAIL_FAST:"Cauda do Dragão",
  ROCK_THROW_FAST:"Lançamento de Rocha",SHADOW_CLAW_FAST:"Garra Sombria",
  CONFUSION_FAST:"Confusão",POISON_JAB_FAST:"Golpe Envenenado",
  LEAF_BLADE:"Lâmina de Folha",BODY_SLAM:"Pancada Corporal",
  // LT269: additional ID-verified Pidgey/Pidgeot/Fletchling/Talonflame fallback.
  // Values below are byte-for-byte names from the same pinned GO pt-BR source.
  GUST_FAST:"Lufada de Vento",INCINERATE_FAST:"Incinerar",
  FLAME_CHARGE:"Ataque de Chamas",FEATHER_DANCE:"Dança das Penas",
  HURRICANE:"Furacão",
  SKY_ATTACK:"Ataque do Céu",ICE_BEAM:"Raio Congelante",
  SOLAR_BEAM:"Raio Solar",OUTRAGE:"Ultraje",EARTHQUAKE:"Terremoto"
 });
 // LT280: type IDs come from the SAME pinned GO moves.json used by
 // PvPoke's verified recommended attacks. Only confirmed types are colored;
 // never color a move from the Pokémon's own type or from its form.
 const TYPE_IDS=Object.freeze({1:"normal",2:"fighting",3:"flying",4:"poison",5:"ground",
  6:"rock",7:"bug",8:"ghost",9:"steel",10:"fire",11:"water",12:"grass",
  13:"electric",14:"psychic",15:"ice",16:"dragon",17:"dark",18:"fairy"});
 const OFFLINE_MOVE_TYPES=Object.freeze({
  PECK_FAST:"flying",
  FLY:"flying",
  FIRE_SPIN_FAST:"fire",
  FIRE_BLAST:"fire",
  EMBER_FAST:"fire",
  HEAT_WAVE:"fire",
  QUICK_ATTACK_FAST:"normal",
  SWIFT:"normal",
  AIR_SLASH_FAST:"flying",
  BRAVE_BIRD:"flying",
  WING_ATTACK_FAST:"flying",
  TWISTER:"dragon",
  AERIAL_ACE:"flying",
  THUNDER_SHOCK_FAST:"electric",
  THUNDERBOLT:"electric",
  THUNDER:"electric",
  MUD_SHOT_FAST:"ground",
  WATER_PULSE:"water",
  RAZOR_LEAF_FAST:"grass",
  BITE_FAST:"dark",
  TACKLE_FAST:"normal",
  SCRATCH_FAST:"normal",
  COUNTER_FAST:"fighting",
  DRAGON_BREATH_FAST:"dragon",
  HYDRO_CANNON:"water",
  SURF:"water",
  FRENZY_PLANT:"grass",
  SHADOW_BALL:"ghost",
  WATER_GUN_FAST:"water",
  VINE_WHIP_FAST:"grass",
  DRAGON_TAIL_FAST:"dragon",
  ROCK_THROW_FAST:"rock",
  SHADOW_CLAW_FAST:"ghost",
  CONFUSION_FAST:"psychic",
  POISON_JAB_FAST:"poison",
  LEAF_BLADE:"grass",
  BODY_SLAM:"normal",
  GUST_FAST:"flying",
  INCINERATE_FAST:"fire",
  FLAME_CHARGE:"fire",
  FEATHER_DANCE:"flying",
  HURRICANE:"flying",
  SKY_ATTACK:"flying",
  ICE_BEAM:"ice",
  SOLAR_BEAM:"grass",
  OUTRAGE:"dragon",
  EARTHQUAKE:"ground",
  FLAMETHROWER:"fire",
  STRUGGLE_BUG_FAST:"bug",
  CRUNCH:"dark",
  DARK_PULSE:"dark",
  IRON_HEAD:"steel",
  MOONBLAST:"fairy",
  CLOSE_COMBAT:"fighting",
  SLUDGE_BOMB:"poison",
  ROCK_SLIDE:"rock",
  PSYCHIC:"psychic"
 });
 const cleanName=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/[^a-z0-9]+/g,"");
 const OFFLINE_NAMES=Object.freeze({lancachamas:"fire",insistencia:"bug",
  flamethrower:"fire",strugglebug:"bug",mordida:"dark",pancadacorporal:"normal",
  brasa:"fire",investida:"normal"});
 const normalize=value=>String(value||"").trim().toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"");
 let remote=null,remoteTypes=null,remoteNames=null,pending=null;
 const key=(value,fast)=>{
  let k=normalize(value);
  if(fast&&!k.endsWith("_FAST"))k+="_FAST";
  return k;
 };
 const lookup=(value,fast)=>{
  const k=key(value,fast);
  return (remote&&remote.get(k))||OFFLINE[k]||"";
 };
 const name=(value,fast=false)=>lookup(value,fast)||
  // An unknown ID is displayed explicitly, not an invented localized move.
  "Golpe sem tradução";
 const isVerified=(value,fast=false)=>!!lookup(value,fast);
 const type=(value,fast=false)=>{
  const proto=key(value,fast),raw=String(value||"");
  const t=remoteTypes?.get(proto)||OFFLINE_MOVE_TYPES[proto]||
   remoteNames?.get(cleanName(raw))||OFFLINE_NAMES[cleanName(raw)]||
   // An original _FAST or localized name may be supplied without suffix.
   remoteTypes?.get(normalize(raw))||OFFLINE_MOVE_TYPES[normalize(raw)];
  return Object.values(TYPE_IDS).includes(t)?t:null;
 };
 const pair=value=>{
  const p=String(value||"").split(/\s*\/\s*/);
  return p.length===2?name(p[0],true)+" / "+name(p[1],false):
   String(value||"");
 };
 async function getJson(url){
  const ctl=typeof AbortController==="function"?new AbortController():null;
  const timer=ctl?setTimeout(()=>ctl.abort(),11000):null;
  try{
   const response=await fetch(BASE+url,{method:"GET",credentials:"omit",
    cache:"force-cache",...(ctl?{signal:ctl.signal}:{})});
   if(!response.ok)throw Error("HTTP "+response.status);
   const length=Number(response.headers?.get?.("content-length")||0);
   if(length>3e6)throw Error("Arquivo PT-BR muito grande");
   const raw=await response.text();
   if(raw.length>3e6)throw Error("Resposta PT-BR muito grande");
   return JSON.parse(raw);
  }finally{if(timer)clearTimeout(timer);}
 }
 const ensure=()=>{
  if(remote)return Promise.resolve(true);
  if(pending)return pending;
  pending=Promise.all([
   getJson("moves.json"),
   getJson("translations/pt-br/moves.json")
  ]).then(([catalog,translation])=>{
   if(!Array.isArray(catalog)||!translation||typeof translation!=="object")
    throw Error("Catálogo incompleto");
   const dict=new Map(),byId=new Map(),byName=new Map();
   for(const item of catalog){
    const proto=typeof item?.proto==="string"?normalize(item.proto):"";
    const n=Number(item?.moveId);
    const word=Number.isInteger(n)?translation["move_"+n]:null;
    if(proto&&typeof word==="string"&&word.trim().length>1&&word.length<120){
     dict.set(proto,word.trim());
     const t=Number.isInteger(item.type)?TYPE_IDS[item.type]:null;
     if(t){byId.set(proto,t);byName.set(cleanName(word),t);}
    }
   }
   if(dict.size<50)throw Error("Fonte parcial");
   remote=dict;remoteTypes=byId;remoteNames=byName;return true;
  }).catch(()=>false).finally(()=>{pending=null;});
  return pending;
 };
 return Object.freeze({name,pair,isVerified,type,ensure,key,offlineCount:Object.keys(OFFLINE).length,
  source:"WatWowMap/pogo-data-api · GO pt-BR · commit 31a3bcdc"});
});
