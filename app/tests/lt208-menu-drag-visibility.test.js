"use strict";
// LT208 regression: twelve independently movable/hideable menu buttons.
// Only Personalização stays visible and accessible.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const service=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const source='const QUICK_ACTIONS=['+dock.split("const QUICK_ACTIONS=[")[1]
 .split("function saveQuickPrefs()")[0];
const menu=new Function(source+';return {QUICK_DEFAULT_ORDER,defaultQuickPrefs,normalizedQuickPrefs};')();
const ids=menu.QUICK_DEFAULT_ORDER;
assert.equal(ids.length,13,"thirteen toolbar actions, including Background");
assert.equal(new Set(ids).size,13);
assert.deepEqual(ids.slice(0,3),["mode","sh","bg"]);
const fresh=menu.defaultQuickPrefs();
assert.deepEqual(fresh.hidden,["sh","bg"],"Shiny and Background hidden initially");
assert.deepEqual(menu.normalizedQuickPrefs({}).hidden,["sh","bg"]);
const oldIds=ids.filter(x=>x!=="bg");
const fromOld=menu.normalizedQuickPrefs({order:oldIds,hidden:[]});
assert.deepEqual(fromOld.hidden,["sh","bg"],"untouched LT208 settings migrate to hidden defaults");
assert.deepEqual(fromOld.order,ids,"Background inserted after Shiny");
const custom=menu.normalizedQuickPrefs({
 order:[...ids].reverse(),hidden:["sh","close","appearance","donate","sh"]});
assert.deepEqual(custom.order,[...ids].reverse(),"user-chosen order must survive");
assert.deepEqual(custom.hidden,["sh","close","donate"],"only Personalização cannot be hidden");
assert.equal(custom.hidden.includes("appearance"),false);
const partial=menu.normalizedQuickPrefs({order:ids.filter(id=>id!=="bell"),hidden:["close"]});
assert.equal(partial.order.length,13,"missing IDs recovered");
assert.ok(partial.hidden.includes("close"));
assert.ok(service.includes('!"appearance".equals(id)'),"Android protects Personalização");
assert.ok(service.includes('"mode","sh","bg","filters"'),"Android accepts Background ID");
assert.ok(service.includes('i<13'),"Android retains all thirteen IDs");
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
console.log("PASS LT211: 13 items, hidden defaults, persistence, protected personalization, drag and keyboard");
