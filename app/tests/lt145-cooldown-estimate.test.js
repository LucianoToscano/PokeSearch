"use strict";
const assert=require("node:assert/strict");
const c=require("../src/main/assets/cooldown_estimate.js");
const boundaries=[
 [0,0],[9.9999,0],[10,3],[99.999,3],[100,15],[499.999,15],
 [500,30],[999.999,30],[1000,120],[4999.999,120],[5000,360],
 [9999.999,360],[10000,660],[24999.99,660],[25000,840],
 [29999.9,840],[30000,1320],[64999.9,1320],[65000,1500],
 [80999,1500],[81000,2100],[99999,2100],[100000,2700],
 [249999,2700],[250000,3600],[499999,3600],[500000,4500],
 [749999,4500],[750000,5400],[999999,5400],[1000000,7200]
];
for(const [meters,seconds] of boundaries)assert.equal(c.secondsForMeters(meters),seconds,"meters "+meters);
for(const n of [NaN,-1,Infinity])assert.equal(c.secondsForMeters(n),null);
assert.equal(c.coords("999,0"),null);
assert.equal(c.coords("not-valid"),null);
assert.equal(c.km(c.coords("0,0"),c.coords("0,0")),0);
assert.equal(c.providerKm({distance:"2.25 km"}),2.25);
assert.equal(c.providerKm({distance:"10 mi"}),null);
const timestamp=Date.now()-2000;
const reference={coords:"0,0",capturedAt:timestamp};
const exact=c.estimate(reference,{coords:"0,0",distance:"1000 km"},{});
assert.equal(exact.kind,"exact");assert.equal(exact.seconds,0);
const noCenter=c.estimate(reference,{distance:"30 km"},{apiVerified:true,fresh:true,searchCenter:"1,1"});
assert.equal(noCenter.kind,"unavailable");
const oldSearch=c.estimate(reference,{distance:"30 km"},{apiVerified:true,fresh:false,searchCenter:"0,0"});
assert.equal(oldSearch.kind,"unavailable");
const unknown=c.estimate(reference,{distance:"30 km"},{apiVerified:false,fresh:true,searchCenter:"0,0"});
assert.equal(unknown.kind,"unavailable");
const estimated=c.estimate(reference,{distance:"30 km"},{apiVerified:true,fresh:true,searchCenter:"0,0"});
assert.equal(estimated.kind,"estimated");assert.equal(estimated.seconds,1320);
assert.equal(c.remaining(exact,Date.now()),0);
assert.equal(c.format(5400),"01:30:00");
assert.equal(c.format(660),"11:00");
assert.equal(c.format(0),"00:00");
console.log("LT145 cooldown boundaries, privacy, reference, formatting PASS");
