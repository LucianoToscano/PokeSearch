"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const src=fs.readFileSync(
  "app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java","utf8");
const git=fs.readFileSync(
  "app/src/main/java/com/lucianotoscano/pokesearchoverlay/GitHubUpdateCenter.java","utf8");
const idx=src.indexOf("screen.addView(homeUpdateHolder,1,updateLp);");
assert(idx>=0,"The update banner is inserted at index 1, directly under Home header");
const header=src.indexOf("screen.addView(header,new LinearLayout.LayoutParams(-1,d(70)));");
const pokeballs=src.indexOf("screen.addView(dualOverlayRow,dualLp);");
const updateInit=src.indexOf("homeUpdateHolder=new LinearLayout(this);");
assert(header>=0&&pokeballs>header&&updateInit>pokeballs,
  "Home construction still creates the header and dual Pokeballs first");
assert(src.includes("homeUpdateHolder.setVisibility(View.GONE);"),
  "No empty space reserved when the update is hidden");
assert(src.includes("renderDriveUpdateBanner();"));
assert(src.includes("GitHubUpdateCenter.eligible(this,currentGithubUpdate)"));
assert(src.includes("renderGithubUpdateBanner(holder,currentGithubUpdate)"));
assert(src.includes("GitHubUpdateCenter.showDialog(this,info)"),
  "Pinned banner keeps verified GitHub download/install");
assert(src.includes("GitHubUpdateCenter.later(this,info.versionCode)"),
  "Pinned banner keeps postpone action");
assert(src.includes("GitHubUpdateCenter.ignore(this,info.versionCode)"),
  "Pinned banner keeps ignore action");
assert(git.includes("releases/latest"),"Update detection stays on stable GitHub channel");
const places=(src.match(/screen\.addView\(homeUpdateHolder/g)||[]).length;
assert.equal(places,1,"Update banner must not be duplicated in Home");
console.log("LT181 Home banner immediately above Pokebolas, no empty space, update actions preserved PASS");
