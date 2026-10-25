"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const java=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
assert.match(java,/SHARE_APK_DRIVE_URL\s*=\s*\n?\s*"https:\/\/drive\.google\.com\/file\/d\/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P\/view"/);
assert.match(java,/share\.setOnClickListener\(v->sharePokeSearch\(\)\)/);
assert.match(java,/addHomeDrawerItem\(drawer,"↗","Compartilhar app",this::sharePokeSearch\)/);
assert.match(java,/new Intent\(Intent\.ACTION_SEND\)/);
assert.match(java,/send\.setType\("text\/plain"\)/);
assert.match(java,/Intent\.createChooser\(send,"Compartilhar PokeSearch"\)/);
assert.match(java,/SHARE_APK_DRIVE_URL\);/);
assert.doesNotMatch(java.slice(java.indexOf("private void sharePokeSearch()"),java.indexOf("private void exportHomeData()")),
  /github\.com|Authorization|jwt|token|FileProvider|FLAG_GRANT_READ_URI_PERMISSION/i);
console.log("PASS LT88 R7: Home share and drawer share only stable Drive APK URL via Sharesheet");
