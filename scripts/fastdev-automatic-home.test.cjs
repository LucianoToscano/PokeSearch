"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs");
const previewManifest=fs.readFileSync("app/src/preview/AndroidManifest.xml","utf8");
const mainManifest=fs.readFileSync("app/src/main/AndroidManifest.xml","utf8");
const app=fs.readFileSync("app/src/preview/java/com/lucianotoscano/pokesearchoverlay/FastDevApplication.java","utf8");
const updater=fs.readFileSync("app/src/preview/java/com/lucianotoscano/pokesearchoverlay/FastDevConsoleActivity.java","utf8");
const workflow=fs.readFileSync(".github/workflows/pokesearch-fastdev.yml","utf8");
const branch=fs.readFileSync(".github/workflows/pokesearch-fastdev-branch.yml","utf8");

test("Preview uses the real PokeSearch MainActivity launcher, never console or Live sandbox",()=>{
 assert.match(mainManifest,/activity android:name="\.MainActivity" android:exported="true"/);
 assert.match(mainManifest,/android.intent.category.LAUNCHER/);
 assert.match(previewManifest,/android:name="\.FastDevApplication"/);
 assert.match(previewManifest,/android:label="PokeSearch DEV"/);
 assert.match(previewManifest,/android:name="\.FastDevConsoleActivity"\s+android:exported="true"/);
 assert.doesNotMatch(previewManifest,/android.intent.category.LAUNCHER|android.intent.action.MAIN/);
 assert.doesNotMatch(previewManifest,/FastDevLiveActivity/);
 assert.match(updater,/Intent home=new Intent\(this,MainActivity\.class\)/);
 assert.match(updater,/startActivity\(home\);/);
});
test("Preview-only application initiates OTA from MainActivity without touching official build",()=>{
 assert.match(app,/extends Application/);
 assert.match(app,/activity instanceof MainActivity/);
 assert.match(app,/FastDevConsoleActivity\.scheduleUpdateChecks\(this\)/);
 assert.match(app,/FastDevConsoleActivity\.checkAutomatically\(activity\)/);
 assert.match(app,/FastDevConsoleActivity\.tryInstallReady\(activity\)/);
 assert.doesNotMatch(mainManifest,/FastDevApplication/);
});
test("automatic OTA verifies release hash, APK signing identity and only opens Android installer",()=>{
 assert.match(updater,/private static File downloadVerified\(Context app,Preview preview\)/);
 assert.match(updater,/private static void verifyDownloaded\(File file,Preview preview\)/);
 assert.match(updater,/validateApk\(app,apk,preview\)/);
 assert.match(updater,/archive\.packageName/);
 assert.match(updater,/digest\(a\[0\]\.toByteArray\(\)\)/);
 assert.match(updater,/install\.setDataAndType\(uri,"application\/vnd.android.package-archive"\)/);
 assert.match(updater,/getPackageManager\(\)\.canRequestPackageInstalls\(\)/);
 assert.match(updater,/Settings\.ACTION_MANAGE_UNKNOWN_APP_SOURCES/);
 assert.match(updater,/!home\.hasWindowFocus\(\)/);
 assert.match(updater,/AUTO_CHECK_INTERVAL_MS=10\*60\*1000L/);
 assert.match(updater,/raw\.githubusercontent\.com/);
 assert.doesNotMatch(updater,/setSilentInstall|installPackageWithoutUserConsent|su -c/);
});
test("background update notifications return to Home rather than the old debug console",()=>{
 assert.match(updater,/Intent open=new Intent\(ctx,MainActivity\.class\)/);
 assert.doesNotMatch(updater,/Intent open=new Intent\(ctx,FastDevConsoleActivity\.class\)/);
});
test("FastDev APK automatically builds after code merge but not on preview manifest publication",()=>{
 assert.match(workflow,/push:\n    branches: \[main\]/);
 assert.match(workflow,/      - 'app\/src\/main\/\*\*'/);
 assert.match(workflow,/      - 'app\/src\/preview\/\*\*'/);
 assert.match(workflow,/MODE="apk-preview"/);
 assert.match(workflow,/environment: fastdev-signing/);
 assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
 assert.doesNotMatch(workflow,/^      - 'fastdev\/latest\.json'$/m);
 assert.match(branch,/branches:\n      - 'fastdev\/\*\*'/);
 assert.doesNotMatch(branch,/assemblePreview|assembleRelease/);
});
