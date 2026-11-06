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
 const normalize=value=>String(value||"").trim().toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"");
 let remote=null,pending=null;
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
   const dict=new Map();
   for(const item of catalog){
    const proto=typeof item?.proto==="string"?normalize(item.proto):"";
    const n=Number(item?.moveId);
    const word=Number.isInteger(n)?translation["move_"+n]:null;
    if(proto&&typeof word==="string"&&word.trim().length>1&&word.length<120)
     dict.set(proto,word.trim());
   }
   if(dict.size<50)throw Error("Fonte parcial");
   remote=dict;return true;
  }).catch(()=>false).finally(()=>{pending=null;});
  return pending;
 };
 return Object.freeze({name,pair,isVerified,ensure,key,offlineCount:Object.keys(OFFLINE).length,
  source:"WatWowMap/pogo-data-api · GO pt-BR · commit 31a3bcdc"});
});
