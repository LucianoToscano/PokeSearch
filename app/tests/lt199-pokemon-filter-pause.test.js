"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const base=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(base,"assets/dock.html"),"utf8");
const native=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const contract=require("../src/main/assets/api_result_contract.js");
const check=(name,fn)=>{fn();console.log("PASS Pokemon pause: "+name);};

check("API ignores remembered species while paused and restores exact selection",()=>{
 const catalog=[
  {pokemon_id:19,form_id:0,species_name:"Rattata",form_name:"Rattata"},
  {pokemon_id:19,form_id:46,species_name:"Rattata",form_name:"Alolan Rattata"}
 ];
 const saved=["Rattata"];
 const settings={mode:"raw",attack:15,defense:15,stamina:15,catalogSpeciesForms:catalog,
  pokemonSavedSelections:saved};
 const on=contract.buildPayload({...settings,pokemonFilterEnabled:true,pokemonSelections:saved});
 const off=contract.buildPayload({...settings,pokemonFilterEnabled:false,pokemonSelections:[]});
 assert.equal(on.ok,true,JSON.stringify(on));
 assert.equal(off.ok,true,JSON.stringify(off));
 assert.deepEqual(on.payload.pokemon_ids,[19]);
 assert.deepEqual(off.payload.pokemon_ids,[]);
 assert.deepEqual(off.payload.species_forms,[]);
 assert.deepEqual(saved,["Rattata"]);
});
check("ON/OFF is a direct switch, without Apply or clearing the chips",()=>{
 const render=dock.split("function renderPokemonChoices(){")[1]?.split("function renderMoreChoices(){")[0]||"";
 assert.match(render,/role","switch"/);
 assert.match(render,/Native\.setPokemonFilterEnabled\(pokemonFilterEnabledDraft\)/);
 assert.match(render,/pokemonFilterRow/);
 assert.ok(render.includes("const selection={selections:[...pokemonDraft],clear:pokemonForceClear}"));
 assert.ok(!render.includes("pokemonDraft=[];pokemonFilterEnabledDraft="));
});
check("Native keeps active and remembered selections separate",()=>{
 const toggle=native.split("@JavascriptInterface public void setPokemonFilterEnabled(boolean enabled)")[1]
   ?.split("// LT64-FILTER-DELTA")[0]||"";
 assert.match(toggle,/pokemonSavedSelections/);
 assert.match(toggle,/pokemonSelections",enabled\?/);
 assert.match(toggle,/new org\.json\.JSONArray\(\)/);
 assert.match(toggle,/clears\.add\("pokemonSelections"\)/);
 assert.match(toggle,/replaceActiveFilterSearch\(\)/);
 assert.match(toggle,/scheduleFilterChangeRefresh\(\)/);
 assert.match(toggle,/overlayPrefs\(\)\.edit\(\)\.putString\("extraFiltersJson"/);
});
check("Apply while paused saves names but keeps active species empty",()=>{
 const apply=native.split("@JavascriptInterface public void setPokemonSelections(String payload)")[1]
   ?.split("@JavascriptInterface public void setSearchConfig")[0]||"";
 assert.match(apply,/boolean enabled=extra\.optBoolean\("pokemonFilterEnabled",true\)/);
 assert.match(apply,/extra\.put\("pokemonSavedSelections",cleaned\)/);
 assert.match(apply,/extra\.put\("pokemonSelections",enabled\?cleaned:new org\.json\.JSONArray\(\)\)/);
});
check("GL/UL/IV mode changes and older saved filters keep remembered names",()=>{
 const config=native.split("@JavascriptInterface public void setSearchConfig(String payload)")[1]||"";
 assert.match(config,/previousMulti\.optJSONArray\("pokemonSavedSelections"\)/);
 assert.match(config,/previousMulti\.optJSONArray\("pokemonSelections"\)/);
 assert.match(config,/fromUi\.length\(\)>0\|\|remembered==null\|\|remembered\.length\(\)==0/);
 assert.match(config,/pokemonEnabled\?\s*new org\.json\.JSONArray\(validatedSaved\.toString\(\)\):new org\.json\.JSONArray\(\)/);
 assert.match(config,/clearPokemonSelection/);
});
check("OFF status and list reopening show saved names",()=>{
 assert.ok(dock.includes('searchSettings.pokemonSavedSelections'));
 assert.ok(dock.includes('pokemonFilterEnabledDraft=pokemonPickerBase.pokemonFilterEnabled!==false;'));
 assert.ok(dock.includes('pokemonDraft.length+(pokemonFilterEnabledDraft?" selecionados":" salvos · filtro OFF")'));
});
