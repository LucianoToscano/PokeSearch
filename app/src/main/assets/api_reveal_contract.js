/* LT77 experimental coordinate reveal contract — disabled in production.
 * Pure transformations only. No network, OAuth, token reads, storage or bridge.
 *
 * The existence of GET /reveal/{code}, anonymity, CORS and exact response
 * fields are not verified. GET and response shapes below are HYPOTHESES.
 * Never log/serialize a real reveal code outside an ephemeral browser scope.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchRevealContract=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const ORIGIN="https://coordinates-api.pokemongopro.com";
 // Conservative, encoded path segment: only an opaque code from the latest
 // server response. No handwritten/external value should be accepted by UI.
 const CODE_RE=/^[A-Za-z0-9_-]{12,2048}$/;
 function validCode(code){return typeof code==="string"&&CODE_RE.test(code);}
 function number(value,min,max){
  return typeof value==="number"&&Number.isFinite(value)&&value>=min&&value<=max?value:null;
 }
 function planForSpawn(spawn,options){
  const cfg=options||{},now=Number.isFinite(cfg.nowMs)?cfg.nowMs:Date.now();
  if(!spawn||typeof spawn!=="object")return {ok:false,reason:"invalid-spawn"};
  if(!Number.isInteger(spawn.pokemon_id)||spawn.pokemon_id<1||spawn.pokemon_id>10000)
   return {ok:false,reason:"invalid-pokemon"};
  const expiry=typeof spawn.despawn_at==="string"?Date.parse(spawn.despawn_at):NaN;
  if(!Number.isFinite(expiry)||expiry<=now)return {ok:false,reason:"expired-or-unknown-spawn"};
  const code=spawn.reveal_code;
  if(!validCode(code))return {ok:false,reason:"invalid-reveal-code"};
  // This URL is sensitive: do not log or export it, and disable redirects in
  // the eventual authenticated/same-session transport implementation.
  return {ok:true,method:"GET",url:ORIGIN+"/reveal/"+encodeURIComponent(code)};
 }
 function extractPair(body){
  // Provisional schemas until a redacted real 200 body is reviewed.
  if(!body||typeof body!=="object"||Array.isArray(body))return null;
  const shapes=[body,body.coordinates,body.coords,body.data];
  let winner=null;
  for(const shape of shapes){
   if(!shape||typeof shape!=="object"||Array.isArray(shape))continue;
   let lat=number(shape.lat,-90,90),lng=number(shape.lng,-180,180);
   if(lat===null||lng===null){
    lat=number(shape.latitude,-90,90);
    lng=number(shape.longitude,-180,180);
   }
   if(lat===null||lng===null)continue;
   const candidate={lat,lng};
   if(winner&&(winner.lat!==candidate.lat||winner.lng!==candidate.lng))
    return null; // conflicting coordinate pairs are not trustworthy
   winner=candidate;
  }
  return winner;
 }
 function normalizeRevealResponse(body,options){
  const pair=extractPair(body);
  if(!pair)return {ok:false,reason:"coordinates-unverified"};
  const cfg=options||{};
  if(cfg.expectedPokemonId!==undefined&&
     (!Number.isInteger(cfg.expectedPokemonId)||cfg.expectedPokemonId<1))
   return {ok:false,reason:"invalid-expected-identity"};
  // Expose only validated coordinates, never JWT, reveal code, encounters,
  // raw HTTP response, secrets, or user identifiers.
  return {ok:true,latitude:pair.lat,longitude:pair.lng,
    coords:pair.lat+","+pair.lng,source:"api-reveal-unverified"};
 }
 return Object.freeze({validCode,planForSpawn,normalizeRevealResponse});
});
