"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const root=path.join(__dirname,"..");
const native=path.join(root,"src/main/java/com/lucianotoscano/pokesearchoverlay");
const resources=path.join(root,"src/main/res/drawable-nodpi");
const read=name=>fs.readFileSync(path.join(native,name),"utf8");
const main=read("MainActivity.java");
const overlay=read("OverlayService.java");
const state=read("SupportMissionState.java");
const policy=read("SupportMissionPolicy.java");
const dialog=read("SupportMissionDialog.java");
const pix=read("PixSupport.java");
let passed=0;
function check(name,fn){fn();passed++;console.log("PASS SupportV2 "+name);}
function sha(name){return crypto.createHash("sha256").update(fs.readFileSync(path.join(resources,name))).digest("hex");}

check("all seven local persistence keys present; no server and no Firebase",()=>{
 for(const key of ["support_app_open_count","support_effective_usage_ms",
 "support_current_style_id","support_last_style_id","support_mission_badge_unread",
 "support_mission_dismissed_at_ms","support_mission_next_eligible_at_ms"])
   assert.ok(state.includes(key),key);
 assert.ok(!/import\s+.*(?:Firebase|HttpURLConnection|Socket|Retrofit|WebView)/.test(state));
});
check("ten opens + 100 effective minutes both required",()=>{
 assert.ok(policy.includes("REQUIRED_OPENS = 10"));
 assert.ok(policy.includes("REQUIRED_USAGE_MS = 100L * 60L * 1000L"));
 assert.ok(policy.includes("opens >= REQUIRED_OPENS && effectiveUsageMs >= REQUIRED_USAGE_MS"));
});
check("exclude recreated Activity, reload and nonlauncher callbacks",()=>{
 assert.ok(state.includes("savedState != null"));
 assert.ok(state.includes("Intent.ACTION_MAIN.equals(intent.getAction())"));
 assert.ok(state.includes("Intent.CATEGORY_LAUNCHER"));
 assert.ok(main.includes("SupportMissionState.onLauncherIntent(this,getIntent(),b);"));
 assert.ok(main.includes("SupportMissionState.onLauncherIntent(this,intent,null);"));
});
check("interactive focus and overlay touches only, no passive service time",()=>{
 assert.ok(state.includes("power.isInteractive()"));
 assert.ok(state.includes("homeVisibility(Activity a, boolean visible)"));
 assert.ok(state.includes("Math.min(Math.max(0, now - homeAt), 5500)"));
 assert.ok(state.includes("if (gap <= 60000L) credit(c, Math.min(gap, 30000L));"));
 assert.ok(main.includes("syncMissionClock(false);"));
 assert.ok(overlay.includes("SupportMissionState.overlayTouch(OverlayService.this);"));
 assert.ok(overlay.includes("SupportMissionState.overlayStopped();"));
});
check("badge only on eligibility and no popup until user taps",()=>{
 assert.ok(main.includes("homeMissionBadge.setOnClickListener(v->openSupportMission())"));
 assert.ok(main.includes("R.drawable.support_home_new:R.drawable.support_home_seen"));
 assert.ok(state.includes("SupportMissionPolicy.eligible"));
 assert.ok(!main.includes("post(this::openSupportMission)"));
});
check("dismissal and 15-day cooldown are local",()=>{
 assert.ok(state.includes(".putLong(DISMISSED,now)"));
 assert.ok(state.includes(".putLong(NEXT,SupportMissionPolicy.nextEligibleAt(now))"));
 assert.ok(state.includes("SupportMissionPolicy.coolingDown(now, next)"));
 assert.ok(dialog.includes("dialog.setOnCancelListener(d->flee.run())"));
 assert.ok(dialog.includes("close.setOnClickListener(v->flee.run())"));
});
check("single weighted drawing per cycle, persisted with anti-repeat",()=>{
 assert.ok(policy.includes("{40, 30, 20, 10}"));
 assert.ok(policy.includes("if (i == previousStyle) continue"));
 assert.ok(state.includes("RANDOM.nextInt(total)"));
 assert.ok(state.includes("p.edit().putInt(CURRENT,style).putBoolean(UNREAD,true)"));
 assert.ok(state.includes("p.edit().putBoolean(UNREAD,false).apply()"));
});
check("all four styles share real interactions and unchanged originals",()=>{
 const titles=["PESQUISA ESPECIAL — EVOLUA O POKESEARCH!",
 "VOCÊ ENCONTROU UM PRESENTE ESPECIAL!",
 "UM MEWTWO SHINY 100% COM FUNDO?!",
 "ALERTA! O PIKACHU DO POKESEARCH FOI INTERNADO!"];
 for(const title of titles) assert.ok(dialog.includes(title),title);
 assert.ok(dialog.includes("R.drawable.support_flee_button"));
 assert.ok(dialog.includes("R.drawable.support_donate_button"));
 assert.ok(dialog.includes("PixSupport.show(activity)"));
 assert.ok(!dialog.includes("PackageInstaller"));
 assert.ok(!dialog.includes("Pokédex! Você ganhou"));
 assert.ok(!/café|☕/i.test(dialog));
});
check("actual payment uses authentic JPEG and never shows civilian name",()=>{
 assert.equal(sha("support_pix_qr_original.jpg"),
 "66bbd986dec0d0102d33642a3a4b425c1fb02f4c284ed74e489b9a5c2b0e2238");
 assert.ok(pix.includes("R.drawable.support_pix_qr_original"));
 assert.ok(pix.includes("ImageView.ScaleType.FIT_CENTER"));
 assert.ok(pix.includes("ClipboardManager"));
 assert.ok(pix.includes("PAYLOAD"));
 assert.ok(pix.includes("PIX • Qualquer valor"));
 assert.ok(pix.includes("Confira os dados no aplicativo do banco."));
 assert.ok(!pix.includes("Destinatário do Pix:"));
 assert.ok(!/café|☕/.test(pix));
});
check("two new Home PNGs and two original functional buttons match source SHA-256",()=>{
 const expected={
 "support_home_new.png":"0f1d43ee9fa4237855aaa12a138c6be8875b99066bba1cc38363a645006d5eed",
 "support_home_seen.png":"a8000d2dccdb68f7e4c80a29a11939aee171f6a772c5f6705173e7050cde9bb6",
 "support_flee_button.png":"dd16ca21e5d5113516c58e2ba8a2baf96f3f17c75b6b2f4d064afde8cb8bf5aa",
 "support_donate_button.png":"70bdb5477312af14dc4fbbde2e106dc77bed977bff0924a1f041e464ea685d79",
 "support_mewtwo_shundo.jpg":"f4e38e51a66575e8fb64162c1b83c9d5b717b044a5c71cd4bcf6a329f9175437",
 "support_pikachu_meme.jpg":"8ec75e84f6e90a8f312e410760dfd242182af6a54f50b70bfd68f2d595604113"
 };
 for(const [file,hash] of Object.entries(expected)) assert.equal(sha(file),hash,file);
});
check("original support remains reachable outside mission",()=>{
 assert.ok(main.includes("heart.setOnClickListener(v->PixSupport.show(this))"));
 assert.ok(main.includes('OPEN_PIX'));
 assert.ok(overlay.includes('OPEN_PIX'));
 assert.ok(main.includes("UpdateCenter.check(this)"));
 assert.ok(overlay.includes("PopupTouchGeometry."));
});
console.log("Support V2 regression: "+passed+"/"+passed+" PASS");
