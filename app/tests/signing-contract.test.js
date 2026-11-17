"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const gradle=read("app/build.gradle.kts"),official=read(".github/workflows/pokesearch-official-release.yml"),
 guard=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/IntegrityGuard.java"),ignore=read(".gitignore");
let n=0;const check=(name,fn)=>{fn();n++;console.log("PASS official signer "+name)};
check("one Android identity",()=>{assert.match(gradle,/applicationId = "com\.lucianotoscano\.pokesearch"/);assert.match(guard,/private static final String PACKAGE = "com\.lucianotoscano\.pokesearch"/);});
check("no DEV build or signer",()=>{assert.doesNotMatch(gradle,/FASTDEV_PREVIEW|fastDev|POKE_FASTDEV|create\("preview"\)|applicationIdSuffix/);assert.doesNotMatch(guard,/FASTDEV_PREVIEW|\.preview/);});
check("protected release only",()=>{assert.match(official,/name: PokeSearch permanent official release/);assert.match(official,/environment: official-updates/);assert.match(official,/github\.ref == 'refs\/heads\/main'/);});
check("permanent certificate",()=>{assert.match(official,/POKE_RELEASE_CERT_SHA256: '34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e'/);assert.match(official,/secrets\.POKE_TEST_KEYSTORE_B64/);assert.match(official,/test "\$CERT" = "\$POKE_RELEASE_CERT_SHA256"/);});
check("official artifacts verified",()=>{for(const x of ["Build signed protected release","apksigner","sha256sum -c SHA256SUMS.txt","Verify public release and hash","Erase private signing material"])assert.ok(official.includes(x));});
check("QA signing preserved",()=>{assert.match(gradle,/create\("persistentTestDebug"\)/);assert.match(gradle,/create\("privateTestRelease"\)/);assert.match(gradle,/testSigningRequired && testVersionCode == null/);for(const x of ["*.jks","*.keystore","*.p12","*.pfx"])assert.ok(ignore.includes(x));});
check("runtime signed assets protected",()=>{assert.match(guard,/getApkContentsSigners\(\)/);assert.match(guard,/EXPECTED_SIGNING_CERT_SHA256/);assert.match(guard,/entries\.length!=7/);});
console.log("PokeSearch official signing contract: "+n+" tests passed");
