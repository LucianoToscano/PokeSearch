"use strict";
// LT62: menu/result visual-state regression checks (no Android SDK required).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const tests=[];
function check(name,fn){tests.push([name,fn]);}
check("Location: active pin outer outline red, inner circle keeps neutral color",()=>{
 assert.match(dock,/\[data-key="location"\]\.selected \.quickGlyph svg>path\{\s*stroke:#ff5264!important;fill:none!important/);
 assert.match(dock,/\[data-key="location"\]\.selected \.quickGlyph svg>circle\{\s*stroke:var\(--visual-menu-fg/);
});
check("Pokémon: applied selection colors the silhouette yellow and OFF stays theme neutral",()=>{
 assert.ok(dock.includes('button.classList.toggle("pokemon-has-selection",id==="pokemon"'));
 assert.ok(dock.includes('button[data-key="pokemon"].pokemon-has-selection .quickGlyph svg'));
 assert.ok(dock.includes('color:#ffd64b!important;stroke:#ffd64b!important'));
});
check("Filters: only additional nondefault filters create count badge",()=>{
 assert.ok(dock.includes('button.classList.toggle("has-extra-filters",count>0)'));
 assert.ok(dock.includes('if(count>0)button.dataset.filterCount=String(count)'));
 assert.ok(dock.includes('else delete button.dataset.filterCount'));
 assert.ok(dock.includes('top:1px!important;right:1px!important'));
});
check("Gear rotates while searching; opening changes orientation; motion preference respected",()=>{
 assert.ok(dock.includes('#gear.busy svg{animation:gearbusy'));
 assert.ok(dock.includes('#gear[aria-expanded="true"]:not(.busy) .gear-icon{transform:rotate(90deg)}'));
 assert.ok(dock.includes('@media (prefers-reduced-motion:reduce)'));
});
check("Result Pokéball keeps independent header, central pulse and confirmed metadata",()=>{
 for(const x of ['id="resultIconStack"','id="capturePulse"','@keyframes psCapturePulse','activeSearchPhase==="searching"','id="modeIndicatorValue"','classList.toggle("long"'])assert.ok(dock.includes(x),x);
});
check("Percent interval badge uses one star band only or neutral percent art",()=>{
 const matched=dock.match(/function modePercentStarCount\(minValue,maxValue\)\{[\s\S]*?\n\}\nfunction getModeMenuIcon/);
 assert.ok(matched,"function available");
 const src=matched[0].replace(/\nfunction getModeMenuIcon$/,"");
 const sandbox={};vm.runInNewContext(src+";this.stars=modePercentStarCount",sandbox);
 for(const [min,max,expected] of [[0,0,0],[0,48,0],[51,64,1],[67,80,2],[82,98,3],[100,100,3],[0,100,-1],[50,100,-1],[60,90,-1]]){
  assert.equal(sandbox.stars(min,max),expected,`${min}-${max}`);
 }
 assert.ok(dock.includes('percent:starCount<0?"StarIVRaw.png"'));
 assert.ok(dock.includes('family==="percent"&&starCount<0?"%":""'));
});
check("LT62 screenshots: gender uses exactly four compact symbol squares; size uses seven",()=>{
 assert.match(dock,/LT62-COMPACT-REDMARKS/);
 assert.match(dock,/\.extraChipRow\[data-kind="gender"\]\{\s*grid-template-columns:repeat\(4,29px\)!important/);
 assert.match(dock,/\.extraChipRow\[data-kind="size"\]\{\s*grid-template-columns:repeat\(7,29px\)!important/);
 assert.match(dock,/\.extraChipRow \.extraChip\{[\s\S]*?width:29px!important;min-width:29px!important;max-width:29px!important/);
 assert.ok(dock.includes('["Any","Male","Female","Genderless"]'));
});
check("LT62 screenshots: mode list loses blank right column but IV/GL/UL stay cascaded",()=>{
 assert.match(dock,/\.modePanel\.modeCascade\{\s*width:54px!important;height:164px!important/);
 assert.match(dock,/\.modeCascadeRail\{\s*width:52px!important/);
 assert.ok(dock.includes('h=Math.max(h,baseHeight+164+6);'));
 for(const token of ['const tops={raw:67,percent:90,gl:113,ul:136};',
   'const offsets={raw:67,percent:90,gl:113,ul:136};',
   'left:54px!important;max-width:calc(100% - 54px)!important;'])
  assert.ok(dock.includes(token),token);
});
check("LT62 screenshots: filter numeric, size, sort and action buttons no longer stretch",()=>{
 for(const token of ['.extraNumberRow input{','width:72px!important;max-width:72px!important',
  '.extraNumberRow.extraLevel input{','width:37px!important;max-width:37px!important',
  '.modeAction.filterActions button{','flex:0 0 auto!important;width:auto!important;min-width:0!important;'])
  assert.ok(dock.includes(token),token);
});
check("LT62 screenshots: location and auto popup stay compact, with no empty footer widths",()=>{
 for(const token of ['width:min(222px,calc(100vw - 14px))!important',
  'width:min(153px,calc(100vw - 14px))!important',
  '.compactLocationActions button{','flex:0 0 auto!important;width:auto!important;min-width:0!important'])
  assert.ok(dock.includes(token),token);
});
check("LT62 screenshots: editor tabs, P/M/G and steppers use intrinsic widths",()=>{
 const editor=fs.readFileSync(path.join(__dirname,"../src/main/assets/visual_editor.js"),"utf8");
 assert.ok(editor.includes('wrap.append(title,value,range,fine)'));
 for(const token of ['.visualTabs .visualButton{','flex:0 0 auto!important;width:auto!important;min-width:68px!important',
  '.visualSlider>input[type="range"]{','.visualSlider>.visualFineTune{',
  'grid-column:2!important;grid-row:2!important','grid-template-columns:repeat(3,29px)!important'])
  assert.ok(dock.includes(token),token);
});

check("LT62 followup: PC and Level are minimum/maximum pairs with no steppers",()=>{
 for(const p of ['numberPair("PC","cpMin","cpMax");',
  'numberPair("Nível","levelMin","levelMax",true);',
  'group.setAttribute("aria-label",label+" mínimo e máximo")',
  '.extraRangeInputs input{'])assert.ok(dock.includes(p),p);
 assert.ok(!dock.includes('make("button","extraStep"'));
});
check("LT62 followup: display-only translations preserve English site values",()=>{
 for(const p of ['"Despawn (longest)":"Despawn"','"CP (highest)":"CP"',
 '"IV % (highest)":"IV %"','"Level (highest)":"Nível"',
 '"Distance (nearest)":"Distância"','"Any":"Qualquer"',
 '"Sunny":"Ensolarado/Limpo"','"Rainy":"Chuvoso"',
 '"Partly Cloudy":"Parcialmente nublado"','"Cloudy":"Nublado"',
 '"Windy":"Ventando"','"Snow":"Neve"','"Fog":"Névoa"'])
  assert.ok(dock.includes(p),p);
 assert.ok(dock.includes('btn.onclick=()=>{modeDraft[key]=value;'));
 assert.ok(dock.includes('btn.textContent=(modeDraft[key]===value?"✓ ":"")+filterDisplayLabel(key,value);'));
});
check("LT62 followup: Apply Clear Cancel are icon-only SVG buttons",()=>{
 for(const p of ['Aplicar filtros','Limpar filtros','Cancelar alterações',
  'svg.innerHTML=art[icon]','modeApply filterIconAction',
  'filterClear filterIconAction','filterIconAction filterCancel'])
  assert.ok(dock.includes(p),p);
});
check("LT62 design: IV%, Raw IV and rank have empty placeholders and only ✓",()=>{
 const block=dock.split("function renderModeChoices(){")[1].split("function renderExtraFilters(")[0];
 for(const p of [
  '["percentMin","Min %","percent"',
  '["percentMax","Max %","percent"',
  '["stamina","S","iv","Stamina"]',
  '["glRank","#","rank"',
  '["ulRank","#","rank"',
  'input.placeholder=placeholder;input.value=""',
  'editor.appendChild(confirm);panel.appendChild(editor)',
  'const limitsFor=kind=>kind==="percent"?[0,100]:kind==="iv"?[0,15]:[1,50]',
  'Object.assign(modeDraft,values)',
  'if(cascadeMode==="percent"&&values.percentMin>values.percentMax)'
 ])assert.ok(block.includes(p),p);
 assert.ok(!block.includes('cancel.className="modeCascadeCancel"'));
 assert.ok(!block.includes('input.addEventListener("touchend"'));
 assert.ok(dock.includes('body.controls-window #choices.modeCascade{pointer-events:none!important}'));
});
check("LT62 native site accepts all IV% boundaries and keeps gear on top",()=>{
 const service=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const probe=fs.readFileSync(path.join(__dirname,"../src/main/assets/probe.js"),"utf8");
 assert.ok(service.includes('!within(min,0,100)||!within(max,0,100)||min>max'));
 assert.ok(service.includes('ivPercentMin=Math.max(0,Math.min(100,pref.getInt("ivPercentMin",0)))'));
 assert.ok(probe.includes('filters.percentMin>=0&&filters.percentMax<=100'));
 const createResult=service.indexOf('createResultsWindow();');
 const attachDock=service.indexOf('wm.addView(root,params);');
 assert.ok(createResult>=0&&attachDock>createResult,"gear must be attached after menu/results");
});

check("LT62 Filtros: seven direct compact entries with separate editor, never accordion",()=>{
 const block=dock.split("function renderExtraFilters(panel,make){")[1]
  .split("function renderFilterPicker(")[0];
 assert.ok(block.includes('const rows=[...panel.querySelectorAll(":scope > .extraField")]'));
 assert.ok(block.includes('panel.append(rail,editor)'));
 assert.ok(block.includes('entry.classList.toggle("chosen",label===selected)'));
 assert.ok(!block.includes('section("Filtros gerais",generalExpanded'));
 assert.ok(dock.includes('panel.classList.add(\'filterCascade\')'));
 assert.ok(dock.includes('grid-template-columns:77px minmax(0,1fr)'));
});
check("LT62 Filtros: single Min/Max placeholders, blank Level/PC, large gender icons",()=>{
 const block=dock.split("function renderExtraFilters(panel,make){")[1]
  .split("function renderFilterPicker(")[0];
 assert.ok(block.includes('input.value=""; // UI-only empty'));
 assert.ok(block.includes('[[minKey,"Min","mínimo"],[maxKey,"Max","máximo"]]'));
 assert.ok(block.includes('cell.appendChild(input)'));
 assert.ok(!block.includes('cell.append(cap,input)'));
 assert.ok(dock.includes('filterFocus="PC"'));
 assert.ok(dock.includes('font:700 20px/1 Arial'));
 assert.ok(dock.includes('height:35px!important;min-height:35px!important'));
 assert.ok(dock.includes('const numericBounds=['));
 assert.ok(dock.includes('invalidNumber(lowKey,lowKey.startsWith("cp")?"PC":"Nível"'));
});
check("LT62 Localização: no instructional paragraphs, concise state and no OFF caption",()=>{
 const body=dock.split("function renderLocationChoices(){")[1]?.split("function manualRefreshTap(){")[0]||"";
 const feedback=dock.split("function locationPanelFeedback(){")[1]?.split("window.onLocationPaste=",1)[0]||"";
 assert.ok(body.includes('make("div","choiceHeader","LOCALIZAÇÃO")'));
 assert.ok(!body.includes('Coords e raio 0–1000 km. Aplicar pesquisa sem limpar outros filtros.'));
 assert.ok(!body.includes('const hide=make("button","locHide","Fechar")'));
 assert.ok(body.includes('actions.append(apply,clear)'));
 assert.ok(body.includes('message.setAttribute("role","status")'));
 assert.ok(body.includes('message.hidden=true'));
 assert.ok(feedback.includes('hint.hidden=state==="OFF"'));
 assert.ok(feedback.includes('state==="NOT_APPLIED"?"⚠ Localização não aplicada"'));
 assert.ok(!feedback.includes('OFF · busca geral'));
});
check("LT62 Localização: SVG de colar centralizado, km limitado e busca independente",()=>{
 const body=dock.split("function renderLocationChoices(){")[1]?.split("function manualRefreshTap(){")[0]||"";
 assert.ok(body.includes('document.createElementNS("http://www.w3.org/2000/svg","svg")'));
 assert.ok(body.includes('paste.appendChild(pasteIcon)'));
 assert.ok(body.includes('paste.onclick=()=>Native.pasteLocationCoords()'));
 assert.ok(body.includes('paste.setAttribute("aria-label","Colar coordenadas")'));
 assert.ok(dock.includes('justify-content:center!important;'));
 assert.ok(dock.includes('body.controls-window #choices.locationPanel .locPaste svg'));
 assert.ok(body.includes('radiusField.min="0";radiusField.max="1000";'));
 assert.ok(body.includes('Native.setLocation(true,wantedCoords,wantedRadius)'));
 assert.ok(body.includes('Native.setLocation(false,"",0)'));
});
check("LT62 Favoritos: no lists or scroll areas, max three live search results",()=>{
 const picker=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
 assert.ok(!picker.includes("new ListView("));
 assert.ok(!picker.includes("new ScrollView("));
 assert.ok(picker.includes('if(!key.isEmpty()){'));
 assert.ok(picker.includes('if(visible.size()==3)break;'));
 assert.ok(picker.includes('String dexInput=term==null?"":term.trim().replaceFirst("^#","").trim();'));
 assert.ok(picker.includes('String.format(Locale.US,"%03d",e.id).startsWith(dexInput)'));
 assert.ok(picker.includes('search.addTextChangedListener(new TextWatcher()'));
 assert.ok(picker.includes('results.removeAllViews()'));
 assert.ok(picker.includes('String term=search.getText().toString().trim()'));
 assert.ok(picker.includes('if(term.isEmpty())return;'));
});
check("LT62 Favoritos: all 50 accessible by 12-sprite pages with direct removal",()=>{
 const picker=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
 assert.ok(picker.includes('final int PAGE_SIZE=12;'));
 assert.ok(picker.includes('sprites.setColumnCount(6);'));
 assert.ok(picker.includes('centeredSprites.setGravity(Gravity.CENTER);'));
 assert.ok(picker.includes('GridLayout.spec(local/6),GridLayout.spec(local%6)'));
 assert.ok(picker.includes('selected.add(found!=null?found:new Entry(0,favorite.getValue()))'));
 assert.ok(picker.includes('tile.setOnClickListener(v->{WatchAlerts.toggle(activity,entry.name);refresh[0].run();})'));
 assert.ok(picker.includes('next.setOnClickListener'));
 assert.ok(picker.includes('previous.setOnClickListener'));
 assert.ok(picker.includes('count.setText("Selecionados  "+size+"/50")'));
});
check("LT62 Favoritos: compact 348dp dialog and notifications only in Alerts",()=>{
 const picker=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
 assert.ok(picker.includes('window.setLayout(Math.min(screen-dp(activity,22),dp(activity,348))'));
 assert.ok(picker.includes('finish.setText("×")'));
 assert.ok(picker.includes('search.setHint("Nome, forma ou nº da Pokédex")'));
 assert.ok(!picker.includes('WatchAlerts.setMode('));
 assert.ok(!picker.includes('testNotification.setText('));
 assert.ok(!picker.includes('Notificar favoritos (som definido no sino'));
 assert.ok(dock.includes('["☆ Testar aviso favorito","testNotification"]'));
 assert.ok(dock.includes('button.onclick=()=>Native.setFavoriteAlertMode(id)'));
});
for(const [name,fn] of tests){fn();process.stdout.write("✓ "+name+"\n");}
process.stdout.write("LT62: "+tests.length+"/"+tests.length+" checks passed\n");
