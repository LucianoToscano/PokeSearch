"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const dock=fs.readFileSync(path.join(assets,"dock.html"),"utf8");
const detail=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const service=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const secondary=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
const inline=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);
new vm.Script(inline);
// Short rank label always makes room for full evolution name, no rank metadata loss.
assert.ok(detail.includes('label+" · IV #"+best.rank+scope'),'fallback IV rank remains when no verified RG');
assert.ok(detail.includes('setRankLineLabel(rankLine,hasVerifiedOverall?label+scope:'),'RG priority for verified species');
assert.ok(detail.includes('const scope=best.kind==="current"?" · Atual":" · ↳ "+best.name'));
assert.ok(detail.includes('league.toUpperCase()+" · IV #"+ivValue'));
assert.ok(detail.includes('#rankLine .psRankLabel{display:block;min-width:0;flex:1 1 auto;'));
assert.match(detail,/#rankLine \.psRankLabel\{[^}]*overflow:visible;text-overflow:clip;white-space:normal;overflow-wrap:anywhere/);
assert.match(detail,/#rankLine\{[^}]*white-space:normal!important;overflow:visible!important/);
assert.match(detail,/#pvpRefPopover\{display:none!important\}/);
assert.match(detail,/\.evoLine \.evoInfoBtn,\.rankLineSafe \.evoInfoBtn,#rankLine \.evoInfoBtn\{display:none!important\}/);
assert.ok(detail.includes("window.PokeSearchRankExplorer?.open"),"rank number remains clickable");
assert.ok(detail.includes("psMovesAction"),"rank #1 moves stay available");
// P1 and P2 retain independent settings but never present two menu ribbons at once.
assert.ok(service.includes("private static volatile OverlayService primaryMenuOwner=null"));
assert.ok(service.includes("private static volatile OverlayService secondaryMenuOwner=null"));
assert.ok(service.includes("if(isSecondaryOverlay())secondaryMenuOwner=this"));
assert.ok(service.includes("if(other!=null&&other!=this&&other.menuExpanded)other.menu(false);"));
assert.ok(service.includes("if(primaryMenuOwner==this)primaryMenuOwner=null"));
assert.ok(secondary.includes("extends OverlayService"));
assert.ok(secondary.includes("isSecondaryOverlay(){return true;}"));
// Exact-image recovery is bounded, local to current sprite, and cannot return
// a different species or costume when verified bytes are absent.
assert.ok(dock.includes("spriteState.psSpriteManaged"));
assert.ok(dock.includes("spriteState.psSpriteRecovered"));
assert.ok(dock.includes("engine?.bundledExactForArt?.(card,art)"));
assert.ok(dock.includes("setTimeout(attachSpriteFeedback,1800)"));
assert.ok(dock.includes("setTimeout(attachSpriteFeedback,4800)"));
assert.ok(dock.includes("setTimeout(attachSpriteFeedback,14500)"));
assert.ok(dock.includes("Sprite indisponível para a forma exata"));
assert.ok(dock.includes("esc(String(dexNumber||"));
assert.ok(!dock.includes("Imagem exata não verificada\">◈"),"no ambiguous diamond placeholder");
assert.ok(!dock.includes("const imageUrl=art.src||verifiedBundledData"),"must prefer verified exact art");
console.log("LT243: full names, compact IV rank, tooltip hidden, single open menu, verified sprite retry, P1/P2 PASS");