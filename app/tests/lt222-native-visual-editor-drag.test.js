"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const android=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const editor=fs.readFileSync(path.join(root,"assets/visual_editor.js"),"utf8");

// LT218 moved the WebView from pointermove and lost the captured pointer.
// LT222 uses a NATIVE transparent header grip exactly like the result card.
assert.match(android,/private View grip,visualEditorDragGrip/);
assert.match(android,/visualEditorDragGrip=new View\(this\)/);
assert.match(android,/popupRoot\.addView\(popupPanel,new FrameLayout\.LayoutParams\(-1,-1\)\)/);
assert.match(android,/popupRoot\.addView\(visualEditorDragGrip,visualGripParams\)/);
assert.match(android,/visualEditorDragGrip\.setOnTouchListener\(\(view,event\)->\{/);
assert.match(android,/visualTouchStart\[0\]=event\.getRawX\(\)/);
assert.match(android,/visualTouchStart\[1\]=event\.getRawY\(\)/);
assert.match(android,/visualStartXY\[0\]=popupParams\.x/);
assert.match(android,/visualStartXY\[1\]=popupParams\.y/);
assert.match(android,/if\(Math\.abs\(dx\)\+Math\.abs\(dy\)>dp\(4\)\)visualMoved\[0\]=true/);
assert.match(android,/popupParams\.x=Math\.max\(margin,Math\.min\(/);
assert.match(android,/popupParams\.y=Math\.max\(margin,Math\.min\(/);
assert.match(android,/visualStartXY\[0\]\+dx/);
assert.match(android,/visualStartXY\[1\]\+dy/);
assert.match(android,/now-visualLastFrame\[0\]>=16L/);
assert.match(android,/wm\.updateViewLayout\(popupRoot,popupParams\)/);
assert.match(android,/if\(visualMoved\[0\]\)\{[\s\S]*?\.putInt\("visualEditorX"/);
assert.match(android,/\.putInt\("visualEditorY"/);
assert.match(android,/visualEditorNativeDragging=false/);
assert.match(android,/if\(visualEditorNativeDragging&&"visual"\.equals\(popupKind\)\)return/);
assert.match(android,/visualEditorDragGrip\.setVisibility\(isEditor\?View\.VISIBLE:View\.GONE\)/);
// The grip stays on just the TITLE. The close X (right end) remains clickable.
assert.match(android,/gripLayout\.width=Math\.max\(dp\(10\),Math\.min\(dp\(205\),b\.width-dp\(64\)\)\)/);
assert.match(android,/gripLayout\.height=dp\(27\)/);
assert.match(android,/visualGripParams\.leftMargin=dp\(6\)/);
assert.match(android,/if\(visualEditorDragGrip!=null\)\s*visualEditorDragGrip\.setVisibility\(View\.GONE\)/);
// Native grip receives rawX/Y continuously without WebView pointercapture.
assert.match(editor,/panel\.classList\.add\("visualPanel","visualCompact"\)/);
assert.match(editor,/Segure e arraste para mover o Editor Visual/);
assert.match(android,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
assert.match(android,/private void positionIndependentPopup\(\)/);
console.log("PASS LT222: Native header drag like result card, continuous raw touch, close-button clearance, per-ball persistence and clamp");
