"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const candy=fs.readFileSync(path.join(base,"RareCandyOverlayService.java"),"utf8");
const policy=fs.readFileSync(path.join(base,"CandyCooldownPolicy.java"),"utf8");
const controls=fs.readFileSync(path.join(__dirname,"../src/main/assets/rare_candy_controls.html"),"utf8");
const position=candy.slice(candy.indexOf("private void placeResults(){"),
 candy.indexOf("private void toggleResults(){"));
const render=candy.slice(candy.indexOf("private void render(){"),
 candy.indexOf("private final Runnable tick="));
const tick=candy.slice(candy.indexOf("private final Runnable tick="),
 candy.indexOf("private final OverlayQuickMenus.CandyActions"));
assert.ok(position.includes("int rowHeight=47;"),"always preserve 47dp row stride");
assert.ok(!position.includes("withHop?62:47"),"never add height for cooldown");
assert.ok(render.includes("resultsList.addView(row,space(-1,45,2))"),"45dp row plus 2dp spacing");
assert.ok(!render.includes("spriteColumn.addView(next"),"no separate cooldown line");
assert.ok(render.includes("spriteCell.addView(badge,badgeLp)"),"badge overlays candy");
assert.ok(render.includes("Gravity.LEFT|Gravity.TOP:Gravity.RIGHT|Gravity.TOP"),"origin left and timer right");
assert.ok(render.includes("Gravity.RIGHT|Gravity.BOTTOM"),"distance overlay at bottom");
assert.ok(render.includes("spriteColumn.addView(countdown,space(46,15,0))"),"despawn remains independent");
assert.ok(render.includes('String shortLabel=origin?"●":CandyCooldownPolicy.compactTimerLabel(remain)'),
 "origin dot / time / ready check from common policy");
assert.ok(render.includes("0xFF91C6FF"),"blue origin");
assert.ok(render.includes("CandyCooldownPolicy.remainingColor(remain)"),"red pink green policy unchanged");
assert.ok(render.includes("setContentDescription"),"accessible full status text");
assert.ok(tick.includes("CandyCooldownPolicy.compactTimerLabel(remaining)"),"1-second update stays compact");
assert.ok(candy.includes("m.setSaturation(.60f)"),"copied candy retains color");
assert.ok(candy.includes("view.setAlpha(.88f)"),"copied candy remains visible");
assert.ok(policy.includes('if(seconds==0)return "✓";'),"no repeated Pronto strings");
assert.ok(policy.includes('return (minutes/60)+"h"+two(minutes%60);'),"compact long wait");
assert.ok(controls.includes("Native.clearCandyCooldown()"),"reset preserved");
assert.ok(candy.includes('showDistance=prefs.getBoolean("candyShowDistance",false)'),
 "respect distance default off");
assert.ok(candy.includes('showDespawn=prefs.getBoolean("candyShowDespawn",true)'),
 "respect despawn default on");
assert.ok(candy.includes("if(newlyCopied&&cards.size()==10"),
 "keep existing ten-copied refresh logic");
assert.ok(candy.includes("lastCopiedCandyAtMs=System.currentTimeMillis()"),
 "copy still updates origin");
console.log("PASS LT196: 47dp compact candy, overlaid cooldown & distance, accessible timers");
