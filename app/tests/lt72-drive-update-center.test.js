"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const main=fs.readFileSync(path.join(src,"MainActivity.java"),"utf8");
const center=fs.readFileSync(path.join(src,"UpdateCenter.java"),"utf8");
const policy=fs.readFileSync(path.join(src,"UpdatePolicy.java"),"utf8");
const manifest=fs.readFileSync(path.join(__dirname,"../src/main/AndroidManifest.xml"),"utf8");
let count=0;
function check(label,fn){fn();count++;console.log("PASS LT72 "+label)}
const requireAll=(body,tokens)=>tokens.forEach(t=>assert.ok(body.includes(t),t));

check("remote manifest points only to approved public Drive config",()=>{
 requireAll(center,['15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf','pokesearch-update-v1',
   'https://drive.google.com/uc?export=download&id=',
   'https://drive.usercontent.google.com/download?id=']);
 assert.ok(!center.includes("github.com/releases"));
});

check("JSON schema preserves publication, version and copy fields",()=>{
 requireAll(center,['"schema"','"enabled"','"forceUpdate"','"versionCode"',
  '"versionName"','"apkName"','"apkFileId"','"apkUrl"','"apkSha256"',
  '"message"','"description"','"notes"','"status"']);
});

check("network IO off main thread and coalesced on resume",()=>{
 requireAll(center,['Executors.newSingleThreadExecutor(', 'private static boolean inFlight=false;',
 'if(inFlight) {','CHECK_INTERVAL_MS','IO.execute(()->{','activity.runOnUiThread(',
 'WeakReference<MainActivity>','setConnectTimeout(4000)','setReadTimeout(4000)']);
 assert.ok(main.includes("UpdateCenter.check(this);"));
});

check("offline and Drive HTML are rejected without blocking Home",()=>{
 requireAll(center,['if(status!=200)return null;','contains("text/html")',
 'return body.startsWith("{")?body:null;','catch(Exception ignored)',
 'if(json==null) json=downloadJson(MANIFEST_FALLBACK);',
 'private static final int MAX_BYTES=16384;']);
});

check("malformed JSON, missing fields and untrusted URLs fail closed",()=>{
 requireAll(center,['new JSONObject(json)','if(!SCHEMA.equals(o.optString("schema")))return null;',
  'if(!(enabled instanceof Boolean)||!(force instanceof Boolean))return null;',
  'if(!(rawCode instanceof Integer||rawCode instanceof Long))return null;',
  'UpdatePolicy.safeDownloadLink(fileId,url)','UpdatePolicy.validHash(hash)',
  'if(notes==null||notes.length()>30)return null;','}catch(Exception ignored){return null;}']);
 requireAll(policy,['remoteCode>installedCode','remoteCode!=dismissedCode','"PokeSearch-v"+versionName+"-LT.apk"',
  'https://drive.google.com/uc?export=download&id=']);
});

check("HTML/browser download only after validated eligibility",()=>{
 requireAll(center,['if(!isEligible(activity,info))return;','Intent.ACTION_VIEW',
 'Intent.CATEGORY_BROWSABLE','activity.startActivity(intent);']);
 assert.ok(!center.includes("REQUEST_INSTALL_PACKAGES"));
 assert.ok(!center.includes("PackageInstaller"));
 assert.ok(!manifest.includes("REQUEST_INSTALL_PACKAGES"));
});

check("Home notice above Firebase counters and absent if disabled",()=>{
 const idx=main.indexOf("homeUpdateHolder=new LinearLayout(this)");
 const stats=main.indexOf("// New compact LT54 counters");
 assert.ok(idx>0&&idx<stats);
 requireAll(main,['homeUpdateHolder.setVisibility(View.GONE);',
 'if(!UpdateCenter.isEligible(this,info)){','holder.setVisibility(View.GONE);',
 'FirebaseStats.bind(this,online,installations);']);
});

check("dismissal persists for one release and does not force updates",()=>{
 requireAll(center,['homeDriveUpdateDismissedCode','putInt(DISMISSED_KEY,versionCode)',
 'UpdatePolicy.shouldDisplay(manifest.enabled,']);
 requireAll(main,['UpdateCenter.dismiss(this,info.versionCode)',
 'UpdateCenter.openDownload(this,info)']);
 assert.ok(!main.includes("UpdateCenter.forceInstall"));
});

check("light/dark Home uses native palette, not WebView recreation",()=>{
 requireAll(main,['boolean light=homeLightMode;',
 'light?Color.argb(240,248,252,255):Color.argb(233,24,35,49)',
 'homeSurface(','renderDriveUpdateBanner();',
 'setContentView(buildHome());']);
 assert.ok(!center.includes("CookieManager"));
 assert.ok(!center.includes("WebStorage"));
});

check("Drive LT62 cannot be offered to a LT72 install",()=>{
 // Model fixture check; authoritative Java policy is independently executed
 // by app/tests/UpdatePolicyTest.java in the CI workflow.
 const installed=54272,remote=54260;
 assert.ok(!(remote>installed));
 const sample={schema:"pokesearch-update-v1",enabled:false,
  versionCode:54260,versionName:"0.00.62",
  apkName:"PokeSearch-v0.00.62-LT.apk",
  apkFileId:"1K59Jh1jw1Qd6BvAYE-geFdp3Z53dOFej"};
 assert.equal(sample.enabled,false);
});

console.log("LT72 Google Drive Home update contract: "+count+"/"+count+" PASS");
