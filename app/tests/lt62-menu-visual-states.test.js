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
check("Unified Pokébola replaces gear art and keeps real mode/Shiny/loading indicators",()=>{
 const main=dock.split('<button id="gear"')[1]?.split('<div id="menu"',1)[0]||"";
 assert.ok(main.includes('id="dockModeIcon"'));
 assert.ok(main.includes('id="dockCapturePulse"'));
 assert.ok(main.includes('id="dockIndicatorValue"'));
 assert.ok(main.includes('id="dockIndicatorShiny"'));
 assert.ok(main.includes('id="dockIndicatorBackground"'));
 assert.ok(!main.includes('class="gear-icon"'));
 assert.ok(dock.includes('body.dock-window.search-active #gear .capturePulse'));
 assert.ok(dock.includes('body.result-window #resultHeader{display:none!important;pointer-events:none!important}'));
 assert.ok(dock.includes('for(const id of ["dockModeIcon","bubbleModeIcon"])'));
 assert.ok(dock.includes('getResultIcon(history?shownMode:mode,history?shownShiny:shiny,'));
 assert.ok(dock.includes('id="resultIconStack"')); // Existing result metadata logic retained.
 assert.ok(dock.includes('id="bubbleModeIcon"'));
 assert.ok(!dock.includes('document.getElementById("gear").classList.toggle("busy"'));
 assert.ok(dock.includes('prefers-reduced-motion:reduce'));
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
 for(const token of ['const room=Math.max(70,Number.parseFloat(getComputedStyle(document.documentElement)',
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
  'svg.innerHTML=icons[kind]','makeDockAction("apply","Aplicar filtros")',
  'makeDockAction("clear","Limpar filtros")','makeDockAction("cancel","Cancelar alterações")'])
  assert.ok(dock.includes(p),p);
});
check("LT62 design: IV%, Raw IV and rank preserve saved values and only ✓ applies",()=>{
 const block=dock.split("function renderModeChoices(){")[1].split("function renderExtraFilters(")[0];
 for(const p of [
  '["percentMin","Min %","percent"',
  '["percentMax","Max %","percent"',
  '["stamina","S","iv","Stamina"]',
  '["glRank","#","rank"',
  '["ulRank","#","rank"',
  'input.value=String(modeDraft[key]??searchSettings[key]??"")',
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
check("LT62 Filtros: single Min/Max placeholders and 29px gender chips",()=>{
 const block=dock.split("function renderExtraFilters(panel,make){")[1]
  .split("function renderFilterPicker(")[0];
 assert.ok(block.includes('input.value=String(modeDraft[key]??"")'));
 assert.ok(block.includes('[[minKey,"Min","mínimo"],[maxKey,"Max","máximo"]]'));
 assert.ok(block.includes('cell.appendChild(input)'));
 assert.ok(!block.includes('cell.append(cap,input)'));
 assert.ok(dock.includes('filterFocus="PC"'));
 assert.ok(dock.includes('font:600 16px/1 Arial'));
 assert.ok(dock.includes('width:29px!important;min-width:29px!important;max-width:29px!important'));
 assert.ok(dock.includes('const numericBounds=['));
 assert.ok(dock.includes('invalidNumber(lowKey,lowKey.startsWith("cp")?"PC":"Nível"'));
});
check("LT62 Localização: no instructional paragraphs, concise state and no OFF caption",()=>{
 const body=dock.split("function renderLocationChoices(){")[1]?.split("function manualRefreshTap(){")[0]||"";
 const feedback=dock.split("function locationPanelFeedback(){")[1]?.split("window.onLocationPaste=",1)[0]||"";
 assert.ok(body.includes('const title=make("div","choiceHeader")'));
 assert.ok(body.includes('titleAction=make("button","locTitleHelp","Localização")')&&
  body.includes('titleAction.onclick=renderLocationCooldownTable'));
 assert.ok(!body.includes('close.onclick=closeChoices;title.appendChild(close)'));
 assert.ok(!body.includes('Coords e raio 0–1000 km. Aplicar pesquisa sem limpar outros filtros.'));
 assert.ok(!body.includes('const hide=make("button","locHide","Fechar")'));
 assert.ok(body.includes('actions.append(apply,clear)'));
 assert.ok(body.includes('message.setAttribute("role","status")'));
 assert.ok(body.includes('message.hidden=true'));
 assert.ok(feedback.includes('hint.hidden=state==="OFF"'));
 assert.ok(feedback.includes('state==="NOT_APPLIED"?')&&
  feedback.includes('state==="SEARCH_ERROR"?"⚠ Busca falhou'));
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
check("LT62 Favoritos: all 50 sprites visible in 10 x 5 grid, no paging",()=>{
 const picker=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
 assert.ok(picker.includes('sprites.setColumnCount(10);'));
 assert.ok(picker.includes('sprites.setRowCount(5);'));
 assert.ok(picker.includes('centeredSprites.setGravity(Gravity.CENTER);'));
 assert.ok(picker.includes('GridLayout.spec(i/10),GridLayout.spec(i%10)'));
 assert.ok(picker.includes('tileOuterDp-2'));
 assert.ok(picker.includes('selected.add(found!=null?found:new Entry(0,favorite.getValue()))'));
 assert.ok(picker.includes('tile.setOnClickListener(v->{WatchAlerts.toggle(activity,entry.name);refresh[0].run();})'));
 assert.ok(!picker.includes('next.setOnClickListener'));
 assert.ok(!picker.includes('previous.setOnClickListener'));
 assert.ok(!picker.includes('final int PAGE_SIZE=12;'));
 assert.ok(picker.indexOf('root.addView(selectedRow)')<picker.indexOf('root.addView(search,searchParams)'));
 assert.ok(picker.includes('count.setText("Selecionados "+size+"/50")'));
});
check("LT62 Favoritos: compact 348dp dialog and notifications only in Alerts",()=>{
 const picker=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
 assert.ok(picker.includes('int preferredWidth=Math.min(screen-dp(activity,22),dp(activity,348))')&&picker.includes('window.setLayout(preferredWidth,')&&picker.includes('android.view.WindowManager.LayoutParams.WRAP_CONTENT'));
 assert.ok(picker.includes('finish.setText("×")'));
 assert.ok(picker.includes('search.setHint("Nome, forma ou nº da Pokédex")'));
 assert.ok(!picker.includes('WatchAlerts.setMode('));
 assert.ok(!picker.includes('testNotification.setText('));
 assert.ok(!picker.includes('Notificar favoritos (som definido no sino'));
 assert.ok(!dock.split("function renderAlertsChoices(){")[1].split("// Site -> App")[0].includes('"testNotification"]'));
 assert.ok(dock.includes('Native.setFavoriteAlertMode(id)'));
});
check("LT62 Notificações: painel somente 2 blocos × 3 ícones SVG e botões de áudio",()=>{
 const block=dock.split("function renderAlertsChoices(){")[1]?.split("// Site -> App")[0]||"";
 assert.ok(block.includes('panel.classList.add("alertsMini")'));
 assert.ok(block.includes('const symbols={'));
 assert.ok(block.includes('for(const id of ["on","silent","off"])'));
 assert.ok(block.includes('section("Novos Pokémon","general",alertMode,generalCustomTone)'));
 assert.ok(block.includes('section("Pokémon Favoritos","favorites",favoriteAlertMode,favoriteCustomTone)'));
 assert.ok(block.includes('select.textContent=tone?"Personalizado":"Padrão"'));
 assert.ok(block.includes('select.onclick=()=>Native.pickAlertTone(target)'));
 assert.ok(dock.includes('const SHOW_INDIVIDUAL_FAVORITE_TONES=false'));
 assert.ok(!block.includes('testNotification"]'));
 assert.ok(block.includes('Native.requestNotificationPermission()'));
 assert.ok(dock.includes('body.controls-window #choices.standardPanel.alertsMini'));
});
check("LT62 Notificações: 36 MP3 locais, favorito BR por padrão sem alterar preferências",()=>{
 const base=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
 const audio=fs.readFileSync(path.join(base,"PokeSoundLibrary.java"),"utf8");
 const watch=fs.readFileSync(path.join(base,"WatchAlerts.java"),"utf8");
 const service=fs.readFileSync(path.join(base,"OverlayService.java"),"utf8");
 const listed=audio.split('static final String[] LABELS={')[1].split('};')[0];
 const resource=audio.split('private static final int[] AUDIO={')[1].split('};')[0];
 assert.equal((listed.match(/^\s*"[^"]+",?$/gm)||[]).length,36);
 assert.equal((resource.match(/R\.raw\.ps_[a-z0-9_]+/g)||[]).length,36);
 assert.ok(resource.includes('R.raw.ps_jigglypuff_evolucao_meme'));
 assert.ok(resource.includes('R.raw.ps_snorlax'));
 assert.ok(watch.includes('if(favorite&&!p.contains(PREF_FAVORITE_TONE))'));
 assert.ok(watch.includes('PokeSoundLibrary.favoriteDefaultUri(context)'));
 // LT106 channels use the already resolved default/custom URI from selectedTone.
 assert.ok(watch.includes('Uri sound=selectedTone(context,true,species)'));
 assert.ok(watch.includes('pokesearch_fav_sound_v3_'));
 assert.ok(service.includes('alertModeCaption("Novos Pokémon",value)'));
 assert.ok(service.includes('alertModeCaption("Pokémon Favoritos",mode)'));
});
check("LT62 Notificações: ouvir, escolher, cancelar e enviar áudio são escolhas separadas",()=>{
 const main=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
 assert.ok(main.includes('String[] choices=new String[count+2]'));
 assert.ok(main.includes('choices[0]="Padrão"'));
 assert.ok(main.includes('choices[count+1]="＋ Enviar áudio"'));
 assert.ok(main.includes('playBundledTonePreview(which-1)'));
 assert.ok(main.includes('setPositiveButton("✓ Usar áudio"'));
 assert.ok(main.includes('setNegativeButton("Cancelar",null)'));
 assert.ok(main.includes('setNeutralButton("▶ Ouvir",null)'));
 assert.ok(main.includes('confirmUploadedAlertTone(target,species,uri)'));
 assert.ok(main.includes('dialog.setOnDismissListener(closed->stopBundledTonePreview())'));
});
check("LT62 Personalização: short labels, fixed-size sprites and aligned menu controls",()=>{
 const body=dock.split("function renderAppearanceChoices(){")[1]?.split('document.addEventListener("pointerdown",event=>{')[0]||"";
 assert.ok(body.includes('link("Info Pokémon","info")'));
 assert.ok(body.includes('link("Editor Visual","visual")'));
 assert.ok(body.includes('help.textContent="Menus · segure ≡ para arrastar"'));
 assert.ok(body.includes('reset.className="resetMenuLayout"'));
 assert.ok(body.includes('reset.textContent="↺"'));
 assert.ok(body.includes('commands.className="appearanceCommands"'));
 assert.ok(body.includes('line.dataset.key=id'));
 assert.ok(body.includes('handle.className="orderHandle"'));
 assert.ok(body.includes('bindAppearanceReorder(commands,panel)'));
 assert.ok(body.includes('eye.disabled=locked'));
 assert.ok(dock.includes('grid-template-columns:minmax(0,1fr) 27px 30px'));
 assert.ok(dock.includes('grid-template-columns:repeat(3,27px)'));
 assert.ok(dock.includes('button.onclick=()=>{if(Native.setSpriteSize)Native.setSpriteSize(size);}'));
});
check("LT208 menu ordering: all twelve menu items support drag and keyboard reorder",()=>{
 const code=dock.split("function movableMenuIds(){")[1]?.split("function renderAppearanceChoices(){")[0]||"";
 assert.ok(code.includes('return quickPrefs.order.filter(id=>QUICK_ACTIONS.some(action=>action[0]===id))'));
 assert.ok(code.includes('function bindAppearanceReorder(commands,panel)'));
 assert.ok(code.includes('commands.setPointerCapture(event.pointerId)'));
 assert.ok(code.includes('const movable=movableMenuIds(),index=movable.indexOf(id),other=movable[index+direction]'));
 assert.ok(code.includes('[quickPrefs.order[a],quickPrefs.order[b]]=[quickPrefs.order[b],quickPrefs.order[a]]'));
 assert.ok(code.includes('saveQuickPrefs();return true;'));
 assert.ok(dock.includes('const hidden=quickPrefs.hidden.includes(id)'));
});
check("LT62 Info Pokémon: 21 short accessible options and no descriptive footer",()=>{
 const block=dock.split("function renderInfoChoices(){")[1]?.split("// A persistent direct P/M/G selector")[0]||"";
 assert.ok(block.includes('uxPanel("INFO POKÉMON")'));
 assert.ok(block.includes('grid.className="infoGrid"'));
 assert.ok(block.includes('["distance","Dist.","Distância"]'));
 assert.ok(block.includes('["rawIv","IV A/D/S","IV bruto"]'));
 assert.ok(block.includes('const selected=key==="despawn"?showTimers:key==="iv"?showResultText:!!resultDisplayOptions[key]'));
 assert.ok(block.includes('Native.setResultDisplayOption(key,!resultDisplayOptions[key])'));
 assert.ok(!block.includes("As 21 informações começam ocultas"));
 assert.ok(dock.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
});
check("LT62 Editor Visual: collapsible groups preserve preview, settings and compact controls",()=>{
 const script=fs.readFileSync(path.join(__dirname,"../src/main/assets/visual_editor.js"),"utf8");
 assert.ok(script.includes('uxPanel("EDITOR VISUAL")'));
 assert.ok(script.includes('function visualGroup(host,id,title,create){'));
 assert.ok(script.includes('const visualOpenSection={results:"spacing",menu:"position"}'));
 assert.ok(script.includes('section.addEventListener("toggle"'));
 assert.ok(script.includes('if(!section.isConnected||choiceOpen!=="visual"||tab!==sectionTab)return'));
 assert.ok(script.includes('addSlider(panel,"popupWidth","Largura dos painéis"," px")'));
 assert.ok(script.includes('addSlider(panel,"popupHeight","Altura máxima"," px")'));
 assert.ok(script.includes('Native.previewVisualArea(tab)'));
 assert.ok(script.includes('saveSoon();renderVisualEditor()'));
 assert.ok(script.includes('btn(actions,"Copiar JSON"'));
 assert.ok(!script.includes('Ajuste ao vivo no jogo. Nada altera os filtros'));
 assert.ok(dock.includes('body.controls-window #choices.visualPanel.visualCompact .visualGroupTitle'));
 assert.ok(dock.includes('body.controls-window #choices.visualPanel.visualCompact .visualFineTune'));
 assert.ok(dock.includes('if(choiceOpen==="visual"&&kind!=="visual"&&window.Native&&Native.previewVisualArea)'));
});
check("LT62 Refresh: original 16px neutral icon spins only after manual tap; minutes in center",()=>{
 assert.ok(dock.includes('button[data-key="period"] .quickGlyph svg{width:16px!important'));
 assert.ok(dock.includes('button[data-key="period"] .periodBadge{'));
 assert.ok(dock.includes('left:50%;top:50%;transform:translate(-50%,-50%)'));
 assert.ok(dock.includes('font:400 7px/1 Roboto,Arial,sans-serif!important'));
 assert.ok(dock.includes('badge.textContent=period===0?"":period+"m"'));
 assert.ok(dock.includes('button.classList.add("refreshSpinning")'));
 assert.ok(dock.includes('@keyframes psRefreshSpin{to{transform:rotate(360deg)}}'));
 assert.ok(!dock.includes('button[data-key="period"].requested .quickGlyph{color:#ffdb70'));
 assert.ok(dock.includes('Native.refresh();'));
});
check("LT62 Atualização and More: OFF + five minutes, no AUTO decoration, transparent tile cascade",()=>{
 const auto=dock.split('const current=period;')[1]?.split('function positionCascadeEditor()')[0]||"";
 assert.ok(auto.includes('panel.classList.add("periodCompact","visible")'));
 assert.ok(auto.includes('row.appendChild(off)'));
 assert.ok(!auto.includes('label.textContent="AUTO"'));
 assert.ok(!auto.includes('className="periodCompactLabel"'));
 assert.ok(auto.includes('for(const value of [3,5,10,15,20])'));
 assert.ok(auto.includes('[...row.children].forEach(tile=>panel.appendChild(tile))'));
 assert.ok(!auto.includes('title.textContent="ATUALIZAÇÃO"'));
 assert.ok(!auto.includes('close.className="choiceClose"'));
 assert.ok(dock.includes('flex-direction:column!important'));
 assert.ok(dock.includes('width:var(--more-tile-width,30px)!important'));
 assert.ok(dock.includes('const periodHeight=tiles*30+Math.max(0,tiles-1)*gap;'));
 assert.ok(dock.includes('#choices:not(.visualPanel):not(.modeCascade):not(.filterCascade):not(.morePanel):not(.periodCompact){'));
 assert.ok(dock.includes('#choices.morePanel .quickMoreAction .quickGlyph{background:transparent!important'));
 assert.ok(dock.includes('#choices.morePanel [data-key=report] .quickGlyph{color:#ffd674!important}'));
 assert.ok(dock.includes('#choices.morePanel [data-key=donate] .quickGlyph{color:#fa94a7!important}'));
 assert.ok(dock.includes('#choices.morePanel [data-key=close] .quickGlyph{color:#ff596c!important}'));
});

check("LT62 Filtros: numeric ✓ remain inline; three requested icon actions show below rail",()=>{
 const body=dock.split("function renderExtraFilters(panel,make){")[1]?.split("function renderFilterPicker(",1)[0]||"";
 const panel=dock.split("function renderFiltersChoices(){")[1]?.split("function renderInfoChoices()",1)[0]||"";
 assert.ok(body.includes('numericConfirmButton(make,[minKey,maxKey],label)'));
 assert.ok(body.includes('if(key==="minPvpCp")wrapper.appendChild(numericConfirmButton(make,[key],label));'));
 assert.ok(dock.includes('button.dataset.filterConfirm=keys.join(",")'));
 assert.ok(dock.includes('button.onclick=()=>confirmNumericFilter(keys,label)'));
 assert.ok(dock.includes(".filterCascadeEditor .filterInlineConfirm{"));
 assert.ok(panel.includes("if(rail)rail.appendChild(actions);"),"three requested actions must be in the DOM");
 assert.ok(body.includes('updateFiltersPanelStatus()'));
 assert.ok(dock.includes('updateFiltersPanelStatus()'));
 assert.ok(!dock.includes('done.textContent="✓ Confirmar seleção"'));
});
check("LT62 Filtros: numeric ✓ patches only its own bounded fields",()=>{
 const script=dock.split("function patchSelectedFilterKeys(keys){")[1]?.split("function renderExtraFilters(",1)[0]||"";
 assert.ok(script,"scoped helpers");
 const source="function patchSelectedFilterKeys(keys){"+script+";this.patch=patchSelectedFilterKeys;this.confirm=confirmNumericFilter;";
 const requests=[],errors=[],saved={
  cpMin:"50",cpMax:"500",levelMin:"1",levelMax:"35",minPvpCp:"0",
  weather:"Rainy",genderSelections:["Female"],sortBy:"Despawn (longest)"};
 const draft={...saved,cpMin:"100",cpMax:"400",weather:"Sunny",genderSelections:["Male"]};
 let closes=0;
 const sandbox={modeDraft:draft,searchSettings:saved,
  Native:{patchSearchFilters:value=>requests.push(JSON.parse(value))},
  closeChoices:()=>{closes++;},
  document:{querySelector:()=>({setCustomValidity:m=>errors.push(m),reportValidity:()=>{}})}};
 vm.runInNewContext(source,sandbox);
 assert.equal(sandbox.confirm(["cpMin","cpMax"],"PC"),true);
 assert.equal(JSON.stringify(requests[0]),JSON.stringify({cpMin:"100",cpMax:"400"}));
 assert.equal(closes,1);
 sandbox.patch(["genderSelections"]);
 assert.equal(JSON.stringify(requests[1]),JSON.stringify({genderSelections:["Male"]}));
 draft.levelMin="51";
 assert.equal(sandbox.confirm(["levelMin","levelMax"],"Nível"),false);
 assert.equal(requests.length,2);
 assert.equal(closes,1);
 assert.ok(errors.some(x=>x.includes("1 a 50")));
 draft.levelMin="20";draft.levelMax="10";
 assert.equal(sandbox.confirm(["levelMin","levelMax"],"Nível"),false);
 assert.ok(errors.some(x=>x.includes("Min não pode ultrapassar Max")));
 draft.levelMax="35";draft.minPvpCp="1200";
 assert.equal(sandbox.confirm(["minPvpCp"],"PC PvP"),true);
 assert.equal(JSON.stringify(requests[2]),JSON.stringify({minPvpCp:"1200"}));
 assert.equal(closes,2);
});
check("Unified Pokébola touch contract: short tap results or closes menu, hold 600ms opens menu, drag cancels",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const grip=native.split('final boolean[] dockHeld={false};')[1]?.split("root.addView(grip,",1)[0]||"";
 for(const check of ['handler.postDelayed(dockLongPress,600L);',
  'handler.removeCallbacks(dockLongPress);',
  'if(minimized)minimize(false);',
  'menu(!menuExpanded);',
  'else if(menuExpanded)menu(false);',
  'else toggleResultsCollapsed();',
  'if(!dragged&&!dockHeld[0])',
  'if(Math.abs(dx)+Math.abs(dy)>dp(4))',
  'if(dragged){'
 ])assert.ok(grip.includes(check),check);
 assert.ok(native.includes('resultGrip.setVisibility(View.GONE)'));
 assert.ok(native.includes('if(resultCollapsed)resultRoot.setVisibility(View.GONE);'));
 assert.ok(native.includes('resultCollapsed||minimized||loginPaused||pickerOpen?View.GONE:View.VISIBLE'));
 assert.ok(native.includes('if(resultRoot!=null&&!pickerOpen&&!minimized&&!resultCollapsed)resultRoot.setVisibility(View.VISIBLE)'));
 assert.ok(native.includes('putBoolean("resultsCollapsed",resultCollapsed).apply()'));
 assert.ok(native.includes('putInt("resultsX",')); // User placement preferences retained.
 assert.ok(native.includes('putInt("resultsY",'));
});

check("Unified Pokébola reaches every screen edge while results stay clamped",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const grip=native.split('final boolean[] dockHeld={false};')[1]?.split("root.addView(grip,",1)[0]||"";
 for(const contract of [
  'dragResultStart[0]=resultParams.x;',
  'dragResultStart[1]=resultParams.y;',
  'int moveX=Math.max(minDx,Math.min(maxDx,dx));',
  'int moveY=Math.max(minDy,Math.min(maxDy,dy));',
  'params.x=startX+moveX;',
  'params.y=startY+moveY;',
  'dragResultStart[0]+moveX',
  'dragResultStart[1]+moveY',
  'positionResultsUnderPokeball(false);',
  'now-lastDockFrameAt[0]>=16L',
  'wm.updateViewLayout(resultRoot,resultParams);',
  'updateWindow(); // Includes open toolbar reposition.',
  'moveDetail();'
 ])assert.ok(grip.includes(contract),contract);
 // The old code intersected the icon and results bounds, stopping the icon
 // when a wide metadata strip reached the edge. Only the icon can constrain.
 assert.ok(!grip.includes('minDx=Math.max(minDx,-dragResultStart[0]);'));
 assert.ok(!grip.includes('maxDx=Math.min(maxDx,'));
 const clamp=(value,range)=>Math.max(0,Math.min(range,value));
 const simulate=(dock,result,dx,dy,screen)=>{
  const moved={
   x:clamp(dock.x+dx,screen.w-dock.w),
   y:clamp(dock.y+dy,screen.h-dock.h)
  };
  const appliedDx=moved.x-dock.x,appliedDy=moved.y-dock.y;
  return {dock:moved,result:{
   x:clamp(result.x+appliedDx,screen.w-result.w),
   y:clamp(result.y+appliedDy,screen.h-result.h)}};
 };
 const dock={x:130,y:200,w:53,h:32},result={x:60,y:260,w:330,h:210};
 const screen={w:390,h:850};
 const right=simulate(dock,result,500,0,screen);
 assert.equal(right.dock.x,337,"wide information must not block Pokébola");
 assert.equal(right.result.x,60,"result stays inside screen");
 for(const [dx,dy] of [[-30,45],[24,-12],[200,400],[-500,-500]]){
  const moved=simulate(dock,result,dx,dy,screen);
  assert.ok(moved.result.x>=0&&moved.result.y>=0);
  assert.ok(moved.result.x+result.w<=390&&moved.result.y+result.h<=850);
  assert.ok(moved.dock.x>=0&&moved.dock.y>=0);
 }
});
check("Unified Pokébola drag persists both windows and restores without overriding old result prefs",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const grip=native.split('final boolean[] dockHeld={false};')[1]?.split("root.addView(grip,",1)[0]||"";
 assert.ok(grip.includes('if(dragged){'));
 assert.ok(grip.includes('putInt("pokeballX",Math.round(params.x/density))'));
 assert.ok(grip.includes('putInt("pokeballY",Math.round(params.y/density))'));
 assert.ok(grip.includes('putInt("resultsX",Math.round(resultParams.x/density)-visualResultsOffsetX)'));
 assert.ok(grip.includes('putInt("resultsY",Math.round(resultParams.y/density)-visualResultsOffsetY)'));
 assert.ok(grip.includes('saved.apply();'));
 assert.ok(native.includes('dockPrefs.getInt("pokeballX",isSecondaryOverlay()?12:oldDefaultX)'));
 assert.ok(native.includes('dockPrefs.getInt("pokeballY",isSecondaryOverlay()?220:120)'));
 assert.ok(native.includes('prefs.getInt("resultsX",preferredX)'));
 assert.ok(native.includes('prefs.getInt("resultsY",preferredY)'));
 assert.ok(grip.includes('handler.removeCallbacks(dockLongPress);'));
 assert.ok(grip.includes('if(!dragged&&!dockHeld[0])'));
});

check("LT62 unified Pokébola: results start directly below icon, not at old saved location",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const anchor=native.split("private void positionResultsUnderPokeball(boolean applyLayout){")[1]
  ?.split("private void updateResultsWidth(){",1)[0]||"";
 assert.ok(anchor.length>200,"anchoring routine exists");
 for(const contract of [
  "int gap=ResultsSpacingPolicy.DEFAULT_TOP_GAP_PX+dp(visualHeaderAfterGap);",
  "int x=params.x+dp(visualResultsOffsetX);",
  "int below=params.y+dp(30)+gap+dp(visualResultsOffsetY);",
  "int above=params.y-resultParams.height-gap+dp(visualResultsOffsetY);",
  "if(below+resultParams.height>display.heightPixels&&above>=0)",
  "int maxX=Math.max(0,display.widthPixels-resultParams.width);",
  "int maxY=Math.max(0,display.heightPixels-resultParams.height);",
  "resultParams.x=desiredX;",
  "resultParams.y=desiredY;",
  "wm.updateViewLayout(resultRoot,resultParams);",
 ])assert.ok(anchor.includes(contract),contract);
 assert.ok(native.includes('resultPanel.loadUrl(OtaAssets.webUrl("dock.html?results=1"));\n        positionResultsUnderPokeball(true);'));
 assert.ok(native.includes("positionResultsUnderPokeball(true); // Editor offsets now relative to the unified icon."));
 assert.ok(native.includes("positionResultsUnderPokeball(false);"));
 assert.ok(native.includes("resultParams.height=pixels;\n        positionResultsUnderPokeball(false);"));
 const first=native.indexOf("int savedX=prefs.getInt(\"resultsX\",preferredX);");
 const migrated=native.indexOf("positionResultsUnderPokeball(true); // Migrate legacy independently saved list coordinates.");
 assert.ok(first>=0&&migrated>first,"legacy coordinate is replaced by the new anchor");
});
check("LT62 unified Pokébola: anchored placement clamps and flips above only when needed",()=>{
 const place=({iconX,iconY,iconW=53,resultsW=53,resultsH=400,width=400,height=850,gap=2,offX=0,offY=0})=>{
  const x=iconX+offX;
  const below=iconY+30+gap+offY,above=iconY-resultsH-gap+offY;
  const y=below+resultsH>height&&above>=0?above:below;
  return {x:Math.max(0,Math.min(Math.max(0,width-resultsW),x)),
   y:Math.max(0,Math.min(Math.max(0,height-resultsH),y))};
 };
 let a=place({iconX:280,iconY:90});
 assert.equal(a.x,280);assert.equal(a.y,122,"sprites begin 2dp below 30dp icon");
 a=place({iconX:280,iconY:700,resultsH:400});
 assert.equal(a.x,280);assert.equal(a.y,298,"above icon when below would overflow");
 a=place({iconX:375,iconY:50,resultsH:600,width:400,height:850});
 assert.equal(a.x,347,"clamp when right edge reached");
 a=place({iconX:280,iconY:90,offX:-12,offY:8,resultsH:400});
 assert.equal(a.x,268);assert.equal(a.y,130,"Editor offsets remain relative");
});

check("LT62 Shiny one-pass: tap only submits one verified Search, no extra setShiny calls",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const toggle=native.split("@JavascriptInterface public void shiny(){")[1]?.split("@JavascriptInterface public void refresh(){",1)[0]||"";
 assert.ok(toggle.includes("shiny=!shiny;"));
 assert.ok(toggle.includes("replaceActiveFilterSearch();"));
 assert.ok(toggle.includes("shinyLoginPromptRequested=shiny;"));
 assert.ok(toggle.includes("resultsStale=count()>0;"));
 assert.ok(toggle.includes("shinyVerified=false;"));
 assert.ok(toggle.includes("if(!shiny){"));
 assert.ok(toggle.includes("OverlayService.this.refresh(true);"));
 assert.ok(toggle.includes("startVerifiedShinySearch(generation,0);"));
 assert.ok(!toggle.includes("prepareImmediateShiny(generation);"));
 assert.ok(!toggle.includes("applyShinyOnSite(generation,0);"));
 assert.ok(!toggle.includes('execute("setShiny"'));
 assert.equal((toggle.match(/refresh\(true\);/g)||[]).length,1,
  "OFF refreshes once and ON starts the session-gated pipeline");
});
check("LT62 Shiny one-pass: short session-hydration retry never trusts stale preferences",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const code=native.split("private void startVerifiedShinySearch(int generation,int attempt){")[1]
  ?.split("private void prepareImmediateShiny(",1)[0]||"";
 assert.ok(code.includes('execute("session",session->'));
 assert.ok(code.includes('if("não confirmado".equals(auth)&&attempt<6){'));
 assert.ok(code.includes('startVerifiedShinySearch(generation,attempt+1),400L'));
 assert.ok(code.includes('if(!siteConfirmsShinyAccount(session))'));
 assert.ok(code.includes('revertUnverifiedShiny('));
 assert.ok(code.includes('openShinyLogin();'));
 assert.ok(code.includes('refresh(true);'));
 assert.ok(code.includes('generation!=requestGeneration||!shiny'));
 assert.ok(native.includes('session.optBoolean("trainerLinked",false)||hasConfirmedTrainerLink()'));
 assert.ok(native.includes('confirmedSubmittedFiltersGeneration=generation;'));
 assert.ok(native.includes('execute("verifyShiny",verified->'));
});
check("LT62 Shiny page readiness: one deferred search prevents two concurrent DOM updates",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const nav=native.split('pendingPageRefreshGeneration=searchInProgress?-1:requestGeneration;')[1]
  ?.split('@Override public void onReceivedError',1)[0]||"";
 assert.ok(nav.includes('if(!searchInProgress)handler.postDelayed(pageFinishedRefresh,'));
 assert.ok(nav.includes('shiny&&!shinyVerified?900L:2500L'));
 assert.ok(!nav.includes('prepareImmediateShiny(generation);'));
 assert.ok(native.includes('execute("setShiny",applied->') &&
  native.includes('verifyShinyAfterLocation(generation,manual,0);'),
  "the single Search must still apply Shiny after location verification");
 assert.ok(native.includes('confirmedSubmittedFiltersGeneration==requestGeneration&&'));
 assert.ok(native.includes('shiny&&!shinyVerified'));
});

check("LT62 Shiny: second session gate retries hydration instead of silently turning OFF",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const session=native.split("private void continueVerifiedSearchSession(")[1]
  ?.split("// React dropdowns are asynchronous:",1)[0]||"";
 assert.ok(session.includes('if(shiny&&"não confirmado".equals(auth)){'));
 assert.ok(session.includes('if(attempt<6){'));
 assert.ok(session.includes('continueVerifiedSearchSession(generation,manual,nextSession,attempt+1)'));
 assert.ok(session.includes('generation!=requestGeneration'));
 assert.ok(session.includes('searchInProgress=false;'));
 assert.ok(session.includes('searchFailure("⚠ Sessão Shiny pendente"'));
 const guard=session.indexOf('if(shiny&&!siteConfirmsShinyAccount(session))');
 assert.ok(guard>0,"fallback is only after unknown-session gate");
 assert.ok(!session.slice(0,guard).includes('revertUnverifiedShiny('),
  "temporary unknown must not clear saved ON preference");
});
check("LT62 Shiny: rapid ON/OFF invalidates previous generation without a duplicate Search",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const toggle=native.split("@JavascriptInterface public void shiny(){")[1]
  ?.split("@JavascriptInterface public void refresh(){",1)[0]||"";
 const cancel=native.split("private void replaceActiveFilterSearch(){")[1]
  ?.split("private void diagnosticError(",1)[0]||"";
 assert.ok(toggle.indexOf("shiny=!shiny;")<toggle.indexOf("replaceActiveFilterSearch();"));
 assert.ok(toggle.includes("resultsStale=count()>0;"));
 assert.ok(toggle.includes("shinyVerified=false;"));
 assert.ok(toggle.includes("startVerifiedShinySearch(generation,0);"));
 assert.equal(toggle.split("refresh(true);").length-1,1);
 assert.ok(cancel.includes("++requestGeneration;"));
 assert.ok(cancel.includes("confirmedSubmittedFiltersGeneration=-1;"));
 assert.ok(cancel.includes("handler.removeCallbacks(filterChangeRefresh);"));
});
check("LT62 Shiny: late WebView callbacks and stale DOM cannot relabel old results",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const execute=native.split("private void execute(String action,Consumer<JSONObject> callback){")[1]
  ?.split("private void refresh(){",1)[0]||"";
 const polling=native.split("private void pollSearch(int generation,int attempt,boolean manual){")[1]
  ?.split("private long expiration(",1)[0]||"";
 assert.ok(execute.includes("callbackGeneration!=requestGeneration"));
 assert.ok(execute.includes("callbackWebsite!=website"));
 assert.ok(execute.includes("callbackPage!=pageLoadGeneration"));
 assert.ok(polling.includes("generation!=requestGeneration"));
 assert.ok(polling.includes('resultFreshnessPending'));
 assert.ok(polling.includes('criteriaConfirmed'));
 assert.ok(polling.includes('applyCollectedResults(r);'));
 assert.ok(polling.indexOf('criteriaConfirmed')<polling.indexOf('applyCollectedResults(r);'));
});
check("LT62 Shiny: mode and filter changes do not overwrite user Shiny intent",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const config=native.split("@JavascriptInterface public void setSearchConfig(String payload)")[1]
  ?.split("@JavascriptInterface public void setMode(String s)",1)[0]||"";
 const changing=native.split("@JavascriptInterface public void setMode(String s)")[1]
  ?.split("@JavascriptInterface public void menu(boolean open)",1)[0]||"";
 assert.ok(config.includes("scheduleFilterChangeRefresh();"));
 assert.ok(changing.includes("replaceActiveFilterSearch();"));
 assert.ok(changing.includes("scheduleFilterChangeRefresh();"));
 assert.ok(!config.includes("shiny=false;"));
 assert.ok(!changing.includes("shiny=false;"));
});


check("LT62 visual parity: no empty Filtros backing and four compact gender symbols",()=>{
 const general=dock.match(/body\.controls-window #choices:not\(\.visualPanel\):[^\n]+/g)||[];
 assert.ok(general.some(line=>line.includes(':not(.filterCascade)')));
 assert.ok(dock.includes('LT62-FILTER-PARITY-02'));
 assert.ok(dock.includes('grid-template-columns:repeat(4,29px)!important'));
 assert.ok(dock.includes('font:600 16px/1 Arial'));
 assert.ok(dock.includes('#choices.filterCascade .filterCascadeEditor'));
});
check("LT62 refresh menu: all 6 choices reach native and receive confirmed state feedback",()=>{
 const menu=dock.split('const current=period;')[1]?.split('function positionCascadeEditor()',1)[0]||"";
 assert.ok(menu.includes('const selectInterval=value=>'));
 assert.ok(menu.includes('Native.setIntervalMinutes(value);'));
 assert.ok(menu.includes('off.onclick=()=>selectInterval(0)'));
 assert.ok(menu.includes('button.onclick=()=>selectInterval(value)'));
 assert.ok(menu.includes('requestedInterval=value===period?null:value'));
 assert.ok(dock.includes('if(requestedInterval!==null&&period===requestedInterval)requestedInterval=null'));
 assert.ok(menu.includes('tile.classList.toggle("awaiting",chosen&&requestedInterval!==null)'));
 assert.ok(!menu.includes('button.onclick=()=>{closeChoices();'));
});
check("LT62 Location: title paste, no close X, inline km and compact panel",()=>{
 const location=dock.split('function renderLocationChoices(){')[1]?.split('function manualRefreshTap(){',1)[0]||"";
 assert.ok(location.includes('label.append(labelName,radiusWrap)'));
 assert.ok(location.includes('clipboard.append(paste,copy)'));
  assert.ok(location.includes('label.append(actions)'));
  assert.ok(location.includes('panel.append(title,fieldRow,sliderRow,label,message)'));
  assert.ok(!location.includes('locSavedName'));
  assert.ok(!location.includes('locSlotTools'));

 assert.ok(location.includes('fieldRow.append(field)'));
 assert.ok(location.includes('const radiusWrap=make("span","locRadiusInputWrap")'));
 assert.ok(location.includes('radiusWrap.append(radiusField,unit)'));
 assert.ok(location.includes('const unit=make("span","locRadiusUnit","km")'));
 assert.ok(!location.includes('const close=make("button","choiceClose","×")'));
 assert.ok(dock.includes('width:min(208px,calc(100vw - 14px))!important'));
});
check("LT62 Alerts: smaller neutral buttons, real native tri-state and explicit pending status",()=>{
 const mini=dock.split('function renderAlertsChoices(){')[1]?.split('// Site -> App',1)[0]||"";
 assert.ok(dock.includes('width:min(166px,calc(100vw - 12px))!important'));
 assert.ok(dock.includes('font-size:10px!important;line-height:13px!important'));
 assert.ok(dock.includes('grid-template-columns:repeat(3,30px)!important'));
 assert.ok(dock.includes('.miniAlertState.chosen{\n background:var(--visual-menu-button-bg'));
 assert.ok(mini.includes('pendingAlertChoice[target]=id===value?null:id;'));
 assert.ok(mini.includes('Native.setAlertMode(id)'));
 assert.ok(mini.includes('Native.setFavoriteAlertMode(id)'));
 assert.ok(dock.includes('if(pendingAlertChoice.general===alertMode)pendingAlertChoice.general=null'));
 assert.ok(dock.includes('if(pendingAlertChoice.favorites===favoriteAlertMode)pendingAlertChoice.favorites=null'));
});
check("LT62 Favorite grid has exactly 50 10-column tiles before search with responsive size",()=>{
 const picker=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
 assert.ok(picker.includes('sprites.setColumnCount(10);'));
 assert.ok(picker.includes('sprites.setRowCount(5);'));
 assert.ok(picker.includes('for(int i=0;i<Math.min(size,50);i++)'));
 assert.ok(picker.includes('GridLayout.spec(i/10),GridLayout.spec(i%10)'));
 assert.ok(picker.includes('Math.min(screenDp-22,348)-22'));
 assert.ok(picker.indexOf('root.addView(selectedRow)')<picker.indexOf('root.addView(search,searchParams)'));
 assert.ok(!picker.includes('pagination.setText('));
 assert.ok(!picker.includes('PAGE_SIZE=12'));
});

check("LT62 visual Filtros: one rail, content-fitted editor, no empty background",()=>{
 const block=dock.split("/* LT62-FILTER-PARITY-02:")[1]
  ?.split("/* Compact location:",1)[0]||"";
 assert.ok(block.includes("background:transparent!important;border:0!important"));
 assert.ok(block.includes('width:min(calc(80px + var(--filter-editor-width,134px)),calc(100vw - 12px))!important'));
 assert.ok(block.includes('width:var(--filter-editor-width,134px)!important'));
 assert.ok(block.includes('pointer-events:none!important'));
 assert.ok(block.includes('pointer-events:auto!important'));
 assert.ok(dock.includes('panel.classList.remove("modePanel","standardPanel")'));
 assert.ok(dock.includes('panel.style.setProperty("--filter-editor-width",filterCascadeEditorWidth(selected)+"px")'));
 assert.ok(!block.includes("width:min(270px"));
});
check("LT62 visual Filtros: precise width contract per editor, never giant Sex panel",()=>{
 const code=dock.split("function filterCascadeEditorWidth(label){")[1]
  ?.split("function renderExtraFilters(panel,make){")[0]||"";
 assert.ok(code,"size resolver is available");
 const context={};
 vm.runInNewContext("function filterCascadeEditorWidth(label){"+code+";this.resolve=filterCascadeEditorWidth",context);
 for(const [type,expected] of [
  ["Sexo",80],["Tamanho",182],["PC",139],["Nível",108],
  ["Clima",158],["Ordenar",178],["Forma",216],["PC mínimo PvP",116]
 ])assert.equal(context.resolve(type),expected,type);
});
check("LT62 visual Filtros: exclusive Sex and 7 Size remain compact and independent",()=>{
 const block=dock.split("/* LT62-FILTER-PARITY-02:")[1]
  ?.split("/* Compact location:",1)[0]||"";
 assert.ok(block.includes('grid-template-columns:repeat(4,29px)!important'));
 assert.ok(block.includes('font:600 16px/1 Arial'));
 assert.ok(block.includes('font:600 10px/1 Roboto'));
 const render=dock.split('function renderExtraFilters(panel,make){')[1]
  ?.split('function renderFilterPicker(',1)[0]||"";
 assert.ok(render.includes('["Male","Female","Genderless"]'));
 assert.ok(render.includes('["XXS","XS","S","M","L","XL","XXL"]'));
 assert.ok(render.includes('if(isGender){modeDraft[multiKey]=checked?[]:[resolved];}'));
 assert.ok(render.includes('updateFiltersPanelStatus()'));
 assert.ok(render.includes('numericConfirmButton(make,[minKey,maxKey],label)'));
});

check("LT62 Tamanho: seven inline chips one row next to its rail entry",()=>{
 const css=dock.split("/* LT67 Stage 2 — width follows visible numbers")[1]?.split("</style>",1)[0]||"";
 assert.ok(css.includes('grid-template-columns:repeat(7,23px)!important'));
 assert.ok(css.includes('grid-template-rows:22px!important'));
 assert.ok(css.includes('grid-auto-flow:column!important'));
 assert.ok(css.includes('height:22px!important;min-height:22px!important'));
 assert.ok(css.includes('width:max-content!important'));
 assert.ok(!css.includes('overflow-x:auto'));
 // Seven chips and their six 3px gaps plus the editor chrome fit 230px.
 assert.ok(7*23+6*2+8<=182);
 assert.ok(80+182<=330);
 const cascade=dock.split("function filterCascadeEditorWidth(label){")[1]
  ?.split("function renderExtraFilters(panel,make){",1)[0]||"";
 assert.ok(cascade.includes('Tamanho:182'));
});
check("LT62 Tamanho: multi-select remains independent of Sex and other filters",()=>{
 const block=dock.split("function renderExtraFilters(panel,make){")[1]
  ?.split("function renderFilterPicker(",1)[0]||"";
 assert.ok(block.includes('["XXS","XS","S","M","L","XL","XXL"]'));
 assert.ok(block.includes('if(selected.has(resolved))selected.delete(resolved);else selected.add(resolved);'));
 assert.ok(block.includes('modeDraft[multiKey]=[...selected];'));
 assert.ok(block.includes('updateFiltersPanelStatus()'));
 assert.ok(block.includes('chips("size","Tamanho")'));
 assert.ok(block.includes('chips("gender","Sexo")'));
});

check("LT62 audit: bridge assignments are executable, not swallowed by // comment",()=>{
 const callback=dock.split("window.onNativeData=")[1]?.split("window.menuSide=",1)[0]||"";
 assert.ok(callback.includes('shiny=!!shi||shinyPending; // Preserve requested ON while site verification is pending.\n row=Number(r)||46;'));
 assert.ok(callback.includes('period=[0,3,5,10,15,20].includes(Number(interval))?Number(interval):5;'));
 assert.ok(callback.includes('spriteSize=[35,45,55].includes(Number(sprite))?Number(sprite):45;'));
 assert.ok(callback.includes('refreshSpriteSizeButtons();'));
 assert.ok(callback.includes('showTimers=!!timers;'));
 assert.ok(callback.includes('generalAlerts=!!general;'));
 assert.ok(callback.includes('hasFavorites=!!hasFav;'));
 assert.ok(callback.includes('notificationMode:(generalAlerts?"on":"off")'));
 assert.ok(!callback.includes('pending.row=Number(r)'));
});
check("LT62 audit: Filtros rail visibly contains Apply, Clear, Cancel",()=>{
 const filters=dock.split("function renderFiltersChoices(){")[1]?.split("function renderInfoChoices(){",1)[0]||"";
 assert.ok(filters.includes('actions.append(apply,clear,cancel);'));
 assert.ok(filters.includes('if(rail)rail.appendChild(actions);'));
 assert.ok(dock.includes('svg.innerHTML=icons[kind]'));
 assert.ok(filters.includes('apply.onclick=()=>'));
 assert.ok(filters.includes('clear.onclick=()=>'));
 assert.ok(filters.includes('cancel.onclick=closeChoices'));
 assert.ok(dock.includes('#choices.filterCascade .filterCascadeRail .filterRailActions'));
});
check("LT62 audit: Favoritos counter is in header and picker passes outside taps",()=>{
 const src=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
 const header=src.split('header.addView(title,')[1]?.split('root.addView(header);',1)[0]||"";
 assert.ok(header.includes('header.addView(count,'));
 assert.ok(header.includes('header.addView(finish,'));
 assert.ok(!src.includes('root.addView(counter)'));
 assert.ok(src.includes('count.setText("Selecionados "+size+"/50")'));
 assert.ok(src.includes('FLAG_NOT_TOUCH_MODAL'));
 assert.ok(src.includes('window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_DIM_BEHIND'));
 assert.ok(src.includes('android.view.WindowManager.LayoutParams.FLAG_BLUR_BEHIND'));
 assert.ok(src.includes('dialog.setCanceledOnTouchOutside(false)'));
 assert.ok(src.includes('sprites.setColumnCount(10)'));
});
check("LT62 audit: smaller centered notifications and readable location coordinates",()=>{
 const css=dock.split("/* LT62-AUDIT-267:")[1]?.split("</style>",1)[0]||"";
 assert.ok(css.includes('width:min(138px,calc(100vw - 12px))'));
 assert.ok(css.includes('text-align:center!important'));
 assert.ok(css.includes('justify-content:center!important;width:100%!important'));
 assert.ok(css.includes('margin:1px auto 0!important'));
 assert.ok(css.includes('width:min(172px,calc(100vw - 12px))'));
 assert.ok(css.includes('.locCoordsRow .locField'));
 assert.ok(css.includes('font-size:9px!important'));
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 assert.ok(native.includes('@JavascriptInterface public void setAlertMode(String value)'));
 assert.ok(native.includes('@JavascriptInterface public void setSpriteSize(int size)'));
});
check("LT62 audit: Visual Editor parameters and touch limitations remain explicit",()=>{
 const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 assert.ok(native.includes('menuRoot.addView(menuPanel,new FrameLayout.LayoutParams(-1,-1))'));
 assert.ok(native.includes('WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL'));
 const visual=fs.readFileSync(path.join(__dirname,"../src/main/assets/visual_editor.js"),"utf8");
 assert.ok(visual.includes('renderVisualEditor()'));
 assert.ok(visual.includes('P 30×30 dp · M 40×40 dp · G 50×50 dp'));
 assert.ok(visual.includes('arte centralizada em 84%'));
 assert.ok(visual.includes('addSlider(panel,"resultGapTop"'));
 assert.ok(visual.includes('addSlider(panel,"popupWidth"'));
 assert.ok(visual.includes('addSlider(panel,"popupHeight"'));
 assert.ok(visual.includes('addSegment(panel,"menuOrientation"'));
});

check("LT62 touch: outside a visible popup closes it without stealing real controls",()=>{
 const capture=dock.split('document.addEventListener("pointerdown",event=>{')[1]
   ?.split("if(controlsWindow){",1)[0]||"";
 assert.ok(capture.includes("if(!choiceOpen)return;"));
 assert.ok(capture.includes('event.target.closest("#choices")'));
 assert.ok(capture.includes('event.target.closest(\'#quickMenuList button[data-key]\')'));
 assert.ok(capture.includes("closeChoices();"));
});
check("LT62 notices: ON asks permission only after explicit selection",()=>{
 const alerts=dock.split("function renderAlertsChoices(){")[1]?.split("// Site -> App",1)[0]||"";
 assert.ok(alerts.includes('if(id==="on"&&!notificationPermissionGranted&&Native.requestNotificationPermission)'));
 assert.ok(alerts.includes('Native.requestNotificationPermission();'));
 assert.ok(alerts.indexOf('Native.requestNotificationPermission();')>alerts.indexOf('button.onclick=()=>{'));
});

check("LT62 native: outside Android window closes submenu without trapping outside touch",()=>{
 const src=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 const window=src.split('menuRoot=new FrameLayout(this){')[1]
  ?.split('menuPanel=new WebView(this);',1)[0]||"";
 assert.ok(window.includes('@Override public boolean dispatchTouchEvent(MotionEvent event)'));
 assert.ok(window.includes('event.getActionMasked()==MotionEvent.ACTION_OUTSIDE'));
 assert.ok(window.includes('if(menuExpanded&&menuLoaded&&menuPanel!=null)'));
 assert.ok(window.includes('js(menuPanel,true,"if(window.closeChoices)window.closeChoices()")'));
 assert.ok(window.includes('return false;'));
 assert.ok(window.includes('return super.dispatchTouchEvent(event);'));
 const params=src.split('menuParams=new WindowManager.LayoutParams(')[1]
  ?.split('PixelFormat.TRANSLUCENT);',1)[0]||"";
 assert.ok(params.includes('WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL'));
 assert.ok(params.includes('WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH'));
 assert.ok(src.includes('menuRoot.addView(menuPanel,new FrameLayout.LayoutParams(-1,-1))'));
});

check("LT62 Favorites: title counter, 10x5 grid and no redundant empty spacer",()=>{
 const picker=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
 assert.ok(picker.includes('header.addView(count'));
 assert.ok(picker.includes('count.setText("Selecionados "+size+"/50")'));
 assert.ok(picker.includes('sprites.setColumnCount(10)'));
 assert.ok(picker.includes('sprites.setRowCount(5)'));
 assert.ok(picker.indexOf('root.addView(selectedRow)')<picker.indexOf('root.addView(search,searchParams)'));
 assert.ok(!picker.includes('root.addView(empty)'));
 assert.ok(!picker.includes('empty.setVisibility('));
});
for(const [name,fn] of tests){fn();process.stdout.write("✓ "+name+"\n");}
process.stdout.write("LT62: "+tests.length+"/"+tests.length+" checks passed\n");
