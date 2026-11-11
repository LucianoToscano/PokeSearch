"use strict";
/* LT325: provenance and exact-form gates for previously verified metadata.
 * Prevent a sort refresh from silently reusing an IV, km or art from a
 * different regional, shadow or event form. The original sort still wins.
 */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
const native=read("src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const evidence=require("../src/main/assets/result_evidence.js");
const t=(name,fn)=>{fn();console.log("PASS LT325 REUSE "+name);};
const reuse=native.slice(native.indexOf("private JSONArray retainVerifiedEncounterFields("),
 native.indexOf("private JSONArray sortItems("));
const match=reuse.slice(reuse.indexOf("private String encounterIdentityForMetadata("));
const now=Date.UTC(2026,10,10,12);
const card={evidenceSource:"site",evidenceVerified:true,evidencePartial:false,
 expiresAtMs:now+900000,iv:"15/15/15",ivPercent:"100",distance:"1.2 km"};

t("keep original 5 mandatory encounter identity fields, plus absolute expiry",()=>{
 assert.ok(reuse.includes("new String[]{\"number\",\"name\",\"cp\",\"level\",\"location\"}"));
 assert.match(match,/card\.optLong\("expiresAtMs",0\)/);
 assert.match(match,/StringBuilder identity=new StringBuilder/);
});
t("a change in form or form id invalidates previous metadata reuse",()=>{
 for(const key of ["form","form_id","variant","region"])
  assert.ok(match.includes('"'+key+'"'),key);
 assert.match(match,/card\.has\(field\)&&!card\.isNull\(field\)/);
 assert.match(match,/"<missing>"/);
});
t("different costume, shiny, shadow or sex must not borrow a cached IV",()=>{
 for(const key of ["costume","costume_id","costumeId","isCostume",
   "isShadow","shadow","shiny","gender","sex"])
  assert.ok(match.includes('"'+key+'"'),key);
});
t("cached sprite requires exact form and event identity in addition to encounter",()=>{
 const block=reuse.slice(reuse.indexOf("boolean sameArtIdentity="),
  reuse.indexOf("if(sameArtIdentity&&"));
 for(const key of ["form_id","costume_id","costumeId","isCostume","isShadow","shadow","gender","shiny"])
  assert.ok(block.includes('card.opt'+(key==="isShadow"||key==="isCostume"||key==="shadow"||key==="shiny"?"Boolean":"String")+'("'+key+'"'),key);
});
t("reused fields are generated locally, not accepted from provider",()=>{
 assert.match(reuse,/card\.remove\("evidenceReusedFields"\)/);
 assert.match(reuse,/JSONArray inherited=new JSONArray\(\)/);
 assert.match(reuse,/inherited\.put\(field\)/);
 assert.match(reuse,/inherited\.put\("distance"\)/);
 assert.match(reuse,/inherited\.put\("image"\)/);
 assert.match(reuse,/card\.put\("evidenceReusedFields",inherited\)/);
});
t("previous km is reused only for identical explicit search center",()=>{
 assert.match(reuse,/locationEnabled&&!locationCoords\.isEmpty\(\)/);
 assert.match(reuse,/locationCoords\.equals\(resultsDistanceCenter\)/);
 assert.match(reuse,/existing\.get\(encounterIdentityForMetadata\(card\)\)/);
 assert.match(reuse,/if\(sameDistanceCenter&&card\.optString\("distance",""\)\.trim\(\)\.isEmpty\(\)\)/);
});
t("previous PvP rank is scoped to same league mode, not merely IV percent",()=>{
 assert.match(reuse,/boolean samePvPMode=shownMode\.equals\(mode\)/);
 assert.match(reuse,/if\(samePvPMode\)for\(String field:scoped\)/);
});
t("evidence marks carried fields without masquerading as new source fields",()=>{
 const result=evidence.assess({...card,
  evidenceReusedFields:["iv","distance","rank","image","distance","unknown"]},
  {nowMs:now},{ivVerified:true});
 assert.equal(result.state,"verified");
 assert.match(result.explanation,/Campos preservados de busca anterior do mesmo encontro/);
 assert.match(result.explanation,/IV, distância, rank da pesquisa, sprite/);
 assert.doesNotMatch(result.explanation,/unknown/);
 assert.equal(result.details.filter(s=>s.includes("Campos preservados")).length,1);
});
t("spurious upstream field lists are ignored instead of rendered as text",()=>{
 const value=evidence.assess({...card,
  evidenceReusedFields:["<script>","__proto__","",1,null]}, {nowMs:now});
 assert.equal(value.state,"verified");
 assert.doesNotMatch(value.explanation,/<script>|__proto__|Campos preservados/);
});
console.log("LT325 metadata reuse: 9 scenarios PASS");
