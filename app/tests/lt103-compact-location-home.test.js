"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("assets/dock.html");
const native=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const tribute=read("java/com/lucianotoscano/pokesearchoverlay/CommunityTribute.java");
const location=html.slice(html.indexOf("function renderLocationChoices(){"),html.indexOf("let requestedInterval=null"));
const css=html.slice(html.indexOf("/* LT103 Samsung compact location:"),html.indexOf("</style></head><body>"));
assert.ok(css.length>4000);
assert.match(html,/Math\.min\(148,Math\.max\(1,Math\.floor\(window\.innerWidth\|\|148\)\)\)/);
assert.match(native,/w=Math\.max\(1,Math\.min\(148,screenWidthDp\(\)-12\)\)/);
assert.ok(css.includes("width:min(148px,calc(100vw - 8px))!important"));
for(const marker of [">.choiceHeader",">.locCoordsRow",">.locSliderRow",">.locRadiusRow",
 "height:26px!important","height:32px!important","height:24px!important","height:29px!important"])
 assert.ok(css.includes(marker),"missing compact CSS "+marker);
for(const marker of ["clipboard.append(paste,copy)","title.appendChild(clipboard)",
"panel.append(title,fieldRow,sliderRow,label,message)","slide.max=\"1000\"",
"field.maxLength=30","Native.copyLocationCoords(field.value)",
"paste.onclick=()=>Native.pasteLocationCoords()",
"Native.setLocation(true,wantedCoords,wantedRadius)","Native.setLocation(false,\"\",0)"])
 assert.ok(location.includes(marker),"missing original logic "+marker);
assert.match(main,/shareActions\.addView\(thanks,thanksLp\)/);
assert.match(main,/shareActions\.addView\(share,shareLp\)/);
assert.doesNotMatch(main,/screen\.addView\(thanks,thanksLp\)/);
assert.match(main,/addHomeDrawerItem\(drawer,"💙","Agradecimentos",this::openTribute\)/);
assert.match(tribute,/R\.drawable\.pokesearch_agradecimento_comunidade/);
assert.match(tribute,/FileProvider\.getUriForFile/);
console.log("PASS LT103: native and CSS compact popup, preserved filters and integrated thanks");
