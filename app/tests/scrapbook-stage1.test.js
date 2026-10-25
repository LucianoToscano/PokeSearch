"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const home=read("java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookStage1.java");
const activity=read("java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookActivity.java");
const manifest=read("AndroidManifest.xml");
const stats=read("java/com/lucianotoscano/pokesearchoverlay/FirebaseStats.java");
const results=[];
const test=(name,run)=>{run();results.push(name);console.log("PASS Scrapbook S1 "+name)};
test("Feature disabled in public release regardless of old preference",()=>{
 assert.match(home,/return BuildConfig\.DEBUG\|\|BuildConfig\.SCRAPBOOK_STAGE1_QA/);
 assert.match(home,/return isQaPreviewAllowed\(\)&&context\.getSharedPreferences/);
 assert.match(home,/\.getBoolean\(FLAG,BuildConfig\.SCRAPBOOK_STAGE1_QA\)/);
 assert.match(main,/if\(CommunityScrapbookStage1\.isQaPreviewAllowed\(\)\)\{/);
 assert.match(main,/if\(!CommunityScrapbookStage1\.isQaPreviewAllowed\(\)\)return/);
 assert.match(activity,/if\(!CommunityScrapbookStage1\.isEnabled\(this\)\|\|!IntegrityGuard\.verify\(this\)\)/);
 assert.match(main,/if\(scrapbookPreview\)/);
});
test("Public Home and wallpaper remain on the original branch of the condition",()=>{
 assert.match(main,/pageBackground\.setAlpha\(1f\)/);
 assert.match(main,/if\(scrapbookPreview\)[\s\S]*?ScrollView stage1HomeScroll[\s\S]*?else\{[\s\S]*?frame\.addView\(screen,new FrameLayout\.LayoutParams\(-1,-1\)\)/);
 assert.match(main,/screen\.addView\(CommunityScrapbookStage1\.homePanel\(this,homeLightMode\)/);
 assert.match(main,/screen\.addView\(footer,new LinearLayout\.LayoutParams\(-1,d\(30\)\)\)/);
 assert.match(main,/FirebaseStats\.bind\(this,online,installations\)/);
 assert.match(main,/share\.setOnClickListener\(v->sharePokeSearch\(\)\)/);
});
test("Home preview: 3 demo posts, avatar nickname category time likes replies",()=>{
 assert.match(home,/for\(int i=0;i<3;i\+\+\)/);
 for(const token of ["nickname","avatar","category","message","relativeTime","likes","replies"])
   assert.ok(home.includes(token),token);
 assert.match(home,/open\[0\]=!open\[0\]/);
 assert.match(home,/content\.setVisibility\(open\[0\]\?View\.VISIBLE:View\.GONE\)/);
 assert.match(home,/openFull\(activity\)/);
 assert.match(home,/Prévia fictícia/);
});
test("One local feed, four categories, local filter and pinned official demo",()=>{
 for(const cat of ["💬 Recados","💡 Sugestões","🐞 Bugs","🎓 Dicas"])assert.ok(home.includes(cat));
 assert.match(home,/Collections\.unmodifiableList\(Arrays\.asList/);
 assert.match(activity,/if\(filter>=0&&!p\.category\.equals\(CommunityScrapbookStage1\.CATEGORIES\[filter\]\)\)continue/);
 assert.match(home,/Fixo \(teste\)/);
 assert.match(home,/activity\.startActivity\(new Intent\(activity,CommunityScrapbookActivity\.class\)\)/);
});
test("No ability to post, reply, like, report or delete; 300 chars",()=>{
 assert.match(activity,/new InputFilter\.LengthFilter\(300\)/);
 assert.match(activity,/input\.setEnabled\(false\)/);
 assert.match(activity,/indisponíveis no protótipo/);
 assert.match(home,/write\.setEnabled\(false\)/);
 assert.doesNotMatch(home+activity,/\.setValue\(|\.updateChildren\(|\.push\(|FirebaseDatabase|DatabaseReference|FirebaseAuth|HttpURLConnection|OkHttp|fetch\(/);
});
test("Independent internal activity; no new exported endpoints or overlay changes",()=>{
 assert.match(manifest,/<activity android:name="\.CommunityScrapbookActivity" android:exported="false"/);
 assert.match(manifest,/<service android:name="\.OverlayService" android:exported="false"/);
 assert.match(stats,/getReference\("stats"\)/);
 assert.doesNotMatch(stats,/scrapbook/);
 assert.doesNotMatch(main,/FirebaseDatabase|getReference\("scrapbook"\)/);
});
test("Dark/light themes and compact scroll",()=>{
 assert.match(activity,/getBoolean\("homeLightMode",false\)/);
 assert.match(main,/stage1HomeScroll\.setFillViewport\(true\)/);
 assert.match(main,/ScrollView\.LayoutParams\(-1,-2\)/);
 assert.match(home,/light\?0xEAF7FBFF:0xD81C2C41/);
 assert.match(activity,/scroll\.setFillViewport\(false\)/);
});
test("QA signed release opt-in is never enabled by a normal Release build",()=>{
 const gradle=fs.readFileSync(path.join(__dirname,"../build.gradle.kts"),"utf8");
 assert.match(gradle,/POKE_SCRAPBOOK_STAGE1_QA/);
 assert.match(gradle,/testSigningRequired && testVersionCode != null && testVersionCode >= 54299/);
 assert.match(gradle,/buildConfigField\("boolean", "SCRAPBOOK_STAGE1_QA", "false"\)/);
 assert.match(gradle,/if \(scrapbookStage1Qa\) "true" else "false"/);
 assert.match(home,/Prévia fictícia · sem publicações reais/);
});
console.log("Scrapbook stage1 "+results.length+" static suites PASS; Samsung physical QA pending");
