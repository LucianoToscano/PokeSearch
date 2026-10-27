"use strict";
/** Pure, deterministic RTDB transaction reducers for the single-P2 lease.
 * Each reducer returns undefined to abort without changing the current owner.
 * A device ID is never stored: callers hash the installation ID with Firebase UID.
 */
const LEASE_MS=90_000;
const TRANSFER_COOLDOWN_MS=60_000;
const obj=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
function claimBinding(current,{hash,name,now}){
  const old=obj(current);
  if(old.deviceHash&&old.deviceHash!==hash)return undefined;
  const fresh=!old.deviceHash;
  return {...old,deviceHash:hash,deviceName:name,
    boundAt:fresh?now:Number(old.boundAt||now),
    switchedAt:fresh?0:Number(old.switchedAt||0),
    updatedAt:now,sessionExpiresAt:now+LEASE_MS,
    releasedAt:0};
}
function transferBinding(current,{hash,name,now}){
  const old=obj(current);
  if(old.deviceHash===hash)return {...old,updatedAt:now,sessionExpiresAt:now+LEASE_MS};
  if(old.deviceHash&&Number(old.switchedAt||0)>now-TRANSFER_COOLDOWN_MS)
    return undefined;
  return {...old,deviceHash:hash,deviceName:name,boundAt:now,
    switchedAt:old.deviceHash?now:0,updatedAt:now,
    sessionExpiresAt:now+LEASE_MS,releasedAt:0};
}
function releaseBinding(current,{hash,now}){
  const old=obj(current);
  if(!old.deviceHash||old.deviceHash!==hash)return undefined;
  return {...old,deviceHash:"",deviceName:"",releasedAt:now,
    sessionExpiresAt:0,updatedAt:now,switchedAt:0};
}
function adminDisconnectBinding(current,{now}){
  const old=obj(current);
  if(!old.deviceHash)return undefined;
  return {...old,deviceHash:"",deviceName:"",releasedAt:now,
    sessionExpiresAt:0,updatedAt:now,switchedAt:0};
}
function adminAllowTransferBinding(current){
  const old=obj(current);
  if(!old.deviceHash||!old.switchedAt)return undefined;
  return {...old,switchedAt:0};
}
function sessionState(value,now){
  const v=obj(value);
  if(!v.deviceHash)return "unbound";
  return Number(v.sessionExpiresAt||0)>now?"active":"idle";
}
module.exports={LEASE_MS,TRANSFER_COOLDOWN_MS,claimBinding,transferBinding,
  releaseBinding,adminDisconnectBinding,adminAllowTransferBinding,sessionState};
