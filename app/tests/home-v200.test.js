'use strict';
// HOME-V200-02: static security/state contracts + real HTML JS syntax validation.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const home=read('app/src/main/assets/home_v200.html');
const main=read('app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java');
const service=read('app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java');
const state=read('app/src/main/java/com/lucianotoscano/pokesearchoverlay/HomeFilterState.java');
const dock=read('app/src/main/assets/dock.html');
const gradle=read('app/build.gradle.kts');
let count=0;const check=(label,fn)=>{try{fn();count++;}catch(e){console.error('FAIL '+label,e);process.exitCode=1;}};
check('Own HOME file is not a remote site wrapper',()=>{
 assert.ok(main.includes('readAsset("home_v200.html")'));assert.ok(!main.includes('homeFiltersWebView.loadUrl("https://pogocoordinates.com/search")'));
 assert.ok(!home.includes('<iframe'));assert.ok(!home.includes('fetch('));
});
check('CSP blocks network and nested remote content',()=>{
 assert.ok(home.includes("connect-src 'none'"));assert.ok(home.includes("frame-src 'none'"));assert.ok(main.includes('setBlockNetworkLoads(true)'));
});
check('Native HOME bridge exists only in local WebView',()=>{
 assert.ok(main.includes('homeFiltersWebView.addJavascriptInterface(new HomeBridge(),"HomeNative")'));
 assert.ok(!main.includes('website.addJavascriptInterface(new HomeBridge()'));
});
check('Same service validates and submits site filters for HOME and overlay',()=>{
 assert.ok(service.includes('new Bridge().setSearchConfig(json)'));
 assert.ok(service.includes('HomeFilterState.ACTION_CONFIG'));
 assert.ok(service.includes('filterConfigJson()'));
 assert.ok(service.includes('execute("verifyFilters"'));
});
check('HOME config and menu config share canonical SharedPreferences',()=>{
 for(const key of ['rawAttack','rawDefense','rawStamina','glRank','ulRank','ivPercentMin','ivPercentMax','extraFiltersJson']){
  assert.ok(state.includes('"'+key+'"'),key);assert.ok(service.includes('"'+key+'"'),key);
 }
});
check('HOME receives latest overlay state without leaking via global IPC',()=>{
 assert.ok(service.includes('new Intent(HomeFilterState.ACTION_EVENT)'));
 assert.ok(service.includes('signal.setPackage(getPackageName())'));
 assert.ok(main.includes('RECEIVER_NOT_EXPORTED'));
});
check('HOME Search runs the existing site collector, never invented results',()=>{
 assert.ok(service.includes('HomeFilterState.ACTION_SEARCH'));
 assert.ok(service.includes('refresh(true)'));
 assert.ok(!home.includes('Math.random('));
});
check('No physical GPS permission or location API',()=>{
 assert.ok(main.includes('setGeolocationEnabled(false)'));
 assert.ok(!read('app/src/main/AndroidManifest.xml').includes('ACCESS_FINE_LOCATION'));
 assert.ok(!read('app/src/main/AndroidManifest.xml').includes('ACCESS_COARSE_LOCATION'));
 assert.ok(!home.includes('navigator.geolocation'));
});
check('Input constraints mirror service validation',()=>{
 assert.ok(state.includes('percentValid(min)'));
 assert.ok(state.includes('selection.length()>50'));
 assert.ok(service.includes('isAllowedIvPercent(min)'));
});
check('Shiny is only applied through existing authenticated site flow',()=>{
 assert.ok(service.includes('new Bridge().shiny()'));
 assert.ok(service.includes('siteConfirmsShinyAccount(session)'));
});
check('Location uses same official verification, not pasted WebView GPS',()=>{
 assert.ok(service.includes('new Bridge().setLocation('));
 assert.ok(service.includes('execute("verifyLocation:"'));
});
check('Official Pokémon suggestions are live and unknown choices fail safely',()=>{
 assert.ok(service.includes('"pokemonSuggest:"+JSONObject.quote(query)'));
 assert.ok(home.includes('HomeNative.suggest(q)'));
 assert.ok(service.includes('setSearchConfig(String payload)'));
});
check('Picker and HOME use same selected species key',()=>{
 for(const s of [home,dock,state,service])assert.ok(s.includes('pokemonSelections'));
});
check('Results have PSC-02 proof and marked staleness',()=>{
 assert.ok(service.includes('payload.put("stale",resultsStale)'));
 assert.ok(service.includes('payload.put("confirmed",!resultsStale'));
 assert.ok(home.includes('Resultado anterior · pendente'));
});
check('Saved presets local, not falsely claimed remote-site preset',()=>{
 assert.ok(home.includes('Presets salvos no PokeSearch'));
 assert.ok(main.includes('homeSavedFilters'));
});
check('Existing original compact dock untouched in layout',()=>{
 assert.ok(dock.includes('QUICK_ACTIONS'));
 assert.ok(dock.includes('setSearchConfig(JSON.stringify(next))'));
});
check('Changing overlay prefs refreshes open floating controls when not editing',()=>{
 assert.ok(dock.includes('filterChangedByHome'));
 assert.ok(dock.includes('!['+'"INPUT","SELECT","TEXTAREA"'+']'));
});
check('HOME local HTML script parses with current JS runtime',()=>{
 const script=home.match(/<script>([\s\S]*?)<\/script>/);assert.ok(script);
 new vm.Script(script[1]);
});
check('Supports 16 visible core controls and 46 permitted IV percentages',()=>{
 const m=home.match(/values=\[([^\]]+)\]/);assert.ok(m);
 assert.equal(m[1].split(',').length,46);
 for(const id of ['saved','pokemonQuery','shinyToggle','coords','radius','sortBy','weather','cpMin','cpMax','levelMin','levelMax','attack','defense','stamina','percentMin','percentMax','league','rank','size','form','gender','search'])assert.ok(home.includes('id="'+id+'"'),id);
});
check('Maintains original package and signing version configuration',()=>{
 assert.ok(gradle.includes('applicationId = "com.lucianotoscano.pokesearch"'));
 assert.ok(gradle.includes('2.00-beta.test.'));
});
check('Embedded picker is one multiselect surface with accessible chips and search',()=>{
 assert.ok(home.includes('id="pokemonPicker"'));
 assert.ok(home.includes('id="pokemonQuery" role="combobox"'));
 assert.ok(home.includes('id="pokemonChevron"'));
 assert.ok(home.includes('id="pokemonClear"'));
 assert.ok(home.includes('role="listbox"'));
});
check('The HOME Pokédex works without starting the overlay',()=>{
 assert.ok(main.includes('view.evaluateJavascript("window.onHomeCatalog("'));
 assert.ok(main.includes('new JSONArray(readAsset("pokemon_catalog.json"))'));
 assert.ok(home.includes('window.onHomeCatalog=entries=>'));
 assert.ok(home.includes('function localPokemonMatches(query)'));
 assert.ok(home.includes('showPokemonPicker(true)'));
 assert.ok(!main.includes("Ative o overlay para obter opções oficiais"));
});
check('Local species remain visible while official form suggestions are pending',()=>{
 assert.ok(home.includes('renderSuggestions([...official,...local])'));
 assert.ok(home.includes('renderSuggestions(local)'));
 assert.ok(home.includes('if(remote&&q)suggestDelay='));
});
check('Multiple species selection and clear propagate to one shared filter state',()=>{
 assert.ok(home.includes('cfg.pokemonSelections=[...chosen,name]'));
 assert.ok(home.includes('cfg.clearPokemonSelection=true'));
 assert.ok(home.includes("if(chosen.length>=50)"));
 assert.ok(home.includes('chips();changed()'));
});
check('Only site-verified results can be presented as confirmed',()=>{
 assert.ok(home.includes('Confirmação final na busca'));
 assert.ok(service.includes('execute("verifyFilters"'));
});
check('Bundled Pokédex query resolves species locally and never guesses forms',()=>{
 const catalog=JSON.parse(read('app/src/main/assets/pokemon_catalog.json'));
 assert.ok(catalog.length>1000);
 const f=home.match(/function localPokemonMatches\(query\)\{[\s\S]*?\n\}/);
 assert.ok(f,'Local catalog matcher must be available');
 const matcher=vm.runInNewContext(f[0]+';localPokemonMatches;', {pokemonCatalog:catalog});
 const char=matcher('char');
 assert.ok(char.some(x=>x.label==='Charmander'));
 assert.ok(char.some(x=>x.label==='Charizard'));
 assert.ok(matcher('7').some(x=>x.label==='Squirtle'));
 assert.equal(matcher('not-a-pokemon-name-xyz').length,0);
 assert.ok(char.length<=35);
 assert.ok(!char.some(x=>x.label.toLowerCase().includes('alolan')),
   'Do not manufacture unverified regional form labels');
});
check('Search replica has original header and all six tab controls',()=>{
 for(const tab of ['pokemon','raids','quests','weather','rocket','power-spots'])
  assert.ok(home.includes('data-search-tab="'+tab+'"'),tab);
 assert.ok(home.includes('<h1>Pokesearch</h1>'));
 assert.ok(home.includes('Find live Pokemon GO spawns by IV, CP, level, size, form, and location.'));
});
check('Unsupported categories use a secure unbridged official browser',()=>{
 assert.ok(home.includes('HomeNative.openOfficialSearchTab'));
 assert.ok(main.includes('case "raids":route="/search?tab=raids"'));
 assert.ok(main.includes('case "quests":route="/search?tab=quests"'));
 assert.ok(main.includes('case "weather":case "rocket":case "power-spots"'));
 assert.ok(main.includes('browser.loadUrl("https://pogocoordinates.com"+route)'));
 assert.ok(!main.includes('officialSearchWebView.addJavascriptInterface'));
 assert.ok(main.includes('callback.invoke(origin,false,false)'));
});
check('Native HOME exposes official site actions without claiming account presets are local',()=>{
 for(const id of ['savedOfficial','advancedOfficial','map','siteTerms','sitePrivacy','siteRefunds'])
  assert.ok(home.includes('id="'+id+'"'),id);
 assert.ok(home.includes("$('notify').onclick=()=>official('notify')"));
 assert.ok(main.includes('case "map":route="/map"'));
 assert.ok(main.includes('case "vip":route="/vip"'));
 assert.ok(home.includes('Presets salvos no PokeSearch'));
});
check('Area and location respect the no physical GPS constraint',()=>{
 assert.ok(home.includes('id="useMyLocation"'));
 assert.ok(home.includes('disabled title="GPS físico desativado'));
 assert.ok(home.includes("official('area')"));
 assert.ok(!home.includes('navigator.geolocation'));
});
check('Only site-confirmed coordinates can be copied from result cards',()=>{
 assert.ok(home.includes("if(confirmed&&!stale&&typeof c.coords==='string'"));
 assert.ok(home.includes('HomeNative.copyConfirmedCoords(c.coords)'));
 assert.ok(main.includes('copyConfirmedCoords(String coords)'));
 assert.ok(home.includes('cards.slice(0,10)'));
});
check('Footer controls exist before the inline HOME script runs',()=>{
 const scriptStart=home.indexOf('<script>');
 for(const name of ['siteTerms','sitePrivacy','siteRefunds']){
  const at=home.indexOf('id="'+name+'"');
  assert.ok(at>=0&&at<scriptStart,name+' must exist before listeners attach');
 }
});
check('Raw IV and percent IV never share visible inputs',()=>{
 assert.ok(home.includes('id="percentFields"'));
 assert.ok(home.includes('id="rawFields" class="iv-fields hidden"'));
 assert.ok(home.includes('id="ivInputsRow"'));
 assert.ok(home.includes("$('percentFields').classList.toggle('hidden',raw)"));
 assert.ok(home.includes("$('rawFields').classList.toggle('hidden',!raw)"));
 assert.ok(home.includes("$('ivInputsRow').classList.toggle('quad',raw)"));
 assert.ok(home.includes("$('ivInputsRow').classList.toggle('triple',!raw)"));
 assert.ok(home.indexOf('id="weather"')>home.indexOf('id="rawFields"'));
});
check('HOME never shows more than ten search cards',()=>{
 assert.ok(home.includes('cards.slice(0,10)'));
 assert.ok(!home.includes('cards.slice(0,100)'));
});
console.log('PokeSearch HOME v2.00 unified state: '+count+' tests passed');
if(process.exitCode)process.exit(process.exitCode);
