"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {validate}=require("./fastdev-request.cjs");
test("explicit valid fast/visual/apk-preview requests",()=>{
 for(const mode of ["fast","visual","apk-preview"])
  assert.equal(validate({schema:1,mode,request_id:"lt379-preview-1"}),mode);
});
test("invalid modes, absent identifiers and malformed schema fail closed",()=>{
 for(const input of [
  {schema:1,mode:"official-release",request_id:"yes"},
  {schema:1,mode:"apk-preview"},
  {schema:0,mode:"apk-preview",request_id:"yes"},
  {schema:1,mode:"apk-preview",request_id:"bad value"},
  null
 ]) assert.throws(()=>validate(input));
});
