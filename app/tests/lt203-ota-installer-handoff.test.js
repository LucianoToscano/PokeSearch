"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../src/main");
const center=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/GitHubUpdateCenter.java"),"utf8");
const main=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const manifest=fs.readFileSync(path.join(root,"AndroidManifest.xml"),"utf8");
const paths=fs.readFileSync(path.join(root,"res/xml/update_file_paths.xml"),"utf8");
let checks=0;function test(name,fn){fn();checks++;console.log("PASS LT203 "+name)}
test("Preserve signed HTTPS GitHub release verification",()=>{
 assert.match(center,/private static final String CERT="34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e"/);
 assert.match(center,/validPackage\(context,tmp,release\)/);
 assert.match(center,/!actual.equals\(release.sha256\)/);
 assert.match(center,/!validPackage\(activity,apk,release\)/);
 assert.match(center,/!apk.getCanonicalFile\(\).getParentFile\(\).equals\(folder.getCanonicalFile\(\)\)/);
});
test("Installer uses Android official install intent and read permissions across processes",()=>{
 assert.match(center,/Intent.ACTION_INSTALL_PACKAGE/);
 assert.match(center,/ClipData.newRawUri\("PokeSearch APK",content\)/);
 assert.match(center,/FLAG_GRANT_READ_URI_PERMISSION/);
 assert.match(center,/Intent.EXTRA_RETURN_RESULT,true/);
 assert.match(center,/startActivityForResult\(installerIntent\(content,true\),INSTALL_REQUEST\)/);
 assert.match(center,/startActivityForResult\(installerIntent\(content,false\),INSTALL_REQUEST\)/);
 assert.match(center,/application\/vnd.android.package-archive/);
 assert.match(manifest,/REQUEST_INSTALL_PACKAGES/);
 assert.match(manifest,/androidx.core.content.FileProvider/);
 assert.match(manifest,/android:grantUriPermissions="true"/);
 assert.match(paths,/cache-path name="pokesearch_update" path="updates\/"/);
});
test("Samsung restrictions are explained, not bypassed",()=>{
 assert.match(center,/canRequestPackageInstalls\(\)/);
 assert.match(center,/Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES/);
 assert.match(center,/Bloqueador Automático da Samsung/);
 assert.doesNotMatch(center,/INSTALL_PACKAGES|USER_ACTION_NOT_REQUIRED|ACTION_DELETE/);
});
test("Unexpected installer exit has useful safe fallback",()=>{
 assert.match(center,/static boolean onInstallerResult/);
 assert.match(main,/GitHubUpdateCenter.onInstallerResult\(this,req,result,data\)/);
 assert.match(center,/elapsed>=0&&elapsed<4000/);
 assert.match(center,/browserFallback.setText\("Instalar pelo navegador"\)/);
 assert.match(center,/browserFallback.setVisibility\(android.view.View.VISIBLE\)/);
 assert.match(center,/browser.addCategory\(Intent.CATEGORY_BROWSABLE\)/);
 assert.match(center,/!url.startsWith\(ASSET_PREFIX\)/);
 assert.match(center,/Não desinstale a versão atual/);
});
test("Installer cannot replace normal release handling or another activity result",()=>{
 assert.match(main,/if\(GitHubUpdateCenter.onInstallerResult\(this,req,result,data\)\)return;/);
 assert.match(center,/if\(request!=INSTALL_REQUEST\)return false/);
 assert.match(center,/if\(result==Activity.RESULT_OK\)return true/);
 assert.match(center,/button.setOnClickListener\(v2->install\(activity,apk,release\)\)/);
});
console.log("LT203 safe install handoff "+checks+"/"+checks+" tests passed");
