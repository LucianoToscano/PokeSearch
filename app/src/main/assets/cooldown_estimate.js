/* LT145 Experimental: time estimates, NEVER a safety guarantee from Niantic.
 * Pure, no fetch, no GPS. Distinguishes exact coordinates from an unverified
 * server distance measured relative to a user-selected search center.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchCooldown=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const thresholds=[
  [10,0],[100,3],[500,15],[1000,30],[5000,120],
  [10000,360],[25000,660],[30000,840],[65000,1320],
  [81000,1500],[100000,2100],[250000,2700],
  [500000,3600],[750000,4500],[1000000,5400]
 ];
 function coords(value){
  if(typeof value!=="string"||value.length>100)return null;
  const p=/^\s*([+-]?\d+(?:\.\d+)?)\s*[,;]\s*([+-]?\d+(?:\.\d+)?)\s*$/.exec(value);
  if(!p)return null;
  const lat=Number(p[1]),lng=Number(p[2]);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return null;
  return {lat,lng};
 }
 function km(a,b){
  if(!a||!b)return null;
  const r=Math.PI/180,p=(b.lat-a.lat)*r,l=(b.lng-a.lng)*r;
  const h=Math.sin(p/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(l/2)**2;
  return 12742*Math.asin(Math.min(1,Math.sqrt(Math.max(0,h))));
 }
 function secondsForMeters(meters){
  if(!Number.isFinite(meters)||meters<0)return null;
  for(const [threshold,s] of thresholds)if(meters<threshold)return s;
  return 7200;
 }
 function providerKm(card){
  if(!card||typeof card.distance!=="string")return null;
  const m=/^(\d{1,6}(?:[.,]\d{1,6})?)\s*km$/i.exec(card.distance.trim());
  if(!m)return null;
  const k=Number(m[1].replace(",","."));
  return Number.isFinite(k)&&k>=0&&k<=100000?k:null;
 }
 function estimate(reference,card,options){
  const r=reference&&coords(reference.coords),target=coords(card?.coords);
  const captured=Number(reference?.capturedAt);
  if(!r||!Number.isSafeInteger(captured)||captured<=0||captured>Date.now()+60000)
   return {kind:"unavailable"};
  let distance=km(r,target),kind="exact";
  if(distance===null){
   const center=coords(options?.searchCenter);
   const fromProvider=providerKm(card);
   // This proves only the request CENTER equals the last capture.
   // It does not prove the API's distance_km reference: mark estimated.
   if(options?.apiVerified!==true||options?.fresh!==true||
      !center||km(center,r)>0.001||fromProvider===null)
    return {kind:"unavailable"};
   // Pad a small tolerance for possible upstream rounding. Never claim exact.
   distance=fromProvider+0.02;kind="estimated";
  }
  const seconds=secondsForMeters(distance*1000);
  return {kind,seconds,distanceKm:distance,
   until:captured+seconds*1000};
 }
 function remaining(value,now){
  if(!value||!Number.isFinite(value.until)||!Number.isFinite(now))return null;
  return Math.max(0,Math.ceil((value.until-now)/1000));
 }
 function format(value){
  if(!Number.isInteger(value)||value<0)return "--:--";
  const h=Math.floor(value/3600),m=Math.floor(value%3600/60),s=value%60;
  return h?String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0"):
   String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
 }
 return Object.freeze({coords,km,secondsForMeters,providerKm,estimate,remaining,format});
});
