/* PokeSearch LT145 - independent, source-free Despawn visual clock.
 * Remaining seconds are rounded UP, so color thresholds are consistent
 * with the seconds displayed in the same card.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchDespawnVisual=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 function state(remainingSeconds){
  if(!Number.isFinite(remainingSeconds)||remainingSeconds<0)
   return Object.freeze({tone:"unknown",pulse:false,seconds:null});
  const seconds=Math.max(0,Math.ceil(remainingSeconds));
  // > 15m green; 5..15m orange; 2..5m pink; <= 2m red.
  // Pulse ONLY the clock in its last 60 seconds (not after expiry).
  const tone=seconds>900?"good":seconds>300?"warning":
   seconds>120?"pink":"critical";
  return Object.freeze({tone,pulse:seconds>0&&seconds<=60,seconds});
 }
 return Object.freeze({state});
});
