"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../src/main");
const center=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/GitHubUpdateCenter.java"),"utf8");
const main=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const manifest=fs.readFileSync(path.join(root,"AndroidManifest.xml"),"utf8");
let checks=0;
function check(title,run){run();checks++;console.log("PASS LT237: "+title);}
check("official release only; package and signing checks retained",()=>{
 assert.match(center,/releases\/latest/);
 assert.match(center,/CERT="34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e"/);
 assert.match(center,/validPackage\(context,tmp,release\)/);
 assert.match(center,/!hex\(digest.digest\(\)\).equals\(release.sha256\)/);
 assert.match(center,/verifiedCached\(context,file,release\)/);
 assert.match(center,/release.sha256.equals\(hex\(sha.digest\(\)\)\)&&validPackage/);
 assert.match(center,/code<=BuildConfig.VERSION_CODE/);
});
check("network is unmetered and opt-in may be disabled",()=>{
 assert.match(manifest,/android.permission.ACCESS_NETWORK_STATE/);
 assert.match(center,/NETWORK_CAPABILITY_NOT_METERED/);
 assert.match(center,/autoDownloadEnabled\(context\)&&onUnmeteredNetwork\(context\)/);
 assert.match(center,/getBoolean\("githubAutoDownloadWifi",true\)/);
 assert.match(main,/Baixar atualizações automaticamente no Wi-Fi/);
 assert.match(main,/GitHubUpdateCenter.setAutoDownload\(this,enabled\)/);
});
check("background worker prefetch and in-home check keep existing schedule",()=>{
 assert.match(center,/PollWorker extends Worker/);
 assert.match(center,/30,TimeUnit.MINUTES/);
 assert.match(center,/ExistingPeriodicWorkPolicy.KEEP/);
 assert.match(center,/downloadVerified\(context,r,new AtomicBoolean\(false\)/);
 assert.match(center,/prefetchOrNotify\(activity.getApplicationContext\(\),r\)/);
 assert.match(main,/GitHubUpdateCenter.schedule\(this\)/);
 assert.match(main,/GitHubUpdateCenter.check\(this\)/);
});
check("ready APK still undergoes confirmation and always revalidation",()=>{
 assert.match(center,/cachedReady\?"Instalar atualização":"Baixar atualização"/);
 assert.match(center,/dialog.dismiss\(\);\s*install\(activity,apk,release\)/);
 assert.match(center,/if\(!apk.getCanonicalFile\(\).getParentFile\(\).equals\(folder.getCanonicalFile\(\)\)\)/);
 assert.match(center,/canRequestPackageInstalls\(\)/);
 assert.match(center,/Intent.ACTION_INSTALL_PACKAGE/);
 assert.doesNotMatch(center,/USER_ACTION_NOT_REQUIRED|INSTALL_PACKAGES/);
});
console.log("LT237 automatic updates: "+checks+"/"+checks+" contracts passed");