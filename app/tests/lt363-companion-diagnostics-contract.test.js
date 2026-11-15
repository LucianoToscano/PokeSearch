"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const read=n=>fs.readFileSync(base+n+".java","utf8");
const policy=read("PgsCompanionPolicy");
const diag=read("PgsCompanionDiagnostics");
const scan=read("PgsAutoClickService");
const menus=read("PgsAutoMenus");
const metrics=read("PgsWatchSessionDiagnostics");
const manifest=fs.readFileSync("app/src/main/AndroidManifest.xml","utf8");
for(const id of ["com.antvn.pokelist","net.pgtools.data_hub",
 "net.pgtools.auto","com.pokemod.aegis","com.pokemod.atlas"]){
 assert.ok(policy.includes('"'+id+'"'),"known exact companion "+id);
 assert.ok(manifest.includes('android:name="'+id+'"'),"exact package visibility "+id);
}
assert.match(diag,/getPackageInfo\(spec\.packageName,0\)/,"no broad enumeration");
assert.match(policy,/installationProvesActive\(String packageName\)\{return false;\}/);
assert.match(policy,/externalApiApproved\(String packageName\)\{return false;\}/);
assert.doesNotMatch(manifest,/android\.permission\.(QUERY_ALL_PACKAGES|ACCESS_SUPERUSER|MANAGE_EXTERNAL_STORAGE)/);
assert.match(menus,/private void showCompanionDiagnostics\(\)/);
assert.match(menus,/showCompanionDiagnostics\(\)/);
assert.doesNotMatch(scan,/PgsAutoHostSettings\.pokemodManagerInstalled\(this\)/,
 "Pokemod manager is never a prerequisite to watch or calibrated scan");
assert.match(scan,/watchMetrics\.begin\(SystemClock\.elapsedRealtime\(\)\)/);
assert.match(scan,/watchMetrics\.finish\(SystemClock\.elapsedRealtime\(\),lastStatus\)/);
assert.match(metrics,/Alertas solicitados/);
assert.doesNotMatch(metrics,/Bitmap|ScreenshotResult|SharedPreferences|HttpURLConnection/);
assert.doesNotMatch(policy,/https?:\/\//);
const manifestPackages=[...manifest.matchAll(/<package android:name="([^"]+)"\s*\/>/g)].map(x=>x[1]);
assert.equal(manifestPackages.length,new Set(manifestPackages).size,"no duplicated package queries");
console.log("LT363 local compatibility view without third-party API, gestures or root PASS");
