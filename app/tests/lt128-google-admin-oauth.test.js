"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const metadata=JSON.parse(fs.readFileSync(path.join(root,"chat-google-oauth-public.json"),"utf8"));
const gradle=fs.readFileSync(path.join(root,"build.gradle.kts"),"utf8");
const workflow=fs.readFileSync(path.join(root,"../.github/workflows/lt128-google-admin-oauth-signed-qa.yml"),"utf8");
const chat=fs.readFileSync(path.join(root,"src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java"),"utf8");
const rules=JSON.parse(fs.readFileSync(path.join(root,"../firebase-realtime.rules.json"),"utf8")).rules;
assert.equal(metadata.projectId,"pokesearch-lt");
assert.equal(metadata.packageName,"com.lucianotoscano.pokesearch");
assert.equal(metadata.signingCertificateSha1,"dd7bf665e1d47a257fc557b51cb5a57dfd13cb96");
assert.equal(metadata.webClientId,"1007816617051-abhc4riftns3om8gs0o67ce1s386ue9d.apps.googleusercontent.com");
assert.notEqual(metadata.webClientId,metadata.androidClientId);
assert.ok(metadata.androidClientId.startsWith("1007816617051-"));
assert.ok(gradle.includes(metadata.webClientId),"Gradle must embed the VERIFIED WEB client ID");
assert.ok(workflow.includes(metadata.webClientId),"Signed QA must use the verified Web OAuth client");
assert.ok(workflow.includes("54333")&&workflow.includes("0.01.28"),"QA release must be monotonic");
assert.ok(chat.includes("GoogleAuthProvider.getCredential("));
assert.ok(chat.includes("requestIdToken(BuildConfig.CHAT_GOOGLE_WEB_CLIENT_ID)"));
assert.ok(chat.includes("FirebaseStats.ensureChatAdminApp(activity)"));
assert.ok(chat.includes('"google.com".equals(info.getProviderId())'));
assert.ok(rules.chat.messages[".write"].includes("email_verified === true"));
assert.ok(rules.chat.messages[".write"].includes("google.com"));
assert.equal(rules.stats.installations[".read"],false);
assert.equal(rules.stats.online[".read"],false);
assert.equal(rules.chat.avatars[".read"],"auth != null");
for (const dangerous of ["private_key","client_secret","firebase-adminsdk","BEGIN PRIVATE KEY"]){
 assert.ok(!fs.readFileSync(path.join(root,"chat-google-oauth-public.json"),"utf8").includes(dangerous),
   "Sensitive service account details must not be in public OAuth metadata");
}
console.log("LT128 OAuth: exact verified Web ID, Android SHA-1, isolated Firebase admin and safe rules PASS");
