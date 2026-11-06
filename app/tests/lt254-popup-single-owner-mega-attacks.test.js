"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const folder=path.join(__dirname,"../src/main/assets");
const detail=fs.readFileSync(path.join(folder,"detail.html"),"utf8");
const dock=fs.readFileSync(path.join(folder,"dock.html"),"utf8");
const js=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(js,"detail script must exist");
new vm.Script(js);
const css=dock.match(/<style>([\s\S]*?)<\/style>/)?.[1]||"";
assert.ok(css,"real toolbar CSS");
const popupFix=css.lastIndexOf("LT254 — SINGLE TOOLBAR OWNER");
assert.ok(popupFix>0);
const restoreRibbon=css.lastIndexOf("body.controls-window.visual-menu-horizontal #quickMenuList");
assert.ok(popupFix>restoreRibbon,"last CSS guard must override historical orientation rendering");
assert.ok(css.includes("body.popup-window.controls-window #shell #menu #quickMenuList"));
assert.ok(css.includes("body.popup-window.controls-window #shell #menu #quickHead"));
assert.ok(css.includes("body.popup-window.controls-window #shell #menu #controls"));
assert.ok(css.slice(popupFix).includes("display:none!important;visibility:hidden!important;pointer-events:none!important;"));
assert.ok(css.slice(popupFix).includes("body.popup-window.controls-window #shell #menu #choices{"));
assert.match(detail,/isMega\?\s*await window\.PokeSearchPvpRankMoves\?\.lookupMega\?\./);
assert.match(detail,/isMega&&recommendation\.megaRecommendation!==true/);
assert.ok(detail.includes('Mega Evolução não aprende golpes exclusivos'));
assert.ok(detail.includes("Os golpes são do '+h(species)+' normal; recomendação Mega não verificada."));
assert.ok(detail.includes("Mesmos golpes do '+h(species)+' normal · avaliação Megaedição."));
assert.ok(detail.includes('Mega não tem golpes exclusivos nem garante GBL'));
assert.ok(detail.includes('src="mega_evolution_icon.svg"'));
assert.ok(detail.includes('window.PokeSearchPvpRankMoves.getStatus(league,featured,isMega)'),"source-verified legacy icon before a tap");
assert.ok(detail.includes('currentCardMoves'),'captured moves remain independently represented');
const native=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
assert.ok(native.includes('popupPanel.loadUrl(OtaAssets.webUrl("dock.html?controls=1&popup=1"))'),
 "actual native second WebView must use popup flag");
assert.ok(native.includes('menuPanel.loadUrl(OtaAssets.webUrl("dock.html?controls=1"))'),
 "primary ribbon must remain separate from popup WebView");
console.log("LT254 PASS: singleton popup ribbon, normal learned attacks vs Mega Edition, verified legacy-only icon, two overlays intact");
