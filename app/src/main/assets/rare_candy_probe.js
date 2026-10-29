/* LT177: PoGoCoordinates API Rare Candy collector.
 * Runs only inside the official https://pogocoordinates.com/search WebView.
 * JWT never crosses the JS/Android bridge: return only non-sensitive candy data.
 * The API returns exact coords and UTC expiry; no /reveal and no HTML scraping.
 */
(function() {
  "use strict";
  const API = "https://coordinates-api.pokemongopro.com/rare-candy/search";
  const isOfficial = () => location.protocol === "https:" &&
    (location.hostname === "pogocoordinates.com" ||
      location.hostname === "www.pogocoordinates.com") &&
    location.pathname === "/search";
  const validCoordinates = value => {
    if (typeof value !== "string") return false;
    const parts=value.split(",");
    if(parts.length!==2) return false;
    const lat=Number(parts[0].trim()),lng=Number(parts[1].trim());
    return parts[0].trim()!==""&&parts[1].trim()!=="" &&
      Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180;
  };
  const sanitize = item => {
    if(!item || !validCoordinates(item.coords)) return null;
    const expiry=Date.parse(item.expires_at);
    if(!Number.isFinite(expiry)||expiry<=Date.now())return null;
    return {
      coords:item.coords.trim(),
      location:String(item.location||"").slice(0,110),
      expires_at:new Date(expiry).toISOString(),
      distance_km:typeof item.distance_km==="number" &&
        Number.isFinite(item.distance_km) && item.distance_km>=0?
        item.distance_km:null
    };
  };
  async function search(coords,radiusMeters) {
    if(!isOfficial())return JSON.stringify({ok:false,status:403,error:"wrong-origin"});
    const payload={};
    if(coords && validCoordinates(coords)){
      const [lat,lng]=coords.split(",").map(Number);
      if(!Number.isFinite(radiusMeters) || radiusMeters<=0 ||
          radiusMeters>1000000) return JSON.stringify({ok:false,status:400,error:"invalid-radius"});
      payload.center_lat=lat;
      payload.center_lng=lng;
      // Site UI uses METERS; endpoint requires KM.
      payload.radius_km=radiusMeters/1000;
    }
    const headers={"Content-Type":"application/json"};
    // Auth stays in the website's own origin. No JWT in native callbacks/logs.
    const token=localStorage.getItem("jwt");
    if(token && token.trim())headers.Authorization="Bearer "+token.trim();
    try {
      const response=await fetch(API,{method:"POST",mode:"cors",credentials:"omit",
        cache:"no-store",headers,body:JSON.stringify(payload)});
      if(!response.ok){
        let retry=Number(response.headers.get("Retry-After")||0);
        if(!Number.isFinite(retry)||retry<0)retry=0;
        if(response.status===429)retry=Math.max(retry,60);
        return JSON.stringify({ok:false,status:response.status,
          error:response.status===429?"rate-limited":"request-failed",
          retry_after:Math.min(3600,retry)});
      }
      const json=await response.json();
      const cap=Number(json.cap)||5;
      // Keep provider's actual cap (including VIP), never request >cap.
      const items=Array.isArray(json.results)?
        json.results.slice(0,Math.min(10,Math.max(1,cap))).map(sanitize).filter(Boolean):[];
      return JSON.stringify({ok:true,status:200,items,
        tier:String(json.tier||"non_logged_in").slice(0,32),cap});
    }catch(e) {
      return JSON.stringify({ok:false,status:0,error:"network"});
    }
  }
  window.PokeSearchCandy={search,validCoordinates};
})();