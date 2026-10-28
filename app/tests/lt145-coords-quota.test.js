"use strict";
const assert=require("node:assert/strict");
const policy=require("../src/main/assets/coords_quota.js");
const h=obj=>({get:key=>Object.prototype.hasOwnProperty.call(obj,key)?obj[key]:null});
assert.equal(policy.fromHeaders(null),null);
assert.equal(policy.fromHeaders(h({"x-ratelimit-limit":"100","x-ratelimit-remaining":"99"})),null);
assert.equal(policy.fromHeaders(h({"x-coords-reveal-limit":"30"})),null);
assert.equal(policy.fromHeaders(h({"x-coords-reveal-limit":"30","x-coords-reveal-remaining":"31"})),null);
assert.equal(policy.fromHeaders(h({"x-coords-reveal-limit":"30","x-coords-reveal-remaining":"-1"})),null);
assert.equal(policy.fromHeaders(h({"x-coords-reveal-limit":"999999999999999","x-coords-reveal-remaining":"2"})),null);
assert.deepEqual(policy.fromHeaders(h({"x-coords-reveal-limit":"30","x-coords-reveal-remaining":"12"})),
 {kind:"official",limit:30,remaining:12,resetAtUnixSeconds:null});
assert.deepEqual(policy.fromHeaders(h({"x-reveal-quota-limit":"20","x-reveal-quota-remaining":"0","x-reveal-quota-reset":"900000000"})),
 {kind:"official",limit:20,remaining:0,resetAtUnixSeconds:900000000});
console.log("LT145 coords quota evidence checks passed");
