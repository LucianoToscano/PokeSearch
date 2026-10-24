/* PokeSearch LT77: experimental authorized API contract, OFF by default.
 * Pure functions only: no network, no cookies, no OAuth, no token access,
 * no Android/WebView hooks. All integration must be separately authorized.
 */
(function(root, factory) {
  "use strict";
  var contract=factory();
  if (typeof module === "object" && module.exports) module.exports=contract;
  if (root) root.PokeSearchApiContract=contract;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";
  var MAX_RESULTS=10;
  var MAX_SOURCE_RESULTS=2000;
  var SIZES=new Set(["XXS","XS","S","M","L","XL","XXL"]);
  var rawPattern=/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/;
  function clean(x,max) {
    return typeof x==="string" ? x.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max||120) : "";
  }
  function optionalNumber(x,min,max,integer) {
    if (x===undefined||x===null||x==="") return null;
    var n=Number(x);
    if (!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n))) throw Error("Invalid range");
    return n;
  }
  function oneRange(source,a,b,min,max,integer) {
    var left=optionalNumber(source[a],min,max,integer),right=optionalNumber(source[b],min,max,integer);
    if (left!==null&&right!==null&&left>right) throw Error("Reversed range");
    return [left,right];
  }
  function requiredInt(x,min,max) {
    var n=optionalNumber(x,min,max,true);
    if(n===null) throw Error("Missing required filter");
    return n;
  }
  function apiGender(x) {
    if(x==="♂"||x==="Male") return "Male";
    if(x==="♀"||x==="Female") return "Female";
    if(x==="⚥"||x==="Genderless") return "Genderless";
    throw Error("Unsupported gender");
  }
  function apiArray(input,max,allow) {
    if(!Array.isArray(input)||input.length>max) throw Error("Invalid filter list");
    var out=[];
    for (var item of input) {
      if(!allow(item)) throw Error("Unverified filter identifier");
      if(!out.includes(item)) out.push(item);
    }
    return out;
  }
  /* Match fields observed in the supplied screenshots only.
   * Unsupported non-neutral UI selections fail closed instead of silently
   * widening the search; never guess server IDs from visible labels.
   */
  function buildPayload(config) {
    try {
      var c=config||{},mode=clean(c.mode||"raw",16).toLowerCase();
      if(!["iv","raw","percent","gl","ul"].includes(mode)) throw Error("Unsupported mode");
      if(c.formSelections && c.formSelections.length) throw Error("Form IDs not yet verified");
      if(c.pokemonSelections && c.pokemonSelections.length) throw Error("Pokemon IDs not yet verified");
      if(c.weather && clean(c.weather,64) && clean(c.weather,64)!=="Any") throw Error("Weather ID not yet verified");
      if(c.sortBy && !["Despawn (longest)","DSP"].includes(c.sortBy)) throw Error("Sorting identifier not yet verified");
      var genderList=c.genderSelections||[];
      if(!Array.isArray(genderList)||genderList.length>1) throw Error("API gender is singular");
      var sizes=apiArray(c.sizeSelections||[],7,function(x){return SIZES.has(x);});
      var cp=oneRange(c,"cpMin","cpMax",0,10000,true);
      var level=oneRange(c,"levelMin","levelMax",1,100,false);
      var pvp=mode==="gl"||mode==="ul";
      var rank=pvp?requiredInt(mode==="gl"?c.glRank:c.ulRank,1,50):null;
      var stats=mode==="iv"?[15,15,15]:mode==="raw"?
        [requiredInt(c.attack,0,15),requiredInt(c.defense,0,15),requiredInt(c.stamina,0,15)]:[null,null,null];
      var pct=mode==="percent"?oneRange(c,"percentMin","percentMax",0,100,true):[null,null];
      var lat=optionalNumber(c.centerLat,-90,90,false),lng=optionalNumber(c.centerLng,-180,180,false);
      var radius=optionalNumber(c.radiusKm,0,1000,false);
      if((lat===null)!==(lng===null)) throw Error("Incomplete coordinate pair");
      if(radius!==null&&lat===null) throw Error("Radius requires explicit coordinates");
      var p={
        shiny_only:c.shiny===true,shiny_account:null,background_only:c.backgroundOnly===true,
        pvp_mode:pvp,pvp_league:mode==="ul"?"ultra":"great",
        pvp_top_rank:rank,pvp_include_pre_evolutions:c.includePreviousEvolutions!==false,
        pvp_min_cp:optionalNumber(c.minPvpCp,0,10000,true),
        pokemon_ids:apiArray(c.officialPokemonIds||[],50,function(x){return Number.isInteger(x)&&x>=1&&x<=10000;}),
        species_forms:[],location:null,cp_min:cp[0],cp_max:cp[1],
        level_min:level[0],level_max:level[1],
        iv_mode:mode==="percent"?"percent":"raw",
        iv_percent_min:pct[0],iv_percent_max:pct[1],
        raw_iv_atk:stats[0],raw_iv_def:stats[1],raw_iv_sta:stats[2],
        sizes:sizes,forms:[],gender:genderList.length?apiGender(genderList[0]):null,
        boosted:null,weather_id:null,min_ttl:null,sort:"DSP",
        center_lat:lat,center_lng:lng,radius_km:radius,
        blacklist_pokemon_ids:[],blacklist_species_forms:[],blacklist_forms:[]
      };
      return {ok:true,payload:p};
    } catch(e) {return {ok:false,reason:clean(e.message,80)||"Invalid API configuration"};}
  }
  function parseIV(raw,percent) {
    if(typeof raw!=="string"||!rawPattern.test(raw)) return null;
    var parts=raw.split("/").map(Number),calculated=Math.round((parts[0]+parts[1]+parts[2])*100/45);
    var observed=Number(percent);
    if(!Number.isFinite(observed)||observed!==calculated) return null;
    return {raw:raw,percent:calculated};
  }
  function spriteData(item) {
    // No source-verified sprite URL in the reference response. Never invent one.
    return "";
  }
  /* Standalone fixture parser. This is NOT an authentication, Search,
   * freshness, ranking or filter-application attestation.
   */
  function normalizeResponse(response, config) {
    var options=config||{},now=Number.isFinite(options.nowMs)?options.nowMs:Date.now();
    if(!response||typeof response!=="object"||!Array.isArray(response.results)||
      response.results.length>MAX_SOURCE_RESULTS) return {ok:false,reason:"Invalid API results"};
    var cards=[],seen=new Set(),rejected=0,expired=0;
    for(var i=0;i<response.results.length;i++) {
      var x=response.results[i];
      if(!x||typeof x!=="object") {rejected++;continue;}
      var id=Number(x.pokemon_id),name=clean(x.pokemon_name,60),iv=parseIV(x.raw_iv,x.iv_percent);
      if(!Number.isInteger(id)||id<1||id>10000||!name||!iv) {rejected++;continue;}
      var cp=optionalNumberSafe(x.cp,0,100000,true),lv=optionalNumberSafe(x.level,0,100,false);
      if(cp===null||lv===null) {rejected++;continue;}
      if(options.shiny===true&&x.shiny!==true) continue;
      var end=typeof x.despawn_at==="string"?Date.parse(x.despawn_at):NaN;
      if(Number.isFinite(end)&&end<=now) {expired++;continue;}
      var encounter=clean(x.encounter_id,100);
      var fingerprint=encounter||[id,cp,iv.raw,x.location,x.despawn_at].join(":");
      if(seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      var size=typeof x.size==="string"&&SIZES.has(x.size)?x.size:"";
      var gender=x.gender==="Male"?"♂":x.gender==="Female"?"♀":x.gender==="Genderless"?"⚥":"";
      var fast=clean(x.fast_move,65),charge=clean(x.charge_move,65);
      var distance=optionalNumberSafe(x.distance_km,0,100000,false);
      var entry={
        sourceIndex:i,name:name,number:"#"+id,image:spriteData(x),gender:gender,size:size,
        moves:fast&&charge?fast+" / "+charge:fast||charge,
        location:clean(x.location,140),distance:distance===null?"":distance+" km",
        despawn:"",cp:String(cp),level:String(lv),
        iv:iv.raw,ivPercent:String(iv.percent),rank:"",ivRank:null,
        ivRankSource:"",ivRankLeague:"",shiny:x.shiny===true,
        form:clean(x.form,70)
      };
      if(Number.isFinite(end)) entry.expiresAtMs=end;
      cards.push(entry);
      if(cards.length===MAX_RESULTS) break;
    }
    return {ok:true,cards:cards,found:cards.length,siteCount:response.results.length,
      rejected:rejected,expired:expired,source:"api-fixture",
      // The native collector must confirm the actual requested filters
      // and fresh response independently before showing results or alerts.
      criteriaConfirmed:false,resultChanged:false,leagueConfirmed:false};
  }
  function optionalNumberSafe(x,min,max,integer) {
    try {return optionalNumber(x,min,max,integer);}catch(_){return null;}
  }
  return Object.freeze({MAX_RESULTS:MAX_RESULTS,buildPayload:buildPayload,
    normalizeResponse:normalizeResponse,parseIV:parseIV});
});
