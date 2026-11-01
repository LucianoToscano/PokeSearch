/* PokeSearch temporary visual editor. Presentation only; never modifies Search/IV evidence. */
(function(){
"use strict";
const DEFAULTS=Object.freeze({
 resultGapTop:0,resultGapBetween:31,resultSpriteScale:100,headerIconY:0,
 headerOffsetX:0,headerTouchWidth:35,headerTouchHeight:30,headerAfterGap:0,
 resultsOffsetX:0,resultsOffsetY:0,
 menuOffsetX:0,menuOffsetY:0,gearMenuGap:0,menuItemGap:3,
 popupWidth:232,popupHeight:390,
 resultsOrientation:"vertical",menuOrientation:"horizontal",
 resultsBgMode:"dark",resultsTransparency:100,
 resultsTileStyle:"none",resultsTileTransparency:40,
 menuBgMode:"dark",menuTransparency:50,menuBlur:4,showGuides:false,menuGuides:false,resultsGuides:false
});
const RANGES={
 resultGapTop:[-80,80],resultGapBetween:[0,65],resultSpriteScale:[70,160],headerIconY:[0,72],
 headerOffsetX:[-16,16],headerTouchWidth:[26,42],headerTouchHeight:[24,50],headerAfterGap:[0,36],
 resultsOffsetX:[-200,200],resultsOffsetY:[-350,350],
 menuOffsetX:[-200,200],menuOffsetY:[-350,350],
 gearMenuGap:[0,80],menuItemGap:[0,16],popupWidth:[160,330],popupHeight:[140,420],
 resultsTransparency:[0,100],resultsTileTransparency:[0,100],
 menuTransparency:[0,100],menuBlur:[0,16]
};
const PRESETS={
 compact:{resultGapTop:-6,resultGapBetween:0,resultSpriteScale:130,menuItemGap:0},
 balanced:{resultGapTop:0,resultGapBetween:13,resultSpriteScale:115,menuItemGap:3},
 readable:{resultGapTop:8,resultGapBetween:40,resultSpriteScale:100,menuItemGap:7},
 // LT217: screenshot layout. Existing orientation keys remain independent.
 // Do not touch account, filters, quick-menu order/visibility, or sprites.
 topHorizontal:{menuOrientation:"horizontal",resultsOrientation:"vertical",
  menuOffsetX:0,menuOffsetY:0,resultsOffsetX:0,resultsOffsetY:0,
  gearMenuGap:0,menuItemGap:0,headerAfterGap:0,resultGapTop:0,resultGapBetween:13}
};
let current={...DEFAULTS},tab="results",saveTimer=null,pendingVisualJson="",saveEpoch=0,previewArea="";
const visualOpenSection={results:"spacing",menu:"position"};
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
 // An independent, opt-in tile per sprite; legacy saved prefs stay bare.
 if(src.resultsTileStyle==="card")result.resultsTileStyle="card";
 result.showGuides=src.showGuides===true;
 result.menuGuides=src.menuGuides===true||(src.menuGuides===undefined&&result.showGuides);
 result.resultsGuides=src.resultsGuides===true||(src.resultsGuides===undefined&&result.showGuides);
 return result;
}
function rgba(mode,transparent){
 const color=mode==="light"?"255,255,255":"15,19,26";
 return "rgba("+color+","+(1-transparent/100).toFixed(2)+")";
}
// Android overlays cannot rely on backdrop-filter to blur another app.
// Use the persisted transparency as the BASE value; boost contrast only on
// compact reading surfaces. 0% stays fully opaque and 100% fully transparent.
// This is not a second, independently configurable transparency preference.
function readableSurface(mode,transparent){
 const base=mode==="light"?"255,255,255":"15,19,26";
 const alpha=1-Math.pow(Math.max(0,Math.min(100,transparent))/100,2.8);
 return "rgba("+base+","+alpha.toFixed(3)+")";
}
function applyVisual(){
 window.visualPrefs=current;
 const root=document.documentElement,body=document.body;
 const set=(key,value)=>root.style.setProperty("--visual-"+key,value);
 set("top-gap",current.resultGapTop+"px");
 set("menu-gap",current.menuItemGap+"px");
 set("results-bg",rgba(current.resultsBgMode,current.resultsTransparency));
 // LT223: tile background is separate from the legacy whole-window background.
 // A dark or light framed card sits BEHIND the original sprite, without
 // changing the sprite element, its dimensions, metadata, or click target.
 const tileAlpha=Math.max(0,1-current.resultsTileTransparency/100);
 const tileRgb=current.resultsBgMode==="light"?"248,250,252":"21,25,32";
 const tileBorderRgb=current.resultsBgMode==="light"?"56,68,88":"211,221,235";
 set("result-tile-bg","rgba("+tileRgb+","+(tileAlpha*0.95).toFixed(3)+")");
 set("result-tile-border","rgba("+tileBorderRgb+","+(tileAlpha*0.65).toFixed(3)+")");
 set("result-tile-shadow",tileAlpha===0?"none":
  "0 1px 4px rgba(0,0,0,"+(tileAlpha*0.28).toFixed(3)+")");
 set("menu-bg",rgba(current.menuBgMode,current.menuTransparency));
 set("menu-readable-bg",readableSurface(current.menuBgMode,current.menuTransparency));
 set("menu-readable-button-bg",readableSurface(current.menuBgMode,
  Math.min(100,current.menuTransparency+12)));
 set("menu-blur",current.menuBlur+"px");
 set("menu-button-bg",rgba(current.menuBgMode,current.menuTransparency));
 // One opacity slider controls fill, border and shadow of each tile.
 // At 100% transparency, no ghost outline/shadow remains.
 const tileOpacity=Math.max(0,1-current.menuTransparency/100);
 const borderRgb=current.menuBgMode==="light"?"49,69,91":"227,233,241";
 set("menu-border","rgba("+borderRgb+","+(tileOpacity*0.45).toFixed(2)+")");
 set("menu-tile-shadow",tileOpacity===0?"none":
  "0 1px 3px rgba(0,0,0,"+(tileOpacity*0.36).toFixed(2)+")");
 set("menu-fg",current.menuBgMode==="light"?"#152231":"#f2f7fc");
 set("results-fg",current.resultsBgMode==="light"?"#172533":"#e6eefa");
 body.classList.toggle("visual-light-menu",current.menuBgMode==="light");
 body.classList.toggle("visual-light-results",current.resultsBgMode==="light");
 body.classList.toggle("visual-results-tiles",current.resultsTileStyle==="card");
 set("sprite-scale",String(current.resultSpriteScale/100));
 set("header-y",current.headerIconY+"px");
 set("header-x",current.headerOffsetX+"px");
 set("header-touch-width",current.headerTouchWidth+"px");
 set("header-touch-height",current.headerTouchHeight+"px");
 set("header-after",current.headerAfterGap+"px");
 set("popup-width",current.popupWidth+"px");
 set("popup-height",current.popupHeight+"px");
 body.classList.toggle("visual-menu-vertical",current.menuOrientation==="vertical");
 body.classList.toggle("visual-menu-horizontal",current.menuOrientation==="horizontal");
 body.classList.toggle("visual-results-horizontal",current.resultsOrientation==="horizontal");
 const guided=controlsWindow?(current.menuGuides||previewArea==="menu"):
  resultWindow?(current.resultsGuides||previewArea==="results"):false;
 body.classList.toggle("visual-guides",guided);
 body.classList.toggle("visual-preview-menu",controlsWindow&&previewArea==="menu");
 body.classList.toggle("visual-preview-results",resultWindow&&previewArea==="results");
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
window.onVisualEditorPreview=function(area){
 previewArea=area==="menu"||area==="results"?area:"";
 applyVisual();
};
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
 if(!Object.prototype.hasOwnProperty.call(PRESETS,name))return;
 current=normalize({...current,...PRESETS[name]});
 applyVisual();renderVisualEditor();
 // LT218: the previous implementation moved the native windows BEFORE the
 // delayed visual prefs save. Java still saw menuOrientation="vertical" and
 // created the tall 232dp one-button-per-row toolbar in the screenshots.
 // Persist new directions and move the dock in a SINGLE ordered UI-thread task.
 if(name==="topHorizontal"&&window.Native&&Native.applyTopHorizontalPreset){
  clearTimeout(saveTimer);saveTimer=null;
  pendingVisualJson=JSON.stringify(current);
  Native.applyTopHorizontalPreset(pendingVisualJson);
 }else{
  // Keep original presets and compatibility with older native bridges.
  saveSoon();
  if(name==="topHorizontal"&&window.Native&&Native.applyTopHorizontalLayout)
   Native.applyTopHorizontalLayout();
 }
 toast("✓ "+(name==="topHorizontal"?"Topo Horizontal":"Preset "+name)+
  " aplicado nesta Pokébola");
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
// Only one section expanded per tab: all controls and their saved keys survive.
function visualGroup(host,id,title,create){
 const sectionTab=tab;
 const section=document.createElement("details");section.className="visualGroup";
 section.dataset.section=id;section.open=visualOpenSection[tab]===id;
 const summary=document.createElement("summary");
 summary.className="visualGroupTitle";summary.textContent=title;
 summary.setAttribute("aria-label","Editar "+title);
 section.appendChild(summary);
 const content=document.createElement("div");content.className="visualGroupBody";
 create(content);section.appendChild(content);host.appendChild(section);
 section.addEventListener("toggle",()=>{
  // Detached sections must not override a newer tab's expanded category.
  if(!section.isConnected||choiceOpen!=="visual"||tab!==sectionTab)return;
  if(section.open){
   visualOpenSection[tab]=id;
   for(const other of host.querySelectorAll("details.visualGroup"))
    if(other!==section)other.open=false;
  }else if(visualOpenSection[tab]===id){
   visualOpenSection[tab]="";
  }
 });
}
function renderVisualEditor(){
 if(!controlsWindow||choiceOpen!=="visual")return;
 const panel=uxPanel("EDITOR VISUAL");
 if(window.Native&&Native.previewVisualArea)Native.previewVisualArea(tab);
 panel.classList.add("visualPanel","visualCompact");
 // LT218: only the header drags the independent native popup. Buttons,
 // fields and sliders retain their normal pointer interaction.
 if(popupWindow&&window.Native&&Native.moveVisualEditorBy){
  const handle=panel.querySelector(".choiceHeader");
  if(handle){
   handle.classList.add("visualEditorDragHandle");
   handle.title="Segure e arraste para mover o Editor Visual";
   let drag=null;
   const at=ev=>({
    x:Number.isFinite(ev.screenX)?ev.screenX:ev.clientX,
    y:Number.isFinite(ev.screenY)?ev.screenY:ev.clientY
   });
   handle.addEventListener("pointerdown",ev=>{
    if(ev.button!==0||ev.target.closest("button,input,textarea,select"))return;
    drag={id:ev.pointerId,...at(ev)};
    try{handle.setPointerCapture(ev.pointerId)}catch(_){}
    ev.preventDefault();
   });
   handle.addEventListener("pointermove",ev=>{
    if(!drag||drag.id!==ev.pointerId)return;
    const pos=at(ev);
    const dx=Math.round(pos.x-drag.x),dy=Math.round(pos.y-drag.y);
    drag={id:ev.pointerId,...pos};
    if(dx||dy)Native.moveVisualEditorBy(dx,dy);
    ev.preventDefault();
   });
   const stop=()=>{drag=null};
   handle.addEventListener("pointerup",stop);
   handle.addEventListener("pointercancel",stop);
   handle.addEventListener("lostpointercapture",stop);
  }
 }
 // Orientations already have separate keys and persist in P1/P2 prefs.
 // Surface an immediately accessible layout preset in either editor tab.
 const quickPreset=document.createElement("div");quickPreset.className="visualPresets";
 const quickTop=btn(quickPreset,"↗ Topo Horizontal",()=>usePreset("topHorizontal"));
 quickTop.title="Menus horizontais no topo e resultados verticais abaixo da Pokébola";
 quickTop.setAttribute("aria-label","Aplicar preset Topo Horizontal nesta Pokébola");
 panel.appendChild(quickPreset);
 const nav=document.createElement("div");nav.className="visualTabs";
 for(const [id,title] of [["results","Pokémon"],["menu","Menu"]]){
  const b=btn(nav,title,()=>{tab=id;renderVisualEditor();});
  b.classList.toggle("chosen",tab===id);
  b.setAttribute("aria-pressed",String(tab===id));
 }
 panel.appendChild(nav);
 if(tab==="results"){
  visualGroup(panel,"spacing","Sprites e espaçamento",panel=>{
   // LT225: P shares the 30dp menu footprint. M/G progressively enlarge
   // result cards via the native P/M/G selector, without scaling menu icons.
   const note=document.createElement("p");
   note.className="uxNote";
   note.textContent="Tamanho dos resultados: P 30×30 dp · M 40×40 dp · G 50×50 dp. Sprites centralizadas a 88% e espaço de 2 dp, com ou sem fundo. Escolha P/M/G em Personalização.";
   panel.appendChild(note);
   addSlider(panel,"resultGapTop","Pokébola → primeiro"," px");
  });
  visualGroup(panel,"ball","Pokébola e toque",panel=>{
   addSlider(panel,"headerIconY","Posição Y"," px");
   addSlider(panel,"headerOffsetX","Posição X"," px");
   addSlider(panel,"headerTouchWidth","Área de toque · largura"," px");
   addSlider(panel,"headerTouchHeight","Área de toque · altura"," px");
   addSlider(panel,"headerAfterGap","Espaço abaixo"," px");
  });
  visualGroup(panel,"window","Janela e orientação",panel=>{
   addSlider(panel,"resultsOffsetX","Mover X"," dp");
   addSlider(panel,"resultsOffsetY","Mover Y"," dp");
   addSegment(panel,"resultsOrientation","Resultados",
    [["vertical","Vertical"],["horizontal","Horizontal"]]);
  });
  visualGroup(panel,"theme","Cores e guias",panel=>{
   addSegment(panel,"resultsTileStyle","Fundo dos Pokémon",
    [["none","Sem fundo"],["card","Com fundo"]]);
   addSegment(panel,"resultsBgMode","Tema",[["dark","Escuro"],["light","Claro"]]);
   if(current.resultsTileStyle==="card")
    addSlider(panel,"resultsTileTransparency","Transparência dos cartões","%");
   addSlider(panel,"resultsTransparency","Transparência da área","%");
   btn(panel,"Linhas-guia resultados: "+(current.resultsGuides?"ON":"OFF"),()=>{
    change("resultsGuides",!current.resultsGuides);renderVisualEditor();
   });
  });
 }else if(tab==="menu"){
  visualGroup(panel,"position","Posição do menu",panel=>{
   addSlider(panel,"gearMenuGap","Engrenagem → menu"," dp");
   addSlider(panel,"menuOffsetX","Mover X"," dp");
   addSlider(panel,"menuOffsetY","Mover Y"," dp");
   addSegment(panel,"menuOrientation","Orientação",
    [["horizontal","Horizontal"],["vertical","Vertical"]]);
  });
  visualGroup(panel,"spacing","Espaçamento e painéis",panel=>{
   addSlider(panel,"menuItemGap","Entre botões"," px");
   addSlider(panel,"popupWidth","Largura dos painéis"," px");
   addSlider(panel,"popupHeight","Altura máxima"," px");
  });
  visualGroup(panel,"theme","Cores e guias",panel=>{
   addSegment(panel,"menuBgMode","Tema",[["dark","Escuro"],["light","Claro"]]);
   addSlider(panel,"menuTransparency","Transparência única dos menus","%");
   addSlider(panel,"menuBlur","Desfoque dos painéis"," px");
   const info=document.createElement("p");info.className="uxNote";
   info.textContent="50% de transparência base. Camada de contraste mantém as opções legíveis quando o desfoque não funciona sobre outros apps.";
   panel.appendChild(info);
   btn(panel,"Linhas-guia menu: "+(current.menuGuides?"ON":"OFF"),()=>{
    change("menuGuides",!current.menuGuides);renderVisualEditor();
   });
  });
 }
 // Keep the JSON source and import function for controlled future use,
 // but do not expose a distracting JSON tab in ordinary operation.
 if(tab==="export"){
  heading(panel,"Exportar o visual para o ChatGPT");
  const textarea=document.createElement("textarea");
  textarea.className="visualJSON";textarea.value=JSON.stringify({schema:"pokesearch-visual-v1",...current},null,2);
  textarea.setAttribute("aria-label","Configuração visual JSON");
  panel.appendChild(textarea);
  textarea.addEventListener("focus",()=>Native.visualEditorFocus&&Native.visualEditorFocus(true));
  textarea.addEventListener("blur",()=>Native.visualEditorFocus&&Native.visualEditorFocus(false));
  btn(panel,"Copiar JSON",()=>{
   Native.copyVisualPrefs&&Native.copyVisualPrefs(JSON.stringify({schema:"pokesearch-visual-v1",...current},null,2));
   toast("✓ JSON copiado");
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
 visualGroup(panel,"presets","Presets e ferramentas",panel=>{
  const presets=document.createElement("div");presets.className="visualPresets";
  btn(presets,"Compacto",()=>usePreset("compact"));
  btn(presets,"Equilibrado",()=>usePreset("balanced"));
  btn(presets,"Legível",()=>usePreset("readable"));
  const topHorizontal=btn(presets,"Topo Horizontal",()=>usePreset("topHorizontal"));
  topHorizontal.title="Pokébola no alto, menus na horizontal, Pokémon em coluna";
  topHorizontal.setAttribute("aria-label","Aplicar Topo Horizontal apenas nesta Pokébola");
  panel.appendChild(presets);
  const actions=document.createElement("div");actions.className="visualActions";
  btn(actions,"Restaurar",()=>{
   current=normalize(DEFAULTS);applyVisual();saveSoon();renderVisualEditor();
   toast("✓ Padrão restaurado");
  });
  btn(actions,"Copiar JSON",()=>{
   if(window.Native&&Native.copyVisualPrefs)
    Native.copyVisualPrefs(JSON.stringify({schema:"pokesearch-visual-v1",...current},null,2));
   toast("✓ JSON copiado");
  });
  panel.appendChild(actions);
 });
 const feedback=document.createElement("div");feedback.id="visualFeedback";
 feedback.className="visualStatus";feedback.setAttribute("role","status");
 feedback.setAttribute("aria-live","polite");feedback.hidden=true;
 panel.appendChild(feedback);
 const back=btn(panel,"‹ Voltar",()=>{
  if(window.Native&&Native.previewVisualArea)Native.previewVisualArea("");
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