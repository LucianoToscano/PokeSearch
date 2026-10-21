/* PokeSearch temporary visual editor. Presentation only; never modifies Search/IV evidence. */
(function(){
"use strict";
const DEFAULTS=Object.freeze({
 resultGapTop:0,resultGapBetween:31,resultSpriteScale:100,headerIconY:0,
 headerOffsetX:0,headerTouchWidth:35,headerTouchHeight:30,headerAfterGap:0,
 resultsOffsetX:0,resultsOffsetY:0,
 menuOffsetX:0,menuOffsetY:0,gearMenuGap:0,menuItemGap:0,
 popupWidth:232,popupHeight:390,
 resultsOrientation:"vertical",menuOrientation:"horizontal",
 resultsBgMode:"dark",resultsTransparency:100,
 menuBgMode:"dark",menuTransparency:35,showGuides:false
});
const RANGES={
 resultGapTop:[-80,80],resultGapBetween:[0,65],resultSpriteScale:[70,160],headerIconY:[0,72],
 headerOffsetX:[-16,16],headerTouchWidth:[26,42],headerTouchHeight:[24,50],headerAfterGap:[0,36],
 resultsOffsetX:[-200,200],resultsOffsetY:[-350,350],
 menuOffsetX:[-200,200],menuOffsetY:[-350,350],
 gearMenuGap:[0,80],menuItemGap:[0,16],popupWidth:[160,330],popupHeight:[140,420],
 resultsTransparency:[0,100],menuTransparency:[0,100]
};
const PRESETS={
 compact:{resultGapTop:-6,resultGapBetween:0,resultSpriteScale:130,menuItemGap:0},
 balanced:{resultGapTop:0,resultGapBetween:13,resultSpriteScale:115,menuItemGap:3},
 readable:{resultGapTop:8,resultGapBetween:40,resultSpriteScale:100,menuItemGap:7}
};
let current={...DEFAULTS},tab="results",saveTimer=null,pendingVisualJson="",saveEpoch=0;
function normalize(raw){
 const src=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{};
 const result={...DEFAULTS};
 for(const [key,limits] of Object.entries(RANGES)){
  const num=Number(src[key]);
  if(src[key]!==undefined&&src[key]!==null&&Number.isFinite(num))
   result[key]=Math.round(Math.max(limits[0],Math.min(limits[1],num)));
 }
 for(const key of ["resultsOrientation","menuOrientation"])
  if(src[key]==="vertical"||src[key]==="horizontal")result[key]=src[key];
 for(const key of ["resultsBgMode","menuBgMode"])
  if(src[key]==="light"||src[key]==="dark")result[key]=src[key];
 result.showGuides=src.showGuides===true;
 return result;
}
function rgba(mode,transparent){
 const color=mode==="light"?"255,255,255":"15,19,26";
 return "rgba("+color+","+(1-transparent/100).toFixed(2)+")";
}
function applyVisual(){
 window.visualPrefs=current;
 const root=document.documentElement,body=document.body;
 const set=(key,value)=>root.style.setProperty("--visual-"+key,value);
 set("top-gap",current.resultGapTop+"px");
 set("menu-gap",current.menuItemGap+"px");
 set("results-bg",rgba(current.resultsBgMode,current.resultsTransparency));
 set("menu-bg",rgba(current.menuBgMode,current.menuTransparency));
 set("menu-button-bg",rgba(current.menuBgMode,current.menuTransparency));
 set("menu-fg",current.menuBgMode==="light"?"#152231":"#f2f7fc");
 set("results-fg",current.resultsBgMode==="light"?"#172533":"#e6eefa");
 body.classList.toggle("visual-light-menu",current.menuBgMode==="light");
 body.classList.toggle("visual-light-results",current.resultsBgMode==="light");
 set("sprite-scale",String(current.resultSpriteScale/100));
 set("header-y",current.headerIconY+"px");
 set("header-x",current.headerOffsetX+"px");
 set("header-touch-width",current.headerTouchWidth+"px");
 set("header-touch-height",current.headerTouchHeight+"px");
 set("header-after",current.headerAfterGap+"px");
 set("popup-width",current.popupWidth+"px");
 set("popup-height",current.popupHeight+"px");
 body.classList.toggle("visual-menu-vertical",current.menuOrientation==="vertical");
 body.classList.toggle("visual-results-horizontal",current.resultsOrientation==="horizontal");
 body.classList.toggle("visual-guides",current.showGuides);
 if(resultWindow&&typeof draw==="function"){
  // Only row pitch/orientation changes require rebuilding sprites; theme and scale
  // apply via CSS without discarding images or their loaded/failed state.
  const signature=[current.resultGapBetween,current.resultsOrientation].join("/");
  if(window.__visualGeometry!==signature){
   window.__visualGeometry=signature;
   lastListKey="";draw();
  }else if(typeof fit==="function")fit();
 }
 if(controlsWindow&&typeof fit==="function")fit();
}
function saveSoon(){
 if(!controlsWindow)return;
 clearTimeout(saveTimer);
 const generation=++saveEpoch;
 pendingVisualJson=JSON.stringify(current);
 saveTimer=setTimeout(()=>{
  if(generation!==saveEpoch)return;
  saveTimer=null;
  if(window.Native&&Native.saveVisualPrefs)
   Native.saveVisualPrefs(pendingVisualJson);
 },100);
}
function change(key,value){
 current=normalize({...current,[key]:value});
 applyVisual();
 saveSoon();
}
function toast(msg){
 const el=document.getElementById("visualFeedback");
 if(el)el.textContent=msg;
}
function usePreset(name){
 current=normalize({...current,...PRESETS[name]});
 applyVisual();saveSoon();renderVisualEditor();
 toast("✓ Preset "+name+" aplicado em tempo real");
}
function heading(container,label){
 const el=document.createElement("div");el.className="uxSubheading";el.textContent=label;
 container.appendChild(el);
}
function addSlider(parent,key,label,unit){
 const limits=RANGES[key];
 const wrap=document.createElement("label");wrap.className="visualSlider";
 const title=document.createElement("span");title.textContent=label;
 const value=document.createElement("output");value.textContent=current[key]+(unit||"");
 const range=document.createElement("input");range.type="range";
 range.min=limits[0];range.max=limits[1];range.step=1;range.value=current[key];
 range.setAttribute("aria-label",label);
 range.oninput=()=>{
  value.textContent=range.value+(unit||"");
  change(key,Number(range.value));
 };
 const fine=document.createElement("div");fine.className="visualFineTune";
 const minus=document.createElement("button"),plus=document.createElement("button");
 minus.type="button";plus.type="button";minus.textContent="−";plus.textContent="+";
 minus.setAttribute("aria-label",label+" menos 1");
 plus.setAttribute("aria-label",label+" mais 1");
 const step=d=>{change(key,current[key]+d);range.value=String(current[key]);value.textContent=current[key]+(unit||"");};
 minus.onclick=()=>step(-1);plus.onclick=()=>step(1);
 fine.append(minus,plus);wrap.append(title,value,range,fine);parent.appendChild(wrap);
}
function addSegment(parent,key,label,options){
 const row=document.createElement("div");row.className="visualLine";
 const head=document.createElement("span");head.textContent=label;row.appendChild(head);
 const group=document.createElement("div");group.className="visualSegmentGroup";
 group.setAttribute("role","group");group.setAttribute("aria-label",label);
 for(const [value,title] of options){
  const button=document.createElement("button");
  button.type="button";button.className="visualSegment";button.textContent=title;
  button.setAttribute("aria-pressed",String(current[key]===value));
  button.classList.toggle("chosen",current[key]===value);
  button.onclick=()=>{change(key,value);renderVisualEditor();};
  group.appendChild(button);
 }
 row.appendChild(group);parent.appendChild(row);
}
function btn(container,title,fn){
 const b=document.createElement("button");b.type="button";b.className="visualButton";
 b.textContent=title;b.onclick=fn;container.appendChild(b);return b;
}
function renderVisualEditor(){
 if(!controlsWindow||choiceOpen!=="visual")return;
 const panel=uxPanel("🎛 EDITOR VISUAL · TEMPORÁRIO");
 panel.classList.add("visualPanel");
 const note=document.createElement("div");note.className="uxNote";
 note.textContent="Ajuste ao vivo no jogo. Nada altera os filtros ou o IV. Os ajustes persistem até restaurar.";
 panel.appendChild(note);
 const nav=document.createElement("div");nav.className="visualTabs";
 for(const [id,title] of [["results","Pokémon"],["menu","Menu"],["bg","Fundo"]]){
  const b=btn(nav,title,()=>{tab=id;renderVisualEditor();});
  b.classList.toggle("chosen",tab===id);
 }
 panel.appendChild(nav);
 if(tab==="results"){
  heading(panel,"Espaçamento e tamanho");
  if(window.renderSpriteSizeButtons)window.renderSpriteSizeButtons(panel,true);
  addSlider(panel,"resultGapTop","Pokébola → primeiro Pokémon"," px");
  addSlider(panel,"resultGapBetween","Distância entre Pokémon (0 = colados)"," px");
  addSlider(panel,"resultSpriteScale","Escala visual dos Pokémon","%");
  heading(panel,"Pokébola · botão completo e área de toque");
  addSlider(panel,"headerIconY","Botão + toque: posição Y (0 = topo)"," px");
  addSlider(panel,"headerOffsetX","Botão + toque: posição X"," px");
  addSlider(panel,"headerTouchWidth","Área clicável: largura"," px");
  addSlider(panel,"headerTouchHeight","Área clicável: altura"," px");
  addSlider(panel,"headerAfterGap","Espaço abaixo do botão"," px");
  heading(panel,"Posição da janela de resultados");
  addSlider(panel,"resultsOffsetX","Mover horizontalmente (X)"," dp");
  addSlider(panel,"resultsOffsetY","Mover verticalmente (Y)"," dp");
  addSegment(panel,"resultsOrientation","Organização dos resultados",
   [["vertical","Vertical ↕"],["horizontal","Horizontal ↔ (quebra de linha)"]]);
 }else if(tab==="menu"){
  heading(panel,"Posição e distância");
  addSlider(panel,"gearMenuGap","Engrenagem → menu"," dp");
  addSlider(panel,"menuItemGap","Distância entre botões"," px");
  addSlider(panel,"popupWidth","Largura das janelas (Modos)"," px");
  addSlider(panel,"popupHeight","Altura máxima das janelas"," px");
  addSlider(panel,"menuOffsetX","Mover menu horizontalmente (X)"," dp");
  addSlider(panel,"menuOffsetY","Mover menu verticalmente (Y)"," dp");
  addSegment(panel,"menuOrientation","Organização do menu",
   [["horizontal","Horizontal ↔"],["vertical","Vertical ↕"]]);
 }else if(tab==="bg"){
  heading(panel,"Resultados dos Pokémon");
  addSegment(panel,"resultsBgMode","Cor do fundo",
   [["dark","Escuro"],["light","Claro"]]);
  addSlider(panel,"resultsTransparency","Transparência (100 = invisível)","%");
  heading(panel,"Menus e filtros");
  // One opacity control drives tiles and submenus; legacy menuBgMode remains
  // in saved/imported JSON so earlier user presets are never destroyed.
  addSlider(panel,"menuTransparency","Transparência única dos menus","%");
  btn(panel,"Linhas-guia: "+(current.showGuides?"ON":"OFF"),()=>{
   change("showGuides",!current.showGuides);renderVisualEditor();
  });
 }else{
  heading(panel,"Exportar o visual para o ChatGPT");
  const textarea=document.createElement("textarea");
  textarea.className="visualJSON";textarea.value=JSON.stringify({schema:"pokesearch-visual-v1",...current},null,2);
  textarea.setAttribute("aria-label","Configuração visual JSON");
  panel.appendChild(textarea);
  textarea.addEventListener("focus",()=>Native.visualEditorFocus&&Native.visualEditorFocus(true));
  textarea.addEventListener("blur",()=>Native.visualEditorFocus&&Native.visualEditorFocus(false));
  btn(panel,"Copiar JSON",()=>{
   Native.copyVisualPrefs&&Native.copyVisualPrefs(JSON.stringify({schema:"pokesearch-visual-v1",...current},null,2));
   toast("✓ JSON copiado. Cole aqui na conversa.");
  });
  btn(panel,"Importar JSON digitado",()=>{
   let input;
   try{input=JSON.parse(textarea.value);}
   catch(e){toast("⚠ JSON inválido");return;}
   if(input.schema&&input.schema!=="pokesearch-visual-v1"){toast("⚠ Arquivo de outro formato");return;}
   current=normalize(input);applyVisual();saveSoon();renderVisualEditor();
   toast("✓ Layout importado");
  });
 }
 heading(panel,"Presets rápidos");
 const presets=document.createElement("div");presets.className="visualPresets";
 btn(presets,"Compacto",()=>usePreset("compact"));
 btn(presets,"Equilibrado",()=>usePreset("balanced"));
 btn(presets,"Legível",()=>usePreset("readable"));
 panel.appendChild(presets);
 const actions=document.createElement("div");actions.className="visualActions";
 btn(actions,"Restaurar padrão original",()=>{
  current=normalize(DEFAULTS);applyVisual();saveSoon();renderVisualEditor();
  toast("✓ Padrão original restaurado");
 });
 btn(actions,"Copiar JSON",()=>{
  if(window.Native&&Native.copyVisualPrefs)
   Native.copyVisualPrefs(JSON.stringify({schema:"pokesearch-visual-v1",...current},null,2));
  toast("✓ JSON copiado");
 });
 panel.appendChild(actions);
 const feedback=document.createElement("div");feedback.id="visualFeedback";
 feedback.className="uxNote";feedback.setAttribute("role","status");
 feedback.textContent="Prévia ativa · não precisa reiniciar";panel.appendChild(feedback);
 const back=btn(panel,"‹ Voltar à personalização",()=>{
  choiceOpen="appearance";renderAppearanceChoices();
 });
 back.classList.add("visualBack");
 fit();
}
window.renderVisualEditor=renderVisualEditor;
window.onVisualPrefs=function(raw){
 try{
  const obj=typeof raw==="string"?JSON.parse(raw):raw;
  const next=normalize(obj),incoming=JSON.stringify(next);
  // Status/notification updates may rebroadcast the last saved layout while
  // the thumb is still moving. Never roll back the user's unsaved values.
  if(pendingVisualJson&&pendingVisualJson!==incoming)return;
  if(pendingVisualJson===incoming)pendingVisualJson="";
  if(incoming!==JSON.stringify(current)){current=next;applyVisual();}
 }catch(e){/* ignore invalid persisted visual prefs */}
};
window.visualEditorCurrent=function(){return {...current};};
applyVisual();
})();