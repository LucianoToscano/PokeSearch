"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const java=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const scope=java.slice(java.indexOf("private void sharePokeSearch()"),java.indexOf("private void toggleCommunityScrapbookStage1()"));
assert.match(java,/SHARE_APK_FILE_ID="1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P"/);
assert.match(java,/share\.setOnClickListener\(v->sharePokeSearch\(\)\)/);
assert.match(java,/addHomeDrawerItem\(drawer,"↗","Compartilhar app",this::sharePokeSearch\)/);
assert.match(scope,/new Intent\(Intent\.ACTION_SEND\)/);
assert.match(scope,/send\.setType\("text\/plain"\)/);
assert.match(scope,/Intent\.createChooser\(send,"Compartilhar PokeSearch"\)/);
assert.match(scope,/UpdatePolicy\.safeDownloadLink/);
assert.match(scope,/\+shareUrl\+/);
assert.match(scope,/&export=download&confirm=t&v="\+versionCode/);
assert.doesNotMatch(scope,/github\.com|Authorization|jwt|token|FileProvider|FLAG_GRANT_READ_URI_PERMISSION/i);
console.log("PASS LT88 R7: Home and drawer share the authenticated-manifest-validated public Drive link");
