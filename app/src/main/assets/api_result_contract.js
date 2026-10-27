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
  var MAX_RESULTS=100; // Upper safety bound; server tier cap remains authoritative.
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
    if(x==="⚲"||x==="Genderless") return "Genderless";
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
  /* Verified catalog data is an explicit argument, not guessed from sprite
   * names or numeric Pokémon labels. No catalog reads occur in this module. */
  var SORTS=Object.freeze({
    "Despawn (longest)":"DSP","DSP":"DSP",
    "CP (highest)":"CP","CP":"CP",
    "IV % (highest)":"IV","IV":"IV",
    "Level (highest)":"LEVEL","LEVEL":"LEVEL",
    "Distance (nearest)":"DISTANCE","DISTANCE":"DISTANCE"
  });
  var WEATHERS=Object.freeze({
    "Sunny":1,"Rainy":2,"Partly Cloudy":3,
    "Cloudy":4,"Windy":5,"Snow":6,"Fog":7
  });
  function verifiedFormNames(selection,catalog){
    if(!Array.isArray(selection)||selection.length>500) throw Error("Invalid form selection");
    if(!selection.length)return [];
    if(!Array.isArray(catalog)||catalog.length>1000) throw Error("Official forms catalog required");
    var available=new Set(catalog.filter(x=>typeof x==="string"&&x.length<=100));
    var out=[];
    for(var raw of selection){
      if(typeof raw!=="string"||!available.has(raw))throw Error("Form not in official catalog");
      if(!out.includes(raw))out.push(raw);
    }
    return out;
  }
  function verifiedSpeciesForms(selection,catalog){
    if(!Array.isArray(selection)||selection.length>100)throw Error("Invalid species forms");
    if(!selection.length)return [];
    if(!Array.isArray(catalog)||catalog.length>5000)throw Error("Official species catalog required");
    var valid=new Set();
    for(var item of catalog){
      if(!item||typeof item!=="object")continue;
      if(Number.isInteger(item.pokemon_id)&&item.pokemon_id>0&&item.pokemon_id<=10000&&
         Number.isInteger(item.form_id)&&item.form_id>=0&&item.form_id<=100000)
       valid.add(item.pokemon_id+":"+item.form_id);
    }
    var out=[],seen=new Set();
    for(var item of selection){
      if(!item||typeof item!=="object")throw Error("Invalid species form");
      var pokemon=requiredInt(item.pokemon_id,1,10000);
      var form=requiredInt(item.form_id,0,100000),key=pokemon+":"+form;
      if(!valid.has(key))throw Error("Species form not in official catalog");
      // A costume-specific choice cannot be represented by this pair alone.
      if(item.costume_id!==undefined&&item.costume_id!==null)
       throw Error("Costume specificity unavailable");
      if(!seen.has(key)){out.push({pokemon_id:pokemon,form_id:form});seen.add(key);}
    }
    return out;
  }
  function officialPokemonSelection(labels,catalog){
    if(!Array.isArray(labels)||labels.length>50)throw Error("Invalid Pokémon choices");
    if(!labels.length)return {ids:[],forms:[]};
    if(!Array.isArray(catalog)||catalog.length>5000)throw Error("Official Pokémon catalog required");
    var ids=[],forms=[],seen=new Set();
    for(var label of labels){
      if(typeof label!=="string"||!label.trim())throw Error("Invalid Pokémon label");
      // A species name is intentionally broad: all its official forms share
      // one dex id, and /search pokemon_ids includes every form of that species.
      // Never confuse a species name with a form-specific label.
      var speciesMatches=catalog.filter(x=>x&&typeof x==="object"&&x.species_name===label);
      if(speciesMatches.length){
       var speciesIds=new Set(speciesMatches.map(x=>requiredInt(x.pokemon_id,1,10000)));
       if(speciesIds.size!==1)throw Error("Ambiguous species name in official catalog");
       var speciesId=speciesIds.values().next().value;
       if(!seen.has(speciesId+":*")){seen.add(speciesId+":*");ids.push(speciesId);}
       continue;
      }
      // A form-specific label must resolve to exactly one official catalog row.
      var matches=catalog.filter(x=>x&&typeof x==="object"&&
       (x.form_name===label||x.label===label));
      if(matches.length!==1)throw Error("Ambiguous Pokémon form selection");
      var item=matches[0],pokemon=requiredInt(item.pokemon_id,1,10000);
      if(item.costume_id!==undefined&&item.costume_id!==null)
       throw Error("Costume-specific filtering unavailable");
      if(item.form_id===null||item.form_id===undefined){
       if(!seen.has(pokemon+":*")){seen.add(pokemon+":*");ids.push(pokemon);}
      }else{
       var form=requiredInt(item.form_id,0,100000),key=pokemon+":"+form;
       if(!seen.has(key)){seen.add(key);forms.push({pokemon_id:pokemon,form_id:form});}
      }
    }
    return {ids,forms};
  }
  function parseLocation(c){
    // The Android location toggle is authoritative. Old editor/extra-filter
    // values must never silently reapply coordinates after Clear.
    if(c.locationEnabled===false)return [null,null,null];
    var lat=optionalNumber(c.centerLat,-90,90,false),
        lng=optionalNumber(c.centerLng,-180,180,false);
    var radius=optionalNumber(c.radiusKm!==undefined?c.radiusKm:c.locationRadius,0,1000,false);
    if(c.locationEnabled===true){
      var raw=clean(c.locationCoords,100);
      var match=/^([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)$/.exec(raw);
      if(!match)throw Error("Location coordinates unavailable");
      var parsedLat=optionalNumber(match[1],-90,90,false);
      var parsedLng=optionalNumber(match[2],-180,180,false);
      if(lat!==null&&lat!==parsedLat||lng!==null&&lng!==parsedLng)
       throw Error("Contradictory location coordinates");
      lat=parsedLat;lng=parsedLng;
    }
    if((lat===null)!==(lng===null))throw Error("Incomplete coordinate pair");
    if((lat===null)!==(radius===null))throw Error("Center and radius required together");
    return [lat,lng,radius];
  }
  function buildPayload(config) {
    try {
      var c=config||{},mode=clean(c.mode||"raw",16).toLowerCase();
      if(!["iv","raw","percent","gl","ul"].includes(mode))throw Error("Unsupported mode");
      var genderList=c.genderSelections||[];
      if(!Array.isArray(genderList)||genderList.length>1)throw Error("API gender is singular");
      var sizes=apiArray(c.sizeSelections||[],7,x=>SIZES.has(x));
      var cp=oneRange(c,"cpMin","cpMax",0,100000,true);
      var level=oneRange(c,"levelMin","levelMax",1,50,false);
      var pvp=mode==="gl"||mode==="ul";
      var rank=pvp?requiredInt(mode==="gl"?c.glRank:c.ulRank,1,50):null;
      var stats=mode==="iv"?[15,15,15]:mode==="raw"?
        [requiredInt(c.attack,0,15),requiredInt(c.defense,0,15),requiredInt(c.stamina,0,15)]:[null,null,null];
      var pct=mode==="percent"?oneRange(c,"percentMin","percentMax",0,100,false):[null,null];
      var geo=parseLocation(c);
      var sortKey=c.sortBy||"Despawn (longest)",sort=SORTS[sortKey];
      if(!sort)throw Error("Unsupported sort");
      if(sort==="DISTANCE"&&geo[0]===null)throw Error("Distance requires verified radius");
      var weather=clean(c.weather||"Any",64),weatherId=null,boosted=null;
      if(weather==="Boosted")boosted=true;
      else if(weather!=="Any"&&weather!==""){
       if(!Object.prototype.hasOwnProperty.call(WEATHERS,weather))throw Error("Unsupported weather");
       weatherId=WEATHERS[weather];
      }
      if(c.weatherId!==undefined&&c.weatherId!==null){
       var explicitWeather=requiredInt(c.weatherId,1,7);
       if(weatherId!==null&&weatherId!==explicitWeather)throw Error("Conflicting weather");
       if(boosted===true)throw Error("Conflicting weather mode");
       weatherId=explicitWeather;
      }
      if(c.boosted===true){
       if(boosted===false)throw Error("Conflicting boost");
       boosted=true;
      }
      var rawForms=verifiedFormNames(c.formSelections||[],c.catalogForms);
      var species=verifiedSpeciesForms(c.speciesFormSelections||[],c.catalogSpeciesForms);
      var selection=officialPokemonSelection(c.pokemonSelections||[],c.catalogSpeciesForms);
      var pokemonIds=apiArray(c.officialPokemonIds||[],50,x=>
       Number.isInteger(x)&&x>=1&&x<=10000);
      for(var id of selection.ids)if(!pokemonIds.includes(id))pokemonIds.push(id);
      var allForms=verifiedSpeciesForms(species.concat(selection.forms),c.catalogSpeciesForms);
      var shinyAccount=c.shinyAccount===undefined||c.shinyAccount===null?null:c.shinyAccount;
      if(shinyAccount!==null&&(typeof shinyAccount!=="string"||!/^\d{12}$/.test(shinyAccount)))
       throw Error("Invalid trainer identifier");
      var textLocation=c.locationText===undefined?null:clean(c.locationText,100);
      if(textLocation==="")textLocation=null;
      var payload={
        shiny_only:c.shiny===true,shiny_account:shinyAccount,background_only:c.backgroundOnly===true,
        pvp_mode:pvp,pvp_league:mode==="ul"?"ultra":"great",
        pvp_top_rank:rank,pvp_include_pre_evolutions:c.includePreviousEvolutions!==false,
        pvp_min_cp:optionalNumber(c.minPvpCp,0,100000,true),
        pokemon_ids:pokemonIds,species_forms:allForms,forms:rawForms,location:textLocation,
        cp_min:cp[0],cp_max:cp[1],level_min:level[0],level_max:level[1],
        iv_mode:mode==="percent"?"percent":"raw",
        iv_percent_min:pct[0],iv_percent_max:pct[1],
        raw_iv_atk:stats[0],raw_iv_def:stats[1],raw_iv_sta:stats[2],
        sizes,gender:genderList.length&&genderList[0]!=="Any"&&genderList[0]!=="⚥"?
          apiGender(genderList[0]):null,
        boosted,weather_id:weatherId,min_ttl:optionalNumber(c.minTtl,0,60,true),
        sort,center_lat:geo[0],center_lng:geo[1],radius_km:geo[2],
        blacklist_pokemon_ids:apiArray(c.blacklistPokemonIds||[],200,x=>
         Number.isInteger(x)&&x>=1&&x<=10000),
        blacklist_species_forms:verifiedSpeciesForms(c.blacklistSpeciesForms||[],c.catalogSpeciesForms),
        blacklist_forms:verifiedFormNames(c.blacklistForms||[],c.catalogForms)
      };
      return {ok:true,payload};
    }catch(e){return {ok:false,reason:clean(e.message,80)||"Invalid API configuration"};}
  }

  function parseIV(raw,percent) {
    if(typeof raw!=="string"||!rawPattern.test(raw)) return null;
    var parts=raw.split("/").map(Number),calculated=Math.round((parts[0]+parts[1]+parts[2])*100/45);
    var observed=Number(percent);
    if(!Number.isFinite(observed)||observed<0||observed>100||Math.abs(observed-calculated)>0.55) return null;
    return {raw:raw,percent:observed};
  }
  function spriteData(item) {
    // The documented API omits sprite URLs. Reuse the existing PokeAPI
    // community base-sprite convention, but NEVER assign it to a costume
    // or a different form. These are not official API image URLs.
    if(!item||!Number.isInteger(item.pokemon_id)||
       item.pokemon_id<1||item.pokemon_id>10000)return "";
    // PoGoCoordinates may describe the ordinary species as
    // SPECIES_NORMAL, SPECIES_DEFAULT or the species name itself. Those
    // names are base forms, not special costumes; exact verified Dex PNG
    // is already packaged offline in both overlay WebViews. Never turn
    // Alolan/Galarian/other forms into the wrong base illustration.
    const normalKey=text=>clean(text,80).toUpperCase().replace(/[^A-Z0-9]/g,"");
    const species=normalKey(item.pokemon_name);
    const form=normalKey(item.form);
    const costume=normalKey(item.costume);
    // Official Furfrou Natural (#676) is the base coat, NOT a trim.
    // No other Furfrou trims are treated as base species.
    const furfrouNatural=item.pokemon_id===676&&species==="FURFROU"&&
      (form==="NATURAL"||form==="FURFROUNATURAL");
    const defaultForm=!form||form==="NORMAL"||form==="DEFAULT"||
      (species&&(form===species||form===species+"NORMAL"||form===species+"DEFAULT"))||
      furfrouNatural;
    if(!defaultForm)return "";
    if(costume&&costume!=="NONE"&&costume!=="NORMAL"&&costume!=="DEFAULT")return "";
    if(item.costume_id!==null&&item.costume_id!==undefined&&
       Number(item.costume_id)!==0)return "";
    return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+
      (item.shiny===true?"shiny/":"")+item.pokemon_id+".png";
  }
  /* Standalone fixture parser. This is NOT an authentication, Search,
   * freshness, ranking or filter-application attestation.
   */
  function normalizeResponse(response, config) {
    var options=config||{},now=Number.isFinite(options.nowMs)?options.nowMs:Date.now();
    if(!response||typeof response!=="object"||!Array.isArray(response.results)||
      response.results.length>MAX_SOURCE_RESULTS) return {ok:false,reason:"Invalid API results"};
    var cards=[],seen=new Set(),rejected=0,expired=0;
    // PvP selection must be checked against the entire signed-in server result
    // BEFORE the provider-authorized visible cap. Validate the exact configured league/rank.
    var pvpLeague=options.pvpLeague;
    var pvpRequired=pvpLeague!==undefined&&pvpLeague!==null;
    if(pvpRequired&&(!["great","ultra"].includes(pvpLeague)||
      !Number.isInteger(options.pvpMaxRank)||options.pvpMaxRank<1||
      options.pvpMaxRank>50))
      return {ok:false,reason:"Invalid PvP filters"};
    var serverCap=Number.isInteger(response.cap)&&response.cap>=0?response.cap:response.results.length;
    var cap=Math.min(MAX_RESULTS,serverCap); // Never exceed the cap actually returned by the provider.
    if(cap===0)return {ok:true,cards:[],found:0,siteCount:response.results.length,rejected:0,expired:0,serverCap:serverCap,displayCap:cap,source:"api-fixture",criteriaConfirmed:false,resultChanged:false,leagueConfirmed:false};
    for(var i=0;i<response.results.length;i++) {
      var x=response.results[i];
      if(!x||typeof x!=="object") {rejected++;continue;}
      var id=Number(x.pokemon_id),name=clean(x.pokemon_name,60),iv=parseIV(x.raw_iv,x.iv_percent);
      if(!Number.isInteger(id)||id<1||id>10000||!name||!iv) {rejected++;continue;}
      var cp=optionalNumberSafe(x.cp,0,100000,true),lv=optionalNumberSafe(x.level,1,50,false);
      if(cp===null||lv===null) {rejected++;continue;}
      if(options.shiny===true&&x.shiny!==true) continue;
      const pvp=x.pvp&&typeof x.pvp==="object"?x.pvp:null;
      if(pvpRequired&&(!pvp||pvp.league!==pvpLeague||
        !Number.isInteger(pvp.rank)||pvp.rank<1||
        pvp.rank>options.pvpMaxRank))continue;
      // Keep costume evidence when crossing the API->Android->WebView bridge.
      // If it is omitted, the detail WebView incorrectly substitutes a
      // normal base sprite for a verified costumed Pokémon.
      var costumeId=x.costume_id===undefined||x.costume_id===null?null:
        optionalNumberSafe(x.costume_id,0,100000,true);
      if(x.costume_id!=null&&costumeId===null){rejected++;continue;}
      // Optional GO form ID is encounter metadata, NEVER a synthesized image.
      var sourceFormId=x.form_id===undefined||x.form_id===null?null:
        optionalNumberSafe(x.form_id,0,100000,true);
      if(x.form_id!=null&&sourceFormId===null){rejected++;continue;}
      var end=typeof x.despawn_at==="string"?Date.parse(x.despawn_at):NaN;
      if(!Number.isFinite(end)) {rejected++;continue;}
      if(end<=now) {expired++;continue;}
      var encounter=clean(x.encounter_id,100);
      var fingerprint=encounter||[id,cp,iv.raw,x.location,x.despawn_at].join(":");
      if(seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      var size=typeof x.size==="string"&&SIZES.has(x.size)?x.size:"";
      var gender=x.gender==="Male"?"♂":x.gender==="Female"?"♀":x.gender==="Genderless"?"⚲":"";
      var fast=clean(x.fast_move,65),charge=clean(x.charge_move,65);
      var distance=optionalNumberSafe(x.distance_km,0,100000,false);
      var entry={
        sourceIndex:i,name:name,number:"#"+id,image:spriteData({...x,pokemon_id:id}),gender:gender,size:size,
        moves:fast&&charge?fast+" / "+charge:fast||charge,
        location:clean(x.location,140),distance:distance===null?"":distance+" km",
        despawn:"",cp:String(cp),level:String(lv),
        iv:iv.raw,ivPercent:String(iv.percent),
        rank:pvpRequired?String(pvp.rank):"",ivRank:null,
        ivRankSource:pvpRequired?"api-pvp":"",ivRankLeague:pvpRequired?pvpLeague:"",
        shiny:x.shiny===true,
        form:clean(x.form,70),costume:clean(x.costume,70),
        costume_id:costumeId
      };
      if(sourceFormId!==null)entry.form_id=sourceFormId;
      if(Number.isFinite(end)) entry.expiresAtMs=end;
      cards.push(entry);
      if(cards.length>=cap) break;
    }
    return {ok:true,cards:cards,found:cards.length,siteCount:response.results.length,
      rejected:rejected,expired:expired,serverCap:serverCap,displayCap:cap,source:"api-fixture",
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
