"use strict";
// LT208 regression: twelve independently movable/hideable menu buttons.
// Only Personalização stays visible and accessible.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const service=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const actions=dock.split("const QUICK_ACTIONS=[")[1]?.split("];")[0]||"";
const ids=[...actions.matchAll(/\["([a-z]+)","[^"]+","[^"]+","[^"]+"\]/g)].map(m=>m[1]);
assert.equal(ids.length,12,"all twelve actual menu actions exist");
assert.equal(new Set(ids).size,12,"each action unique");
assert.ok(ids.includes("appearance")&&ids.includes("sh")&&ids.includes("close"));
const prefs=dock.split("function normalizedQuickPrefs(p){")[1]?.split("function saveQuickPrefs()")[0]||"";
assert.ok(prefs,"normalized preferences exist");
const clean=new Function("p","QUICK_DEFAULT_ORDER","function normalizedQuickPrefs(p){"+prefs+";return normalizedQuickPrefs(p);");
const before=ids.slice();
const initial=clean({order:before,hidden:[]},ids);
assert.deepEqual(initial.order,ids,"default order unchanged");
assert.deepEqual(initial.hidden,[],"all visible by default");
const shuffled=[...ids].reverse();
const custom=clean({order:shuffled,hidden:["sh","close","appearance","donate","sh"]},ids);
assert.deepEqual(custom.order,shuffled,"Shiny and Close maintain user-chosen positions");
assert.deepEqual(custom.hidden,["sh","close","donate"],"only Personalização is never hidden");
assert.equal(custom.hidden.includes("appearance"),false);
assert.equal(custom.order.length,12);
const partial=clean({order:ids.filter(id=>id!=="bell"),hidden:["close"]},ids);
assert.equal(partial.order.length,12,"missing IDs restored without dropping existing");
assert.ok(partial.hidden.includes("close"));
assert.ok(service.includes('!"appearance".equals(id)'),"Android only forbids hiding Personalização");
assert.ok(!service.includes('!"close".equals(id)&&!"appearance".equals(id)&&!"sh".equals(id)'),"old visibility ban removed");
const editor=dock.split("function renderAppearanceChoices(){")[1]?.split('document.addEventListener("pointerdown",event=>{')[0]||"";
assert.ok(editor.includes('const movable=movableMenuIds()'));
assert.ok(editor.includes('const locked=id==="appearance"'));
assert.ok(editor.includes("line.dataset.key=id"));
assert.ok(editor.includes('eye.disabled=locked'));
assert.ok(editor.includes("line.append(eye,handle)"),"two controls replace arrows");
assert.ok(!editor.includes('className="orderUp"')&&!editor.includes('className="orderDown"'));
assert.ok(editor.includes("bindAppearanceReorder(commands,panel)"));
const gestures=dock.split("function bindAppearanceReorder(commands,panel){")[1]?.split("function renderAppearanceChoices(){")[0]||"";
for(const token of ['.orderHandle','setPointerCapture(event.pointerId)','pointerdown','pointermove',
 'pointerup','pointercancel','lostpointercapture','appearanceScrollTop=panel.scrollTop',
 'quickPrefs.order=ordered;saveQuickPrefs();renderAppearanceChoices();','commands.insertBefore(g.line,target)',
 'handle.setAttribute("aria-grabbed","true")'])assert.ok(gestures.includes(token),token);
assert.ok(dock.includes('touch-action:none!important'));
assert.ok(dock.includes('event.key==="ArrowUp"?-1:event.key==="ArrowDown"?1:0'),
 "keyboard reorder still possible for accessibility");
assert.ok(dock.includes("grid-template-columns:minmax(0,1fr) 27px 30px!important"));
assert.ok(dock.includes('const MORE_ACTION_IDS=Object.freeze(["report","donate","close"])'),
 "three-item More stays optional and compact");
console.log("PASS LT208: 12 items, persistence, Shiny/Close hide, Personalização locked, drag and keyboard");
